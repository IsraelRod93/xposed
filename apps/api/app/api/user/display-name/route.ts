import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getAuthUserId } from '@/lib/auth';
import { sanitizeDisplayName } from '@/lib/validation';

export async function POST(req: NextRequest) {
  if (!sql) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });

  const userId = getAuthUserId(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { display_name } = await req.json();
    const name = sanitizeDisplayName(display_name);
    if (!name) return NextResponse.json({ error: 'Nombre inválido' }, { status: 400 });

    const taken = await sql`
      SELECT 1 FROM users WHERE display_name ILIKE ${name} AND id != ${userId} LIMIT 1
    `;
    if (taken.length > 0) return NextResponse.json({ error: 'Ese nombre ya está en uso' }, { status: 409 });

    await sql`UPDATE users SET display_name = ${name} WHERE id = ${userId}`;

    return NextResponse.json({ ok: true, display_name: name });
  } catch (err) {
    console.error('[display-name]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
