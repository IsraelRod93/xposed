import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { signJWT } from '@/lib/auth';

// Solo disponible si DEMO_MODE=true en las env vars
export async function POST(req: NextRequest) {
  if (process.env.DEMO_MODE !== 'true') {
    return NextResponse.json({ error: 'Not available' }, { status: 403 });
  }
  if (!sql) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });

  try {
    const existing = await sql`SELECT * FROM users WHERE share_link = 'demo_user' LIMIT 1`;

    let user = existing[0];
    if (!user) {
      const [created] = await sql`
        INSERT INTO users (email, display_name, share_link, stars)
        VALUES ('demo@xposed.app', 'Demo', 'demo_user', 500)
        RETURNING *
      `;
      user = created;
    }

    const token = signJWT(user.id);
    return NextResponse.json({ token, user });
  } catch (err) {
    console.error('[auth/demo]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
