import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { ensureMissionsColumns } from "@/lib/migrations";
import { DAILY_MISSIONS } from "@/lib/missions";

export async function GET(req: NextRequest) {
  if (!sql) return NextResponse.json({ error: "Database not configured" }, { status: 500 });

  await ensureMissionsColumns();

  const telegram_id = req.nextUrl.searchParams.get("telegram_id");
  if (!telegram_id) return NextResponse.json({ error: "Missing telegram_id" }, { status: 400 });

  try {
    // Reset daily missions if date changed
    await sql`
      UPDATE users
      SET missions_claimed_today = '', missions_reset_date = CURRENT_DATE
      WHERE telegram_id = ${telegram_id}
        AND (missions_reset_date IS NULL OR missions_reset_date < CURRENT_DATE)
    `;

    const users = await sql`
      SELECT missions_claimed_today, streak_count FROM users WHERE telegram_id = ${telegram_id}
    `;
    if (users.length === 0) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const claimed: string[] = (users[0].missions_claimed_today || '')
      .split(',').filter(Boolean);
    const streak = users[0].streak_count || 0;

    // Get today's message counts
    const todayResult = await sql`
      SELECT COUNT(*) FROM messages WHERE receiver_id = ${telegram_id} AND created_at::date = CURRENT_DATE
    `;
    const totalResult = await sql`
      SELECT COUNT(*) FROM messages WHERE receiver_id = ${telegram_id}
    `;
    const todayCount = parseInt(todayResult[0].count);
    const totalCount = parseInt(totalResult[0].count);

    // Find first unclaimed mission
    const active = DAILY_MISSIONS.find(m => !claimed.includes(m.id)) ?? null;

    let progress = 0;
    if (active) {
      if (active.type === 'messages_today') progress = Math.min(active.goal, todayCount);
      else if (active.type === 'streak') progress = Math.min(active.goal, streak);
      else if (active.type === 'messages_total') progress = Math.min(active.goal, totalCount);
    }

    return NextResponse.json({
      active,
      claimed,
      total: DAILY_MISSIONS.length,
      progress,
      todayCount,
      allDone: !active,
    });
  } catch (err) {
    console.error("Error fetching mission:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
