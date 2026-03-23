-- Create table for patient prescriptions (prepared for Digital Prescription integration)
CREATE TABLE public.patient_prescricoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  profissional_id UUID NOT NULL REFERENCES public.professionals(id),
  
  -- Prescription metadata
  data_prescricao TIMESTAMPTZ NOT NULL DEFAULT now(),
  tipo_receita VARCHAR(30) NOT NULL DEFAULT 'simples' CHECK (tipo_receita IN ('simples', 'controle_especial', 'antimicrobiano', 'entorpecente')),
  
  -- Status for future digital prescription integration
  status VARCHAR(20) NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'assinada', 'enviada', 'cancelada')),
  assinada_em TIMESTAMPTZ,
  
  -- Future digital prescription fields (nullable for now)
  numero_receita VARCHAR(50),
  codigo_verificacao VARCHAR(100),
  validade_dias INTEGER DEFAULT 30,
  
  -- Clinical context
  observacoes TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create table for prescription items (medications)
CREATE TABLE public.patient_prescricao_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prescricao_id UUID NOT NULL REFERENCES public.patient_prescricoes(id) ON DELETE CASCADE,
  
  -- Medication identification
  medicamento_nome TEXT NOT NULL,
  medicamento_principio_ativo TEXT,
  medicamento_concentracao TEXT,
  medicamento_forma_farmaceutica TEXT,
  
  -- Dosage
  dose TEXT NOT NULL,
  unidade_dose VARCHAR(20),
  
  -- Posology (dosage instructions)
  posologia TEXT NOT NULL,
  frequencia VARCHAR(50),
  duracao_dias INTEGER,
  
  -- Additional instructions
  via_administracao VARCHAR(30) DEFAULT 'oral' CHECK (via_administracao IN ('oral', 'topica', 'injetavel', 'inalatoria', 'sublingual', 'retal', 'oftalmico', 'nasal', 'otologico', 'transdermico', 'outra')),
  instrucoes_especiais TEXT,
  uso_continuo BOOLEAN DEFAULT FALSE,
  
  -- Order for display
  ordem INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.patient_prescricoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_prescricao_itens ENABLE ROW LEVEL SECURITY;

-- RLS Policies for prescriptions
CREATE POLICY "Clinic members can view prescriptions"
ON public.patient_prescricoes
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.professionals p
    WHERE p.clinic_id = patient_prescricoes.clinic_id
    AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Professionals can insert prescriptions"
ON public.patient_prescricoes
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.professionals p
    WHERE p.id = patient_prescricoes.profissional_id
    AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Professionals can update own draft prescriptions"
ON public.patient_prescricoes
FOR UPDATE
USING (
  status = 'rascunho' AND
  EXISTS (
    SELECT 1 FROM public.professionals p
    WHERE p.id = patient_prescricoes.profissional_id
    AND p.user_id = auth.uid()
  )
);

-- RLS Policies for prescription items
CREATE POLICY "Clinic members can view prescription items"
ON public.patient_prescricao_itens
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.patient_prescricoes pr
    JOIN public.professionals p ON p.clinic_id = pr.clinic_id
    WHERE pr.id = patient_prescricao_itens.prescricao_id
    AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Professionals can insert prescription items"
ON public.patient_prescricao_itens
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.patient_prescricoes pr
    JOIN public.professionals p ON p.id = pr.profissional_id
    WHERE pr.id = patient_prescricao_itens.prescricao_id
    AND p.user_id = auth.uid()
    AND pr.status = 'rascunho'
  )
);

CREATE POLICY "Professionals can update draft prescription items"
ON public.patient_prescricao_itens
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.patient_prescricoes pr
    JOIN public.professionals p ON p.id = pr.profissional_id
    WHERE pr.id = patient_prescricao_itens.prescricao_id
    AND p.user_id = auth.uid()
    AND pr.status = 'rascunho'
  )
);

CREATE POLICY "Professionals can delete draft prescription items"
ON public.patient_prescricao_itens
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.patient_prescricoes pr
    JOIN public.professionals p ON p.id = pr.profissional_id
    WHERE pr.id = patient_prescricao_itens.prescricao_id
    AND p.user_id = auth.uid()
    AND pr.status = 'rascunho'
  )
);

-- Indexes
CREATE INDEX idx_patient_prescricoes_patient ON public.patient_prescricoes(patient_id);
CREATE INDEX idx_patient_prescricoes_clinic ON public.patient_prescricoes(clinic_id);
CREATE INDEX idx_patient_prescricao_itens_prescricao ON public.patient_prescricao_itens(prescricao_id);

-- Trigger for updated_at
CREATE TRIGGER update_patient_prescricoes_updated_at
BEFORE UPDATE ON public.patient_prescricoes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();