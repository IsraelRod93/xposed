import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET(req: NextRequest) {
  if (!sql) {
    return NextResponse.json({ error: "Database not configured" }, { status: 500 });
  }

  try {
    const ranking = await sql`
      SELECT
        u.telegram_id,
        u.username,
        u.display_name,
        u.stars,
        COUNT(m.id) as message_count
      FROM users u
      LEFT JOIN messages m ON u.telegram_id = m.receiver_id
      GROUP BY u.telegram_id, u.username, u.display_name, u.stars
      ORDER BY message_count DESC
      LIMIT 10
    `;

    const processedRanking = ranking.map((user, index) => {
      let tier = 'bronze';
      if (index < 3) tier = 'legend';
      else if (index < 10) tier = 'gold';
      else if (index < 25) tier = 'silver';

      const name = user.display_name ||
        (user.username ? `@${user.username}` : `Usuario ${user.telegram_id.toString().slice(-4)}`);

      return {
        rank: index + 1,
        name,
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
