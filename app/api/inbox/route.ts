import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getAuthUserId } from '@/lib/auth';

export async function GET(req: NextRequest) {
  if (!sql) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });

  const userId = getAuthUserId(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const messages = await sql`
      SELECT * FROM messages
      WHERE receiver_id = ${userId}
        AND (hidden_by_user IS NULL OR hidden_by_user = FALSE)
      ORDER BY created_at DESC
    `;

    const [weeklyCount] = await sql`
      SELECT COUNT(*) FROM messages
      WHERE receiver_id = ${userId} AND created_at > NOW() - INTERVAL '7 days'
    `;

    const [todayCount] = await sql`
      SELECT COUNT(*) FROM messages
      WHERE receiver_id = ${userId} AND created_at::date = CURRENT_DATE
    `;

    const [rankResult] = await sql`
      SELECT COUNT(*) + 1 AS rank FROM users u
      WHERE (SELECT COUNT(*) FROM messages m WHERE m.receiver_id = u.id) > ${messages.length}
    `;

    return NextResponse.json({
      messages,
      stats: {
        weekly: parseInt(weeklyCount.count),
        today: parseInt(todayCount.count),
        rank: parseInt(rankResult.rank),
      },
    });
  } catch (err) {
    console.error('[inbox]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
