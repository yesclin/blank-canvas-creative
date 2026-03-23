-- =====================================================
-- MÓDULOS DE ESTÉTICA / HARMONIZAÇÃO FACIAL
-- =====================================================

-- 1. Tabela para pontos de aplicação no Mapa Facial
CREATE TABLE public.facial_map_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  professional_id UUID REFERENCES public.professionals(id) ON DELETE SET NULL,
  
  -- Dados do ponto de aplicação
  procedure_type TEXT NOT NULL CHECK (procedure_type IN ('toxin', 'filler', 'biostimulator')),
  view_type TEXT NOT NULL DEFAULT 'frontal' CHECK (view_type IN ('frontal', 'left_lateral', 'right_lateral')),
  position_x NUMERIC NOT NULL, -- Posição X relativa (0-100%)
  position_y NUMERIC NOT NULL, -- Posição Y relativa (0-100%)
  
  -- Detalhes da aplicação
  muscle TEXT, -- Músculo associado
  product_name TEXT NOT NULL, -- Produto utilizado
  quantity NUMERIC NOT NULL, -- Quantidade/unidades
  unit TEXT NOT NULL DEFAULT 'UI', -- UI, ml, etc.
  side TEXT CHECK (side IN ('left', 'right', 'center', 'bilateral')),
  
  -- Observações
  notes TEXT,
  
  -- Auditoria
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Tabela para registros de Antes/Depois
CREATE TABLE public.aesthetic_before_after (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  procedure_id UUID REFERENCES public.procedures(id) ON DELETE SET NULL,
  
  -- Metadados
  title TEXT NOT NULL,
  description TEXT,
  procedure_type TEXT, -- toxin, filler, biostimulator, combined
  
  -- Imagens (armazenadas no storage)
  before_image_url TEXT,
  before_image_date TIMESTAMP WITH TIME ZONE,
  after_image_url TEXT,
  after_image_date TIMESTAMP WITH TIME ZONE,
  
  -- Ângulo/vista
  view_angle TEXT DEFAULT 'frontal' CHECK (view_angle IN ('frontal', 'left_profile', 'right_profile', 'left_45', 'right_45')),
  
  -- Consentimento para marketing
  consent_for_marketing BOOLEAN NOT NULL DEFAULT false,
  
  -- Auditoria
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Tabela para termos de consentimento específicos de estética
CREATE TABLE public.aesthetic_consent_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  
  -- Tipo do termo
  consent_type TEXT NOT NULL CHECK (consent_type IN ('toxin', 'filler', 'biostimulator', 'general')),
  
  -- Conteúdo e versão
  term_title TEXT NOT NULL,
  term_content TEXT NOT NULL,
  term_version TEXT NOT NULL DEFAULT '1.0',
  
  -- Aceite
  accepted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT,
  
  -- Assinatura digital (opcional)
  signature_data TEXT, -- Base64 da assinatura
  
  -- Auditoria
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.facial_map_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aesthetic_before_after ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aesthetic_consent_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies para facial_map_applications
CREATE POLICY "Users can view facial map for their clinic"
ON public.facial_map_applications FOR SELECT
USING (
  clinic_id IN (
    SELECT p.clinic_id FROM profiles p WHERE p.user_id = auth.uid()
  )
);

CREATE POLICY "Professionals can manage facial map applications"
ON public.facial_map_applications FOR ALL
USING (
  clinic_id IN (
    SELECT p.clinic_id FROM profiles p WHERE p.user_id = auth.uid()
  )
)
WITH CHECK (
  clinic_id IN (
    SELECT p.clinic_id FROM profiles p WHERE p.user_id = auth.uid()
  )
);

-- RLS Policies para aesthetic_before_after
CREATE POLICY "Users can view before_after for their clinic"
ON public.aesthetic_before_after FOR SELECT
USING (
  clinic_id IN (
    SELECT p.clinic_id FROM profiles p WHERE p.user_id = auth.uid()
  )
);

CREATE POLICY "Professionals can manage before_after"
ON public.aesthetic_before_after FOR ALL
USING (
  clinic_id IN (
    SELECT p.clinic_id FROM profiles p WHERE p.user_id = auth.uid()
  )
)
WITH CHECK (
  clinic_id IN (
    SELECT p.clinic_id FROM profiles p WHERE p.user_id = auth.uid()
  )
);

-- RLS Policies para aesthetic_consent_records
CREATE POLICY "Users can view consent records for their clinic"
ON public.aesthetic_consent_records FOR SELECT
USING (
  clinic_id IN (
    SELECT p.clinic_id FROM profiles p WHERE p.user_id = auth.uid()
  )
);

CREATE POLICY "Professionals can create consent records"
ON public.aesthetic_consent_records FOR INSERT
WITH CHECK (
  clinic_id IN (
    SELECT p.clinic_id FROM profiles p WHERE p.user_id = auth.uid()
  )
);

-- Trigger para updated_at
CREATE TRIGGER update_facial_map_applications_updated_at
BEFORE UPDATE ON public.facial_map_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_aesthetic_before_after_updated_at
BEFORE UPDATE ON public.aesthetic_before_after
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para performance
CREATE INDEX idx_facial_map_applications_patient ON public.facial_map_applications(patient_id);
CREATE INDEX idx_facial_map_applications_appointment ON public.facial_map_applications(appointment_id);
CREATE INDEX idx_facial_map_applications_clinic ON public.facial_map_applications(clinic_id);

CREATE INDEX idx_aesthetic_before_after_patient ON public.aesthetic_before_after(patient_id);
CREATE INDEX idx_aesthetic_before_after_clinic ON public.aesthetic_before_after(clinic_id);

CREATE INDEX idx_aesthetic_consent_records_patient ON public.aesthetic_consent_records(patient_id);
CREATE INDEX idx_aesthetic_consent_records_clinic ON public.aesthetic_consent_records(clinic_id);

-- Storage bucket para imagens de estética
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'aesthetic-images',
  'aesthetic-images',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Políticas de storage
CREATE POLICY "Authenticated users can upload aesthetic images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'aesthetic-images' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can view aesthetic images"
ON storage.objects FOR SELECT
USING (bucket_id = 'aesthetic-images');

CREATE POLICY "Users can update their own aesthetic images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'aesthetic-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own aesthetic images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'aesthetic-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);