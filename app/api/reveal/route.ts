import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

const REVEAL_COST = 50;

export async function POST(req: NextRequest) {
  if (!sql) {
    return NextResponse.json({ error: "Database not configured" }, { status: 500 });
  }

  try {
    const { telegram_id, message_id } = await req.json();

    if (!telegram_id || !message_id) {
      return NextResponse.json({ error: "Missing required data" }, { status: 400 });
    }

    // 1. Get user and check stars
    const users = await sql`
      SELECT stars FROM users WHERE telegram_id = ${telegram_id}
    `;

    if (users.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (users[0].stars < REVEAL_COST) {
      return NextResponse.json({ error: "Not enough stars" }, { status: 403 });
    }

    // 2. Atomic CTE: only reveals if not already revealed, only charges stars if reveal succeeds
    const result = await sql`
      WITH updated_message AS (
        UPDATE messages
        SET is_clue_revealed = true
        WHERE id = ${message_id}::uuid
          AND receiver_id = ${telegram_id}
          AND is_clue_revealed = false
        RETURNING id, sender_os, sender_country
      ),
      updated_user AS (
        UPDATE users
        SET stars = stars - ${REVEAL_COST}
        WHERE telegram_id = ${telegram_id}
          AND stars >= ${REVEAL_COST}
          AND EXISTS (SELECT 1 FROM updated_message)
        RETURNING telegram_id
      ),
      inserted AS (
        INSERT INTO transactions (user_id, message_id, type, amount)
        SELECT ${telegram_id}, updated_message.id, 'reveal', -${REVEAL_COST}
        FROM updated_user, updated_message
      )
      SELECT sender_os, sender_country FROM updated_message
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: "Already revealed or insufficient stars" }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      sender_os: result[0].sender_os,
      sender_country: result[0].sender_country,
    });
  } catch (err) {
    console.error("Error revealing clue:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
