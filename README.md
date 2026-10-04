# Full Stack React Native Course - Build Welth (Full Stack App for IOS and Android)

A full-stack budgeting app for iOS and Android built with Expo and Supabase — track accounts and transactions, set a monthly budget, and log expenses by typing, scanning a receipt, or just speaking to it.

## Features

- **Accounts** — multiple accounts (cash, bank, credit card, savings) with a default account and running balances
- **Transactions** — income/expense tracking with categories, search, filters, and daily income vs. expense charts
- **AI receipt scanning** — snap or pick a photo of a receipt and let Gemini extract the amount, category, and description
- **AI voice entry** — describe a transaction out loud ("I spent 400 on groceries yesterday") and have it transcribed and parsed automatically
- **Monthly budget** — set a budget and track spend against it on the dashboard
- **CSV export** — export recent transactions to CSV and share them from the Transactions screen
- **AI assistant** — ask questions about your spending
- **Onboarding** — first-run currency and starting balance setup

## Tech stack

- [Expo](https://docs.expo.dev/versions/v54.0.0/) (SDK 54) + Expo Router
- [Clerk](https://clerk.com/) for authentication
- [Supabase](https://supabase.com/) (Postgres + Row Level Security) as the backend, authenticated via Clerk's native third-party auth integration (no Supabase JWT template needed)
- [Google Gemini](https://ai.google.dev/) for receipt/voice extraction
- NativeWind (Tailwind for React Native)
- Zustand
- TanStack Query
- React Hook Form + ZOD

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Add a `.env` file in the project root with:

   ```
   EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=
   EXPO_PUBLIC_SUPABASE_URL=
   EXPO_PUBLIC_SUPABASE_KEY=
   EXPO_PUBLIC_GEMINI_API_KEY=
   ```

3. In your Supabase project, add Clerk as a **Third-Party Auth** provider (Authentication → Sign In / Providers → Clerk) so `auth.jwt()->>'sub'` resolves to the Clerk user id — this app does not use the legacy Supabase JWT template approach.

4. Run the Supabase queries below to set up the schema.

5. Start the app

   ```bash
   npx expo start -c
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

## Supabase Queries

### Users Table

```sql
create table users (
  clerk_id text primary key,
  email text not null,
  name text,
  image_url text,
  currency text, -- null until the user completes onboarding
  created_at timestamp with time zone default now()
);
```

### Users RLS Policies

```sql
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
```

### Accounts Table

```sql
create table accounts (
  id uuid default gen_random_uuid() primary key,
  user_id text not null references users(clerk_id) on delete cascade,
  name text not null,
  type text not null, -- 'CASH' | 'BANK' | 'CREDIT_CARD' | 'SAVINGS'
  balance numeric not null default 0,
  is_default boolean not null default false,
  created_at timestamp with time zone default now()
);
```

### Accounts RLS Policies

```sql
alter table accounts enable row level security;

create policy "Users can manage own accounts"
on accounts for all
using (user_id = auth.jwt()->>'sub')
with check (user_id = auth.jwt()->>'sub');
```

### Transactions Table

```sql
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
```

### Transactions RLS Policies

```sql
alter table transactions enable row level security;

create policy "Users can manage own transactions"
on transactions for all
using (user_id = auth.jwt()->>'sub')
with check (user_id = auth.jwt()->>'sub');
```

### Budgets Table

```sql
-- One budget per user (simple monthly budget, no per-category breakdown)
create table budgets (
  id uuid default gen_random_uuid() primary key,
  user_id text not null unique references users(clerk_id) on delete cascade,
  amount numeric not null,
  last_alert_sent timestamp with time zone,
  last_alert_threshold numeric, -- last budget-usage % (80 or 100) emailed for, resets each calendar month
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
```

### Budgets RLS Policies

```sql
alter table budgets enable row level security;

create policy "Users can manage own budget"
on budgets for all
using (user_id = auth.jwt()->>'sub')
with check (user_id = auth.jwt()->>'sub');
```

## Budget alerts & weekly tips

Two Supabase Edge Functions in `supabase/functions/` run on a schedule and email the user via [Resend](https://resend.com/):

- **`check-budget-alerts`** — runs daily, emails a user the first time they cross 80% and again the first time they cross 100% of their monthly budget (tracked via `last_alert_sent`/`last_alert_threshold`, resets each calendar month).
- **`weekly-tips`** — runs every Monday, asks Gemini for a few short, personalized tips based on each user's last 7 days of transactions and emails them.

Neither is called from the app — they're standalone, timer-driven backend jobs that live entirely on Supabase.

### Setup

1. **Link the project** (one-time; skip if using the dashboard only)

   ```bash
   npx supabase login
   npx supabase init
   npx supabase link --project-ref <your-project-ref>
   ```

2. **Apply the DB schema** — Supabase dashboard → SQL Editor → run `scripts/schema.sql`.

3. **Deploy the two edge functions** — either:

   ```bash
   npx supabase functions deploy check-budget-alerts
   npx supabase functions deploy weekly-tips
   ```

   or from the dashboard: **Edge Functions → Deploy a new function**, paste in the contents of the corresponding `index.ts` (and the files under `_shared/`), and give it the same name as the folder — no CLI required.

4. **Set secrets** (project-wide, covers both functions) — either `npx supabase secrets set KEY=value` per line below, or dashboard → **Edge Functions → Secrets**:

   ```
   RESEND_API_KEY=
   RESEND_FROM_EMAIL=        # "Welth <alerts@yourdomain.com>" once you verify a domain in Resend;
                              # until then, use "Welth <onboarding@resend.dev>" — the address must
                              # stay onboarding@resend.dev and only delivers to the email you signed
                              # up with, but the display name (the "Welth" part) is yours to set
   GEMINI_API_KEY=           # same Gemini key as EXPO_PUBLIC_GEMINI_API_KEY, without the EXPO_PUBLIC_ prefix
   EMAIL_LOGO_URL=           # any public URL to the Welth logo, used in the email header;
                              # omit this secret entirely to fall back to a text "Welth" wordmark
   ```

   `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are provided automatically in the edge function runtime — Supabase reserves the `SUPABASE_` prefix, so you can't (and don't need to) set these yourself.

5. **Schedule them** — SQL Editor → run `scripts/cron_jobs.sql`, after filling in your real project URL and service-role key in the two `vault.create_secret(...)` calls at the top.

Once done: `check-budget-alerts` runs daily at 9am UTC, `weekly-tips` runs Mondays at 9am UTC.

### Testing without waiting for the schedule

Easiest way: dashboard → **Edge Functions** → select the function → use the built-in test/invoke panel to trigger it on demand and see the response and logs right there.

CLI alternative: `curl` the deployed URL directly (this CLI version has no `functions invoke` subcommand):

```bash
curl -i --location --request POST 'https://<project-ref>.supabase.co/functions/v1/check-budget-alerts' \
  --header 'Authorization: Bearer <anon-or-service-role-key>'
```

A response of `{"sent": 0}` just means no user currently qualifies — for `check-budget-alerts` you need a test user whose spend is ≥80% of their budget, for `weekly-tips` a test user with a transaction in the last 7 days. `last_alert_sent`/`last_alert_threshold` block repeat sends within the same month, so reset them on your test budget row between runs if you want to re-trigger the same threshold.
