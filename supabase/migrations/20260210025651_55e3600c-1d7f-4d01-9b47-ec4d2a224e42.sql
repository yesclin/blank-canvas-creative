
-- Fix trigger: stop auto-assigning ALL specialties to admin professionals
-- Admins should manually configure specialties per professional just like any other role

-- 1) Replace sync_specialty_to_admin_professionals to be a no-op
-- We no longer want new specialties to auto-assign to admins
CREATE OR REPLACE FUNCTION public.sync_specialty_to_admin_professionals()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- No longer auto-assign specialties to admin professionals.
  -- Specialties must be explicitly assigned via the UI.
  RETURN NEW;
END;
$function$;

-- 2) Fix ensure_admin_has_professional to NOT bulk-assign all specialties
CREATE OR REPLACE FUNCTION public.ensure_admin_has_professional()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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

  -- NO LONGER auto-assign all specialties.
  -- Admin/owner professionals must have specialties assigned explicitly via Configurações > Especialidades.

  RETURN NEW;
END;
$function$;

-- 3) Clean up: remove ALL professional_specialties for admin/owner professionals
-- so they can be re-assigned properly via the UI
DELETE FROM public.professional_specialties
WHERE professional_id IN (
  SELECT p.id
  FROM public.professionals p
  JOIN public.user_roles ur ON ur.user_id = p.user_id AND ur.clinic_id = p.clinic_id
  WHERE ur.role IN ('owner', 'admin')
);
