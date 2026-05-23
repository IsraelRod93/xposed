-- Tables for Xposed
create table users (
  telegram_id bigint primary key,
  username text,
  share_link text unique not null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

create table messages (
  id uuid primary key default gen_random_uuid(),
  receiver_id bigint references users(telegram_id),
  content text not null,
  sender_os text,
  sender_country text,
  is_clue_revealed boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

create table transactions (
  id uuid primary key default gen_random_uuid(),
  user_id bigint references users(telegram_id),
  message_id uuid references messages(id),
  amount integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);
