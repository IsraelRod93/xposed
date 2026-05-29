import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET(req: NextRequest) {
  if (!sql) return NextResponse.json({ error: "Database not configured" }, { status: 500 });

  try {
    const users = await sql`
      SELECT
        u.telegram_id, u.display_name, u.username, u.share_link,
        u.boosted_until,
        COUNT(m.id)::INTEGER as message_count,
        (u.boosted_until IS NOT NULL AND u.boosted_until > NOW()) as is_boosted
      FROM users u
      LEFT JOIN messages m ON m.receiver_id = u.telegram_id
      WHERE u.display_name IS NOT NULL AND u.display_name != ''
      GROUP BY u.telegram_id, u.display_name, u.username, u.share_link, u.boosted_until
      ORDER BY is_boosted DESC, message_count DESC
      LIMIT 30
    `;

    return NextResponse.json(users);
  } catch (err) {
    console.error("Error fetching discover:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
