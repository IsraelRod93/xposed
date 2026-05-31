import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(req: NextRequest) {
  if (!sql) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });

  try {
    const ranking = await sql`
      SELECT
        u.id,
        u.display_name,
        u.share_link,
        COUNT(m.id)::int AS message_count
      FROM users u
      LEFT JOIN messages m ON u.id = m.receiver_id
      GROUP BY u.id, u.display_name, u.share_link
      ORDER BY message_count DESC
      LIMIT 25
    `;

    return NextResponse.json(
      ranking.map((u, i) => ({
        rank: i + 1,
        id: u.id,
        name: u.display_name || u.share_link,
        share_link: u.share_link,
        count: u.message_count,
        tier: i < 3 ? 'legend' : i < 10 ? 'gold' : i < 25 ? 'silver' : 'bronze',
      }))
    );
  } catch (err) {
    console.error('[ranking]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
