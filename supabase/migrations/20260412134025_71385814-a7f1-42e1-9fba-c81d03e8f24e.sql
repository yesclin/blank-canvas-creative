
CREATE TABLE public.aesthetic_before_after (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id),
  procedure_id UUID REFERENCES public.procedures(id),
  title TEXT NOT NULL,
  description TEXT,
  procedure_type TEXT,
  before_image_url TEXT,
  before_image_date TIMESTAMP WITH TIME ZONE,
  after_image_url TEXT,
  after_image_date TIMESTAMP WITH TIME ZONE,
  view_angle TEXT NOT NULL DEFAULT 'frontal',
  consent_for_marketing BOOLEAN NOT NULL DEFAULT false,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.aesthetic_before_after ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view before/after records of their clinic"
ON public.aesthetic_before_after
FOR SELECT TO authenticated
USING (
  clinic_id IN (
    SELECT p.clinic_id FROM public.professionals p WHERE p.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert before/after records for their clinic"
ON public.aesthetic_before_after
FOR INSERT TO authenticated
WITH CHECK (
  clinic_id IN (
    SELECT p.clinic_id FROM public.professionals p WHERE p.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update before/after records of their clinic"
ON public.aesthetic_before_after
FOR UPDATE TO authenticated
USING (
  clinic_id IN (
    SELECT p.clinic_id FROM public.professionals p WHERE p.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete before/after records of their clinic"
ON public.aesthetic_before_after
FOR DELETE TO authenticated
USING (
  clinic_id IN (
    SELECT p.clinic_id FROM public.professionals p WHERE p.user_id = auth.uid()
  )
);

CREATE INDEX idx_aesthetic_before_after_clinic ON public.aesthetic_before_after(clinic_id);
CREATE INDEX idx_aesthetic_before_after_patient ON public.aesthetic_before_after(patient_id);
CREATE INDEX idx_aesthetic_before_after_appointment ON public.aesthetic_before_after(appointment_id);
