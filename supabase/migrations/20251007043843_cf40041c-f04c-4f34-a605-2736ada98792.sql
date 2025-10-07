-- Enable required extensions for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule bet settlement to run every 15 minutes
-- This will automatically settle bets when games finish
SELECT cron.schedule(
  'auto-settle-bets',
  '*/15 * * * *', -- Every 15 minutes
  $$
  SELECT
    net.http_post(
        url:='https://btteqktyhnyeycmognox.supabase.co/functions/v1/settle-bets',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0dGVxa3R5aG55ZXljbW9nbm94Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1NTM5ODgsImV4cCI6MjA3NDEyOTk4OH0.xnYWkXWDWgD-4aLy1zFUHV5TvsVoH-QxF3d0cqDBW8k"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);