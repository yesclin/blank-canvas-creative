
DO $$
BEGIN
  PERFORM cron.unschedule('queue-worker-every-minute');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'queue-worker-every-minute',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://yfljqgmbnplkdjfhvunq.supabase.co/functions/v1/queue-worker',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlmbGpxZ21ibnBsa2RqZmh2dW5xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyNzA3ODcsImV4cCI6MjA4OTg0Njc4N30.S5zOLGw2i7E3Wxqu0YjrRHgHrJ5N1P8tQtec1q07XJk'
    ),
    body := '{"source":"pg_cron"}'::jsonb
  ) AS request_id;
  $$
);
