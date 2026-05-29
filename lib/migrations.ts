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

export async function ensureSubscriptionColumn() {
  if (!sql) return;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS subscribed_until TIMESTAMP WITH TIME ZONE`;
}

export async function ensureAdColumns() {
  if (!sql) return;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS daily_ads_watched INTEGER DEFAULT 0`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS ads_reset_date DATE`;
}

export async function ensureReferralColumns() {
  if (!sql) return;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by BIGINT`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_count INTEGER DEFAULT 0`;
}

export async function ensurePremiumClueColumns() {
  if (!sql) return;
  await sql`ALTER TABLE messages ADD COLUMN IF NOT EXISTS sender_city TEXT`;
  await sql`ALTER TABLE messages ADD COLUMN IF NOT EXISTS sender_platform TEXT`;
  await sql`ALTER TABLE messages ADD COLUMN IF NOT EXISTS sender_hour INTEGER`;
  await sql`ALTER TABLE messages ADD COLUMN IF NOT EXISTS revealed_premium TEXT DEFAULT ''`;
}

export async function ensureMessageColumns() {
  if (!sql) return;
  await sql`ALTER TABLE messages ADD COLUMN IF NOT EXISTS sender_city TEXT`;
  await sql`ALTER TABLE messages ADD COLUMN IF NOT EXISTS sender_platform TEXT`;
  await sql`ALTER TABLE messages ADD COLUMN IF NOT EXISTS sender_hour INTEGER`;
  await sql`ALTER TABLE messages ADD COLUMN IF NOT EXISTS sender_ip TEXT`;
  await sql`ALTER TABLE messages ADD COLUMN IF NOT EXISTS revealed_premium TEXT DEFAULT ''`;
  await sql`ALTER TABLE messages ADD COLUMN IF NOT EXISTS hidden_by_user BOOLEAN DEFAULT FALSE`;
}

export async function ensureBoostColumn() {
  if (!sql) return;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS boosted_until TIMESTAMP WITH TIME ZONE`;
}

export async function ensureMissionNotifiedColumn() {
  if (!sql) return;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS mission_notified_date DATE`;
}
