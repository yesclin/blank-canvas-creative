
-- =============================================
-- BUILDER DE MODELOS DE ANAMNESE — ARQUITETURA PROFISSIONAL
-- =============================================

-- 1. Make clinic_id nullable for global templates
ALTER TABLE public.anamnesis_templates ALTER COLUMN clinic_id DROP NOT NULL;

-- Add new columns
ALTER TABLE public.anamnesis_templates 
  ADD COLUMN IF NOT EXISTS specialty_id uuid REFERENCES public.specialties(id),
  ADD COLUMN IF NOT EXISTS is_system boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_default boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS current_version_id uuid;

-- Migrate existing specialty text to specialty_id
UPDATE public.anamnesis_templates t
SET specialty_id = s.id
FROM public.specialties s
WHERE LOWER(s.name) = CASE 
  WHEN t.specialty = 'geral' THEN 'clínica geral'
  WHEN t.specialty = 'estetica' THEN 'estética'
  WHEN t.specialty = 'clinica_geral' THEN 'clínica geral'
  ELSE LOWER(t.specialty)
END
AND t.specialty_id IS NULL;

-- 2. CREATE anamnesis_template_versions
CREATE TABLE IF NOT EXISTS public.anamnesis_template_versions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id uuid NOT NULL REFERENCES public.anamnesis_templates(id) ON DELETE CASCADE,
  version_number integer NOT NULL DEFAULT 1,
  structure jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  UNIQUE(template_id, version_number)
);

-- 3. CREATE anamnesis_records
CREATE TABLE IF NOT EXISTS public.anamnesis_records (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id uuid REFERENCES public.appointments(id),
  patient_id uuid NOT NULL REFERENCES public.patients(id),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id),
  template_id uuid NOT NULL REFERENCES public.anamnesis_templates(id),
  template_version_id uuid NOT NULL REFERENCES public.anamnesis_template_versions(id),
  responses jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Add FK for current_version_id
ALTER TABLE public.anamnesis_templates 
  ADD CONSTRAINT anamnesis_templates_current_version_id_fkey 
  FOREIGN KEY (current_version_id) REFERENCES public.anamnesis_template_versions(id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_atv_template ON public.anamnesis_template_versions(template_id);
CREATE INDEX IF NOT EXISTS idx_ar_appointment ON public.anamnesis_records(appointment_id);
CREATE INDEX IF NOT EXISTS idx_ar_patient ON public.anamnesis_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_ar_clinic ON public.anamnesis_records(clinic_id);
CREATE INDEX IF NOT EXISTS idx_ar_template ON public.anamnesis_records(template_id);
CREATE INDEX IF NOT EXISTS idx_at_specialty ON public.anamnesis_templates(specialty_id);
CREATE INDEX IF NOT EXISTS idx_at_clinic_default ON public.anamnesis_templates(clinic_id, is_default) WHERE is_default = true;

-- =============================================
-- RLS POLICIES
-- =============================================

ALTER TABLE public.anamnesis_template_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View versions of own clinic or global templates"
  ON public.anamnesis_template_versions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.anamnesis_templates t
    WHERE t.id = template_id
      AND (t.clinic_id IS NULL OR t.clinic_id = public.get_user_clinic_id())
  ));

CREATE POLICY "Create versions for own clinic templates"
  ON public.anamnesis_template_versions FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.anamnesis_templates t
    WHERE t.id = template_id
      AND t.clinic_id = public.get_user_clinic_id()
      AND t.is_system = false
  ));

ALTER TABLE public.anamnesis_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View own clinic records" ON public.anamnesis_records FOR SELECT
  USING (clinic_id = public.get_user_clinic_id());

CREATE POLICY "Create own clinic records" ON public.anamnesis_records FOR INSERT
  WITH CHECK (clinic_id = public.get_user_clinic_id());

CREATE POLICY "Update own clinic records" ON public.anamnesis_records FOR UPDATE
  USING (clinic_id = public.get_user_clinic_id());

-- Update templates RLS for global visibility
DROP POLICY IF EXISTS "Users can view their clinic templates" ON public.anamnesis_templates;
CREATE POLICY "View own clinic or global templates"
  ON public.anamnesis_templates FOR SELECT
  USING (clinic_id IS NULL OR clinic_id = public.get_user_clinic_id());

-- Updated at trigger
CREATE OR REPLACE FUNCTION public.update_anamnesis_records_ts()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_anamnesis_records_updated_at
  BEFORE UPDATE ON public.anamnesis_records
  FOR EACH ROW EXECUTE FUNCTION public.update_anamnesis_records_ts();

-- =============================================
-- SEED: System template for Clínica Geral
-- =============================================

