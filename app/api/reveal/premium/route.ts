import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

const CLUE_COSTS: Record<string, number> = {
  hour: 25,
  city: 25,
  platform: 25,
};

function formatHour(hour: number | null): string {
  if (hour === null || hour === undefined) return 'Desconocida';
  if (hour >= 5 && hour < 12) return 'Mañana (5–12h)';
  if (hour >= 12 && hour < 18) return 'Tarde (12–18h)';
  if (hour >= 18 && hour < 22) return 'Noche (18–22h)';
  return 'Madrugada (22–5h)';
}

export async function POST(req: NextRequest) {
  if (!sql) return NextResponse.json({ error: "Database not configured" }, { status: 500 });

  try {
    const { telegram_id, message_id, clue_type } = await req.json();
    if (!telegram_id || !message_id || !clue_type) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const cost = CLUE_COSTS[clue_type];
    if (!cost) return NextResponse.json({ error: "Invalid clue type" }, { status: 400 });

    const rows = await sql`
      SELECT m.sender_city, m.sender_platform, m.sender_hour, m.is_clue_revealed,
             COALESCE(m.revealed_premium, '') as revealed_premium,
             u.stars, u.subscribed_until
      FROM messages m
      JOIN users u ON u.telegram_id = ${telegram_id}
      WHERE m.id = ${message_id}::uuid AND m.receiver_id = ${telegram_id}
    `;

    if (rows.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const row = rows[0];
    const rawRevealed = (row.revealed_premium || '').split(',').filter(Boolean);
    // Backwards compat: old messages with is_clue_revealed=true but empty revealed_premium
    const alreadyRevealed = (row.is_clue_revealed && rawRevealed.length === 0)
      ? ['country', 'os']
      : rawRevealed;

    const rawValue = clue_type === 'hour' ? formatHour(row.sender_hour)
                   : clue_type === 'city' ? (row.sender_city || 'Desconocida')
                   : (row.sender_platform || 'Web directa');

    if (alreadyRevealed.includes(clue_type)) {
      return NextResponse.json({ ok: true, value: rawValue, already: true });
    }

    const isSubscribed = row.subscribed_until && new Date(row.subscribed_until) > new Date();

    // Clue not yet revealed — block (use /api/reveal to reveal new clues)
    if (!isSubscribed) {
      return NextResponse.json({ error: "Not revealed yet" }, { status: 403 });
    }

    const newRevealed = [...alreadyRevealed, clue_type].join(',');

    if (isSubscribed) {
      await sql`
        UPDATE messages SET revealed_premium = ${newRevealed}
        WHERE id = ${message_id}::uuid AND receiver_id = ${telegram_id}
      `;
    } else {
      await sql`
        WITH updated_msg AS (
          UPDATE messages SET revealed_premium = ${newRevealed}
          WHERE id = ${message_id}::uuid AND receiver_id = ${telegram_id}
          RETURNING id
        ),
        updated_user AS (
          UPDATE users SET stars = stars - ${cost}
          WHERE telegram_id = ${telegram_id} AND stars >= ${cost}
            AND EXISTS (SELECT 1 FROM updated_msg)
          RETURNING telegram_id
        )
        INSERT INTO transactions (user_id, message_id, type, amount)
        SELECT ${telegram_id}, updated_msg.id, ${'reveal_' + clue_type}, ${-cost}
        FROM updated_user, updated_msg
      `;
    }

    return NextResponse.json({ ok: true, value: rawValue, cost: isSubscribed ? 0 : cost });
  } catch (err) {
    console.error("Error revealing premium clue:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
