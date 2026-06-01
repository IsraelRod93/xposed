import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getAuthUserId } from '@/lib/auth';

export async function GET(req: NextRequest) {
  if (!sql) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });

  const userId = getAuthUserId(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const users = await sql`
      UPDATE users SET
        streak_count = CASE
          WHEN last_active_at::date = CURRENT_DATE - 1 THEN streak_count + 1
          WHEN last_active_at::date = CURRENT_DATE     THEN streak_count
          ELSE 1
        END,
        last_active_at = NOW()
      WHERE id = ${userId}
      RETURNING *
    `;

    if (users.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const rankResult = await sql`
      SELECT COUNT(*) + 1 AS rank FROM users u
      WHERE (SELECT COUNT(*) FROM messages m WHERE m.receiver_id = u.id) >
            (SELECT COUNT(*) FROM messages m WHERE m.receiver_id = ${userId})
    `;

    return NextResponse.json({
      ...users[0],
      rank: parseInt(rankResult[0].rank),
    });
  } catch (err) {
    console.error('[auth/me]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
