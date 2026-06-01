import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getAuthUserId } from '@/lib/auth';

// Product IDs — deben coincidir con los configurados en Google Play y App Store
const PRODUCTS: Record<string, { type: 'subscription' | 'tokens'; tokens?: number; months?: number }> = {
  'xposed_pro_monthly':  { type: 'subscription', months: 1 },
  'xposed_tokens_100':   { type: 'tokens', tokens: 100 },
  'xposed_tokens_500':   { type: 'tokens', tokens: 500 },
  'xposed_tokens_1000':  { type: 'tokens', tokens: 1000 },
};

export async function POST(req: NextRequest) {
  if (!sql) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });

  const userId = getAuthUserId(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { product_id, purchase_token, platform } = await req.json();

    if (!product_id || !purchase_token || !platform) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const product = PRODUCTS[product_id];
    if (!product) {
      return NextResponse.json({ error: 'Invalid product' }, { status: 400 });
    }

    // Prevent duplicate processing
    const existing = await sql`
      SELECT id FROM transactions
      WHERE stripe_payment_id = ${purchase_token} LIMIT 1
    `;
    if (existing.length > 0) {
      return NextResponse.json({ ok: true, message: 'Already processed' });
    }

    if (product.type === 'subscription') {
      await sql`
        UPDATE users SET subscribed_until = NOW() + INTERVAL '30 days'
        WHERE id = ${userId}
      `;
      await sql`
        INSERT INTO transactions (user_id, type, amount, stripe_payment_id)
        VALUES (${userId}, 'subscription_iap', -9.99, ${purchase_token})
      `.catch(() => {});
    } else if (product.type === 'tokens' && product.tokens) {
      await sql`
        UPDATE users SET stars = stars + ${product.tokens} WHERE id = ${userId}
      `;
      await sql`
        INSERT INTO transactions (user_id, type, amount, stripe_payment_id)
        VALUES (${userId}, 'tokens_iap', ${-product.tokens * 0.01}, ${purchase_token})
      `.catch(() => {});
    }

    return NextResponse.json({ ok: true, product_id, type: product.type });
  } catch (err) {
    console.error('[purchase/verify]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
