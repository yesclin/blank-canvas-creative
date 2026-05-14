
ALTER TABLE public.platform_audit_logs
  ALTER COLUMN actor_user_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS actor_name text,
  ADD COLUMN IF NOT EXISTS actor_role text,
  ADD COLUMN IF NOT EXISTS module text NOT NULL DEFAULT 'plataforma',
  ADD COLUMN IF NOT EXISTS entity text,
  ADD COLUMN IF NOT EXISTS entity_id text,
  ADD COLUMN IF NOT EXISTS severity text NOT NULL DEFAULT 'info',
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS old_values jsonb,
  ADD COLUMN IF NOT EXISTS new_values jsonb,
  ADD COLUMN IF NOT EXISTS route text,
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'frontend',
  ADD COLUMN IF NOT EXISTS environment text NOT NULL DEFAULT 'production';

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'platform_audit_logs_severity_check') THEN
    ALTER TABLE public.platform_audit_logs
      ADD CONSTRAINT platform_audit_logs_severity_check
      CHECK (severity IN ('info','warning','critical','error','success'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'platform_audit_logs_source_check') THEN
    ALTER TABLE public.platform_audit_logs
      ADD CONSTRAINT platform_audit_logs_source_check
      CHECK (source IN ('frontend','backend','edge_function','trigger','system'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_pal_created_at ON public.platform_audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pal_actor_user_id ON public.platform_audit_logs (actor_user_id);
CREATE INDEX IF NOT EXISTS idx_pal_clinic_id ON public.platform_audit_logs (clinic_id);
CREATE INDEX IF NOT EXISTS idx_pal_module ON public.platform_audit_logs (module);
CREATE INDEX IF NOT EXISTS idx_pal_action ON public.platform_audit_logs (action);
CREATE INDEX IF NOT EXISTS idx_pal_severity ON public.platform_audit_logs (severity);
CREATE INDEX IF NOT EXISTS idx_pal_entity ON public.platform_audit_logs (entity);
CREATE INDEX IF NOT EXISTS idx_pal_entity_id ON public.platform_audit_logs (entity_id);
