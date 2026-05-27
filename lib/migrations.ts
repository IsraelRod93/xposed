import { sql } from './db';

export async function ensureTransactionsTable() {
  if (!sql) return;
  await sql`
    CREATE TABLE IF NOT EXISTS transactions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id BIGINT REFERENCES users(telegram_id),
      type TEXT NOT NULL,
      amount INTEGER NOT NULL,
      message_id UUID REFERENCES messages(id),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `;
}
