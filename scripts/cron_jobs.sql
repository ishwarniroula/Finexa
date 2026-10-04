-- Schedules the two edge functions in supabase/functions/ via pg_cron +
-- pg_net. Run once per project, in the Supabase SQL editor, AFTER deploying
-- both edge functions (see README "Budget alerts & weekly tips" section).
-- pg_cron/pg_net are enabled by default on Supabase projects.

-- Store the project URL and service-role key in Vault once, instead of
-- pasting the service-role key directly into a cron job body.
select vault.create_secret('https://<project-ref>.supabase.co', 'project_url');
select vault.create_secret('<service-role-key>', 'service_role_key');

-- Budget alerts: daily at 09:00 UTC.
select cron.schedule(
  'check-budget-alerts',
  '0 9 * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/check-budget-alerts',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key'),
      'Content-Type', 'application/json'
    )
  );
  $$
);

-- Weekly tips: every Monday at 09:00 UTC.
select cron.schedule(
  'weekly-tips',
  '0 9 * * 1',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/weekly-tips',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key'),
      'Content-Type', 'application/json'
    )
  );
  $$
);

-- To inspect scheduled jobs: select * from cron.job;
-- To unschedule: select cron.unschedule('check-budget-alerts');
