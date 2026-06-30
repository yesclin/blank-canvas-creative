
-- Fix clinic_template_overrides to support all prontuario resource types
ALTER TABLE public.clinic_template_overrides
  DROP CONSTRAINT IF EXISTS clinic_template_overrides_template_kind_check;

ALTER TABLE public.clinic_template_overrides
  ALTER COLUMN template_id DROP NOT NULL;

ALTER TABLE public.clinic_template_overrides
  DROP CONSTRAINT IF EXISTS clinic_template_overrides_clinic_id_template_id_key;

CREATE UNIQUE INDEX IF NOT EXISTS clinic_template_overrides_clinic_resource_key_uidx
  ON public.clinic_template_overrides (clinic_id, resource_key)
  WHERE resource_key IS NOT NULL;
