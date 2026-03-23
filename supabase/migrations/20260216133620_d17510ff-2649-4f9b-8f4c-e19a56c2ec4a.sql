
-- Table for fields inside each tab of the medical record
CREATE TABLE public.medical_record_tab_fields (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  tab_id UUID NOT NULL REFERENCES public.medical_record_tabs(id) ON DELETE CASCADE,
  specialty_id UUID NOT NULL REFERENCES public.specialties(id) ON DELETE CASCADE,
  
  label TEXT NOT NULL,
  field_type TEXT NOT NULL DEFAULT 'text',
  placeholder TEXT,
  default_value TEXT,
  options JSONB, -- for select/multiselect
  is_required BOOLEAN NOT NULL DEFAULT false,
  field_order INTEGER NOT NULL DEFAULT 0,
  
  -- RBAC visibility
  visible_to_roles TEXT[] DEFAULT '{}',
  
  -- Conditional logic
  condition_field_id UUID REFERENCES public.medical_record_tab_fields(id) ON DELETE SET NULL,
  condition_operator TEXT, -- eq, neq, contains, not_empty
  condition_value TEXT,
  
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_system BOOLEAN NOT NULL DEFAULT false,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_tab_fields_tab ON public.medical_record_tab_fields(tab_id);
CREATE INDEX idx_tab_fields_clinic_spec ON public.medical_record_tab_fields(clinic_id, specialty_id);

-- RLS
ALTER TABLE public.medical_record_tab_fields ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tab fields of their clinic"
  ON public.medical_record_tab_fields FOR SELECT
  USING (
    clinic_id IN (
      SELECT clinic_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert tab fields for their clinic"
  ON public.medical_record_tab_fields FOR INSERT
  WITH CHECK (
    clinic_id IN (
      SELECT clinic_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update tab fields of their clinic"
  ON public.medical_record_tab_fields FOR UPDATE
  USING (
    clinic_id IN (
      SELECT clinic_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete tab fields of their clinic"
  ON public.medical_record_tab_fields FOR DELETE
  USING (
    clinic_id IN (
      SELECT clinic_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_medical_record_tab_fields_updated_at
  BEFORE UPDATE ON public.medical_record_tab_fields
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
