-- Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Schedule the celebrity picks scraper to run daily at 6 AM UTC
SELECT cron.schedule(
  'scrape-celebrity-picks-daily',
  '0 6 * * *', -- Daily at 6 AM UTC
  $$
  SELECT
    net.http_post(
        url:='https://btteqktyhnyeycmognox.supabase.co/functions/v1/scrape-celebrity-picks',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0dGVxa3R5aG55ZXljbW9nbm94Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1NTM5ODgsImV4cCI6MjA3NDEyOTk4OH0.xnYWkXWDWgD-4aLy1zFUHV5TvsVoH-QxF3d0cqDBW8k"}'::jsonb,
        body:=concat('{"time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);