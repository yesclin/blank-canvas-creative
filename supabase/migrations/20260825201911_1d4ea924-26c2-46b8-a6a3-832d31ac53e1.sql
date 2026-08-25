-- 1. Limpeza imediata do histórico antigo de execuções do pg_cron
DELETE FROM cron.job_run_details WHERE end_time < now() - interval '3 days' OR end_time IS NULL AND start_time < now() - interval '3 days';

-- 2. Reagenda o queue-worker: a cada 5 minutos e apenas se houver mensagens pendentes
DO $$
DECLARE
  cmd text;
  new_cmd text;
BEGIN
  SELECT command INTO cmd FROM cron.job WHERE jobname = 'queue-worker-every-minute';

  IF cmd IS NOT NULL THEN
    new_cmd := rtrim(btrim(cmd), ';')
      || ' WHERE EXISTS (SELECT 1 FROM public.message_queue WHERE status = ''pending'' AND (scheduled_for IS NULL OR scheduled_for <= now()) AND coalesce(attempts, 0) < 3)';

    PERFORM cron.unschedule('queue-worker-every-minute');
    PERFORM cron.schedule('queue-worker-pending-every-5min', '*/5 * * * *', new_cmd);
  END IF;
END $$;

-- 3. Retenção automática do histórico do pg_cron (diária, 03:15 UTC)
SELECT cron.schedule(
  'purge-cron-run-history',
  '15 3 * * *',
  $$DELETE FROM cron.job_run_details WHERE start_time < now() - interval '3 days'$$
);