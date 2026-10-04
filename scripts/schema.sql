-- Full current schema for Welth. Run this once against a fresh Supabase project.
--
-- Auth: Clerk is configured as a Third-Party Auth provider in the Supabase
-- dashboard, so auth.jwt()->>'sub' resolves to the Clerk user id. No Supabase
-- JWT template is used.

-- ── Users ────────────────────────────────────────────────────────────────

create table users (
  clerk_id text primary key,
  email text not null,
  name text,
  image_url text,
  currency text, -- null until the user completes onboarding
  created_at timestamp with time zone default now()
);

alter table users enable row level security;

create policy "Users can insert own row"
on users for insert
with check (clerk_id = auth.jwt()->>'sub');

create policy "Users can read own row"
on users for select
using (clerk_id = auth.jwt()->>'sub');

create policy "Users can update own row"
on users for update
using (clerk_id = auth.jwt()->>'sub');

-- ── Accounts ─────────────────────────────────────────────────────────────

create table accounts (
  id uuid default gen_random_uuid() primary key,
  user_id text not null references users(clerk_id) on delete cascade,
  name text not null,
  type text not null, -- 'CASH' | 'BANK' | 'CREDIT_CARD' | 'SAVINGS'
  balance numeric not null default 0,
  is_default boolean not null default false,
  created_at timestamp with time zone default now()
);

alter table accounts enable row level security;

create policy "Users can manage own accounts"
on accounts for all
using (user_id = auth.jwt()->>'sub')
with check (user_id = auth.jwt()->>'sub');

-- ── Transactions ─────────────────────────────────────────────────────────

create table transactions (
  id uuid default gen_random_uuid() primary key,
  user_id text not null references users(clerk_id) on delete cascade,
  account_id uuid not null references accounts(id) on delete cascade,
  type text not null, -- 'INCOME' | 'EXPENSE'
  amount numeric not null,
  category text not null,
  description text,
  date timestamp with time zone not null default now(),
  status text not null default 'COMPLETED',
  input_method text not null default 'MANUAL', -- 'MANUAL' | 'RECEIPT_SCAN' | 'VOICE'
  voice_transcript text,
  is_flagged boolean not null default false,
  flag_reason text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table transactions enable row level security;

create policy "Users can manage own transactions"
on transactions for all
using (user_id = auth.jwt()->>'sub')
with check (user_id = auth.jwt()->>'sub');

-- ── Budgets ──────────────────────────────────────────────────────────────
-- One simple monthly budget per user.

create table budgets (
  id uuid default gen_random_uuid() primary key,
  user_id text not null unique references users(clerk_id) on delete cascade,
  amount numeric not null,
  last_alert_sent timestamp with time zone,
  last_alert_threshold numeric, -- last budget-usage % (e.g. 80 or 100) an email was sent for, resets each calendar month
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table budgets enable row level security;

create policy "Users can manage own budget"
on budgets for all
using (user_id = auth.jwt()->>'sub')
with check (user_id = auth.jwt()->>'sub');
