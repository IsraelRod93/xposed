-- Xposed — schema completo
-- Ejecutar este archivo una vez al crear la base de datos

CREATE TABLE IF NOT EXISTS users (
  telegram_id          BIGINT PRIMARY KEY,
  username             TEXT,
  share_link           TEXT UNIQUE NOT NULL,
  stars                INTEGER DEFAULT 100,
  streak_count         INTEGER DEFAULT 0,
  last_active_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_mission_completed_at TIMESTAMP WITH TIME ZONE,
  created_at           TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  display_name         TEXT,
  link_changes         INTEGER DEFAULT 0,
  subscribed_until     TIMESTAMP WITH TIME ZONE,
  missions_claimed_today TEXT DEFAULT '',
  missions_reset_date  DATE,
  mission_notified_date DATE,
  daily_ads_watched    INTEGER DEFAULT 0,
  ads_reset_date       DATE,
  referred_by          BIGINT,
  referral_count       INTEGER DEFAULT 0,
  boosted_until        TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS messages (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receiver_id      BIGINT REFERENCES users(telegram_id),
  content          TEXT NOT NULL,
  sender_os        TEXT,
  sender_country   TEXT,
  sender_city      TEXT,
  sender_platform  TEXT,
  sender_hour      INTEGER,
  is_clue_revealed BOOLEAN DEFAULT FALSE,
  revealed_premium TEXT DEFAULT '',
  hidden_by_user   BOOLEAN DEFAULT FALSE,
  sender_ip        TEXT,
  created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reports (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id  UUID REFERENCES messages(id) ON DELETE CASCADE,
  reporter_id BIGINT,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, reporter_id)
);

CREATE TABLE IF NOT EXISTS transactions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    BIGINT REFERENCES users(telegram_id),
  type       TEXT NOT NULL,
  amount     INTEGER NOT NULL,
  message_id UUID REFERENCES messages(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Script de migración para bases de datos existentes
-- (solo ejecutar si ya existe la base de datos con el schema viejo)
--
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name TEXT;
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS link_changes INTEGER DEFAULT 0;
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS subscribed_until TIMESTAMP WITH TIME ZONE;
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS missions_claimed_today TEXT DEFAULT '';
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS missions_reset_date DATE;
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS mission_notified_date DATE;
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS daily_ads_watched INTEGER DEFAULT 0;
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS ads_reset_date DATE;
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by BIGINT;
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_count INTEGER DEFAULT 0;
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS boosted_until TIMESTAMP WITH TIME ZONE;
-- ALTER TABLE messages ADD COLUMN IF NOT EXISTS sender_city TEXT;
-- ALTER TABLE messages ADD COLUMN IF NOT EXISTS sender_platform TEXT;
-- ALTER TABLE messages ADD COLUMN IF NOT EXISTS sender_hour INTEGER;
-- ALTER TABLE messages ADD COLUMN IF NOT EXISTS revealed_premium TEXT DEFAULT '';
