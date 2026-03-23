
-- Add premium columns to clinic_document_settings
ALTER TABLE public.clinic_document_settings
  ADD COLUMN IF NOT EXISTS font_family VARCHAR DEFAULT 'Inter',
  ADD COLUMN IF NOT EXISTS header_layout VARCHAR DEFAULT 'left',
  ADD COLUMN IF NOT EXISTS watermark_type VARCHAR DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS watermark_text TEXT,
  ADD COLUMN IF NOT EXISTS use_professional_from_doc BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS doc_type_config JSONB DEFAULT '{}';

-- doc_type_config structure example:
-- {
--   "anamnese": { "title": "ANAMNESE CLÍNICA", "show_cpf": true, "show_address": false },
--   "receita": { "title": "RECEITUÁRIO", "show_cpf": true, "show_address": true },
--   ...
-- }

COMMENT ON COLUMN public.clinic_document_settings.font_family IS 'PDF font: Inter, Lato, Roboto, Serif';
COMMENT ON COLUMN public.clinic_document_settings.header_layout IS 'Header layout: left, center, horizontal';
COMMENT ON COLUMN public.clinic_document_settings.watermark_type IS 'Watermark type: none, clinic_name, logo, custom_text';
COMMENT ON COLUMN public.clinic_document_settings.watermark_text IS 'Custom watermark text when type=custom_text';
COMMENT ON COLUMN public.clinic_document_settings.use_professional_from_doc IS 'Use document author instead of fixed clinic responsible';
COMMENT ON COLUMN public.clinic_document_settings.doc_type_config IS 'Per-document-type settings (title, show_cpf, show_address)';
