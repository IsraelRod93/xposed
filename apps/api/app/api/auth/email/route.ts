import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { signJWT } from '@/lib/auth';
import { sanitizeDisplayName } from '@/lib/validation';
import { getClientIp, rateLimitOk } from '@/lib/ratelimit';
import { User, UserWithPasswordHash } from '@/lib/types';
import bcrypt from 'bcryptjs';

const BCRYPT_ROUNDS = 12;

function generateShareLink(email: string): string {
  const base = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20);
  return `${base}_${Math.random().toString(36).slice(2, 7)}`;
}

export async function POST(req: NextRequest) {
  if (!sql) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });

  try {
    // Rate limit por IP (anti fuerza bruta): 5 intentos / 60s.
    const ip = getClientIp(req);
    if (!(await rateLimitOk(`auth_email:${ip}`, 5, 60))) {
      return NextResponse.json({ error: 'Demasiados intentos. Espera un minuto.' }, { status: 429 });
    }

    const { action, email, password, display_name } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email y contraseña requeridos' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 });
    }

    if (action === 'register') {
      const existing = await sql`SELECT id FROM users WHERE email = ${email} LIMIT 1`;
      if (existing.length > 0) {
        return NextResponse.json({ error: 'Este email ya está registrado' }, { status: 409 });
      }

      const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
      const shareLink = generateShareLink(email);
      const displayName = sanitizeDisplayName(display_name, email.split('@')[0]);

      // Usuario + credenciales en UNA sola sentencia (CTE) => atómica, sin huérfanos.
      const rows = await sql`
        WITH new_user AS (
          INSERT INTO users (email, display_name, share_link, stars)
          VALUES (${email}, ${displayName}, ${shareLink}, 100)
          RETURNING *
        ), new_provider AS (
          INSERT INTO auth_providers (user_id, provider, provider_id)
          SELECT id, 'email', ${passwordHash} FROM new_user
        )
        SELECT * FROM new_user
      ` as User[];

      const user = rows[0];
      const token = signJWT(user.id);
      return NextResponse.json({ token, user });

    } else {
      // login — una sola consulta (JOIN) trae el usuario y el hash bcrypt guardado.
      const rows = await sql`
        SELECT u.*, ap.provider_id AS password_hash
        FROM users u
        JOIN auth_providers ap ON ap.user_id = u.id
        WHERE u.email = ${email} AND ap.provider = 'email'
        LIMIT 1
      ` as UserWithPasswordHash[];
      if (rows.length === 0) {
        return NextResponse.json({ error: 'Email o contraseña incorrectos' }, { status: 401 });
      }

      // Separa el hash del resto sin mutar el objeto original.
      const { password_hash, ...user } = rows[0];
      const ok = await bcrypt.compare(password, password_hash || '');
      if (!ok) {
        return NextResponse.json({ error: 'Email o contraseña incorrectos' }, { status: 401 });
      }

      const token = signJWT(user.id);
      return NextResponse.json({ token, user });
    }
  } catch (err) {
    console.error('[auth/email]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
