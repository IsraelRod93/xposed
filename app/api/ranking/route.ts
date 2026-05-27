import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET(req: NextRequest) {
  if (!sql) {
    return NextResponse.json({ error: "Database not configured" }, { status: 500 });
  }

  try {
    // Get top users by messages received in the last 7 days
    const ranking = await sql`
      SELECT 
        u.telegram_id,
        u.username,
        u.stars,
        COUNT(m.id) as message_count
      FROM users u
      LEFT JOIN messages m ON u.telegram_id = m.receiver_id AND m.created_at > NOW() - INTERVAL '7 days'
      GROUP BY u.telegram_id, u.username, u.stars
      ORDER BY message_count DESC
      LIMIT 100
    `;

    // Process tiers based on counts (example logic)
    const processedRanking = ranking.map((user, index) => {
      let tier = 'bronze';
      if (index < 3) tier = 'legend';
      else if (index < 10) tier = 'diamond';
      else if (index < 25) tier = 'gold';
      else if (index < 50) tier = 'silver';

      return {
        rank: index + 1,
        name: user.username ? `@${user.username}` : `Usuario ${user.telegram_id.toString().slice(-4)}`,
        count: parseInt(user.message_count),
        tier,
        telegram_id: user.telegram_id
      };
    });

    return NextResponse.json(processedRanking);
  } catch (err) {
    console.error("Error fetching ranking:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
