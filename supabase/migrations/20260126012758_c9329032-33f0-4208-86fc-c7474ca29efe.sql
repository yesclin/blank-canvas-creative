-- Drop old tables completely
DROP TABLE IF EXISTS public.medical_record_fields CASCADE;
DROP TABLE IF EXISTS public.medical_record_templates CASCADE;
DROP TABLE IF EXISTS public.medical_record_tabs CASCADE;

-- 1. MEDICAL RECORD TABS - stores tab configuration with scope override hierarchy
CREATE TABLE public.medical_record_tabs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  scope TEXT NOT NULL DEFAULT 'system' CHECK (scope IN ('system', 'specialty', 'professional')),
  specialty_id UUID REFERENCES public.specialties(id) ON DELETE CASCADE,
  professional_id UUID REFERENCES public.professionals(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key TEXT NOT NULL,
  icon TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. MEDICAL RECORD TEMPLATES - anamnese, evolution, diagnosis templates
CREATE TABLE public.medical_record_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  scope TEXT NOT NULL DEFAULT 'system' CHECK (scope IN ('system', 'specialty', 'professional')),
  specialty_id UUID REFERENCES public.specialties(id) ON DELETE CASCADE,
  professional_id UUID REFERENCES public.professionals(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('anamnese', 'evolution', 'diagnosis', 'procedure', 'prescription')),
  description TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. MEDICAL RECORD FIELDS - dynamic fields for templates
CREATE TABLE public.medical_record_fields (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES public.medical_record_templates(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  field_type TEXT NOT NULL CHECK (field_type IN ('text', 'textarea', 'number', 'boolean', 'select', 'multiselect', 'date', 'file')),
  placeholder TEXT,
  options JSONB,
  is_required BOOLEAN NOT NULL DEFAULT false,
  field_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.medical_record_tabs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_record_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_record_fields ENABLE ROW LEVEL SECURITY;

-- RLS Policies for medical_record_tabs
CREATE POLICY "tabs_select_policy" ON public.medical_record_tabs
  FOR SELECT USING (clinic_id IN (SELECT clinic_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "tabs_insert_policy" ON public.medical_record_tabs
  FOR INSERT WITH CHECK (clinic_id IN (SELECT clinic_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "tabs_update_policy" ON public.medical_record_tabs
  FOR UPDATE USING (clinic_id IN (SELECT clinic_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "tabs_delete_policy" ON public.medical_record_tabs
  FOR DELETE USING (clinic_id IN (SELECT clinic_id FROM public.profiles WHERE id = auth.uid()) AND is_system = false);

-- RLS Policies for medical_record_templates
CREATE POLICY "templates_select_policy" ON public.medical_record_templates
  FOR SELECT USING (clinic_id IN (SELECT clinic_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "templates_insert_policy" ON public.medical_record_templates
  FOR INSERT WITH CHECK (clinic_id IN (SELECT clinic_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "templates_update_policy" ON public.medical_record_templates
  FOR UPDATE USING (clinic_id IN (SELECT clinic_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "templates_delete_policy" ON public.medical_record_templates
  FOR DELETE USING (clinic_id IN (SELECT clinic_id FROM public.profiles WHERE id = auth.uid()) AND is_system = false);

-- RLS Policies for medical_record_fields
CREATE POLICY "fields_select_policy" ON public.medical_record_fields
  FOR SELECT USING (template_id IN (
    SELECT id FROM public.medical_record_templates 
    WHERE clinic_id IN (SELECT clinic_id FROM public.profiles WHERE id = auth.uid())
  ));
CREATE POLICY "fields_insert_policy" ON public.medical_record_fields
  FOR INSERT WITH CHECK (template_id IN (
    SELECT id FROM public.medical_record_templates 
    WHERE clinic_id IN (SELECT clinic_id FROM public.profiles WHERE id = auth.uid())
  ));
CREATE POLICY "fields_update_policy" ON public.medical_record_fields
  FOR UPDATE USING (template_id IN (
    SELECT id FROM public.medical_record_templates 
    WHERE clinic_id IN (SELECT clinic_id FROM public.profiles WHERE id = auth.uid())
  ));
CREATE POLICY "fields_delete_policy" ON public.medical_record_fields
  FOR DELETE USING (template_id IN (
    SELECT id FROM public.medical_record_templates 
    WHERE clinic_id IN (SELECT clinic_id FROM public.profiles WHERE id = auth.uid())
  ));

-- Indexes for performance
CREATE INDEX idx_mr_tabs_clinic ON public.medical_record_tabs(clinic_id);
CREATE INDEX idx_mr_tabs_scope ON public.medical_record_tabs(scope, specialty_id, professional_id);
CREATE INDEX idx_mr_templates_clinic ON public.medical_record_templates(clinic_id);
CREATE INDEX idx_mr_templates_scope ON public.medical_record_templates(scope, specialty_id, professional_id);
CREATE INDEX idx_mr_templates_type ON public.medical_record_templates(type);
CREATE INDEX idx_mr_fields_template ON public.medical_record_fields(template_id);

-- Triggers for updated_at
CREATE TRIGGER set_mr_tabs_updated_at
  BEFORE UPDATE ON public.medical_record_tabs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_mr_templates_updated_at
  BEFORE UPDATE ON public.medical_record_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_mr_fields_updated_at
  BEFORE UPDATE ON public.medical_record_fields
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();