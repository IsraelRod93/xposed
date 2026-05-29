import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!sql) {
    return NextResponse.json({ error: "Database not configured" }, { status: 500 });
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';

  if (!botToken) {
    return NextResponse.json({ error: "Bot token not configured" }, { status: 500 });
  }

  try {
    // Users with unread messages > 2 days old who went inactive exactly 2-3 days ago.
    // The 24h window (2d–3d) matches the daily cron frequency so each user is
    // notified exactly once per inactivity period, with no extra columns needed.
    const usersToNotify = await sql`
      SELECT
        u.telegram_id,
        COUNT(m.id)::int AS unread_count
      FROM users u
      JOIN messages m ON m.receiver_id = u.telegram_id
      WHERE (m.revealed_premium IS NULL OR m.revealed_premium = '')
        AND m.is_clue_revealed = FALSE
        AND (m.hidden_by_user IS NULL OR m.hidden_by_user = FALSE)
        AND m.created_at < NOW() - INTERVAL '2 days'
        AND u.last_active_at < NOW() - INTERVAL '2 days'
        AND u.last_active_at > NOW() - INTERVAL '3 days'
      GROUP BY u.telegram_id
      HAVING COUNT(m.id) > 0
    `;

    let sent = 0;
    for (const user of usersToNotify) {
      const n = user.unread_count;
      const text =
        n === 1
          ? `📩 Tienes 1 secreto anónimo sin leer...\n\nLleva 2 días esperándote. Alguien se arriesgó a enviarte algo — ¿te atreves a leerlo? 🤫`
          : `📩 Tienes ${n} secretos anónimos sin leer...\n\nLlevan 2 días esperándote. Hay cosas que alguien nunca se atrevería a decirte en persona. ¿Ya los viste? 🤫`;

      try {
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: user.telegram_id,
            text,
            reply_markup: {
              inline_keyboard: [[{
                text: 'Ver mi Inbox 📩',
                web_app: { url: appUrl }
              }]]
            }
          })
        });
        sent++;
      } catch {}
    }

    return NextResponse.json({ ok: true, notified: sent, found: usersToNotify.length });
  } catch (err) {
    console.error('[CRON] Reengagement error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
