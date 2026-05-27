import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

const COUNTRY_NAMES: Record<string, string> = {
  ES: 'España',   MX: 'México',    AR: 'Argentina', CO: 'Colombia',
  CL: 'Chile',    PE: 'Perú',      VE: 'Venezuela', EC: 'Ecuador',
  BO: 'Bolivia',  PY: 'Paraguay',  UY: 'Uruguay',   CR: 'Costa Rica',
  PA: 'Panamá',   DO: 'R. Dominicana', GT: 'Guatemala', HN: 'Honduras',
  SV: 'El Salvador', NI: 'Nicaragua', CU: 'Cuba',   PR: 'Puerto Rico',
  US: 'USA',      GB: 'Reino Unido', DE: 'Alemania', FR: 'Francia',
  IT: 'Italia',   BR: 'Brasil',    PT: 'Portugal',  CA: 'Canadá',
  JP: 'Japón',    CN: 'China',     AU: 'Australia', NL: 'Países Bajos',
};

function detectCountry(req: NextRequest, fallback?: string): string {
  const code = req.headers.get('x-vercel-ip-country') || req.headers.get('cf-ipcountry');
  if (code && code !== 'XX') return COUNTRY_NAMES[code] ?? code;
  return fallback || 'Desconocido';
}

async function notifyReceiver(receiverId: bigint | number) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
  if (!botToken || !appUrl) return;

  await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: receiverId,
      text: '📩 ¡Tienes un nuevo secreto anónimo!\n\nAlguien te ha enviado algo... ¿te atreves a leerlo?',
      reply_markup: {
        inline_keyboard: [[{
          text: 'Ver mi Inbox 📩',
          web_app: { url: appUrl }
        }]]
      }
    })
  });
}

export async function POST(req: NextRequest) {
  if (!sql) {
    return NextResponse.json({ error: "Database not configured" }, { status: 500 });
  }

  try {
    const { share_link, content, sender_os, sender_country: clientCountry } = await req.json();

    if (!share_link || !content) {
      return NextResponse.json({ error: "Faltan datos obligatorios" }, { status: 400 });
    }

    // País detectado server-side (Vercel header > CF header > fallback del cliente)
    const sender_country = detectCountry(req, clientCountry);

    // 1. Buscar al destinatario por su share_link
    const users = await sql`
      SELECT telegram_id FROM users WHERE share_link = ${share_link}
    `;

    if (users.length === 0) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    const receiver_id = users[0].telegram_id;

    // 2. Insertar el mensaje
    await sql`
      INSERT INTO messages (receiver_id, content, sender_os, sender_country, is_clue_revealed)
      VALUES (${receiver_id}, ${content}, ${sender_os}, ${sender_country}, false)
    `;

    // 3. Notificar al receptor via Telegram (fire and forget — no bloquea la respuesta)
    notifyReceiver(receiver_id).catch(() => {});

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error al guardar mensaje:", err);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
