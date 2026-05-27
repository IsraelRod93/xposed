import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { ensureDisplayNameColumn } from "@/lib/migrations";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!sql) {
    return NextResponse.json({ error: "Database not configured" }, { status: 500 });
  }

  const { id: telegramId } = await params;

  await ensureDisplayNameColumn();

  try {
    // 1. Get user data and update streak atomically on each inbox open
    const users = await sql`
      UPDATE users SET
        streak_count = CASE
          WHEN last_active_at::date = CURRENT_DATE - 1 THEN streak_count + 1
          WHEN last_active_at::date = CURRENT_DATE     THEN streak_count
          ELSE 1
        END,
        last_active_at = NOW()
      WHERE telegram_id = ${telegramId}
      RETURNING *
    `;

    if (users.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = users[0];

    // 2. Get messages
    const messages = await sql`
      SELECT * FROM messages 
      WHERE receiver_id = ${telegramId} 
      ORDER BY created_at DESC
    `;

    // 3. Calculate weekly stats
    const weeklyCount = await sql`
      SELECT COUNT(*) FROM messages
      WHERE receiver_id = ${telegramId}
      AND created_at > NOW() - INTERVAL '7 days'
    `;

    // 4. Check daily mission (e.g., 5 secrets received today)
    const todayCount = await sql`
      SELECT COUNT(*) FROM messages
      WHERE receiver_id = ${telegramId}
      AND created_at::date = CURRENT_DATE
    `;

    // 5. Rank among all users by weekly messages
    const rankResult = await sql`
      SELECT COUNT(*) + 1 AS rank
      FROM users u
      WHERE (
        SELECT COUNT(*) FROM messages m
        WHERE m.receiver_id = u.telegram_id
        AND m.created_at > NOW() - INTERVAL '7 days'
      ) > ${weeklyCount[0].count}
    `;

    // 6. Total stars spent (from transactions — safe if table is empty)
    let starsSpent = 0;
    try {
      const spentResult = await sql`
        SELECT COALESCE(SUM(ABS(amount)), 0) AS stars_spent
        FROM transactions
        WHERE user_id = ${telegramId} AND amount < 0
      `;
      starsSpent = parseInt(spentResult[0].stars_spent);
    } catch {
      // transactions table may not exist yet in this deployment
    }

    return NextResponse.json({
      user: { ...user, stars_spent: starsSpent },
      messages,
      stats: {
        weekly: parseInt(weeklyCount[0].count),
        today: parseInt(todayCount[0].count),
        rank: parseInt(rankResult[0].rank),
      }
    });
  } catch (err) {
    console.error("Error fetching inbox data:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
