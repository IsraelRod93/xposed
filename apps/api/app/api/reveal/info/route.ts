import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getAuthUserId } from '@/lib/auth';

const ALL_CLUES = ['country', 'os', 'hour', 'platform'] as const;
type ClueType = typeof ALL_CLUES[number];

function formatHour(h: number | null): string {
  if (h == null) return 'Desconocida';
  if (h >= 5 && h < 12) return 'Mañana (5–12h)';
  if (h >= 12 && h < 18) return 'Tarde (12–18h)';
  if (h >= 18 && h < 22) return 'Noche (18–22h)';
  return 'Madrugada (22–5h)';
}

function getValue(type: ClueType, msg: any): string {
  switch (type) {
    case 'country':  return msg.sender_country || 'Desconocido';
    case 'os':       return msg.sender_os || 'Desconocido';
    case 'hour':     return formatHour(msg.sender_hour);
    case 'platform': return msg.sender_platform || 'Directo';
  }
}

export async function POST(req: NextRequest) {
  if (!sql) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });

  const userId = getAuthUserId(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { message_id } = await req.json();
    if (!message_id) return NextResponse.json({ error: 'Missing message_id' }, { status: 400 });

    const msgs = await sql`
      SELECT content, revealed_premium, is_clue_revealed,
             sender_country, sender_os, sender_city, sender_platform, sender_hour
      FROM messages WHERE id = ${message_id} AND receiver_id = ${userId}
    `;
    if (msgs.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const msg = msgs[0];
    const revealed: string[] = (msg.revealed_premium || '').split(',').filter(Boolean);
    const values: Record<string, string> = {};
    revealed.forEach(c => { values[c] = getValue(c as ClueType, msg); });
    const allRevealed = revealed.length >= ALL_CLUES.filter(c => msg[`sender_${c === 'os' ? 'os' : c}`] != null).length;

    return NextResponse.json({
      content: msg.content,
      revealed,
      values,
      allRevealed,
    });
  } catch (err) {
    console.error('[reveal/info]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
