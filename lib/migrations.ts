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

export async function ensureDisplayNameColumn() {
  if (!sql) return;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name TEXT`;
}

export async function ensureLinkChangesColumn() {
  if (!sql) return;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS link_changes INTEGER DEFAULT 0`;
}

export async function ensureMissionsColumns() {
  if (!sql) return;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS missions_claimed_today TEXT DEFAULT ''`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS missions_reset_date DATE`;
}
