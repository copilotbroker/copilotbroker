-- Enable extensions needed for cron + http
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Remove any old job with same name (idempotent)
DO $$
BEGIN
  PERFORM cron.unschedule('whatsapp-message-sender-process');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Schedule queue processor every minute
SELECT cron.schedule(
  'whatsapp-message-sender-process',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://vmkwzuxbgqlqsmeennmg.supabase.co/functions/v1/whatsapp-message-sender/process',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZta3d6dXhiZ3FscXNtZWVubm1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczNzg5ODUsImV4cCI6MjA5Mjk1NDk4NX0.GMM41BbbZrOnIg2-9vSrhEUdhsJQqZv5DknhBzVmmRw'
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);