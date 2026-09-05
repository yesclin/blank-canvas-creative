DO $$
DECLARE r record;
BEGIN
  -- Snapshot do que hoje é legitimamente executável por usuários logados
  CREATE TEMP TABLE _keep_auth ON COMMIT DROP AS
  SELECT p.oid
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public' AND p.prosecdef
    AND p.prorettype <> 'trigger'::regtype
    AND has_function_privilege('authenticated', p.oid, 'EXECUTE');

  -- Remove o EXECUTE herdado de PUBLIC (causa real do acesso anônimo)
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', r.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', r.sig);
  END LOOP;

  -- Devolve às funções legítimas do app
  FOR r IN SELECT oid::regprocedure AS sig FROM _keep_auth LOOP
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', r.sig);
  END LOOP;
END $$;

DO $$
DECLARE
  r record;
  public_fns text[] := ARRAY[
    'get_public_procedures','get_public_professionals','get_public_specialties',
    'get_public_effective_schedule','get_booked_slots','check_slot_available',
    'is_public_booking_enabled','find_or_create_public_patient',
    'submit_pre_registration','get_pre_registration_by_token',
    'get_teleconsulta_by_token','start_teleconsulta_precheck_by_token',
    'complete_teleconsulta_precheck_by_token','log_teleconsulta_event_by_token',
    'validate_teleconsultation_token','can_join_teleconsultation',
    'validate_clinical_document'
  ];
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef AND p.proname = ANY(public_fns)
  LOOP
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO anon, authenticated', r.sig);
  END LOOP;
END $$;