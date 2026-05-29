import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

const BOOST_COST = 100;

export async function POST(req: NextRequest) {
  if (!sql) return NextResponse.json({ error: "Database not configured" }, { status: 500 });

  try {
    const { telegram_id } = await req.json();
    if (!telegram_id) return NextResponse.json({ error: "Missing telegram_id" }, { status: 400 });

    const result = await sql`
      UPDATE users
      SET
        boosted_until = GREATEST(COALESCE(boosted_until, NOW()), NOW()) + INTERVAL '24 hours',
        stars = stars - ${BOOST_COST}
      WHERE telegram_id = ${telegram_id} AND stars >= ${BOOST_COST}
      RETURNING stars, boosted_until
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: "Not enough tokens", cost: BOOST_COST }, { status: 403 });
    }

    try {
      await sql`INSERT INTO transactions (user_id, type, amount) VALUES (${telegram_id}, 'boost', ${-BOOST_COST})`;
    } catch {}

    return NextResponse.json({ ok: true, stars: result[0].stars, boosted_until: result[0].boosted_until, cost: BOOST_COST });
  } catch (err) {
    console.error("Error boosting:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
