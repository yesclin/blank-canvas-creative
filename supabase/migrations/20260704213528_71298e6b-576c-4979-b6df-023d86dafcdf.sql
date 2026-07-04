
-- 1. Extend procedures
ALTER TABLE public.procedures
  ADD COLUMN IF NOT EXISTS uses_sessions BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS default_sessions_count INTEGER,
  ADD COLUMN IF NOT EXISTS session_interval_days INTEGER,
  ADD COLUMN IF NOT EXISTS session_duration_minutes INTEGER,
  ADD COLUMN IF NOT EXISTS package_price NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS price_per_session NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS open_package BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS allow_single_sale BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS package_validity_days INTEGER,
  ADD COLUMN IF NOT EXISTS protocol_notes TEXT;

-- 2. Extend treatment_packages
ALTER TABLE public.treatment_packages
  ADD COLUMN IF NOT EXISTS professional_id UUID REFERENCES public.professionals(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS specialty_id UUID REFERENCES public.specialties(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS sale_id UUID REFERENCES public.sales(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS origin TEXT NOT NULL DEFAULT 'manual'
    CHECK (origin IN ('manual','sale','appointment','import')),
  ADD COLUMN IF NOT EXISTS session_price NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS session_interval_days INTEGER;

CREATE INDEX IF NOT EXISTS idx_treatment_packages_clinic_patient
  ON public.treatment_packages(clinic_id, patient_id);
CREATE INDEX IF NOT EXISTS idx_treatment_packages_status
  ON public.treatment_packages(clinic_id, status);
CREATE INDEX IF NOT EXISTS idx_treatment_packages_sale
  ON public.treatment_packages(sale_id);

-- 3. Extend recurring_session_entries
ALTER TABLE public.recurring_session_entries
  ALTER COLUMN plan_id DROP NOT NULL;

ALTER TABLE public.recurring_session_entries
  ADD COLUMN IF NOT EXISTS treatment_package_id UUID
    REFERENCES public.treatment_packages(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS session_date DATE,
  ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS duration_minutes INTEGER,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

ALTER TABLE public.recurring_session_entries
  DROP CONSTRAINT IF EXISTS recurring_session_entries_status_check;
ALTER TABLE public.recurring_session_entries
  ADD CONSTRAINT recurring_session_entries_status_check
  CHECK (status IN ('pending','scheduled','completed','missed','cancelled','rescheduled'));

CREATE UNIQUE INDEX IF NOT EXISTS uq_treatment_session_seq
  ON public.recurring_session_entries(treatment_package_id, session_number)
  WHERE treatment_package_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_rse_treatment_pkg
  ON public.recurring_session_entries(treatment_package_id);
CREATE INDEX IF NOT EXISTS idx_rse_clinic_patient
  ON public.recurring_session_entries(clinic_id, patient_id);
CREATE INDEX IF NOT EXISTS idx_rse_appointment
  ON public.recurring_session_entries(appointment_id);

-- 4. RLS on recurring_session_entries via clinic_id when it is populated
ALTER TABLE public.recurring_session_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rse clinic select" ON public.recurring_session_entries;
CREATE POLICY "rse clinic select"
  ON public.recurring_session_entries FOR SELECT TO authenticated
  USING (
    clinic_id IS NULL
    OR clinic_id = public.user_clinic_id(auth.uid())
    OR public.is_platform_admin(auth.uid())
  );

DROP POLICY IF EXISTS "rse clinic write" ON public.recurring_session_entries;
CREATE POLICY "rse clinic write"
  ON public.recurring_session_entries FOR ALL TO authenticated
  USING (
    clinic_id IS NULL
    OR clinic_id = public.user_clinic_id(auth.uid())
    OR public.is_platform_admin(auth.uid())
  )
  WITH CHECK (
    clinic_id IS NULL
    OR clinic_id = public.user_clinic_id(auth.uid())
    OR public.is_platform_admin(auth.uid())
  );

-- 5. updated_at trigger for recurring_session_entries
CREATE OR REPLACE FUNCTION public.tg_touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_rse_updated_at ON public.recurring_session_entries;
CREATE TRIGGER trg_rse_updated_at
  BEFORE UPDATE ON public.recurring_session_entries
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

-- 6. Recalc treatment_packages progress
CREATE OR REPLACE FUNCTION public.recalc_treatment_package_progress()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE v_pkg UUID;
BEGIN
  v_pkg := COALESCE(NEW.treatment_package_id, OLD.treatment_package_id);
  IF v_pkg IS NULL THEN RETURN COALESCE(NEW, OLD); END IF;

  UPDATE public.treatment_packages tp
  SET used_sessions = (
        SELECT COUNT(*) FROM public.recurring_session_entries r
        WHERE r.treatment_package_id = v_pkg AND r.status = 'completed'
      ),
      status = CASE
        WHEN tp.status IN ('cancelado','vencido') THEN tp.status
        WHEN tp.total_sessions > 0
             AND (SELECT COUNT(*) FROM public.recurring_session_entries r
                  WHERE r.treatment_package_id = v_pkg AND r.status = 'completed')
                 >= tp.total_sessions
          THEN 'finalizado'
        ELSE 'ativo'
      END,
      updated_at = now()
  WHERE tp.id = v_pkg;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_rse_recalc_pkg ON public.recurring_session_entries;
CREATE TRIGGER trg_rse_recalc_pkg
  AFTER INSERT OR UPDATE OR DELETE ON public.recurring_session_entries
  FOR EACH ROW EXECUTE FUNCTION public.recalc_treatment_package_progress();

-- 7. Register resource for Super Admin
INSERT INTO public.prontuario_resource_catalog
  (resource_key, resource_type, specialty_slug, title, description, is_active)
VALUES
  ('medical_records.treatment_sessions', 'feature', NULL,
   'Sessões de Tratamento / Pacotes',
   'Habilita gestão de pacotes de sessões (venda, geração automática, agenda, atendimento, prontuário e financeiro).',
   true)
ON CONFLICT (resource_key) DO UPDATE
  SET title = EXCLUDED.title,
      description = EXCLUDED.description,
      resource_type = EXCLUDED.resource_type,
      is_active = true,
      updated_at = now();
