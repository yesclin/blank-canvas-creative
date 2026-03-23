
-- Create clinic_document_settings table for institutional document templates
CREATE TABLE public.clinic_document_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  logo_url TEXT,
  primary_color TEXT NOT NULL DEFAULT '#6366f1',
  secondary_color TEXT NOT NULL DEFAULT '#8b5cf6',
  clinic_name TEXT,
  responsible_name TEXT,
  responsible_crm TEXT,
  show_crm BOOLEAN NOT NULL DEFAULT true,
  show_footer BOOLEAN NOT NULL DEFAULT true,
  footer_text TEXT DEFAULT 'Documento gerado eletronicamente pelo YesClin',
  header_style TEXT NOT NULL DEFAULT 'simple' CHECK (header_style IN ('simple', 'stripe')),
  show_digital_signature BOOLEAN NOT NULL DEFAULT false,
  signature_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(clinic_id)
);

-- Enable RLS
ALTER TABLE public.clinic_document_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their clinic document settings"
  ON public.clinic_document_settings FOR SELECT
  USING (
    clinic_id IN (
      SELECT clinic_id FROM public.professionals WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their clinic document settings"
  ON public.clinic_document_settings FOR INSERT
  WITH CHECK (
    clinic_id IN (
      SELECT clinic_id FROM public.professionals WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their clinic document settings"
  ON public.clinic_document_settings FOR UPDATE
  USING (
    clinic_id IN (
      SELECT clinic_id FROM public.professionals WHERE user_id = auth.uid()
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_clinic_document_settings_updated_at
  BEFORE UPDATE ON public.clinic_document_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for document assets (logos, signatures)
INSERT INTO storage.buckets (id, name, public) VALUES ('document-assets', 'document-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Authenticated users can upload document assets"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'document-assets' AND auth.role() = 'authenticated');

CREATE POLICY "Anyone can view document assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'document-assets');

CREATE POLICY "Authenticated users can update document assets"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'document-assets' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete document assets"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'document-assets' AND auth.role() = 'authenticated');

-- Storage bucket for generated PDFs
INSERT INTO storage.buckets (id, name, public) VALUES ('generated-documents', 'generated-documents', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload generated documents"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'generated-documents' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view generated documents"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'generated-documents' AND auth.role() = 'authenticated');

-- Table to track generated documents history
CREATE TABLE public.patient_generated_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL DEFAULT 'anamnese',
  title TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  generated_by UUID NOT NULL,
  source_record_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.patient_generated_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their clinic generated documents"
  ON public.patient_generated_documents FOR SELECT
  USING (
    clinic_id IN (
      SELECT clinic_id FROM public.professionals WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert generated documents"
  ON public.patient_generated_documents FOR INSERT
  WITH CHECK (
    clinic_id IN (
      SELECT clinic_id FROM public.professionals WHERE user_id = auth.uid()
    )
  );
