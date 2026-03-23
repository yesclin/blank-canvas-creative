
-- Remove the old rule that prevented admins from being professionals
-- This is being replaced by a new rule that REQUIRES admins to be professionals
DROP TRIGGER IF EXISTS prevent_admin_as_professional ON public.professionals;
DROP FUNCTION IF EXISTS public.validate_professional_not_admin();

-- Function to auto-create a professional record for admin/owner users
CREATE OR REPLACE FUNCTION public.ensure_admin_has_professional()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _profile RECORD;
  _existing_prof_id uuid;
BEGIN
  -- Only act on admin/owner roles
  IF NEW.role NOT IN ('owner', 'admin') THEN
    RETURN NEW;
  END IF;

  -- Check if a professional record already exists for this user in this clinic
  SELECT id INTO _existing_prof_id
  FROM public.professionals
  WHERE user_id = NEW.user_id
    AND clinic_id = NEW.clinic_id
  LIMIT 1;

  -- If professional exists but inactive, reactivate
  IF _existing_prof_id IS NOT NULL THEN
    UPDATE public.professionals
    SET is_active = true, updated_at = now()
    WHERE id = _existing_prof_id AND is_active = false;
    RETURN NEW;
  END IF;

  -- No professional record exists, create one from profile data
  SELECT full_name, email, avatar_url
  INTO _profile
  FROM public.profiles
  WHERE user_id = NEW.user_id
    AND clinic_id = NEW.clinic_id
  LIMIT 1;

  IF _profile IS NOT NULL THEN
    INSERT INTO public.professionals (clinic_id, user_id, full_name, email, avatar_url, is_active)
    VALUES (NEW.clinic_id, NEW.user_id, _profile.full_name, _profile.email, _profile.avatar_url, true);
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger: auto-create professional when admin/owner role is assigned
CREATE TRIGGER trg_ensure_admin_professional
AFTER INSERT OR UPDATE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.ensure_admin_has_professional();

-- Backfill: create professional records for existing admin/owner users who don't have one
INSERT INTO public.professionals (clinic_id, user_id, full_name, email, avatar_url, is_active)
SELECT 
  p.clinic_id,
  p.user_id,
  p.full_name,
  p.email,
  p.avatar_url,
  true
FROM public.profiles p
JOIN public.user_roles ur ON ur.user_id = p.user_id AND ur.clinic_id = p.clinic_id
WHERE ur.role IN ('owner', 'admin')
  AND p.is_active = true
  AND NOT EXISTS (
    SELECT 1 FROM public.professionals pr 
    WHERE pr.user_id = p.user_id AND pr.clinic_id = p.clinic_id
  );

-- Reactivate any inactive professional records for current admins/owners
UPDATE public.professionals pr
SET is_active = true, updated_at = now()
FROM public.user_roles ur
WHERE ur.user_id = pr.user_id
  AND ur.clinic_id = pr.clinic_id
  AND ur.role IN ('owner', 'admin')
  AND pr.is_active = false;
