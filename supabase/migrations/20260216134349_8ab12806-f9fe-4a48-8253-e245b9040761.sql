
-- Add procedure_id to anamnesis_templates for procedure-specific binding
ALTER TABLE public.anamnesis_templates
  ADD COLUMN procedure_id UUID REFERENCES public.procedures(id) ON DELETE SET NULL;

CREATE INDEX idx_anamnesis_templates_procedure ON public.anamnesis_templates(procedure_id);
CREATE INDEX idx_anamnesis_templates_specialty ON public.anamnesis_templates(specialty_id);
