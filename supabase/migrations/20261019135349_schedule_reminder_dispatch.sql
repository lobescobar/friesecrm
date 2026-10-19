CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

DO $$
DECLARE
  v_job_id bigint;
BEGIN
  SELECT jobid
  INTO v_job_id
  FROM cron.job
  WHERE jobname = 'crm-lembretes-acoes'
  LIMIT 1;

  IF v_job_id IS NOT NULL THEN
    PERFORM cron.unschedule(v_job_id);
  END IF;
END;
$$;

SELECT cron.schedule(
  'crm-lembretes-acoes',
  '* * * * *',
  $request$
    SELECT net.http_get(
      url := 'https://friesecrm.vercel.app/api/cron/lembretes-acoes',
      headers := jsonb_build_object(
        'Authorization',
        'Bearer ' || (
          SELECT decrypted_secret
          FROM vault.decrypted_secrets
          WHERE name = 'crm_reminder_dispatch_secret'
          LIMIT 1
        )
      ),
      timeout_milliseconds := 30000
    );
  $request$
);
