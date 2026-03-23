-- =====================================================
-- INSTRUMENTOS / TESTES PSICOLÓGICOS
-- =====================================================

CREATE TABLE public.instrumentos_psicologicos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  
  -- Dados do instrumento
  nome_instrumento TEXT NOT NULL, -- Nome do teste/instrumento
  data_aplicacao DATE NOT NULL DEFAULT CURRENT_DATE,
  finalidade TEXT, -- Objetivo da aplicação
  observacoes TEXT, -- Observações do profissional
  
  -- Documento anexo (URL do storage)
  documento_url TEXT,
  documento_nome TEXT,
  
  -- Auditoria
  profissional_id UUID NOT NULL REFERENCES public.professionals(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_instrumentos_psico_patient ON public.instrumentos_psicologicos(patient_id);
CREATE INDEX idx_instrumentos_psico_clinic ON public.instrumentos_psicologicos(clinic_id);
CREATE INDEX idx_instrumentos_psico_data ON public.instrumentos_psicologicos(data_aplicacao DESC);

-- Enable RLS
ALTER TABLE public.instrumentos_psicologicos ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view instrumentos from their clinic"
ON public.instrumentos_psicologicos
FOR SELECT
USING (
  clinic_id IN (
    SELECT profiles.clinic_id FROM profiles WHERE profiles.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create instrumentos in their clinic"
ON public.instrumentos_psicologicos
FOR INSERT
WITH CHECK (
  clinic_id IN (
    SELECT profiles.clinic_id FROM profiles WHERE profiles.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update instrumentos in their clinic"
ON public.instrumentos_psicologicos
FOR UPDATE
USING (
  clinic_id IN (
    SELECT profiles.clinic_id FROM profiles WHERE profiles.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete instrumentos in their clinic"
ON public.instrumentos_psicologicos
FOR DELETE
USING (
  clinic_id IN (
    SELECT profiles.clinic_id FROM profiles WHERE profiles.user_id = auth.uid()
  )
);

-- Trigger para updated_at
CREATE TRIGGER update_instrumentos_psicologicos_updated_at
BEFORE UPDATE ON public.instrumentos_psicologicos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- STORAGE BUCKET para documentos de instrumentos
-- =====================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('instrumentos-psicologicos', 'instrumentos-psicologicos', false)
ON CONFLICT (id) DO NOTHING;

-- Policies para o bucket
CREATE POLICY "Users can view instrumentos files from their clinic"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'instrumentos-psicologicos' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM clinics WHERE id IN (
      SELECT clinic_id FROM profiles WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can upload instrumentos files to their clinic"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'instrumentos-psicologicos' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM clinics WHERE id IN (
      SELECT clinic_id FROM profiles WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can delete instrumentos files from their clinic"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'instrumentos-psicologicos' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM clinics WHERE id IN (
      SELECT clinic_id FROM profiles WHERE user_id = auth.uid()
    )
  )
);

-- Comentários
COMMENT ON TABLE public.instrumentos_psicologicos IS 'Registro de aplicação de testes e instrumentos psicológicos';
COMMENT ON COLUMN public.instrumentos_psicologicos.nome_instrumento IS 'Nome do teste ou instrumento aplicado';
COMMENT ON COLUMN public.instrumentos_psicologicos.finalidade IS 'Objetivo da aplicação do instrumento';
COMMENT ON COLUMN public.instrumentos_psicologicos.documento_url IS 'URL do documento no storage';