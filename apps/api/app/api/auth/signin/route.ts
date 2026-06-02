import { NextRequest, NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';
import appleSignin from 'apple-signin-auth';
import { sql } from '@/lib/db';
import { signJWT } from '@/lib/auth';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

async function verifyGoogleToken(token: string) {
  const ticket = await googleClient.verifyIdToken({
    idToken: token,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();
  if (!payload) throw new Error('Invalid Google token');
  return { providerId: payload.sub, email: payload.email ?? null, name: payload.name ?? null };
}

async function verifyAppleToken(token: string) {
  const payload = await appleSignin.verifyIdToken(token, {
    audience: process.env.APPLE_CLIENT_ID,
    ignoreExpiration: false,
  });
  return { providerId: payload.sub, email: payload.email ?? null, name: null };
}

export async function POST(req: NextRequest) {
  if (!sql) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });

  try {
    const { provider, token, display_name, referral_code } = await req.json();

    if (!provider || !token) {
      return NextResponse.json({ error: 'Missing provider or token' }, { status: 400 });
    }

    let providerData: { providerId: string; email: string | null; name: string | null };

    if (provider === 'google') {
      providerData = await verifyGoogleToken(token);
    } else if (provider === 'apple') {
      providerData = await verifyAppleToken(token);
    } else {
      return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
    }

    // Find existing auth provider record
    const existing = await sql`
      SELECT u.* FROM auth_providers ap
      JOIN users u ON u.id = ap.user_id
      WHERE ap.provider = ${provider} AND ap.provider_id = ${providerData.providerId}
    `;

    if (existing.length > 0) {
      const user = existing[0];
      const jwtToken = signJWT(user.id);
      return NextResponse.json({ token: jwtToken, user });
    }

    // New user — create account
    const baseLink = (providerData.email?.split('@')[0] ?? 'user')
      .toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20);
    const shareLink = `${baseLink}_${Math.random().toString(36).slice(2, 7)}`;

    let referrerId: string | null = null;
    if (referral_code) {
      const referrer = await sql`SELECT id FROM users WHERE share_link = ${referral_code}`;
      if (referrer.length > 0) referrerId = referrer[0].id;
    }

    const initialStars = referrerId ? 150 : 100;
    const name = display_name ?? providerData.name ?? shareLink;

    // Usuario + credenciales en UNA sola sentencia (CTE) => atómica, sin huérfanos.
    const [newUser] = await sql`
      WITH new_user AS (
        INSERT INTO users (email, display_name, share_link, stars, referred_by)
        VALUES (${providerData.email}, ${name}, ${shareLink}, ${initialStars}, ${referrerId})
        RETURNING *
      ), new_provider AS (
        INSERT INTO auth_providers (user_id, provider, provider_id)
        SELECT id, ${provider}, ${providerData.providerId} FROM new_user
      )
      SELECT * FROM new_user
    `;

    if (referrerId) {
      await sql`
        UPDATE users SET stars = stars + 50, referral_count = referral_count + 1
        WHERE id = ${referrerId}
      `;
    }

    const jwtToken = signJWT(newUser.id);
    return NextResponse.json({ token: jwtToken, user: newUser });
  } catch (err: any) {
    console.error('[auth/signin]', err.message);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
  }
}
