
-- 1. Add template_key column
ALTER TABLE public.anamnesis_templates
ADD COLUMN IF NOT EXISTS template_key TEXT NULL;

-- 2. Unique partial index to prevent duplicate keys per clinic+specialty
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_template_key_per_clinic_specialty
ON public.anamnesis_templates (clinic_id, specialty_id, template_key)
WHERE template_key IS NOT NULL;

-- 3. Trigger function to protect locked templates from destructive changes
CREATE OR REPLACE FUNCTION public.protect_locked_templates()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- On DELETE: block if system_locked
  IF TG_OP = 'DELETE' THEN
    IF OLD.system_locked = TRUE THEN
      RAISE EXCEPTION 'Modelo oficial travado não pode ser excluído (template_id: %)', OLD.id;
    END IF;
    RETURN OLD;
  END IF;

  -- On UPDATE: block destructive changes if system_locked
  IF TG_OP = 'UPDATE' THEN
    IF OLD.system_locked = TRUE THEN
      -- Block deactivation
      IF NEW.is_active = FALSE AND OLD.is_active = TRUE THEN
        RAISE EXCEPTION 'Modelo oficial travado não pode ser desativado';
      END IF;
      -- Block archiving
      IF NEW.archived = TRUE AND OLD.archived = FALSE THEN
        RAISE EXCEPTION 'Modelo oficial travado não pode ser arquivado';
      END IF;
      -- Block name change
      IF NEW.name IS DISTINCT FROM OLD.name THEN
        RAISE EXCEPTION 'Nome de modelo oficial travado não pode ser alterado';
      END IF;
      -- Block specialty change
      IF NEW.specialty_id IS DISTINCT FROM OLD.specialty_id THEN
        RAISE EXCEPTION 'Especialidade de modelo oficial travado não pode ser alterada';
      END IF;
      -- Block template_key change
      IF NEW.template_key IS DISTINCT FROM OLD.template_key THEN
        RAISE EXCEPTION 'Chave de modelo oficial travado não pode ser alterada';
      END IF;
      -- Block campos/fields change
      IF NEW.campos::text IS DISTINCT FROM OLD.campos::text THEN
        RAISE EXCEPTION 'Campos de modelo oficial travado não podem ser alterados';
      END IF;
      IF NEW.fields::text IS DISTINCT FROM OLD.fields::text THEN
        RAISE EXCEPTION 'Estrutura de modelo oficial travado não pode ser alterada';
      END IF;
      -- Block unlocking (system_locked false)
      IF NEW.system_locked = FALSE AND OLD.system_locked = TRUE THEN
        RAISE EXCEPTION 'Modelo oficial não pode ser destravado';
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

-- Drop existing trigger if any, then create
DROP TRIGGER IF EXISTS trg_protect_locked_templates ON public.anamnesis_templates;
CREATE TRIGGER trg_protect_locked_templates
BEFORE UPDATE OR DELETE ON public.anamnesis_templates
FOR EACH ROW
EXECUTE FUNCTION public.protect_locked_templates();

-- 4. Update reset function to skip locked templates
CREATE OR REPLACE FUNCTION public.reset_anamnesis_templates(p_clinic_id uuid, p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Archive all non-locked templates for the clinic
  UPDATE public.anamnesis_templates
  SET archived = TRUE, is_active = FALSE, updated_at = now()
  WHERE clinic_id = p_clinic_id
    AND system_locked = FALSE;
END;
$$;
