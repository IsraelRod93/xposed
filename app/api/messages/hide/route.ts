import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function POST(req: NextRequest) {
  if (!sql) return NextResponse.json({ error: "Database not configured" }, { status: 500 });

  try {
    const { telegram_id, message_id } = await req.json();
    if (!telegram_id || !message_id) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    await sql`
      UPDATE messages SET hidden_by_user = TRUE
      WHERE id = ${message_id}::uuid AND receiver_id = ${telegram_id}
    `;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error hiding message:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
