
-- =============================================
-- BATCH 4: Specialty-specific phantom tables + clinics column fix
-- =============================================

-- Add allow_negative_stock to clinics
ALTER TABLE public.clinics ADD COLUMN IF NOT EXISTS allow_negative_stock boolean DEFAULT false;

-- sessoes_psicologia
CREATE TABLE IF NOT EXISTS public.sessoes_psicologia (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  professional_id uuid REFERENCES public.professionals(id),
  numero_sessao integer,
  data_sessao date,
  tema_central text,
  humor_paciente text,
  emocoes_predominantes text,
  evolucao_caso text,
  adesao_terapeutica text,
  tecnicas_utilizadas text,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.sessoes_psicologia ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clinical users view sessions" ON public.sessoes_psicologia FOR SELECT TO authenticated USING (clinic_id = user_clinic_id(auth.uid()) AND can_access_clinical_content(auth.uid()));
CREATE POLICY "Professionals insert sessions" ON public.sessoes_psicologia FOR INSERT TO authenticated WITH CHECK (clinic_id = user_clinic_id(auth.uid()) AND can_access_clinical_content(auth.uid()));
CREATE POLICY "Professionals update sessions" ON public.sessoes_psicologia FOR UPDATE TO authenticated USING (clinic_id = user_clinic_id(auth.uid()) AND can_access_clinical_content(auth.uid()));
CREATE POLICY "Admins manage sessions" ON public.sessoes_psicologia FOR ALL TO authenticated USING (is_clinic_admin(auth.uid(), clinic_id)) WITH CHECK (is_clinic_admin(auth.uid(), clinic_id));

-- patient_anamnese_psicologia
CREATE TABLE IF NOT EXISTS public.patient_anamnese_psicologia (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  professional_id uuid REFERENCES public.professionals(id),
  queixa_principal text,
  historico_pessoal text,
  historico_familiar text,
  medicamentos text,
  data jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.patient_anamnese_psicologia ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clinical view psico anamnese" ON public.patient_anamnese_psicologia FOR SELECT TO authenticated USING (clinic_id = user_clinic_id(auth.uid()) AND can_access_clinical_content(auth.uid()));
CREATE POLICY "Insert psico anamnese" ON public.patient_anamnese_psicologia FOR INSERT TO authenticated WITH CHECK (clinic_id = user_clinic_id(auth.uid()) AND can_access_clinical_content(auth.uid()));
CREATE POLICY "Update psico anamnese" ON public.patient_anamnese_psicologia FOR UPDATE TO authenticated USING (clinic_id = user_clinic_id(auth.uid()) AND can_access_clinical_content(auth.uid()));
CREATE POLICY "Admins manage psico anamnese" ON public.patient_anamnese_psicologia FOR ALL TO authenticated USING (is_clinic_admin(auth.uid(), clinic_id)) WITH CHECK (is_clinic_admin(auth.uid(), clinic_id));

-- plano_terapeutico_psicologia
CREATE TABLE IF NOT EXISTS public.plano_terapeutico_psicologia (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  professional_id uuid REFERENCES public.professionals(id),
  titulo text,
  objetivos text,
  abordagem text,
  frequencia text,
  status text DEFAULT 'ativo',
  data jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.plano_terapeutico_psicologia ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clinical view plano" ON public.plano_terapeutico_psicologia FOR SELECT TO authenticated USING (clinic_id = user_clinic_id(auth.uid()) AND can_access_clinical_content(auth.uid()));
CREATE POLICY "Insert plano" ON public.plano_terapeutico_psicologia FOR INSERT TO authenticated WITH CHECK (clinic_id = user_clinic_id(auth.uid()) AND can_access_clinical_content(auth.uid()));
CREATE POLICY "Update plano" ON public.plano_terapeutico_psicologia FOR UPDATE TO authenticated USING (clinic_id = user_clinic_id(auth.uid()) AND can_access_clinical_content(auth.uid()));
CREATE POLICY "Admins manage plano" ON public.plano_terapeutico_psicologia FOR ALL TO authenticated USING (is_clinic_admin(auth.uid(), clinic_id)) WITH CHECK (is_clinic_admin(auth.uid(), clinic_id));

-- planos_acao_crise
CREATE TABLE IF NOT EXISTS public.planos_acao_crise (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  professional_id uuid REFERENCES public.professionals(id),
  titulo text NOT NULL,
  sinais_alerta text,
  acoes text,
  contatos_emergencia jsonb DEFAULT '[]',
  is_active boolean NOT NULL DEFAULT true,
  data jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.planos_acao_crise ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clinical view crisis plans" ON public.planos_acao_crise FOR SELECT TO authenticated USING (clinic_id = user_clinic_id(auth.uid()) AND can_access_clinical_content(auth.uid()));
CREATE POLICY "Insert crisis plans" ON public.planos_acao_crise FOR INSERT TO authenticated WITH CHECK (clinic_id = user_clinic_id(auth.uid()) AND can_access_clinical_content(auth.uid()));
CREATE POLICY "Update crisis plans" ON public.planos_acao_crise FOR UPDATE TO authenticated USING (clinic_id = user_clinic_id(auth.uid()) AND can_access_clinical_content(auth.uid()));
CREATE POLICY "Admins manage crisis plans" ON public.planos_acao_crise FOR ALL TO authenticated USING (is_clinic_admin(auth.uid(), clinic_id)) WITH CHECK (is_clinic_admin(auth.uid(), clinic_id));

-- therapeutic_goals
CREATE TABLE IF NOT EXISTS public.therapeutic_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  professional_id uuid REFERENCES public.professionals(id),
  titulo text NOT NULL,
  descricao text,
  status text DEFAULT 'em_andamento',
  progresso numeric DEFAULT 0,
  meta_type text DEFAULT 'qualitativo',
  data jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.therapeutic_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clinical view goals" ON public.therapeutic_goals FOR SELECT TO authenticated USING (clinic_id = user_clinic_id(auth.uid()) AND can_access_clinical_content(auth.uid()));
CREATE POLICY "Insert goals" ON public.therapeutic_goals FOR INSERT TO authenticated WITH CHECK (clinic_id = user_clinic_id(auth.uid()) AND can_access_clinical_content(auth.uid()));
CREATE POLICY "Update goals" ON public.therapeutic_goals FOR UPDATE TO authenticated USING (clinic_id = user_clinic_id(auth.uid()) AND can_access_clinical_content(auth.uid()));
CREATE POLICY "Admins manage goals" ON public.therapeutic_goals FOR ALL TO authenticated USING (is_clinic_admin(auth.uid(), clinic_id)) WITH CHECK (is_clinic_admin(auth.uid(), clinic_id));

-- therapeutic_goal_updates
CREATE TABLE IF NOT EXISTS public.therapeutic_goal_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id uuid NOT NULL REFERENCES public.therapeutic_goals(id) ON DELETE CASCADE,
  old_progress numeric,
  new_progress numeric,
  observation text,
  score_value numeric,
  updated_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.therapeutic_goal_updates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View goal updates" ON public.therapeutic_goal_updates FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM therapeutic_goals g WHERE g.id = goal_id AND g.clinic_id = user_clinic_id(auth.uid()) AND can_access_clinical_content(auth.uid())));
CREATE POLICY "Insert goal updates" ON public.therapeutic_goal_updates FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM therapeutic_goals g WHERE g.id = goal_id AND g.clinic_id = user_clinic_id(auth.uid()) AND can_access_clinical_content(auth.uid())));

-- instrumentos_psicologicos
CREATE TABLE IF NOT EXISTS public.instrumentos_psicologicos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  professional_id uuid REFERENCES public.professionals(id),
  nome text NOT NULL,
  tipo text,
  resultado jsonb DEFAULT '{}',
  observacoes text,
  data_aplicacao date,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.instrumentos_psicologicos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clinical view instrumentos" ON public.instrumentos_psicologicos FOR SELECT TO authenticated USING (clinic_id = user_clinic_id(auth.uid()) AND can_access_clinical_content(auth.uid()));
CREATE POLICY "Insert instrumentos" ON public.instrumentos_psicologicos FOR INSERT TO authenticated WITH CHECK (clinic_id = user_clinic_id(auth.uid()) AND can_access_clinical_content(auth.uid()));
CREATE POLICY "Admins manage instrumentos" ON public.instrumentos_psicologicos FOR ALL TO authenticated USING (is_clinic_admin(auth.uid(), clinic_id)) WITH CHECK (is_clinic_admin(auth.uid(), clinic_id));
