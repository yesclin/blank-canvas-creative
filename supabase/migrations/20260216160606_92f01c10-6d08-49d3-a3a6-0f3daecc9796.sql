
-- 1. Prevent deletion of templates that have linked anamnesis_records
CREATE OR REPLACE FUNCTION public.prevent_template_delete_with_records()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  record_count INT;
BEGIN
  SELECT count(*) INTO record_count
  FROM public.anamnesis_records
  WHERE template_id = OLD.id
  LIMIT 1;

  IF record_count > 0 THEN
    RAISE EXCEPTION 'Não é possível excluir este modelo pois existem atendimentos vinculados a ele. Desative-o em vez de excluir.'
      USING ERRCODE = 'P0001';
  END IF;

  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_template_delete ON public.anamnesis_templates;
CREATE TRIGGER trg_prevent_template_delete
  BEFORE DELETE ON public.anamnesis_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_template_delete_with_records();

-- 2. Prevent structure_snapshot modification on existing anamnesis_records
CREATE OR REPLACE FUNCTION public.protect_record_structure_immutability()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Block changes to immutable context fields after initial creation
  IF OLD.structure_snapshot IS NOT NULL AND NEW.structure_snapshot IS DISTINCT FROM OLD.structure_snapshot THEN
    RAISE EXCEPTION 'A estrutura do registro clínico não pode ser alterada após a criação.'
      USING ERRCODE = 'P0001';
  END IF;

  IF OLD.template_version_id IS NOT NULL AND NEW.template_version_id IS DISTINCT FROM OLD.template_version_id THEN
    RAISE EXCEPTION 'A versão do modelo não pode ser alterada após a criação do registro.'
      USING ERRCODE = 'P0001';
  END IF;

  IF OLD.template_id IS NOT NULL AND NEW.template_id IS DISTINCT FROM OLD.template_id THEN
    RAISE EXCEPTION 'O modelo vinculado não pode ser alterado após a criação do registro.'
      USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

-- Apply to anamnesis_records
DROP TRIGGER IF EXISTS trg_protect_anamnesis_record_structure ON public.anamnesis_records;
CREATE TRIGGER trg_protect_anamnesis_record_structure
  BEFORE UPDATE ON public.anamnesis_records
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_record_structure_immutability();

-- Apply to clinical_evolutions
DROP TRIGGER IF EXISTS trg_protect_evolution_structure ON public.clinical_evolutions;
CREATE TRIGGER trg_protect_evolution_structure
  BEFORE UPDATE ON public.clinical_evolutions
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_record_structure_immutability();
