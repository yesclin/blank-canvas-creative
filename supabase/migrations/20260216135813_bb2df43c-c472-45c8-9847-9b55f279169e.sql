
-- Storage bucket for clinical appointment images
INSERT INTO storage.buckets (id, name, public)
VALUES ('clinical-images', 'clinical-images', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for clinical-images bucket
CREATE POLICY "Authenticated users can upload clinical images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'clinical-images'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can view clinical images"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'clinical-images'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can delete own clinical images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'clinical-images'
  AND auth.role() = 'authenticated'
);

-- Table to store appointment image metadata
CREATE TABLE public.clinical_appointment_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  field_id UUID REFERENCES public.medical_record_tab_fields(id) ON DELETE SET NULL,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size_bytes INTEGER,
  caption TEXT,
  classification TEXT NOT NULL DEFAULT 'evolucao' CHECK (classification IN ('antes', 'depois', 'evolucao')),
  taken_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_clinical_images_appointment ON public.clinical_appointment_images(appointment_id);
CREATE INDEX idx_clinical_images_patient ON public.clinical_appointment_images(patient_id);
CREATE INDEX idx_clinical_images_clinic ON public.clinical_appointment_images(clinic_id);

-- RLS
ALTER TABLE public.clinical_appointment_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view images from their clinic"
ON public.clinical_appointment_images FOR SELECT
USING (
  clinic_id IN (
    SELECT p.clinic_id FROM public.professionals p WHERE p.user_id = auth.uid()
    UNION
    SELECT pm.clinic_id FROM public.profiles pm WHERE pm.id = auth.uid()
  )
);

CREATE POLICY "Users can insert images for their clinic"
ON public.clinical_appointment_images FOR INSERT
WITH CHECK (
  clinic_id IN (
    SELECT p.clinic_id FROM public.professionals p WHERE p.user_id = auth.uid()
    UNION
    SELECT pm.clinic_id FROM public.profiles pm WHERE pm.id = auth.uid()
  )
);

CREATE POLICY "Users can update images from their clinic"
ON public.clinical_appointment_images FOR UPDATE
USING (
  clinic_id IN (
    SELECT p.clinic_id FROM public.professionals p WHERE p.user_id = auth.uid()
    UNION
    SELECT pm.clinic_id FROM public.profiles pm WHERE pm.id = auth.uid()
  )
);

CREATE POLICY "Users can delete images from their clinic"
ON public.clinical_appointment_images FOR DELETE
USING (
  clinic_id IN (
    SELECT p.clinic_id FROM public.professionals p WHERE p.user_id = auth.uid()
    UNION
    SELECT pm.clinic_id FROM public.profiles pm WHERE pm.id = auth.uid()
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_clinical_appointment_images_updated_at
BEFORE UPDATE ON public.clinical_appointment_images
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
