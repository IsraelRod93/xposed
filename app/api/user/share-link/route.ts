import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

const LINK_CHANGE_COST = 200;
const LINK_PATTERN = /^[a-zA-Z0-9_]{3,30}$/;

export async function POST(req: NextRequest) {
  if (!sql) return NextResponse.json({ error: "Database not configured" }, { status: 500 });

  try {
    const { telegram_id, new_link } = await req.json();
    if (!telegram_id || !new_link) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
    }

    if (!LINK_PATTERN.test(new_link)) {
      return NextResponse.json(
        { error: "Solo letras, números y _ — entre 3 y 30 caracteres" },
        { status: 400 }
      );
    }

    // Check uniqueness (case-insensitive, exclude self)
    const taken = await sql`
      SELECT 1 FROM users
      WHERE share_link ILIKE ${new_link}
        AND telegram_id != ${telegram_id}
      LIMIT 1
    `;
    if (taken.length > 0) {
      return NextResponse.json({ error: "Ese link ya está en uso" }, { status: 409 });
    }

    const users = await sql`
      SELECT stars, link_changes FROM users WHERE telegram_id = ${telegram_id}
    `;
    if (users.length === 0) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    const { stars, link_changes } = users[0];
    const isFirstChange = (link_changes ?? 0) === 0;

    if (!isFirstChange && stars < LINK_CHANGE_COST) {
      return NextResponse.json(
        { error: `No tienes suficientes tokens — necesitas ${LINK_CHANGE_COST} 🪙` },
        { status: 402 }
      );
    }

    if (isFirstChange) {
      await sql`
        UPDATE users
        SET share_link = ${new_link}, link_changes = 1
        WHERE telegram_id = ${telegram_id}
      `;
    } else {
      // Deduct tokens atomically
      const updated = await sql`
        UPDATE users
        SET share_link = ${new_link},
            stars = stars - ${LINK_CHANGE_COST},
            link_changes = link_changes + 1
        WHERE telegram_id = ${telegram_id} AND stars >= ${LINK_CHANGE_COST}
        RETURNING telegram_id
      `;
      if (updated.length === 0) {
        return NextResponse.json(
          { error: `No tienes suficientes tokens — necesitas ${LINK_CHANGE_COST} 🪙` },
          { status: 402 }
        );
      }

      // Record transaction
      try {
        await sql`
          INSERT INTO transactions (user_id, type, amount)
          VALUES (${telegram_id}, 'link_change', ${-LINK_CHANGE_COST})
        `;
      } catch {}
    }

    return NextResponse.json({ ok: true, share_link: new_link });
  } catch (err) {
    console.error("Error updating share link:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
