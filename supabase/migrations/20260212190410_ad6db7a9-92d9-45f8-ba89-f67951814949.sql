
-- Add structured_data JSONB column to patient_anamneses for extended medical model
-- This preserves existing column data while allowing the new 13-section template
ALTER TABLE public.patient_anamneses 
ADD COLUMN IF NOT EXISTS structured_data jsonb DEFAULT '{}';

-- Add historia_ginecologica column for gynecological/obstetric history
ALTER TABLE public.patient_anamneses 
ADD COLUMN IF NOT EXISTS historia_ginecologica text DEFAULT '';

-- Add revisao_sistemas column for Review of Systems (ROS)
ALTER TABLE public.patient_anamneses 
ADD COLUMN IF NOT EXISTS revisao_sistemas text DEFAULT '';

-- Add template_id to track which template was used
ALTER TABLE public.patient_anamneses 
ADD COLUMN IF NOT EXISTS template_id text DEFAULT NULL;

COMMENT ON COLUMN public.patient_anamneses.structured_data IS 'Extended structured anamnesis data from the 13-section medical template (OPQRST, detailed fields, etc.)';
COMMENT ON COLUMN public.patient_anamneses.template_id IS 'ID of the anamnesis template used (e.g., anamnese_clinica_geral_padrao)';
