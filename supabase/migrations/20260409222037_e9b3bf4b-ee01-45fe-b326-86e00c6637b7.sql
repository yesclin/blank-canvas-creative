
-- Add system_locked column
ALTER TABLE public.anamnesis_templates 
ADD COLUMN IF NOT EXISTS system_locked boolean NOT NULL DEFAULT false;

-- Mark all is_system templates as system_locked
UPDATE public.anamnesis_templates SET system_locked = true WHERE is_system = true;

-- Activate all Psychology system templates
UPDATE public.anamnesis_templates 
SET is_active = true, archived = false 
WHERE specialty_id = '9c04a373-8caf-4af6-9ed8-9742ecb04da9' 
AND is_system = true;

-- Set Adulto as default for Psychology
UPDATE public.anamnesis_templates 
SET is_default = true 
WHERE id = '7faaabba-b593-4087-9d48-06b5c44a3b06';

-- Create trigger to protect system_locked templates
CREATE OR REPLACE FUNCTION public.protect_system_locked_templates()
RETURNS trigger AS $$
BEGIN
  -- Prevent DELETE of system_locked templates
  IF TG_OP = 'DELETE' THEN
    IF OLD.system_locked = true THEN
      RAISE EXCEPTION 'Cannot delete system-locked template: %', OLD.name;
    END IF;
    RETURN OLD;
  END IF;

  -- Prevent deactivation or archiving of system_locked templates
  IF TG_OP = 'UPDATE' THEN
    IF OLD.system_locked = true THEN
      -- Block deactivation
      IF NEW.is_active = false AND OLD.is_active = true THEN
        RAISE EXCEPTION 'Cannot deactivate system-locked template: %', OLD.name;
      END IF;
      -- Block archiving
      IF NEW.archived = true AND OLD.archived = false THEN
        RAISE EXCEPTION 'Cannot archive system-locked template: %', OLD.name;
      END IF;
      -- Block removing system_locked flag
      IF NEW.system_locked = false THEN
        RAISE EXCEPTION 'Cannot remove system_locked flag from template: %', OLD.name;
      END IF;
      -- Block removing specialty_id
      IF NEW.specialty_id IS NULL AND OLD.specialty_id IS NOT NULL THEN
        RAISE EXCEPTION 'Cannot remove specialty from system-locked template: %', OLD.name;
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_protect_system_locked ON public.anamnesis_templates;
CREATE TRIGGER trg_protect_system_locked
BEFORE UPDATE OR DELETE ON public.anamnesis_templates
FOR EACH ROW
EXECUTE FUNCTION public.protect_system_locked_templates();
