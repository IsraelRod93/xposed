import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { ensureTransactionsTable } from "@/lib/migrations";

const MISSION_GOAL = 5;
const MISSION_REWARD = 100;

export async function POST(req: NextRequest) {
  if (!sql) {
    return NextResponse.json({ error: "Database not configured" }, { status: 500 });
  }

  await ensureTransactionsTable();

  try {
    const { telegram_id } = await req.json();

    if (!telegram_id) {
      return NextResponse.json({ error: "Missing telegram_id" }, { status: 400 });
    }

    // 1. Check if mission already completed today
    const users = await sql`
      SELECT last_mission_completed_at FROM users WHERE telegram_id = ${telegram_id}
    `;

    if (users.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const lastCompleted = users[0].last_mission_completed_at;
    if (lastCompleted && new Date(lastCompleted).toDateString() === new Date().toDateString()) {
      return NextResponse.json({ error: "Mission already completed today" }, { status: 400 });
    }

    // 2. Count messages received today
    const todayCount = await sql`
      SELECT COUNT(*) FROM messages 
      WHERE receiver_id = ${telegram_id} 
      AND created_at::date = CURRENT_DATE
    `;

    const count = parseInt(todayCount[0].count);

    if (count < MISSION_GOAL) {
      return NextResponse.json({ 
        error: "Goal not reached", 
        current: count, 
        goal: MISSION_GOAL 
      }, { status: 400 });
    }

    // 3. Complete mission and reward user
    await sql`
      WITH updated_user AS (
        UPDATE users 
        SET 
          stars = stars + ${MISSION_REWARD},
          last_mission_completed_at = NOW()
        WHERE telegram_id = ${telegram_id}
        RETURNING telegram_id
      )
      INSERT INTO transactions (user_id, type, amount)
      SELECT telegram_id, 'mission_reward', ${MISSION_REWARD}
      FROM updated_user
    `;

    return NextResponse.json({ ok: true, reward: MISSION_REWARD });
  } catch (err) {
    console.error("Error completing mission:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
