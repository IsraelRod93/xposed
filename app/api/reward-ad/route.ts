import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

const AD_REWARD = 20;
const MAX_ADS_PER_DAY = 10;

export async function POST(req: NextRequest) {
  if (!sql) return NextResponse.json({ error: "Database not configured" }, { status: 500 });

  try {
    const { telegram_id } = await req.json();
    if (!telegram_id) return NextResponse.json({ error: "Missing telegram_id" }, { status: 400 });

    // Reset counter if it's a new day, then check limit
    const result = await sql`
      UPDATE users SET
        daily_ads_watched = CASE
          WHEN ads_reset_date IS DISTINCT FROM CURRENT_DATE THEN 1
          ELSE daily_ads_watched + 1
        END,
        ads_reset_date = CURRENT_DATE,
        stars = CASE
          WHEN ads_reset_date IS DISTINCT FROM CURRENT_DATE OR daily_ads_watched < ${MAX_ADS_PER_DAY}
          THEN stars + ${AD_REWARD}
          ELSE stars
        END
      WHERE telegram_id = ${telegram_id}
        AND (
          ads_reset_date IS DISTINCT FROM CURRENT_DATE
          OR daily_ads_watched < ${MAX_ADS_PER_DAY}
        )
      RETURNING stars, daily_ads_watched, ads_reset_date
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { error: `Límite diario alcanzado. Vuelve mañana para más tokens.` },
        { status: 429 }
      );
    }

    const watched = result[0].daily_ads_watched;
    const remaining = MAX_ADS_PER_DAY - watched;

    try {
      await sql`
        INSERT INTO transactions (user_id, type, amount)
        VALUES (${telegram_id}, 'ad_reward', ${AD_REWARD})
      `;
    } catch {}

    return NextResponse.json({
      ok: true,
      reward: AD_REWARD,
      stars: result[0].stars,
      ads_today: watched,
      ads_remaining: remaining,
    });
  } catch (err) {
    console.error("Error rewarding ad:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
