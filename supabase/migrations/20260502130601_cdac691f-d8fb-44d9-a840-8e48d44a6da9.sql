-- Remove agendamento anterior, se existir
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'roleta-auto-checkout-tick') THEN
    PERFORM cron.unschedule('roleta-auto-checkout-tick');
  END IF;
END $$;

SELECT cron.schedule(
  'roleta-auto-checkout-tick',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://vmkwzuxbgqlqsmeennmg.supabase.co/functions/v1/roleta-auto-checkout',
    headers := '{"Content-Type": "application/json", "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZta3d6dXhiZ3FscXNtZWVubm1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczNzg5ODUsImV4cCI6MjA5Mjk1NDk4NX0.GMM41BbbZrOnIg2-9vSrhEUdhsJQqZv5DknhBzVmmRw"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);