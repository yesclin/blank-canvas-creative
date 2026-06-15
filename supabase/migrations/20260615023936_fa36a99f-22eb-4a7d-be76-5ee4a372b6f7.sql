DO $$
DECLARE
    tbl record;
BEGIN
    FOR tbl IN
        SELECT c.relname AS table_name
          FROM pg_class c
          JOIN pg_namespace n ON n.oid = c.relnamespace
         WHERE c.relkind = 'r'
           AND n.nspname = 'public'
    LOOP
        EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', tbl.table_name);
        EXECUTE format('GRANT ALL ON public.%I TO service_role', tbl.table_name);
    END LOOP;
END;
$$;

-- Sequences (for inserts with serial/identity)
DO $$
DECLARE
    seq record;
BEGIN
    FOR seq IN
        SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
        WHERE c.relkind='S' AND n.nspname='public'
    LOOP
        EXECUTE format('GRANT USAGE, SELECT ON SEQUENCE public.%I TO authenticated', seq.relname);
        EXECUTE format('GRANT ALL ON SEQUENCE public.%I TO service_role', seq.relname);
    END LOOP;
END;
$$;

-- Public-read tables that pre-login flows depend on (booking, etc.)
GRANT SELECT ON public.clinics TO anon;
GRANT SELECT ON public.specialties TO anon;
GRANT SELECT ON public.subscription_plans TO anon;
GRANT SELECT ON public.platform_feature_flags TO anon;

-- Ensure default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON TABLES TO service_role;
