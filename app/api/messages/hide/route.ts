import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getAuthUserId } from '@/lib/auth';

export async function POST(req: NextRequest) {
  if (!sql) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });

  const userId = getAuthUserId(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { message_id } = await req.json();
    if (!message_id) return NextResponse.json({ error: 'Missing message_id' }, { status: 400 });

    await sql`
      UPDATE messages SET hidden_by_user = TRUE
      WHERE id = ${message_id} AND receiver_id = ${userId}
    `;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[messages/hide]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
