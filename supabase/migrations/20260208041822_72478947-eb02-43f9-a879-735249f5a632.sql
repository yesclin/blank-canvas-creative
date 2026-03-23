-- Create anamnesis_templates table for configurable anamnesis models
CREATE TABLE public.anamnesis_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  template_type TEXT NOT NULL, -- e.g., 'anamnese_geral_estetica', 'anamnese_toxina', etc.
  specialty TEXT DEFAULT 'estetica',
  icon TEXT DEFAULT 'ClipboardList',
  campos JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  usage_count INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.anamnesis_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view anamnesis templates from their clinic"
ON public.anamnesis_templates
FOR SELECT
USING (
  clinic_id IN (
    SELECT clinic_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can create anamnesis templates for their clinic"
ON public.anamnesis_templates
FOR INSERT
WITH CHECK (
  clinic_id IN (
    SELECT clinic_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can update anamnesis templates from their clinic"
ON public.anamnesis_templates
FOR UPDATE
USING (
  clinic_id IN (
    SELECT clinic_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can delete anamnesis templates from their clinic"
ON public.anamnesis_templates
FOR DELETE
USING (
  clinic_id IN (
    SELECT clinic_id FROM public.profiles WHERE id = auth.uid()
  )
  AND usage_count = 0
);

-- Create index for faster queries
CREATE INDEX idx_anamnesis_templates_clinic_id ON public.anamnesis_templates(clinic_id);
CREATE INDEX idx_anamnesis_templates_active ON public.anamnesis_templates(clinic_id, is_active);

-- Trigger for updated_at
CREATE TRIGGER update_anamnesis_templates_updated_at
BEFORE UPDATE ON public.anamnesis_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();