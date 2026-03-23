-- Create storage bucket for medical documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('medical-documents', 'medical-documents', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for medical-documents bucket
CREATE POLICY "Users can view documents from their clinic"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'medical-documents' AND
    (storage.foldername(name))[1] IN (
      SELECT clinic_id::text FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can upload documents to their clinic"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'medical-documents' AND
    (storage.foldername(name))[1] IN (
      SELECT clinic_id::text FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete documents from their clinic"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'medical-documents' AND
    (storage.foldername(name))[1] IN (
      SELECT clinic_id::text FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- Create patient_documentos table for storing document metadata
CREATE TABLE public.patient_documentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  profissional_id UUID NOT NULL REFERENCES public.professionals(id),
  
  -- Document info
  titulo TEXT NOT NULL,
  categoria TEXT NOT NULL DEFAULT 'documento', -- 'exame', 'laudo', 'relatorio', 'documento'
  descricao TEXT,
  data_documento DATE,
  observacoes TEXT,
  
  -- File info
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.patient_documentos ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view documentos from their clinic"
  ON public.patient_documentos
  FOR SELECT
  USING (
    clinic_id IN (
      SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create documentos in their clinic"
  ON public.patient_documentos
  FOR INSERT
  WITH CHECK (
    clinic_id IN (
      SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete documentos in their clinic"
  ON public.patient_documentos
  FOR DELETE
  USING (
    clinic_id IN (
      SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_patient_documentos_patient_id ON public.patient_documentos(patient_id);
CREATE INDEX idx_patient_documentos_clinic_id ON public.patient_documentos(clinic_id);
CREATE INDEX idx_patient_documentos_categoria ON public.patient_documentos(categoria);
CREATE INDEX idx_patient_documentos_data ON public.patient_documentos(data_documento DESC);

-- Add comment for documentation
COMMENT ON TABLE public.patient_documentos IS 'Stores metadata for patient documents (exams, reports, etc.) with files stored in medical-documents bucket.';