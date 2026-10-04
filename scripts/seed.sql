-- Seed script for local/dev testing. Run this in the Supabase SQL editor.
-- Replace the clerk_id below with your own before running.

do $$
declare
  target_clerk_id text := 'user_3GGaMrbJydUBeS51sk6yjBkVwcO';
  v_user_id text;
  v_account_id uuid;
  v_hdfc_account_id uuid;
  v_cash_account_id uuid;
  v_credit_account_id uuid;
  v_now timestamptz := now();
  v_day int;
  v_expense_categories text[] := array['food', 'groceries', 'transport', 'shopping', 'entertainment', 'utilities'];
  v_day_date date;
begin
  select clerk_id into v_user_id from users where clerk_id = target_clerk_id;
  if v_user_id is null then
    raise exception 'No user found with clerk_id %. Update target_clerk_id and re-run.', target_clerk_id;
  end if;

  -- wipe any previous seed data for this user so the script is re-runnable
  delete from transactions where user_id = v_user_id;
  delete from budgets where user_id = v_user_id;
  delete from accounts where user_id = v_user_id;

  -- ── Accounts: Cash, Bank, Credit Card, Savings ────────────────────────
  insert into accounts (user_id, name, type, balance, is_default)
  values (v_user_id, 'SBI Bank', 'BANK', 0, true)
  returning id into v_account_id;

  insert into accounts (user_id, name, type, balance, is_default)
  values (v_user_id, 'HDFC Savings', 'SAVINGS', 0, false)
  returning id into v_hdfc_account_id;

  insert into accounts (user_id, name, type, balance, is_default)
  values (v_user_id, 'Wallet Cash', 'CASH', 0, false)
  returning id into v_cash_account_id;

  insert into accounts (user_id, name, type, balance, is_default)
  values (v_user_id, 'HDFC Credit Card', 'CREDIT_CARD', 0, false)
  returning id into v_credit_account_id;

  -- ── Transactions: last 6 months, mixed income + expense ──────────────
  insert into transactions (user_id, account_id, type, amount, category, description, date, input_method)
  values
    -- income (salary each month)
    (v_user_id, v_account_id, 'INCOME', 75000, 'salary', 'Monthly salary', v_now - interval '5 months', 'MANUAL'),
    (v_user_id, v_account_id, 'INCOME', 75000, 'salary', 'Monthly salary', v_now - interval '4 months', 'MANUAL'),
    (v_user_id, v_account_id, 'INCOME', 75000, 'salary', 'Monthly salary', v_now - interval '3 months', 'MANUAL'),
    (v_user_id, v_account_id, 'INCOME', 78000, 'salary', 'Monthly salary', v_now - interval '2 months', 'MANUAL'),
    (v_user_id, v_account_id, 'INCOME', 78000, 'salary', 'Monthly salary', v_now - interval '1 month', 'MANUAL'),
    (v_user_id, v_account_id, 'INCOME', 78000, 'salary', 'Monthly salary', v_now, 'MANUAL'),
    (v_user_id, v_account_id, 'INCOME', 8000, 'freelance', 'Freelance project', v_now - interval '2 months', 'MANUAL'),

    -- expenses, spread across last 6 months and several categories
    (v_user_id, v_account_id, 'EXPENSE', 4200, 'food', 'Restaurants & takeout', v_now - interval '5 months', 'MANUAL'),
    (v_user_id, v_account_id, 'EXPENSE', 6100, 'groceries', 'Monthly groceries', v_now - interval '5 months', 'MANUAL'),
    (v_user_id, v_account_id, 'EXPENSE', 2200, 'transport', 'Cab rides', v_now - interval '5 months', 'MANUAL'),

    (v_user_id, v_account_id, 'EXPENSE', 5300, 'food', 'Restaurants & takeout', v_now - interval '4 months', 'MANUAL'),
    (v_user_id, v_account_id, 'EXPENSE', 5900, 'groceries', 'Monthly groceries', v_now - interval '4 months', 'MANUAL'),
    (v_user_id, v_account_id, 'EXPENSE', 3100, 'shopping', 'Clothes', v_now - interval '4 months', 'MANUAL'),
    (v_user_id, v_account_id, 'EXPENSE', 1800, 'entertainment', 'Movies', v_now - interval '4 months', 'MANUAL'),

    (v_user_id, v_account_id, 'EXPENSE', 4800, 'food', 'Restaurants & takeout', v_now - interval '3 months', 'MANUAL'),
    (v_user_id, v_account_id, 'EXPENSE', 6400, 'groceries', 'Monthly groceries', v_now - interval '3 months', 'MANUAL'),
    (v_user_id, v_account_id, 'EXPENSE', 2600, 'transport', 'Fuel', v_now - interval '3 months', 'MANUAL'),
    (v_user_id, v_account_id, 'EXPENSE', 12000, 'rent', 'Monthly rent', v_now - interval '3 months', 'MANUAL'),

    (v_user_id, v_account_id, 'EXPENSE', 3900, 'food', 'Restaurants & takeout', v_now - interval '2 months', 'MANUAL'),
    (v_user_id, v_account_id, 'EXPENSE', 6700, 'groceries', 'Monthly groceries', v_now - interval '2 months', 'MANUAL'),
    (v_user_id, v_account_id, 'EXPENSE', 2100, 'utilities', 'Electricity & water', v_now - interval '2 months', 'MANUAL'),
    (v_user_id, v_account_id, 'EXPENSE', 12000, 'rent', 'Monthly rent', v_now - interval '2 months', 'MANUAL'),

    (v_user_id, v_account_id, 'EXPENSE', 5600, 'food', 'Restaurants & takeout', v_now - interval '1 month', 'MANUAL'),
    (v_user_id, v_account_id, 'EXPENSE', 7100, 'groceries', 'Monthly groceries', v_now - interval '1 month', 'MANUAL'),
    (v_user_id, v_account_id, 'EXPENSE', 4400, 'shopping', 'Electronics', v_now - interval '1 month', 'MANUAL'),
    (v_user_id, v_account_id, 'EXPENSE', 12000, 'rent', 'Monthly rent', v_now - interval '1 month', 'MANUAL');

  -- ── Current month: one expense + one income for every day so far ─────
  for v_day in 1..extract(day from v_now)::int loop
    v_day_date := date_trunc('month', v_now)::date + (v_day - 1);

    insert into transactions (user_id, account_id, type, amount, category, description, date, input_method)
    values (
      v_user_id,
      v_account_id,
      'EXPENSE',
      (500 + floor(random() * 4500))::numeric,
      v_expense_categories[1 + (v_day % array_length(v_expense_categories, 1))],
      'Daily spend',
      v_day_date::timestamptz + interval '12 hours',
      'MANUAL'
    );

    insert into transactions (user_id, account_id, type, amount, category, description, date, input_method)
    values (
      v_user_id,
      v_account_id,
      'INCOME',
      (100 + floor(random() * 900))::numeric,
      'other_income',
      'Daily cashback/interest',
      v_day_date::timestamptz + interval '18 hours',
      'MANUAL'
    );
  end loop;

  -- HDFC Savings: a smaller, separate set of transactions
  insert into transactions (user_id, account_id, type, amount, category, description, date, input_method)
  values
    (v_user_id, v_hdfc_account_id, 'INCOME', 20000, 'investment', 'Dividend payout', v_now - interval '3 months', 'MANUAL'),
    (v_user_id, v_hdfc_account_id, 'INCOME', 5000, 'gift', 'Birthday gift', v_now - interval '2 months', 'MANUAL'),
    (v_user_id, v_hdfc_account_id, 'EXPENSE', 3500, 'insurance', 'Health insurance premium', v_now - interval '2 months', 'MANUAL'),
    (v_user_id, v_hdfc_account_id, 'EXPENSE', 1200, 'subscriptions', 'Annual subscriptions', v_now - interval '1 month', 'MANUAL'),
    (v_user_id, v_hdfc_account_id, 'EXPENSE', 4500, 'travel', 'Weekend trip', v_now - interval '10 days', 'MANUAL');

  -- Wallet Cash: small everyday cash spends
  insert into transactions (user_id, account_id, type, amount, category, description, date, input_method)
  values
    (v_user_id, v_cash_account_id, 'INCOME', 3000, 'other_income', 'ATM withdrawal', v_now - interval '25 days', 'MANUAL'),
    (v_user_id, v_cash_account_id, 'EXPENSE', 450, 'food', 'Street food', v_now - interval '20 days', 'MANUAL'),
    (v_user_id, v_cash_account_id, 'EXPENSE', 600, 'transport', 'Auto rides', v_now - interval '14 days', 'MANUAL'),
    (v_user_id, v_cash_account_id, 'EXPENSE', 350, 'entertainment', 'Arcade', v_now - interval '7 days', 'MANUAL'),
    (v_user_id, v_cash_account_id, 'EXPENSE', 200, 'food', 'Tea & snacks', v_now - interval '2 days', 'MANUAL');

  -- HDFC Credit Card: a month of card spending
  insert into transactions (user_id, account_id, type, amount, category, description, date, input_method)
  values
    (v_user_id, v_credit_account_id, 'EXPENSE', 5200, 'shopping', 'Online shopping', v_now - interval '20 days', 'MANUAL'),
    (v_user_id, v_credit_account_id, 'EXPENSE', 2800, 'food', 'Dining out', v_now - interval '15 days', 'MANUAL'),
    (v_user_id, v_credit_account_id, 'EXPENSE', 1500, 'subscriptions', 'Streaming subscriptions', v_now - interval '10 days', 'MANUAL'),
    (v_user_id, v_credit_account_id, 'EXPENSE', 3200, 'travel', 'Flight booking', v_now - interval '5 days', 'MANUAL'),
    (v_user_id, v_credit_account_id, 'INCOME', 4000, 'other_income', 'Cashback reward', v_now - interval '3 days', 'MANUAL');

  -- keep account balances consistent with seeded transactions
  update accounts a
  set balance = coalesce((
    select sum(case when t.type = 'INCOME' then t.amount else -t.amount end)
    from transactions t
    where t.account_id = a.id
  ), 0)
  where a.user_id = v_user_id;

  -- ── Budget: single monthly budget for the user ────────────────────────
  insert into budgets (user_id, amount)
  values (v_user_id, 45000)
  on conflict (user_id) do update set amount = excluded.amount;

  raise notice 'Seeded data for user %', v_user_id;
end $$;
