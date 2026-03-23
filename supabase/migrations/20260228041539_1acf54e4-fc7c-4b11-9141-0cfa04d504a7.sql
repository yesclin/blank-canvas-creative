
-- Table for crisis action plans linked to psychology sessions
CREATE TABLE public.planos_acao_crise (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id),
  sessao_id UUID NOT NULL REFERENCES public.sessoes_psicologia(id),
  profissional_id UUID NOT NULL REFERENCES public.professionals(id),
  
  -- Seção 1: Avaliação de Risco Imediato
  risco_iminente BOOLEAN NOT NULL DEFAULT false,
  encaminhamento_emergencial BOOLEAN NOT NULL DEFAULT false,
  contato_responsavel BOOLEAN NOT NULL DEFAULT false,
  
  -- Seção 2: Intervenção Realizada
  descricao_intervencao TEXT NOT NULL,
  tecnica_aplicada TEXT,
  
  -- Seção 3: Encaminhamentos
  encaminhamento_medico BOOLEAN NOT NULL DEFAULT false,
  encaminhamento_caps BOOLEAN NOT NULL DEFAULT false,
  encaminhamento_hospital BOOLEAN NOT NULL DEFAULT false,
  encaminhamento_outro TEXT,
  
  -- Seção 4: Plano próximas 72h
  sessao_antecipada BOOLEAN NOT NULL DEFAULT false,
  contato_intermediario BOOLEAN NOT NULL DEFAULT false,
  observacoes_adicionais TEXT,
  
  -- Meta
  regression_status TEXT NOT NULL DEFAULT 'crise',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.planos_acao_crise ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view action plans from their clinic"
  ON public.planos_acao_crise FOR SELECT
  USING (clinic_id = public.get_user_clinic_id());

CREATE POLICY "Users can insert action plans for their clinic"
  ON public.planos_acao_crise FOR INSERT
  WITH CHECK (clinic_id = public.get_user_clinic_id());

CREATE POLICY "Users can update action plans from their clinic"
  ON public.planos_acao_crise FOR UPDATE
  USING (clinic_id = public.get_user_clinic_id());
