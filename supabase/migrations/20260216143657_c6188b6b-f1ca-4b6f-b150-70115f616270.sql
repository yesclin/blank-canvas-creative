
-- Add immutable context columns to medical_record_entries
ALTER TABLE public.medical_record_entries
  ADD COLUMN IF NOT EXISTS specialty_id UUID REFERENCES public.specialties(id),
  ADD COLUMN IF NOT EXISTS procedure_id UUID REFERENCES public.procedures(id),
  ADD COLUMN IF NOT EXISTS template_version_id UUID REFERENCES public.anamnesis_template_versions(id),
  ADD COLUMN IF NOT EXISTS structure_snapshot JSONB;

CREATE INDEX IF NOT EXISTS idx_medical_record_entries_specialty_id ON public.medical_record_entries(specialty_id);
CREATE INDEX IF NOT EXISTS idx_medical_record_entries_procedure_id ON public.medical_record_entries(procedure_id);
