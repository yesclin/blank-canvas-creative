
-- Tabela para Receituários e Atestados emitidos no prontuário
CREATE TABLE public.documentos_clinicos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES public.professionals(id),
  specialty_id UUID REFERENCES public.specialties(id),
  tipo VARCHAR NOT NULL CHECK (tipo IN ('receituario', 'atestado')),
  conteudo_json JSONB NOT NULL DEFAULT '{}',
  status VARCHAR NOT NULL DEFAULT 'emitido' CHECK (status IN ('emitido', 'cancelado')),
  pdf_url TEXT,
  cancelado_em TIMESTAMP WITH TIME ZONE,
  cancelado_por UUID,
  motivo_cancelamento TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_documentos_clinicos_patient ON public.documentos_clinicos(patient_id);
CREATE INDEX idx_documentos_clinicos_clinic ON public.documentos_clinicos(clinic_id);
CREATE INDEX idx_documentos_clinicos_tipo ON public.documentos_clinicos(tipo);
CREATE INDEX idx_documentos_clinicos_created ON public.documentos_clinicos(created_at DESC);

-- RLS
ALTER TABLE public.documentos_clinicos ENABLE ROW LEVEL SECURITY;

-- Profissionais da clínica podem ver documentos
CREATE POLICY "Professionals can view clinic documents"
ON public.documentos_clinicos FOR SELECT
USING (
  clinic_id IN (
    SELECT p.clinic_id FROM public.professionals p WHERE p.user_id = auth.uid()
  )
);

-- Profissionais podem inserir documentos
CREATE POLICY "Professionals can insert documents"
ON public.documentos_clinicos FOR INSERT
WITH CHECK (
  clinic_id IN (
    SELECT p.clinic_id FROM public.professionals p WHERE p.user_id = auth.uid()
  )
);

-- Profissionais podem atualizar (para cancelamento)
CREATE POLICY "Professionals can update documents"
ON public.documentos_clinicos FOR UPDATE
USING (
  clinic_id IN (
    SELECT p.clinic_id FROM public.professionals p WHERE p.user_id = auth.uid()
  )
);

-- Trigger para updated_at
CREATE TRIGGER update_documentos_clinicos_updated_at
BEFORE UPDATE ON public.documentos_clinicos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
