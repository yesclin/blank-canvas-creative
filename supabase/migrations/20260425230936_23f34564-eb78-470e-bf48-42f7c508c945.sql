-- ============================================================================
-- Backend enforcement of plan limits
-- ----------------------------------------------------------------------------
-- Adds a SECURITY DEFINER helper that checks the effective plan limits for a
-- clinic against the current count of a given resource, plus BEFORE INSERT
-- triggers on the four sensitive tables: professionals, patients, specialties
-- and appointments. When a plan limit is reached the insert is rejected with
-- a clear error code so the frontend can show "Limite do plano atingido".
--
-- Notes:
-- * Uses the existing view `clinic_effective_features` as source of truth.
-- * Limits stored as NULL mean "unlimited" — no enforcement.
-- * Specialties: only counted/enforced when the row is clinic-scoped (clinic_id
--   IS NOT NULL) and active (is_active = true). System-wide rows (clinic_id
--   NULL) are skipped.
-- * Appointments: enforces a per-month limit using `scheduled_date`.
-- ============================================================================

-- 1) Helper: enforce a single resource limit ---------------------------------
CREATE OR REPLACE FUNCTION public.enforce_plan_limit(
  _clinic_id uuid,
  _resource  text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_limit   integer;
  v_current integer;
  v_label   text;
BEGIN
  IF _clinic_id IS NULL THEN
    RETURN; -- nothing to enforce
  END IF;

  -- Pick the limit column from the effective-features view.
  SELECT
    CASE _resource
      WHEN 'professionals'         THEN max_professionals
      WHEN 'patients'              THEN max_patients
      WHEN 'specialties'           THEN max_specialties
      WHEN 'appointments_monthly'  THEN max_appointments_monthly
      WHEN 'whatsapp_instances'    THEN max_whatsapp_instances
      ELSE NULL
    END
  INTO v_limit
  FROM public.clinic_effective_features
  WHERE clinic_id = _clinic_id;

  -- No row in the view (clinic without subscription) OR NULL limit = unlimited
  IF v_limit IS NULL THEN
    RETURN;
  END IF;

  -- Count current usage per resource.
  IF _resource = 'professionals' THEN
    SELECT count(*) INTO v_current
    FROM public.professionals
    WHERE clinic_id = _clinic_id AND is_active = true;
    v_label := 'profissionais';

  ELSIF _resource = 'patients' THEN
    SELECT count(*) INTO v_current
    FROM public.patients
    WHERE clinic_id = _clinic_id;
    v_label := 'pacientes';

  ELSIF _resource = 'specialties' THEN
    SELECT count(*) INTO v_current
    FROM public.specialties
    WHERE clinic_id = _clinic_id AND is_active = true;
    v_label := 'especialidades';

  ELSIF _resource = 'appointments_monthly' THEN
    SELECT count(*) INTO v_current
    FROM public.appointments
    WHERE clinic_id = _clinic_id
      AND scheduled_date >= date_trunc('month', now())::date
      AND scheduled_date <  (date_trunc('month', now()) + interval '1 month')::date;
    v_label := 'agendamentos no mês';

  ELSIF _resource = 'whatsapp_instances' THEN
    SELECT count(*) INTO v_current
    FROM public.clinic_channel_integrations
    WHERE clinic_id = _clinic_id AND channel = 'whatsapp';
    v_label := 'instâncias de WhatsApp';

  ELSE
    RETURN;
  END IF;

  IF v_current >= v_limit THEN
    RAISE EXCEPTION
      'PLAN_LIMIT_REACHED: Limite do plano atingido. Seu plano permite até % %.',
      v_limit, v_label
      USING ERRCODE = 'check_violation';
  END IF;
END;
$$;

-- 2) Trigger functions per table --------------------------------------------
CREATE OR REPLACE FUNCTION public.tg_enforce_plan_professionals()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only enforce on creation of an active professional.
  IF COALESCE(NEW.is_active, true) THEN
    PERFORM public.enforce_plan_limit(NEW.clinic_id, 'professionals');
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.tg_enforce_plan_patients()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.enforce_plan_limit(NEW.clinic_id, 'patients');
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.tg_enforce_plan_specialties()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only enforce for clinic-scoped active specialties.
  IF NEW.clinic_id IS NOT NULL AND COALESCE(NEW.is_active, true) THEN
    PERFORM public.enforce_plan_limit(NEW.clinic_id, 'specialties');
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.tg_enforce_plan_appointments()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.enforce_plan_limit(NEW.clinic_id, 'appointments_monthly');
  RETURN NEW;
END;
$$;

-- 3) Attach BEFORE INSERT triggers ------------------------------------------
DROP TRIGGER IF EXISTS enforce_plan_limit_professionals ON public.professionals;
CREATE TRIGGER enforce_plan_limit_professionals
  BEFORE INSERT ON public.professionals
  FOR EACH ROW EXECUTE FUNCTION public.tg_enforce_plan_professionals();

DROP TRIGGER IF EXISTS enforce_plan_limit_patients ON public.patients;
CREATE TRIGGER enforce_plan_limit_patients
  BEFORE INSERT ON public.patients
  FOR EACH ROW EXECUTE FUNCTION public.tg_enforce_plan_patients();

DROP TRIGGER IF EXISTS enforce_plan_limit_specialties ON public.specialties;
CREATE TRIGGER enforce_plan_limit_specialties
  BEFORE INSERT ON public.specialties
  FOR EACH ROW EXECUTE FUNCTION public.tg_enforce_plan_specialties();

DROP TRIGGER IF EXISTS enforce_plan_limit_appointments ON public.appointments;
CREATE TRIGGER enforce_plan_limit_appointments
  BEFORE INSERT ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.tg_enforce_plan_appointments();

-- Also enforce when a soft-deleted/inactive resource is reactivated.
CREATE OR REPLACE FUNCTION public.tg_enforce_plan_professionals_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (OLD.is_active = false OR OLD.is_active IS NULL)
     AND NEW.is_active = true THEN
    PERFORM public.enforce_plan_limit(NEW.clinic_id, 'professionals');
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.tg_enforce_plan_specialties_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.clinic_id IS NOT NULL
     AND (OLD.is_active = false OR OLD.is_active IS NULL)
     AND NEW.is_active = true THEN
    PERFORM public.enforce_plan_limit(NEW.clinic_id, 'specialties');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_plan_limit_professionals_update ON public.professionals;
CREATE TRIGGER enforce_plan_limit_professionals_update
  BEFORE UPDATE OF is_active ON public.professionals
  FOR EACH ROW EXECUTE FUNCTION public.tg_enforce_plan_professionals_update();

DROP TRIGGER IF EXISTS enforce_plan_limit_specialties_update ON public.specialties;
CREATE TRIGGER enforce_plan_limit_specialties_update
  BEFORE UPDATE OF is_active ON public.specialties
  FOR EACH ROW EXECUTE FUNCTION public.tg_enforce_plan_specialties_update();