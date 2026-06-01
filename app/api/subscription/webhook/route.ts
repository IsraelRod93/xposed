import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { sql } from '@/lib/db';

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY not set');
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig  = req.headers.get('stripe-signature')!;
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    console.error('[webhook] Invalid signature:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (!sql) return NextResponse.json({ ok: true });

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        if (!userId || session.mode !== 'subscription') break;

        await sql`
          UPDATE users SET
            subscribed_until       = NOW() + INTERVAL '30 days',
            stripe_subscription_id = ${session.subscription as string}
          WHERE id = ${userId}
        `;
        await sql`
          INSERT INTO transactions (user_id, type, amount, stripe_payment_id)
          VALUES (${userId}, 'subscription', -10.00, ${session.id})
        `.catch(() => {});
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        await sql`
          UPDATE users SET subscribed_until = NOW() + INTERVAL '30 days'
          WHERE stripe_customer_id = ${customerId}
        `;
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;
        await sql`
          UPDATE users SET
            subscribed_until       = NULL,
            stripe_subscription_id = NULL
          WHERE stripe_customer_id = ${customerId}
        `;
        break;
      }
    }
  } catch (err) {
    console.error('[webhook] Handler error:', err);
  }

  return NextResponse.json({ ok: true });
}

export const config = { api: { bodyParser: false } };
