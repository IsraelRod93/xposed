import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

const REVEAL_COST = 25;
const ALL_CLUES = ['country', 'os', 'hour', 'city', 'platform'] as const;
type ClueType = typeof ALL_CLUES[number];

function hasData(type: ClueType, msg: any): boolean {
  switch (type) {
    case 'country':  return !!msg.sender_country;
    case 'os':       return !!msg.sender_os;
    case 'city':     return msg.sender_city !== null && msg.sender_city !== undefined;
    case 'platform': return msg.sender_platform !== null && msg.sender_platform !== undefined;
    case 'hour':     return msg.sender_hour !== null && msg.sender_hour !== undefined;
  }
}

function formatHour(h: number | null): string {
  if (h === null || h === undefined) return 'Desconocida';
  if (h >= 5 && h < 12) return 'Mañana (5–12h)';
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
    case 'platform': return msg.sender_platform || 'Web directa';
  }
}

export async function POST(req: NextRequest) {
  if (!sql) return NextResponse.json({ error: "Database not configured" }, { status: 500 });

  try {
    const { telegram_id, message_id } = await req.json();
    if (!telegram_id || !message_id) {
      return NextResponse.json({ error: "Missing required data" }, { status: 400 });
    }

    const msgs = await sql`
      SELECT revealed_premium, is_clue_revealed,
             sender_country, sender_os, sender_city, sender_platform, sender_hour
      FROM messages WHERE id = ${message_id}::uuid AND receiver_id = ${telegram_id}
    `;
    if (msgs.length === 0) return NextResponse.json({ error: "Message not found" }, { status: 404 });
    const msg = msgs[0];

    const users = await sql`SELECT stars, subscribed_until FROM users WHERE telegram_id = ${telegram_id}`;
    if (users.length === 0) return NextResponse.json({ error: "User not found" }, { status: 404 });
    const { stars, subscribed_until } = users[0];
    const isSubscribed = subscribed_until && new Date(subscribed_until) > new Date();

    // Backwards compat: old messages with is_clue_revealed=true but no revealed_premium
    let revealedSoFar: string[];
    if (msg.is_clue_revealed && (!msg.revealed_premium || msg.revealed_premium === '')) {
      revealedSoFar = ['country', 'os'];
    } else {
      revealedSoFar = (msg.revealed_premium || '').split(',').filter(Boolean);
    }

    const buildValues = (list: string[]) => {
      const v: Record<string, string> = {};
      list.forEach(c => { v[c] = getClueValue(c as ClueType, msg); });
      return v;
    };

    // Only offer clues that have real data
    const availableClues = [...ALL_CLUES].filter(c => hasData(c, msg));

    // Subscribed: reveal all available clues for free
    if (isSubscribed) {
      const availableStr = availableClues.join(',');
      await sql`
        UPDATE messages SET revealed_premium = ${availableStr}, is_clue_revealed = true
        WHERE id = ${message_id}::uuid AND receiver_id = ${telegram_id}
      `;
      return NextResponse.json({
        ok: true, allRevealed: true,
        revealed: availableClues,
        available: availableClues,
        values: buildValues(availableClues),
      });
    }

    const unrevealed = availableClues.filter(c => !revealedSoFar.includes(c));

    // All available already revealed — just return values
    if (unrevealed.length === 0) {
      return NextResponse.json({
        ok: true, allRevealed: true,
        revealed: revealedSoFar,
        available: availableClues,
        values: buildValues(revealedSoFar),
      });
    }

    // Not enough tokens
    if (stars < REVEAL_COST) {
      return NextResponse.json({
        error: "Not enough stars",
        revealed: revealedSoFar,
        available: availableClues,
        values: buildValues(revealedSoFar),
      }, { status: 403 });
    }

    // Pick a random unrevealed clue (only from available ones)
    const randomClue = unrevealed[Math.floor(Math.random() * unrevealed.length)];
    const newRevealedList = [...revealedSoFar, randomClue];
    const newRevealed = newRevealedList.join(',');
    const allRevealed = newRevealedList.length === availableClues.length;

    await sql`
      UPDATE messages SET revealed_premium = ${newRevealed}, is_clue_revealed = ${allRevealed}
      WHERE id = ${message_id}::uuid AND receiver_id = ${telegram_id}
    `;
    await sql`
      WITH updated_user AS (
        UPDATE users SET stars = stars - ${REVEAL_COST}
        WHERE telegram_id = ${telegram_id} AND stars >= ${REVEAL_COST}
        RETURNING telegram_id
      )
      INSERT INTO transactions (user_id, message_id, type, amount)
      SELECT ${telegram_id}, ${message_id}::uuid, 'reveal', ${-REVEAL_COST}
      FROM updated_user
    `;

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
    console.error("Error revealing clue:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
