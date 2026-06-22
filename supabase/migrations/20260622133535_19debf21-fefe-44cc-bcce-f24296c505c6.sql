
-- 1) Extend audit_logs
ALTER TABLE public.audit_logs
  ADD COLUMN IF NOT EXISTS module text,
  ADD COLUMN IF NOT EXISTS user_name text,
  ADD COLUMN IF NOT EXISTS user_email text,
  ADD COLUMN IF NOT EXISTS user_role text,
  ADD COLUMN IF NOT EXISTS entity_type text,
  ADD COLUMN IF NOT EXISTS patient_id uuid,
  ADD COLUMN IF NOT EXISTS appointment_id uuid,
  ADD COLUMN IF NOT EXISTS ip_address inet,
  ADD COLUMN IF NOT EXISTS user_agent text,
  ADD COLUMN IF NOT EXISTS description text;

CREATE INDEX IF NOT EXISTS idx_audit_logs_clinic_created ON public.audit_logs (clinic_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.audit_logs (clinic_id, user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_patient ON public.audit_logs (clinic_id, patient_id) WHERE patient_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_audit_logs_appointment ON public.audit_logs (clinic_id, appointment_id) WHERE appointment_id IS NOT NULL;

-- 2) Block updates/deletes (logs são somente leitura)
DROP POLICY IF EXISTS "No one can update audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "No one can delete audit logs" ON public.audit_logs;
CREATE POLICY "No one can update audit logs" ON public.audit_logs FOR UPDATE USING (false) WITH CHECK (false);
CREATE POLICY "No one can delete audit logs" ON public.audit_logs FOR DELETE USING (false);

REVOKE UPDATE, DELETE ON public.audit_logs FROM authenticated;
GRANT  SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT  ALL ON public.audit_logs TO service_role;

-- 3) Generic trigger function
CREATE OR REPLACE FUNCTION public.tg_audit_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_clinic_id uuid;
  v_record_id uuid;
  v_patient_id uuid;
  v_appointment_id uuid;
  v_old jsonb;
  v_new jsonb;
  v_action text;
  v_module text := COALESCE(TG_ARGV[0], TG_TABLE_NAME);
  v_user_name text;
  v_user_email text;
  v_user_role text;
  v_row jsonb;
BEGIN
  v_old := CASE WHEN TG_OP IN ('UPDATE','DELETE') THEN to_jsonb(OLD) ELSE NULL END;
  v_new := CASE WHEN TG_OP IN ('INSERT','UPDATE') THEN to_jsonb(NEW) ELSE NULL END;
  v_row := COALESCE(v_new, v_old);

  v_clinic_id := NULLIF(v_row->>'clinic_id','')::uuid;
  v_record_id := NULLIF(v_row->>'id','')::uuid;
  v_patient_id := NULLIF(v_row->>'patient_id','')::uuid;
  v_appointment_id := NULLIF(v_row->>'appointment_id','')::uuid;

  IF v_clinic_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  v_action := CASE TG_OP WHEN 'INSERT' THEN 'created' WHEN 'UPDATE' THEN 'updated' WHEN 'DELETE' THEN 'deleted' END;

  IF v_user_id IS NOT NULL THEN
    SELECT p.full_name, p.email INTO v_user_name, v_user_email
      FROM public.profiles p WHERE p.user_id = v_user_id LIMIT 1;
    SELECT ur.role::text INTO v_user_role
      FROM public.user_roles ur
      WHERE ur.user_id = v_user_id AND ur.clinic_id = v_clinic_id
      LIMIT 1;
  END IF;

  INSERT INTO public.audit_logs (
    clinic_id, user_id, user_name, user_email, user_role,
    module, action, entity_type, table_name, record_id,
    patient_id, appointment_id, old_data, new_data
  ) VALUES (
    v_clinic_id, v_user_id, v_user_name, v_user_email, v_user_role,
    v_module, v_action, TG_TABLE_NAME, TG_TABLE_NAME, v_record_id,
    v_patient_id, v_appointment_id, v_old, v_new
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- 4) Attach triggers to audited tables
DO $$
DECLARE
  t record;
  pairs text[][] := ARRAY[
    ['patients','pacientes'],
    ['appointments','agenda'],
    ['appointment_payments','financeiro'],
    ['clinical_evolutions','prontuario'],
    ['clinical_addendums','prontuario'],
    ['clinical_performed_procedures','prontuario'],
    ['procedures','configuracoes'],
    ['clinic_document_settings','configuracoes'],
    ['clinic_teleconsultation_settings','configuracoes'],
    ['module_permissions','usuarios'],
    ['user_roles','usuarios'],
    ['user_invitations','usuarios']
  ];
  trg_name text;
BEGIN
  FOR i IN 1..array_length(pairs,1) LOOP
    trg_name := 'audit_' || pairs[i][1];
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I', trg_name, pairs[i][1]);
    EXECUTE format(
      'CREATE TRIGGER %I AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.tg_audit_event(%L)',
      trg_name, pairs[i][1], pairs[i][2]
    );
  END LOOP;
END $$;
