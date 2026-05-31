import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { signJWT } from '@/lib/auth';
import { createHash } from 'crypto';

function hashPassword(password: string): string {
  return createHash('sha256').update(password + process.env.JWT_SECRET).digest('hex');
}

function generateShareLink(email: string): string {
  const base = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20);
  return `${base}_${Math.random().toString(36).slice(2, 7)}`;
}

export async function POST(req: NextRequest) {
  if (!sql) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });

  try {
    const { action, email, password, display_name } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email y contraseña requeridos' }, { status: 400 });
    }

    const hashed = hashPassword(password);

    if (action === 'register') {
      const existing = await sql`SELECT id FROM users WHERE email = ${email} LIMIT 1`;
      if (existing.length > 0) {
        return NextResponse.json({ error: 'Este email ya está registrado' }, { status: 409 });
      }

      const shareLink = generateShareLink(email);
      const [user] = await sql`
        INSERT INTO users (email, display_name, share_link, stars)
        VALUES (${email}, ${display_name || email.split('@')[0]}, ${shareLink}, 100)
        RETURNING *
      `;
      await sql`
        INSERT INTO auth_providers (user_id, provider, provider_id)
        VALUES (${user.id}, 'email', ${hashed})
      `;

      const token = signJWT(user.id);
      return NextResponse.json({ token, user });

    } else {
      // login
      const providers = await sql`
        SELECT ap.user_id FROM auth_providers ap
        JOIN users u ON u.id = ap.user_id
        WHERE u.email = ${email} AND ap.provider = 'email' AND ap.provider_id = ${hashed}
        LIMIT 1
      `;
      if (providers.length === 0) {
        return NextResponse.json({ error: 'Email o contraseña incorrectos' }, { status: 401 });
      }

      const users = await sql`SELECT * FROM users WHERE id = ${providers[0].user_id}`;
      const token = signJWT(users[0].id);
      return NextResponse.json({ token, user: users[0] });
    }
  } catch (err) {
    console.error('[auth/email]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
