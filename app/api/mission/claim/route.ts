import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { ensureTransactionsTable, ensureMissionsColumns } from "@/lib/migrations";
import { DAILY_MISSIONS } from "@/lib/missions";

export async function POST(req: NextRequest) {
  if (!sql) return NextResponse.json({ error: "Database not configured" }, { status: 500 });

  await ensureTransactionsTable();
  await ensureMissionsColumns();

  try {
    const { telegram_id, mission_id } = await req.json();
    if (!telegram_id || !mission_id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const mission = DAILY_MISSIONS.find(m => m.id === mission_id);
    if (!mission) return NextResponse.json({ error: "Invalid mission" }, { status: 400 });

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

    const claimed: string[] = (users[0].missions_claimed_today || '').split(',').filter(Boolean);

    if (claimed.includes(mission_id)) {
      return NextResponse.json({ error: "Mission already claimed" }, { status: 400 });
    }

    // Verify progress requirement
    let progress = 0;
    if (mission.type === 'messages_today') {
      const r = await sql`SELECT COUNT(*) FROM messages WHERE receiver_id = ${telegram_id} AND created_at::date = CURRENT_DATE`;
      progress = parseInt(r[0].count);
    } else if (mission.type === 'streak') {
      progress = users[0].streak_count || 0;
    } else if (mission.type === 'messages_total') {
      const r = await sql`SELECT COUNT(*) FROM messages WHERE receiver_id = ${telegram_id}`;
      progress = parseInt(r[0].count);
    }

    if (progress < mission.goal) {
      return NextResponse.json({ error: "Goal not reached", progress, goal: mission.goal }, { status: 400 });
    }

    const newClaimed = [...claimed, mission_id].join(',');

    // Award tokens + mark claimed atomically
    await sql`
      WITH updated AS (
        UPDATE users
        SET
          stars = stars + ${mission.reward},
          missions_claimed_today = ${newClaimed}
        WHERE telegram_id = ${telegram_id}
        RETURNING telegram_id
      )
      INSERT INTO transactions (user_id, type, amount)
      SELECT telegram_id, 'mission_reward', ${mission.reward} FROM updated
    `;

    // Find next unclaimed mission
    const allClaimed = [...claimed, mission_id];
    const next = DAILY_MISSIONS.find(m => !allClaimed.includes(m.id)) ?? null;

    return NextResponse.json({ ok: true, reward: mission.reward, next });
  } catch (err) {
    console.error("Error claiming mission:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
