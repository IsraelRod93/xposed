import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getDailyMissions, ALL_MISSIONS } from "@/lib/missions";

async function sendMissionNotification(telegramId: string) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
  if (!botToken || !appUrl) return;

  await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: telegramId,
      text: '🎯 ¡Tus misiones diarias están listas!\n\nCompleta las misiones de hoy y gana 🪙 tokens.',
      reply_markup: {
        inline_keyboard: [[{ text: 'Ver Misiones 🎯', web_app: { url: appUrl } }]]
      }
    })
  });
}

export async function GET(req: NextRequest) {
  if (!sql) return NextResponse.json({ error: "Database not configured" }, { status: 500 });

  const telegram_id = req.nextUrl.searchParams.get("telegram_id");
  if (!telegram_id) return NextResponse.json({ error: "Missing telegram_id" }, { status: 400 });

  try {
    const today = new Date().toISOString().slice(0, 10);
    const todayMissions = getDailyMissions(today);

    // Reset daily missions and notify if day changed
    const resetResult = await sql`
      UPDATE users
      SET missions_claimed_today = '', missions_reset_date = CURRENT_DATE
      WHERE telegram_id = ${telegram_id}
        AND (missions_reset_date IS NULL OR missions_reset_date < CURRENT_DATE)
      RETURNING telegram_id
    `;

    if (resetResult.length > 0) {
      // New day — send mission notification once
      const notifyResult = await sql`
        UPDATE users SET mission_notified_date = CURRENT_DATE
        WHERE telegram_id = ${telegram_id}
          AND (mission_notified_date IS NULL OR mission_notified_date < CURRENT_DATE)
        RETURNING telegram_id
      `;
      if (notifyResult.length > 0) {
        sendMissionNotification(telegram_id).catch(() => {});
      }
    }

    const users = await sql`
      SELECT missions_claimed_today, streak_count FROM users WHERE telegram_id = ${telegram_id}
    `;
    if (users.length === 0) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const claimed: string[] = (users[0].missions_claimed_today || '').split(',').filter(Boolean);
    const streak = users[0].streak_count || 0;

    const todayCount = parseInt((await sql`
      SELECT COUNT(*) FROM messages WHERE receiver_id = ${telegram_id} AND created_at::date = CURRENT_DATE
    `)[0].count);

    const totalCount = parseInt((await sql`
      SELECT COUNT(*) FROM messages WHERE receiver_id = ${telegram_id}
    `)[0].count);

    let referralsTodayCount = 0;
    try {
      referralsTodayCount = parseInt((await sql`
        SELECT COUNT(*) FROM transactions
        WHERE user_id = ${telegram_id} AND type = 'referral' AND created_at::date = CURRENT_DATE
      `)[0].count);
    } catch {}

    // Filter out already-claimed missions from today's pool
    const active = todayMissions.find(m => !claimed.includes(m.id)) ?? null;

    let progress = 0;
    if (active) {
      if (active.type === 'messages_today') progress = Math.min(active.goal, todayCount);
      else if (active.type === 'streak') progress = Math.min(active.goal, streak);
      else if (active.type === 'messages_total') progress = Math.min(active.goal, totalCount);
      else if (active.type === 'referral_today') progress = Math.min(active.goal, referralsTodayCount);
    }

    // Only count missions that are in today's pool
    const todayClaimed = claimed.filter(id => todayMissions.some(m => m.id === id));

    return NextResponse.json({
      active,
      claimed: todayClaimed,
      total: todayMissions.length,
      progress,
      todayCount,
      allDone: !active || todayMissions.every(m => todayClaimed.includes(m.id)),
    });
  } catch (err) {
    console.error("Error fetching mission:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
