
-- Update the ensure_admin_has_professional function to also assign all active specialties
CREATE OR REPLACE FUNCTION public.ensure_admin_has_professional()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _profile RECORD;
  _prof_id uuid;
BEGIN
  -- Only act on admin/owner roles
  IF NEW.role NOT IN ('owner', 'admin') THEN
    RETURN NEW;
  END IF;

  -- Check if a professional record already exists for this user in this clinic
  SELECT id INTO _prof_id
  FROM public.professionals
  WHERE user_id = NEW.user_id
    AND clinic_id = NEW.clinic_id
  LIMIT 1;

  -- If professional exists but inactive, reactivate
  IF _prof_id IS NOT NULL THEN
    UPDATE public.professionals
    SET is_active = true, updated_at = now()
    WHERE id = _prof_id AND is_active = false;
  END IF;

  -- If no professional record exists, create one from profile data
  IF _prof_id IS NULL THEN
    SELECT full_name, email, avatar_url
    INTO _profile
    FROM public.profiles
    WHERE user_id = NEW.user_id
      AND clinic_id = NEW.clinic_id
    LIMIT 1;

    IF _profile IS NOT NULL THEN
      INSERT INTO public.professionals (clinic_id, user_id, full_name, email, avatar_url, is_active)
      VALUES (NEW.clinic_id, NEW.user_id, _profile.full_name, _profile.email, _profile.avatar_url, true)
      RETURNING id INTO _prof_id;
    END IF;
  END IF;

  -- Assign ALL active specialties to this admin/owner professional
  IF _prof_id IS NOT NULL THEN
    INSERT INTO public.professional_specialties (professional_id, specialty_id, is_primary)
    SELECT _prof_id, s.id, false
    FROM public.specialties s
    WHERE s.is_active = true
      AND (s.clinic_id IS NULL OR s.clinic_id = NEW.clinic_id)
      AND NOT EXISTS (
        SELECT 1 FROM public.professional_specialties ps
        WHERE ps.professional_id = _prof_id AND ps.specialty_id = s.id
      );
    
    -- Ensure at least one is marked as primary
    IF NOT EXISTS (
      SELECT 1 FROM public.professional_specialties 
      WHERE professional_id = _prof_id AND is_primary = true
    ) THEN
      UPDATE public.professional_specialties
      SET is_primary = true
      WHERE id = (
        SELECT id FROM public.professional_specialties
        WHERE professional_id = _prof_id
        ORDER BY created_at ASC
        LIMIT 1
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Also create a trigger to auto-assign new specialties to admin professionals
CREATE OR REPLACE FUNCTION public.sync_specialty_to_admin_professionals()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- When a specialty is created or activated, assign it to all admin/owner professionals
  IF NEW.is_active = true THEN
    INSERT INTO public.professional_specialties (professional_id, specialty_id, is_primary)
    SELECT p.id, NEW.id, false
    FROM public.professionals p
    JOIN public.user_roles ur ON ur.user_id = p.user_id AND ur.clinic_id = p.clinic_id
    WHERE ur.role IN ('owner', 'admin')
      AND p.is_active = true
      AND (NEW.clinic_id IS NULL OR NEW.clinic_id = p.clinic_id)
      AND NOT EXISTS (
        SELECT 1 FROM public.professional_specialties ps
        WHERE ps.professional_id = p.id AND ps.specialty_id = NEW.id
      );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sync_specialty_to_admins
AFTER INSERT OR UPDATE OF is_active ON public.specialties
FOR EACH ROW
EXECUTE FUNCTION public.sync_specialty_to_admin_professionals();

-- Backfill: assign all active specialties to existing admin/owner professionals
INSERT INTO public.professional_specialties (professional_id, specialty_id, is_primary)
SELECT p.id, s.id, false
FROM public.professionals p
JOIN public.user_roles ur ON ur.user_id = p.user_id AND ur.clinic_id = p.clinic_id
CROSS JOIN public.specialties s
WHERE ur.role IN ('owner', 'admin')
  AND p.is_active = true
  AND s.is_active = true
  AND (s.clinic_id IS NULL OR s.clinic_id = p.clinic_id)
  AND NOT EXISTS (
    SELECT 1 FROM public.professional_specialties ps
    WHERE ps.professional_id = p.id AND ps.specialty_id = s.id
  );

-- Set primary specialty for admin professionals that don't have one
UPDATE public.professional_specialties ps
SET is_primary = true
WHERE ps.id IN (
  SELECT DISTINCT ON (ps2.professional_id) ps2.id
  FROM public.professional_specialties ps2
  JOIN public.professionals p ON p.id = ps2.professional_id
  JOIN public.user_roles ur ON ur.user_id = p.user_id AND ur.clinic_id = p.clinic_id
  WHERE ur.role IN ('owner', 'admin')
    AND NOT EXISTS (
      SELECT 1 FROM public.professional_specialties ps3
      WHERE ps3.professional_id = ps2.professional_id AND ps3.is_primary = true
    )
  ORDER BY ps2.professional_id, ps2.created_at ASC
);
