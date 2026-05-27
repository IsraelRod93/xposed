import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { ensureDisplayNameColumn } from "@/lib/migrations";

export async function POST(req: NextRequest) {
  if (!sql) {
    return NextResponse.json({ error: "Database not configured" }, { status: 500 });
  }

  await ensureDisplayNameColumn();

  try {
    const { telegram_id, display_name } = await req.json();

    if (!telegram_id) {
      return NextResponse.json({ error: "Missing telegram_id" }, { status: 400 });
    }

    const name = (display_name || "").trim().slice(0, 32);

    const result = await sql`
      UPDATE users
      SET display_name = ${name || null}
      WHERE telegram_id = ${telegram_id}
      RETURNING display_name
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, display_name: result[0].display_name });
  } catch (err) {
    console.error("Error updating display name:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
