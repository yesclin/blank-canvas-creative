-- 1) Restaurar todos os templates de sistema que tenham versão válida com structure não vazio
UPDATE public.anamnesis_templates t
SET is_active = true, archived = false, updated_at = now()
FROM public.anamnesis_template_versions v
WHERE v.id = t.current_version_id
  AND t.is_system = true
  AND v.structure IS NOT NULL
  AND v.structure::text NOT IN ('[]', 'null', '{}')
  AND (t.is_active = false OR t.archived = true);

-- 2) Garantir que todos os templates do sistema fiquem com system_locked = true
UPDATE public.anamnesis_templates
SET system_locked = true, updated_at = now()
WHERE is_system = true AND system_locked = false;

-- 3) Atualizar reset_anamnesis_templates: nunca arquivar templates do sistema
CREATE OR REPLACE FUNCTION public.reset_anamnesis_templates(p_clinic_id uuid, p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.anamnesis_templates
  SET archived = TRUE, is_active = FALSE, updated_at = now()
  WHERE clinic_id = p_clinic_id
    AND system_locked = FALSE
    AND is_system = FALSE;
END;
$$;

-- 4) Trigger de proteção: impede arquivar/desativar template de sistema com estrutura válida
CREATE OR REPLACE FUNCTION public.protect_system_anamnesis_templates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  has_valid_version boolean;
BEGIN
  IF NEW.is_system = true THEN
    -- Se tentando arquivar ou desativar
    IF (COALESCE(NEW.archived, false) = true AND COALESCE(OLD.archived, false) = false)
       OR (COALESCE(NEW.is_active, true) = false AND COALESCE(OLD.is_active, true) = true) THEN
      SELECT EXISTS (
        SELECT 1 FROM public.anamnesis_template_versions v
        WHERE v.id = NEW.current_version_id
          AND v.structure IS NOT NULL
          AND v.structure::text NOT IN ('[]', 'null', '{}')
      ) INTO has_valid_version;

      IF has_valid_version THEN
        RAISE EXCEPTION 'Não é permitido arquivar ou desativar um modelo de anamnese do sistema (id=%, name=%).', NEW.id, NEW.name
          USING ERRCODE = 'check_violation';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_system_anamnesis_templates ON public.anamnesis_templates;
CREATE TRIGGER trg_protect_system_anamnesis_templates
BEFORE UPDATE ON public.anamnesis_templates
FOR EACH ROW
EXECUTE FUNCTION public.protect_system_anamnesis_templates();

-- 5) RPC para a clínica restaurar manualmente os modelos do sistema de uma especialidade
CREATE OR REPLACE FUNCTION public.restore_system_anamnesis_templates(
  p_clinic_id uuid,
  p_specialty_id uuid DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  restored_count integer := 0;
BEGIN
  UPDATE public.anamnesis_templates t
  SET is_active = true, archived = false, updated_at = now()
  FROM public.anamnesis_template_versions v
  WHERE v.id = t.current_version_id
    AND t.is_system = true
    AND (t.clinic_id = p_clinic_id OR t.clinic_id IS NULL)
    AND (p_specialty_id IS NULL OR t.specialty_id = p_specialty_id)
    AND v.structure IS NOT NULL
    AND v.structure::text NOT IN ('[]', 'null', '{}')
    AND (t.is_active = false OR t.archived = true);

  GET DIAGNOSTICS restored_count = ROW_COUNT;
  RETURN restored_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.restore_system_anamnesis_templates(uuid, uuid) TO authenticated;