import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ link: string }> }
) {
  if (!sql) {
    return NextResponse.json({ error: "Database not configured" }, { status: 500 });
  }

  const { link: shareLink } = await params;

  try {
    const users = await sql`
      SELECT
        u.telegram_id,
        u.username,
        u.display_name,
        u.streak_count,
        u.share_link,
        COUNT(m.id)::int AS message_count,
        MAX(m.created_at) AS last_message_at,
        COUNT(DISTINCT m.sender_ip) FILTER (WHERE m.created_at > NOW() - INTERVAL '24 hours')::int AS recent_count
      FROM users u
      LEFT JOIN messages m ON u.telegram_id = m.receiver_id
      WHERE u.share_link = ${shareLink}
      GROUP BY u.telegram_id, u.username, u.display_name, u.streak_count, u.share_link
    `;

    if (users.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const rankResult = await sql`
      SELECT COUNT(*) + 1 AS rank
      FROM users u
      WHERE (
        SELECT COUNT(*) FROM messages m WHERE m.receiver_id = u.telegram_id
      ) > ${users[0].message_count}
    `;

    return NextResponse.json({
      ...users[0],
      rank: parseInt(rankResult[0].rank),
    });
  } catch (err) {
    console.error("Error fetching user by link:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
