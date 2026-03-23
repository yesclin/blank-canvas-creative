
-- 1) Expand documentos_clinicos with premium fields
ALTER TABLE public.documentos_clinicos
  ADD COLUMN IF NOT EXISTS modelo_id UUID,
  ADD COLUMN IF NOT EXISTS tipo_receita VARCHAR DEFAULT 'simples' CHECK (tipo_receita IN ('simples', 'controlada', 'especial')),
  ADD COLUMN IF NOT EXISTS numero_talonario VARCHAR,
  ADD COLUMN IF NOT EXISTS assinatura_url TEXT,
  ADD COLUMN IF NOT EXISTS qr_hash VARCHAR,
  ADD COLUMN IF NOT EXISTS bloqueado BOOLEAN DEFAULT false;

-- 2) Document templates per specialty
CREATE TABLE public.modelos_documento (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  specialty_id UUID REFERENCES public.specialties(id),
  tipo VARCHAR NOT NULL CHECK (tipo IN ('receituario', 'atestado')),
  nome VARCHAR NOT NULL,
  cabecalho_personalizado TEXT,
  texto_padrao TEXT,
  rodape TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_modelos_documento_clinic ON public.modelos_documento(clinic_id);
CREATE INDEX idx_modelos_documento_specialty ON public.modelos_documento(specialty_id);

ALTER TABLE public.modelos_documento ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clinic users can view models"
ON public.modelos_documento FOR SELECT
USING (clinic_id IN (SELECT p.clinic_id FROM public.professionals p WHERE p.user_id = auth.uid()));

CREATE POLICY "Clinic users can insert models"
ON public.modelos_documento FOR INSERT
WITH CHECK (clinic_id IN (SELECT p.clinic_id FROM public.professionals p WHERE p.user_id = auth.uid()));

CREATE POLICY "Clinic users can update models"
ON public.modelos_documento FOR UPDATE
USING (clinic_id IN (SELECT p.clinic_id FROM public.professionals p WHERE p.user_id = auth.uid()));

CREATE POLICY "Clinic users can delete models"
ON public.modelos_documento FOR DELETE
USING (clinic_id IN (SELECT p.clinic_id FROM public.professionals p WHERE p.user_id = auth.uid()));

CREATE TRIGGER update_modelos_documento_updated_at
BEFORE UPDATE ON public.modelos_documento
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) Personal prescription templates (per professional)
CREATE TABLE public.modelos_receita_profissional (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  nome_modelo VARCHAR NOT NULL,
  conteudo_json JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_modelos_receita_prof ON public.modelos_receita_profissional(professional_id);

ALTER TABLE public.modelos_receita_profissional ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Professionals can manage own templates"
ON public.modelos_receita_profissional FOR ALL
USING (professional_id IN (SELECT id FROM public.professionals WHERE user_id = auth.uid()));

-- 4) Immutable legal log for clinical documents
CREATE TABLE public.documentos_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  documento_id UUID NOT NULL REFERENCES public.documentos_clinicos(id) ON DELETE RESTRICT,
  acao VARCHAR NOT NULL CHECK (acao IN ('criado', 'emitido', 'cancelado')),
  usuario_id UUID NOT NULL,
  data_hora TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address VARCHAR,
  user_agent TEXT
);

CREATE INDEX idx_documentos_log_doc ON public.documentos_log(documento_id);
CREATE INDEX idx_documentos_log_date ON public.documentos_log(data_hora DESC);

ALTER TABLE public.documentos_log ENABLE ROW LEVEL SECURITY;

-- Only SELECT allowed (immutable)
CREATE POLICY "Clinic users can view document logs"
ON public.documentos_log FOR SELECT
USING (
  documento_id IN (
    SELECT dc.id FROM public.documentos_clinicos dc
    WHERE dc.clinic_id IN (SELECT p.clinic_id FROM public.professionals p WHERE p.user_id = auth.uid())
  )
);

-- INSERT only (no update, no delete)
CREATE POLICY "System can insert logs"
ON public.documentos_log FOR INSERT
WITH CHECK (
  documento_id IN (
    SELECT dc.id FROM public.documentos_clinicos dc
    WHERE dc.clinic_id IN (SELECT p.clinic_id FROM public.professionals p WHERE p.user_id = auth.uid())
  )
);

-- Add FK from documentos_clinicos to modelos_documento
ALTER TABLE public.documentos_clinicos
  ADD CONSTRAINT fk_documentos_clinicos_modelo
  FOREIGN KEY (modelo_id) REFERENCES public.modelos_documento(id);

-- Add signature_url to professionals for digital signature
ALTER TABLE public.professionals
  ADD COLUMN IF NOT EXISTS signature_url TEXT;
