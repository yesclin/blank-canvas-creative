
-- Function to sync all active clinic specialties to admin/owner professionals
CREATE OR REPLACE FUNCTION public.sync_specialty_to_admin_professionals()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- When a specialty is activated (inserted as active or updated to active)
  IF (TG_OP = 'INSERT' AND NEW.is_active = true) OR 
     (TG_OP = 'UPDATE' AND NEW.is_active = true AND (OLD.is_active = false OR OLD.is_active IS NULL)) THEN
    
    -- Add this specialty to all admin/owner professionals in the same clinic
    INSERT INTO public.professional_specialties (professional_id, specialty_id, is_primary)
    SELECT p.id, NEW.id, false
    FROM public.professionals p
    JOIN public.user_roles ur ON ur.user_id = p.user_id AND ur.clinic_id = p.clinic_id
    WHERE p.clinic_id = NEW.clinic_id
      AND p.is_active = true
      AND ur.role IN ('owner', 'admin')
    ON CONFLICT (professional_id, specialty_id) DO NOTHING;
  END IF;

  -- When a specialty is deactivated, remove it from ALL professionals in the clinic
  IF (TG_OP = 'UPDATE' AND NEW.is_active = false AND OLD.is_active = true) THEN
    DELETE FROM public.professional_specialties ps
    USING public.professionals p
    WHERE ps.specialty_id = NEW.id
      AND ps.professional_id = p.id
      AND p.clinic_id = NEW.clinic_id;
  END IF;

  RETURN NEW;
END;
$$;

-- Ensure the trigger exists on specialties table
DROP TRIGGER IF EXISTS trg_sync_specialty_to_admins ON public.specialties;
CREATE TRIGGER trg_sync_specialty_to_admins
  AFTER INSERT OR UPDATE ON public.specialties
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_specialty_to_admin_professionals();

-- Function to auto-assign all active clinic specialties when an admin/owner professional is created
CREATE OR REPLACE FUNCTION public.sync_admin_professional_specialties_on_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _prof_id uuid;
BEGIN
  -- Only act on admin/owner roles
  IF NEW.role NOT IN ('owner', 'admin') THEN
    RETURN NEW;
  END IF;

  -- Find the professional record for this user in this clinic
  SELECT id INTO _prof_id
  FROM public.professionals
  WHERE user_id = NEW.user_id
    AND clinic_id = NEW.clinic_id
    AND is_active = true
  LIMIT 1;

  IF _prof_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Auto-assign all active specialties from this clinic
  INSERT INTO public.professional_specialties (professional_id, specialty_id, is_primary)
  SELECT _prof_id, s.id, false
  FROM public.specialties s
  WHERE s.clinic_id = NEW.clinic_id
    AND s.is_active = true
  ON CONFLICT (professional_id, specialty_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Trigger on user_roles to auto-sync when someone becomes admin/owner
DROP TRIGGER IF EXISTS trg_sync_admin_specialties_on_role ON public.user_roles;
CREATE TRIGGER trg_sync_admin_specialties_on_role
  AFTER INSERT OR UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_admin_professional_specialties_on_role();

-- Also add unique constraint on professional_specialties if not exists
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'professional_specialties_professional_id_specialty_id_key'
  ) THEN
    ALTER TABLE public.professional_specialties 
    ADD CONSTRAINT professional_specialties_professional_id_specialty_id_key 
    UNIQUE (professional_id, specialty_id);
  END IF;
END $$;

-- Backfill: sync existing admin/owner professionals with their clinic's active specialties
INSERT INTO public.professional_specialties (professional_id, specialty_id, is_primary)
SELECT p.id, s.id, false
FROM public.professionals p
JOIN public.user_roles ur ON ur.user_id = p.user_id AND ur.clinic_id = p.clinic_id
JOIN public.specialties s ON s.clinic_id = p.clinic_id AND s.is_active = true
WHERE p.is_active = true
  AND ur.role IN ('owner', 'admin')
ON CONFLICT (professional_id, specialty_id) DO NOTHING;