INSERT INTO public.anamnesis_templates (
  id, clinic_id, name, description, template_type, specialty, specialty_id,
  icon, is_system, is_default, is_active, campos
) VALUES (
  'a0000000-0000-0000-0000-000000000001',
  NULL,
  'Anamnese Clínica Geral – Padrão Médico',
  'Modelo completo de anamnese seguindo o padrão técnico de 13 pontos da prática médica',
  'anamnese_clinica_geral_padrao',
  'clinica_geral',
  'd43d2062-c2ba-4d53-bca1-fa2e164ce095',
  'Stethoscope',
  true, true, true, '[]'::jsonb
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.anamnesis_template_versions (
  id, template_id, version_number, structure
) VALUES (
  'b0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  1,
  '[
    {"id":"queixa_principal","type":"section","title":"1. Queixa Principal (QP)","fields":[{"id":"qp_descricao","type":"textarea","label":"Motivo da consulta (nas palavras do paciente)","required":true,"placeholder":"Ex: Dor no peito há 2 dias"}]},
    {"id":"historia_doenca_atual","type":"section","title":"2. História da Doença Atual (HDA)","fields":[{"id":"hda_onset","type":"date","label":"Início dos sintomas (O)"},{"id":"hda_provocation","type":"textarea","label":"Fatores de piora/melhora (P)","placeholder":"O que piora? O que melhora?"},{"id":"hda_quality","type":"textarea","label":"Qualidade do sintoma (Q)","placeholder":"Tipo: pontada, queimação, pressão..."},{"id":"hda_radiation","type":"textarea","label":"Irradiação (R)","placeholder":"Irradia para algum lugar?"},{"id":"hda_severity","type":"number","label":"Intensidade (0–10) (S)","placeholder":"0 a 10"},{"id":"hda_time","type":"textarea","label":"Tempo/duração (T)","placeholder":"Quanto tempo dura?"},{"id":"hda_evolucao","type":"textarea","label":"Evolução","placeholder":"Como evoluiu?"},{"id":"hda_sintomas_associados","type":"textarea","label":"Sintomas associados"},{"id":"hda_tratamentos_previos","type":"textarea","label":"Tratamentos já realizados"},{"id":"hda_impacto_funcional","type":"textarea","label":"Impacto funcional"}]},
    {"id":"antecedentes_pessoais","type":"section","title":"3. História Patológica Pregressa (HPP)","fields":[{"id":"hpp_doencas_previas","type":"textarea","label":"Doenças prévias"},{"id":"hpp_internacoes","type":"textarea","label":"Internações"},{"id":"hpp_cirurgias","type":"textarea","label":"Cirurgias"},{"id":"hpp_transfusoes","type":"textarea","label":"Transfusões"},{"id":"hpp_traumas","type":"textarea","label":"Traumas relevantes"}]},
    {"id":"antecedentes_familiares","type":"section","title":"4. História Familiar (HF)","fields":[{"id":"hf_doencas_hereditarias","type":"textarea","label":"Doenças hereditárias"},{"id":"hf_has_dm_cancer","type":"textarea","label":"HAS / DM / Câncer / Cardiovasculares"},{"id":"hf_obitos","type":"textarea","label":"Idade e causa de óbito"}]},
    {"id":"medicamentos","type":"section","title":"5. Medicamentos em Uso","fields":[{"id":"med_lista","type":"textarea","label":"Nome / Dose / Frequência / Tempo de uso","required":true},{"id":"med_automedicacao","type":"textarea","label":"Automedicação"}]},
    {"id":"alergias","type":"section","title":"6. Alergias","fields":[{"id":"alergias_medicamentosas","type":"textarea","label":"Medicamentosas"},{"id":"alergias_alimentares","type":"textarea","label":"Alimentares"},{"id":"alergias_ambientais","type":"textarea","label":"Ambientais"},{"id":"alergias_reacao","type":"textarea","label":"Reação apresentada"}]},
    {"id":"habitos_vida","type":"section","title":"7. Hábitos de Vida","fields":[{"id":"hab_tabagismo","type":"text","label":"Tabagismo (carga tabágica)"},{"id":"hab_etilismo","type":"text","label":"Etilismo (frequência/quantidade)"},{"id":"hab_atividade_fisica","type":"textarea","label":"Atividade física"},{"id":"hab_alimentacao","type":"textarea","label":"Alimentação"},{"id":"hab_drogas","type":"textarea","label":"Uso de drogas"},{"id":"hab_sono","type":"textarea","label":"Padrão de sono"}]},
    {"id":"historia_ginecologica","type":"section","title":"8. História Ginecológica/Obstétrica","fields":[{"id":"gin_menarca","type":"text","label":"Menarca"},{"id":"gin_ciclo","type":"text","label":"Ciclo menstrual"},{"id":"gin_gestacoes","type":"number","label":"Gestações"},{"id":"gin_abortos","type":"number","label":"Abortos"},{"id":"gin_dum","type":"date","label":"Última menstruação"},{"id":"gin_contraceptivo","type":"text","label":"Método contraceptivo"}]},
    {"id":"revisao_sistemas","type":"section","title":"9. Revisão de Sistemas (ROS)","fields":[{"id":"ros_geral","type":"textarea","label":"Geral"},{"id":"ros_cardiovascular","type":"textarea","label":"Cardiovascular"},{"id":"ros_respiratorio","type":"textarea","label":"Respiratório"},{"id":"ros_gastrointestinal","type":"textarea","label":"Gastrointestinal"},{"id":"ros_geniturinario","type":"textarea","label":"Geniturinário"},{"id":"ros_neurologico","type":"textarea","label":"Neurológico"},{"id":"ros_endocrino","type":"textarea","label":"Endócrino"},{"id":"ros_musculoesqueletico","type":"textarea","label":"Musculoesquelético"},{"id":"ros_dermatologico","type":"textarea","label":"Dermatológico"},{"id":"ros_psiquiatrico","type":"textarea","label":"Psiquiátrico"}]}
  ]'::jsonb
) ON CONFLICT DO NOTHING;

UPDATE public.anamnesis_templates 
SET current_version_id = 'b0000000-0000-0000-0000-000000000001'
WHERE id = 'a0000000-0000-0000-0000-000000000001';

-- Unique default per specialty per clinic
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_default_per_specialty_clinic
  ON public.anamnesis_templates (COALESCE(clinic_id, '00000000-0000-0000-0000-000000000000'), specialty_id)
  WHERE is_default = true AND is_active = true;
