import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

const CHANGE_COST = 200;

function slugify(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 30) || 'usuario';
}

export async function POST(req: NextRequest) {
  if (!sql) {
    return NextResponse.json({ error: "Database not configured" }, { status: 500 });
  }

  try {
    const { telegram_id, display_name } = await req.json();

    if (!telegram_id) {
      return NextResponse.json({ error: "Missing telegram_id" }, { status: 400 });
    }

    const name = (display_name || "").trim().slice(0, 32);

    if (name) {
      const taken = await sql`
        SELECT telegram_id FROM users
        WHERE display_name ILIKE ${name}
          AND telegram_id != ${telegram_id}
        LIMIT 1
      `;
      if (taken.length > 0) {
        return NextResponse.json({ error: "Ese nombre ya está en uso" }, { status: 409 });
      }
    }

    const users = await sql`
      SELECT display_name, stars, link_changes, subscribed_until FROM users WHERE telegram_id = ${telegram_id}
    `;
    if (users.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { display_name: existing, stars, link_changes, subscribed_until } = users[0];
    const isFirstChange = !existing;
    const isSubscribed = subscribed_until && new Date(subscribed_until) > new Date();

    if (!isFirstChange && !isSubscribed && stars < CHANGE_COST) {
      return NextResponse.json(
        { error: `Necesitas ${CHANGE_COST} 🪙 para cambiar tu nombre` },
        { status: 402 }
      );
    }

    // Sync link when user hasn't manually customized it (link_changes <= 1 = auto-generated)
    const shouldSyncLink = name && (link_changes ?? 0) <= 1;
    let finalSlug: string | null = null;
    if (shouldSyncLink) {
      const slug = slugify(name);
      const takenSlug = await sql`
        SELECT 1 FROM users WHERE share_link ILIKE ${slug} AND telegram_id != ${telegram_id} LIMIT 1
      `;
      finalSlug = takenSlug.length > 0 ? `${slug}_${String(telegram_id).slice(-4)}` : slug;
    }

    let result;
    if (isFirstChange) {
      if (finalSlug) {
        result = await sql`
          UPDATE users SET display_name = ${name || null}, share_link = ${finalSlug}, link_changes = 1
          WHERE telegram_id = ${telegram_id} RETURNING display_name
        `;
      } else {
        result = await sql`
          UPDATE users SET display_name = ${name || null}
          WHERE telegram_id = ${telegram_id} RETURNING display_name
        `;
      }
    } else if (isSubscribed) {
      // Subscribed: free name change
      if (finalSlug) {
        result = await sql`
          UPDATE users SET display_name = ${name || null}, share_link = ${finalSlug}, link_changes = 1
          WHERE telegram_id = ${telegram_id} RETURNING display_name
        `;
      } else {
        result = await sql`
          UPDATE users SET display_name = ${name || null}
          WHERE telegram_id = ${telegram_id} RETURNING display_name
        `;
      }
    } else {
      // Pay with tokens
      if (finalSlug) {
        result = await sql`
          UPDATE users SET display_name = ${name || null}, stars = stars - ${CHANGE_COST}, share_link = ${finalSlug}, link_changes = 1
          WHERE telegram_id = ${telegram_id} AND stars >= ${CHANGE_COST} RETURNING display_name
        `;
      } else {
        result = await sql`
          UPDATE users SET display_name = ${name || null}, stars = stars - ${CHANGE_COST}
          WHERE telegram_id = ${telegram_id} AND stars >= ${CHANGE_COST} RETURNING display_name
        `;
      }
      if (result.length === 0) {
        return NextResponse.json(
          { error: `Necesitas ${CHANGE_COST} 🪙 para cambiar tu nombre` },
          { status: 402 }
        );
      }
      try {
        await sql`
          INSERT INTO transactions (user_id, type, amount)
          VALUES (${telegram_id}, 'display_name_change', ${-CHANGE_COST})
        `;
      } catch {}
    }

    return NextResponse.json({ ok: true, display_name: result[0].display_name, isFirstChange, share_link: finalSlug });
  } catch (err) {
    console.error("Error updating display name:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
