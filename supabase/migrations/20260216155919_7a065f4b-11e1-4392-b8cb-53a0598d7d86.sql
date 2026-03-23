
-- Add template context columns to clinical_appointment_images
ALTER TABLE public.clinical_appointment_images
  ADD COLUMN IF NOT EXISTS template_id uuid REFERENCES public.anamnesis_templates(id),
  ADD COLUMN IF NOT EXISTS template_version_id uuid REFERENCES public.anamnesis_template_versions(id);

-- Index for querying images by template context
CREATE INDEX IF NOT EXISTS idx_clinical_images_template 
  ON public.clinical_appointment_images(template_id, template_version_id);
