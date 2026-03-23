-- Table for storing actual patient medical record entries (evolutions)
CREATE TABLE IF NOT EXISTS public.medical_record_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES public.professionals(id),
  template_id UUID REFERENCES public.medical_record_templates(id),
  appointment_id UUID REFERENCES public.appointments(id),
  
  -- Entry metadata
  entry_type TEXT NOT NULL DEFAULT 'evolution', -- anamnesis, evolution, procedure, etc.
  status TEXT NOT NULL DEFAULT 'draft', -- draft, signed, amended
  
  -- Dynamic content stored as JSONB
  content JSONB NOT NULL DEFAULT '{}',
  
  -- Clinical notes
  notes TEXT,
  next_steps TEXT,
  
  -- Signature tracking
  signed_at TIMESTAMPTZ,
  signed_by UUID REFERENCES public.profiles(id),
  
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id)
);

-- Table for storing files attached to medical records
CREATE TABLE IF NOT EXISTS public.medical_record_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  entry_id UUID REFERENCES public.medical_record_entries(id) ON DELETE SET NULL,
  
  -- File info
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  file_url TEXT NOT NULL,
  
  -- Categorization
  category TEXT NOT NULL DEFAULT 'document', -- exam, image, document, report, consent, prescription
  description TEXT,
  
  -- Before/after comparison for aesthetics
  is_before_after BOOLEAN DEFAULT false,
  before_after_type TEXT, -- 'before' or 'after'
  
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id)
);

-- Enable RLS
ALTER TABLE public.medical_record_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_record_files ENABLE ROW LEVEL SECURITY;

-- RLS Policies for entries
CREATE POLICY "Users can view entries from their clinic"
  ON public.medical_record_entries FOR SELECT
  USING (clinic_id = public.user_clinic_id(auth.uid()));

CREATE POLICY "Users can insert entries in their clinic"
  ON public.medical_record_entries FOR INSERT
  WITH CHECK (clinic_id = public.user_clinic_id(auth.uid()));

CREATE POLICY "Users can update entries in their clinic"
  ON public.medical_record_entries FOR UPDATE
  USING (clinic_id = public.user_clinic_id(auth.uid()));

-- RLS Policies for files
CREATE POLICY "Users can view files from their clinic"
  ON public.medical_record_files FOR SELECT
  USING (clinic_id = public.user_clinic_id(auth.uid()));

CREATE POLICY "Users can insert files in their clinic"
  ON public.medical_record_files FOR INSERT
  WITH CHECK (clinic_id = public.user_clinic_id(auth.uid()));

CREATE POLICY "Users can update files in their clinic"
  ON public.medical_record_files FOR UPDATE
  USING (clinic_id = public.user_clinic_id(auth.uid()));

CREATE POLICY "Users can delete files in their clinic"
  ON public.medical_record_files FOR DELETE
  USING (clinic_id = public.user_clinic_id(auth.uid()));

-- Triggers for updated_at
CREATE TRIGGER set_updated_at_medical_record_entries
  BEFORE UPDATE ON public.medical_record_entries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_medical_record_entries_clinic ON public.medical_record_entries(clinic_id);
CREATE INDEX IF NOT EXISTS idx_medical_record_entries_patient ON public.medical_record_entries(patient_id);
CREATE INDEX IF NOT EXISTS idx_medical_record_entries_professional ON public.medical_record_entries(professional_id);
CREATE INDEX IF NOT EXISTS idx_medical_record_files_clinic ON public.medical_record_files(clinic_id);
CREATE INDEX IF NOT EXISTS idx_medical_record_files_patient ON public.medical_record_files(patient_id);
CREATE INDEX IF NOT EXISTS idx_medical_record_files_entry ON public.medical_record_files(entry_id);