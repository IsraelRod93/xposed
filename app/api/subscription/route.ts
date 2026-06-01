import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { sql } from '@/lib/db';
import { getAuthUserId } from '@/lib/auth';

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY not set');
  return new Stripe(process.env.STRIPE_SECRET_KEY);
} // $10/mes en Stripe dashboard

export async function POST(req: NextRequest) {
  if (!sql) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });

  const userId = getAuthUserId(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const stripe = getStripe();
    const PRICE_ID = process.env.STRIPE_PRICE_ID!;

    const users = await sql`SELECT email, stripe_customer_id FROM users WHERE id = ${userId}`;
    if (users.length === 0) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const user = users[0];
    const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

    let customerId = user.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        metadata: { userId },
      });
      customerId = customer.id;
      await sql`UPDATE users SET stripe_customer_id = ${customerId} WHERE id = ${userId}`;
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: PRICE_ID, quantity: 1 }],
      success_url: `${appUrl}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${appUrl}/subscription/cancel`,
      metadata: { userId },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('[subscription]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!sql) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });

  const userId = getAuthUserId(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const stripe = getStripe();
    const users = await sql`SELECT stripe_subscription_id FROM users WHERE id = ${userId}`;
    if (!users[0]?.stripe_subscription_id) {
      return NextResponse.json({ error: 'No active subscription' }, { status: 404 });
    }

    await stripe.subscriptions.cancel(users[0].stripe_subscription_id);
    await sql`
      UPDATE users SET stripe_subscription_id = NULL WHERE id = ${userId}
    `;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[subscription DELETE]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
