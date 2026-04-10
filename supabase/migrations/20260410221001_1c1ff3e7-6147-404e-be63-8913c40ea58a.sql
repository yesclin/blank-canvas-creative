
-- Unique index for locked templates with specific (non-generic) template types
CREATE UNIQUE INDEX IF NOT EXISTS idx_anamnesis_templates_locked_unique_type
ON public.anamnesis_templates (clinic_id, specialty_id, template_type)
WHERE template_type IS NOT NULL 
  AND template_type NOT IN ('anamnese', 'anamnese_personalizada')
  AND archived = false 
  AND system_locked = true;
