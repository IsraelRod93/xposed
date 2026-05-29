import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { containsThreat } from "@/lib/moderation";
import { ensureMessageColumns } from "@/lib/migrations";

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

function detectCity(req: NextRequest): string {
  const city = req.headers.get('x-vercel-ip-city');
  if (city && city !== 'XX') {
    try { return decodeURIComponent(city); } catch { return city; }
  }
  return 'Desconocida';
}

function detectPlatform(req: NextRequest): string {
  const referer = req.headers.get('referer') || '';
  if (referer.includes('instagram.com') || referer.includes('ig.me')) return 'Instagram';
  if (referer.includes('tiktok.com')) return 'TikTok';
  if (referer.includes('twitter.com') || referer.includes('x.com')) return 'Twitter/X';
  if (referer.includes('wa.me') || referer.includes('whatsapp')) return 'WhatsApp';
  if (referer.includes('t.me') || referer.includes('telegram.org')) return 'Telegram';
  if (referer.includes('youtube.com')) return 'YouTube';
  if (referer.includes('facebook.com') || referer.includes('fb.com')) return 'Facebook';
  return 'Web directa';
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

const RATE_LIMIT = 5;

function getClientIP(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-real-ip')
    || '0.0.0.0';
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

    if (containsThreat(content)) {
      return NextResponse.json({ error: "Tu mensaje contiene contenido no permitido." }, { status: 400 });
    }

    const ip = getClientIP(req);

    const recentCount = await sql`
      SELECT COUNT(*) FROM messages
      WHERE sender_ip = ${ip}
        AND created_at > NOW() - INTERVAL '1 hour'
    `;
    if (parseInt(recentCount[0].count) >= RATE_LIMIT) {
      return NextResponse.json(
        { error: "Demasiados mensajes. Vuelve en 1 hora." },
        { status: 429 }
      );
    }

    const sender_country = detectCountry(req, clientCountry);
    const sender_city = detectCity(req);
    const sender_platform = detectPlatform(req);

    await ensureMessageColumns().catch(() => {});

    const users = await sql`
      SELECT telegram_id FROM users WHERE share_link = ${share_link}
    `;

    if (users.length === 0) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    const receiver_id = users[0].telegram_id;

    await sql`
      INSERT INTO messages (receiver_id, content, sender_os, sender_country, sender_city, sender_platform, sender_hour, sender_ip, is_clue_revealed)
      VALUES (${receiver_id}, ${content}, ${sender_os}, ${sender_country}, ${sender_city}, ${sender_platform}, EXTRACT(HOUR FROM NOW())::INTEGER, ${ip}, false)
    `;

    notifyReceiver(receiver_id).catch(() => {});

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error al guardar mensaje:", err);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
