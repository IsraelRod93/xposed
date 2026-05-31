import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getAuthUserId } from '@/lib/auth';

const REVEAL_COST = 25;
const ALL_CLUES = ['country', 'os', 'hour', 'city', 'platform'] as const;
type ClueType = typeof ALL_CLUES[number];

function hasData(type: ClueType, msg: any): boolean {
  switch (type) {
    case 'country':  return !!msg.sender_country;
    case 'os':       return !!msg.sender_os;
    case 'city':     return msg.sender_city != null;
    case 'platform': return msg.sender_platform != null;
    case 'hour':     return msg.sender_hour != null;
  }
}

function formatHour(h: number | null): string {
  if (h == null) return 'Desconocida';
  if (h >= 5  && h < 12) return 'Mañana (5–12h)';
  if (h >= 12 && h < 18) return 'Tarde (12–18h)';
  if (h >= 18 && h < 22) return 'Noche (18–22h)';
  return 'Madrugada (22–5h)';
}

function getClueValue(type: ClueType, msg: any): string {
  switch (type) {
    case 'country':  return msg.sender_country || 'Desconocido';
    case 'os':       return msg.sender_os || 'Desconocido';
    case 'hour':     return formatHour(msg.sender_hour);
    case 'city':     return msg.sender_city || 'Desconocida';
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
      SELECT revealed_premium, is_clue_revealed,
             sender_country, sender_os, sender_city, sender_platform, sender_hour
      FROM messages WHERE id = ${message_id} AND receiver_id = ${userId}
    `;
    if (msgs.length === 0) return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    const msg = msgs[0];

    const users = await sql`SELECT stars, subscribed_until FROM users WHERE id = ${userId}`;
    if (users.length === 0) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    const { stars, subscribed_until } = users[0];
    const isSubscribed = subscribed_until && new Date(subscribed_until) > new Date();

    const revealedSoFar: string[] = (msg.revealed_premium || '').split(',').filter(Boolean);
    const availableClues = [...ALL_CLUES].filter(c => hasData(c, msg));
    const buildValues = (list: string[]) => {
      const v: Record<string, string> = {};
      list.forEach(c => { v[c] = getClueValue(c as ClueType, msg); });
      return v;
    };

    if (isSubscribed) {
      const availableStr = availableClues.join(',');
      await sql`
        UPDATE messages SET revealed_premium = ${availableStr}, is_clue_revealed = true
        WHERE id = ${message_id} AND receiver_id = ${userId}
      `;
      return NextResponse.json({ ok: true, allRevealed: true, revealed: availableClues, available: availableClues, values: buildValues(availableClues) });
    }

    const unrevealed = availableClues.filter(c => !revealedSoFar.includes(c));

    if (unrevealed.length === 0) {
      return NextResponse.json({ ok: true, allRevealed: true, revealed: revealedSoFar, available: availableClues, values: buildValues(revealedSoFar) });
    }

    if (stars < REVEAL_COST) {
      return NextResponse.json({ error: 'Not enough stars', revealed: revealedSoFar, available: availableClues, values: buildValues(revealedSoFar) }, { status: 403 });
    }

    const randomClue = unrevealed[Math.floor(Math.random() * unrevealed.length)];
    const newRevealedList = [...revealedSoFar, randomClue];
    const newRevealed = newRevealedList.join(',');
    const allRevealed = newRevealedList.length === availableClues.length;

    await sql`
      UPDATE messages SET revealed_premium = ${newRevealed}, is_clue_revealed = ${allRevealed}
      WHERE id = ${message_id} AND receiver_id = ${userId}
    `;
    await sql`
      UPDATE users SET stars = stars - ${REVEAL_COST} WHERE id = ${userId} AND stars >= ${REVEAL_COST}
    `;
    await sql`
      INSERT INTO transactions (user_id, message_id, type, amount)
      VALUES (${userId}, ${message_id}, 'reveal', ${-REVEAL_COST})
    `.catch(() => {});

    return NextResponse.json({
      ok: true,
      clue_type: randomClue,
      value: getClueValue(randomClue as ClueType, msg),
      revealed: newRevealedList,
      available: availableClues,
      remaining: unrevealed.length - 1,
      allRevealed,
      values: buildValues(newRevealedList),
    });
  } catch (err) {
    console.error('[reveal]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
