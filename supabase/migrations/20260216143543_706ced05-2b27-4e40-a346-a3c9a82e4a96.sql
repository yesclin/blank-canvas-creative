
-- Add specialty_id and procedure_id to anamnesis_records for immutable context
ALTER TABLE public.anamnesis_records
  ADD COLUMN IF NOT EXISTS specialty_id UUID REFERENCES public.specialties(id),
  ADD COLUMN IF NOT EXISTS procedure_id UUID REFERENCES public.procedures(id);

-- Add specialty_id, procedure_id, template_version_id and structure_snapshot to clinical_evolutions
ALTER TABLE public.clinical_evolutions
  ADD COLUMN IF NOT EXISTS specialty_id UUID REFERENCES public.specialties(id),
  ADD COLUMN IF NOT EXISTS procedure_id UUID REFERENCES public.procedures(id),
  ADD COLUMN IF NOT EXISTS template_version_id UUID REFERENCES public.anamnesis_template_versions(id),
  ADD COLUMN IF NOT EXISTS structure_snapshot JSONB;

-- Indexes for querying by specialty/procedure
CREATE INDEX IF NOT EXISTS idx_anamnesis_records_specialty_id ON public.anamnesis_records(specialty_id);
CREATE INDEX IF NOT EXISTS idx_anamnesis_records_procedure_id ON public.anamnesis_records(procedure_id);
CREATE INDEX IF NOT EXISTS idx_clinical_evolutions_specialty_id ON public.clinical_evolutions(specialty_id);
CREATE INDEX IF NOT EXISTS idx_clinical_evolutions_procedure_id ON public.clinical_evolutions(procedure_id);
