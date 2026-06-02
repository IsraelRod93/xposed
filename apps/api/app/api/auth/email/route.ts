import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { signJWT } from '@/lib/auth';
import { createHash } from 'crypto';
import bcrypt from 'bcryptjs';

const BCRYPT_ROUNDS = 12;

// Hash legacy (SHA-256 con pepper). Solo se usa para validar cuentas creadas
// antes de migrar a bcrypt; al iniciar sesión esas cuentas se re-hashean a bcrypt.
function legacyHash(password: string): string {
  return createHash('sha256').update(password + process.env.JWT_SECRET).digest('hex');
}

function isBcryptHash(hash: string): boolean {
  return typeof hash === 'string' && hash.startsWith('$2');
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
      const displayName = display_name || email.split('@')[0];

      // Usuario + credenciales en UNA sola sentencia (CTE) => atómica.
      // Si el INSERT de credenciales falla, también se revierte el del usuario
      // (Postgres trata cada sentencia como su propia transacción) => sin huérfanos.
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
      `;

      const user = rows[0];
      const token = signJWT(user.id);
      return NextResponse.json({ token, user });

    } else {
      // login — una sola consulta (JOIN) trae el usuario y el hash guardado.
      // La comparación va en código porque bcrypt usa salt aleatorio.
      const rows = await sql`
        SELECT u.*, ap.id AS provider_row_id, ap.provider_id AS password_hash
        FROM users u
        JOIN auth_providers ap ON ap.user_id = u.id
        WHERE u.email = ${email} AND ap.provider = 'email'
        LIMIT 1
      `;
      if (rows.length === 0) {
        return NextResponse.json({ error: 'Email o contraseña incorrectos' }, { status: 401 });
      }

      const row = rows[0];
      const storedHash: string = row.password_hash;

      let ok = false;
      let needsUpgrade = false;
      if (isBcryptHash(storedHash)) {
        ok = await bcrypt.compare(password, storedHash);
      } else {
        // Cuenta legacy (SHA-256): valida y marca para re-hashear a bcrypt.
        ok = storedHash === legacyHash(password);
        needsUpgrade = ok;
      }

      if (!ok) {
        return NextResponse.json({ error: 'Email o contraseña incorrectos' }, { status: 401 });
      }

      if (needsUpgrade) {
        const newHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
        await sql`UPDATE auth_providers SET provider_id = ${newHash} WHERE id = ${row.provider_row_id}`
          .catch(() => {});
      }

      // No exponer campos internos del join en la respuesta del usuario.
      delete row.provider_row_id;
      delete row.password_hash;

      const token = signJWT(row.id);
      return NextResponse.json({ token, user: row });
    }
  } catch (err) {
    console.error('[auth/email]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
