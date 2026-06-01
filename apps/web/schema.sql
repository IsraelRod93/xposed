-- Xposed — schema v2 (sin Telegram, auth propia)

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email                 TEXT,
  display_name          TEXT,
  share_link            TEXT UNIQUE NOT NULL,
  stars                 INTEGER DEFAULT 0,
  streak_count          INTEGER DEFAULT 0,
  last_active_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  subscribed_until      TIMESTAMP WITH TIME ZONE,
  stripe_customer_id    TEXT,
  stripe_subscription_id TEXT,
  link_changes          INTEGER DEFAULT 0,
  missions_claimed_today TEXT DEFAULT '',
  missions_reset_date   DATE,
  mission_notified_date DATE,
  daily_ads_watched     INTEGER DEFAULT 0,
  ads_reset_date        DATE,
  referred_by           UUID REFERENCES users(id),
  referral_count        INTEGER DEFAULT 0,
  boosted_until         TIMESTAMP WITH TIME ZONE,
  created_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS auth_providers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider    TEXT NOT NULL,      -- 'google' | 'apple'
  provider_id TEXT NOT NULL,      -- sub/uid del proveedor externo
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(provider, provider_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receiver_id      UUID REFERENCES users(id) ON DELETE CASCADE,
  content          TEXT NOT NULL,
  sender_os        TEXT,
  sender_country   TEXT,
  sender_city      TEXT,
  sender_platform  TEXT,
  sender_hour      INTEGER,
  sender_ip        TEXT,
  is_clue_revealed BOOLEAN DEFAULT FALSE,
  revealed_premium TEXT DEFAULT '',
  hidden_by_user   BOOLEAN DEFAULT FALSE,
  created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reports (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id  UUID REFERENCES messages(id) ON DELETE CASCADE,
  reporter_id UUID REFERENCES users(id),
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, reporter_id)
);

CREATE TABLE IF NOT EXISTS transactions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID REFERENCES users(id),
  type              TEXT NOT NULL,
  amount            DECIMAL(10,2) NOT NULL,
  stripe_payment_id TEXT,
  created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_messages_receiver    ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created     ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_auth_providers_user  ON auth_providers(user_id);
CREATE INDEX IF NOT EXISTS idx_users_share_link     ON users(share_link);
CREATE INDEX IF NOT EXISTS idx_users_boosted        ON users(boosted_until);
