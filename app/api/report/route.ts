import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function POST(req: NextRequest) {
  if (!sql) return NextResponse.json({ error: "Database not configured" }, { status: 500 });

  try {
    const { telegram_id, message_id } = await req.json();
    if (!telegram_id || !message_id) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const msgs = await sql`
      SELECT id, content FROM messages
      WHERE id = ${message_id}::uuid AND receiver_id = ${telegram_id}
    `;
    if (msgs.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const msg = msgs[0];

    await sql`
      UPDATE messages SET hidden_by_user = TRUE
      WHERE id = ${message_id}::uuid
    `;

    try {
      await sql`
        INSERT INTO reports (message_id, reporter_id)
        VALUES (${message_id}::uuid, ${telegram_id})
        ON CONFLICT DO NOTHING
      `;
    } catch {}

    const adminId = process.env.ADMIN_TELEGRAM_ID;
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (adminId && botToken) {
      const preview = msg.content.slice(0, 300);
      fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: adminId,
          text: `⚠️ *MENSAJE REPORTADO*\n\nContenido:\n"${preview}"\n\nUsuario: \`${telegram_id}\`\nID: \`${message_id}\``,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[
              { text: '🗑 Eliminar', callback_data: `adm_del_${message_id}` },
              { text: '✅ Ignorar',  callback_data: `adm_ign_${message_id}` },
            ]]
          }
        })
      }).catch(() => {});
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error reporting:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
