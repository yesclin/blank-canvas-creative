-- Create medical_record_signatures table
CREATE TABLE public.medical_record_signatures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  medical_record_id UUID NOT NULL REFERENCES public.medical_record_entries(id) ON DELETE CASCADE,
  signed_name TEXT NOT NULL,
  signed_document TEXT,
  signed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT,
  document_hash TEXT NOT NULL,
  signature_type TEXT NOT NULL DEFAULT 'advanced_electronic',
  status TEXT NOT NULL DEFAULT 'valid',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_signature_per_record UNIQUE (medical_record_id)
);

-- Enable RLS
ALTER TABLE public.medical_record_signatures ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view signatures from their clinic"
ON public.medical_record_signatures
FOR SELECT
USING (
  clinic_id IN (
    SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create signatures in their clinic"
ON public.medical_record_signatures
FOR INSERT
WITH CHECK (
  clinic_id IN (
    SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid()
  )
);

-- Add updated_at trigger
CREATE TRIGGER update_medical_record_signatures_updated_at
BEFORE UPDATE ON public.medical_record_signatures
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_signatures_medical_record ON public.medical_record_signatures(medical_record_id);
CREATE INDEX idx_signatures_patient ON public.medical_record_signatures(patient_id);
CREATE INDEX idx_signatures_professional ON public.medical_record_signatures(professional_id);