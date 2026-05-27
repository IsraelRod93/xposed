-- Updated Tables for Xposed (Neon/PostgreSQL)

-- Users table with stars and gamification fields
CREATE TABLE IF NOT EXISTS users (
  telegram_id BIGINT PRIMARY KEY,
  username TEXT,
  share_link TEXT UNIQUE NOT NULL,
  stars INTEGER DEFAULT 100,
  streak_count INTEGER DEFAULT 0,
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_mission_completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages table (secret confessions)
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receiver_id BIGINT REFERENCES users(telegram_id),
  content TEXT NOT NULL,
  sender_os TEXT,
  sender_country TEXT,
  is_clue_revealed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions for tracking star usage and rewards
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id BIGINT REFERENCES users(telegram_id),
  type TEXT NOT NULL, -- 'reveal', 'mission_reward', 'purchase'
  amount INTEGER NOT NULL, -- positive for rewards, negative for costs
  message_id UUID REFERENCES messages(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily missions progress tracking (optional, but good for scalability)
-- For now, we can calculate today's progress by counting messages.
