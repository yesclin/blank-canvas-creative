-- =============================================================================
-- CLINICAL MODULES SYSTEM
-- Hybrid architecture: code defaults + clinic overrides
-- =============================================================================

-- 1. Create enum for module categories
CREATE TYPE public.clinical_module_category AS ENUM (
  'clinical_record',    -- Modules that add content to medical records
  'documentation',      -- Terms, consents, documents
  'assessment',         -- Scales, measurements, evaluations
  'visual',             -- Images, before/after, interactive maps
  'planning'            -- Treatment plans, recurring sessions
);

-- 2. Master table of available clinical modules
CREATE TABLE public.clinical_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,           -- e.g. 'odontogram', 'clinical_scales'
  name TEXT NOT NULL,                 -- Display name in Portuguese
  description TEXT,
  category clinical_module_category NOT NULL,
  icon TEXT,                          -- Lucide icon name
  display_order INT NOT NULL DEFAULT 0,
  is_system BOOLEAN NOT NULL DEFAULT true,  -- System modules can't be deleted
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Default module assignments per specialty (code-level defaults)
CREATE TABLE public.specialty_module_defaults (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  specialty_id UUID NOT NULL REFERENCES public.specialties(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES public.clinical_modules(id) ON DELETE CASCADE,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(specialty_id, module_id)
);

-- 4. Clinic-level overrides
CREATE TABLE public.clinic_specialty_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  specialty_id UUID NOT NULL REFERENCES public.specialties(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES public.clinical_modules(id) ON DELETE CASCADE,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id),
  UNIQUE(clinic_id, specialty_id, module_id)
);

-- 5. Clinical scales catalog
CREATE TABLE public.clinical_scales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  scale_type TEXT NOT NULL DEFAULT 'numeric',
  min_value NUMERIC,
  max_value NUMERIC,
  unit TEXT,
  options JSONB,
  interpretation_guide JSONB,
  is_system BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- 6. Scale specialty associations
CREATE TABLE public.scale_specialties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scale_id UUID NOT NULL REFERENCES public.clinical_scales(id) ON DELETE CASCADE,
  specialty_id UUID NOT NULL REFERENCES public.specialties(id) ON DELETE CASCADE,
  UNIQUE(scale_id, specialty_id)
);

-- 7. Patient scale readings
CREATE TABLE public.patient_scale_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  scale_id UUID NOT NULL REFERENCES public.clinical_scales(id) ON DELETE RESTRICT,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  evolution_id UUID REFERENCES public.clinical_evolutions(id) ON DELETE SET NULL,
  value NUMERIC NOT NULL,
  notes TEXT,
  recorded_by UUID NOT NULL REFERENCES auth.users(id),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Before/After image pairs
CREATE TABLE public.before_after_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  procedure_id UUID REFERENCES public.procedures(id) ON DELETE SET NULL,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  before_image_url TEXT NOT NULL,
  before_date DATE NOT NULL,
  after_image_url TEXT,
  after_date DATE,
  is_consent_given BOOLEAN NOT NULL DEFAULT false,
  consent_for_marketing BOOLEAN NOT NULL DEFAULT false,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. Body measurements
CREATE TABLE public.body_measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  measurement_date DATE NOT NULL DEFAULT CURRENT_DATE,
  weight_kg NUMERIC(5,2),
  height_cm NUMERIC(5,2),
  bmi NUMERIC(4,2),
  body_fat_percent NUMERIC(4,2),
  muscle_mass_kg NUMERIC(5,2),
  waist_cm NUMERIC(5,2),
  hip_cm NUMERIC(5,2),
  chest_cm NUMERIC(5,2),
  arm_left_cm NUMERIC(5,2),
  arm_right_cm NUMERIC(5,2),
  thigh_left_cm NUMERIC(5,2),
  thigh_right_cm NUMERIC(5,2),
  calf_left_cm NUMERIC(5,2),
  calf_right_cm NUMERIC(5,2),
  custom_measurements JSONB,
  notes TEXT,
  recorded_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. Recurring sessions
CREATE TABLE public.recurring_session_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE RESTRICT,
  procedure_id UUID REFERENCES public.procedures(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  total_sessions INT NOT NULL,
  completed_sessions INT NOT NULL DEFAULT 0,
  frequency TEXT,
  start_date DATE NOT NULL,
  expected_end_date DATE,
  actual_end_date DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),
  notes TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. Session entries
CREATE TABLE public.recurring_session_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.recurring_session_plans(id) ON DELETE CASCADE,
  session_number INT NOT NULL,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'missed', 'cancelled')),
  notes TEXT,
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES auth.users(id)
);

-- 12. Therapeutic plans
CREATE TABLE public.therapeutic_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE RESTRICT,
  specialty_id UUID REFERENCES public.specialties(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  objectives JSONB,
  interventions JSONB,
  expected_outcomes TEXT,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  review_date DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'under_review', 'completed', 'discontinued')),
  notes TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 13. Interactive map annotations
CREATE TABLE public.interactive_map_annotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  map_type TEXT NOT NULL,
  custom_image_url TEXT,
  annotations JSONB NOT NULL,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 14. Clinical media
CREATE TABLE public.clinical_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  evolution_id UUID REFERENCES public.clinical_evolutions(id) ON DELETE SET NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video', 'audio', 'document')),
  file_url TEXT NOT NULL,
  thumbnail_url TEXT,
  title TEXT,
  description TEXT,
  duration_seconds INT,
  file_size_bytes BIGINT,
  metadata JSONB,
  tags TEXT[],
  is_consent_given BOOLEAN NOT NULL DEFAULT false,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- INDEXES
-- =============================================================================
CREATE INDEX idx_clinic_specialty_modules_lookup ON public.clinic_specialty_modules(clinic_id, specialty_id);
CREATE INDEX idx_patient_scale_readings_patient ON public.patient_scale_readings(patient_id);
CREATE INDEX idx_body_measurements_patient ON public.body_measurements(patient_id, measurement_date DESC);
CREATE INDEX idx_recurring_sessions_patient ON public.recurring_session_plans(patient_id);
CREATE INDEX idx_therapeutic_plans_patient ON public.therapeutic_plans(patient_id);
CREATE INDEX idx_clinical_media_patient ON public.clinical_media(patient_id);
CREATE INDEX idx_before_after_patient ON public.before_after_records(patient_id);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================
ALTER TABLE public.clinical_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.specialty_module_defaults ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinic_specialty_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_scales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scale_specialties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_scale_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.before_after_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.body_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_session_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_session_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.therapeutic_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interactive_map_annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_media ENABLE ROW LEVEL SECURITY;

-- Clinical modules are readable by all authenticated users
CREATE POLICY "Clinical modules are viewable by authenticated users"
  ON public.clinical_modules FOR SELECT TO authenticated USING (true);

-- Specialty module defaults are readable by all authenticated users
CREATE POLICY "Specialty module defaults are viewable by authenticated users"
  ON public.specialty_module_defaults FOR SELECT TO authenticated USING (true);

-- Clinic specialty modules - users can view their clinic's config
CREATE POLICY "Users can view their clinic module config"
  ON public.clinic_specialty_modules FOR SELECT TO authenticated
  USING (clinic_id IN (SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage clinic module config"
  ON public.clinic_specialty_modules FOR ALL TO authenticated
  USING (clinic_id IN (
    SELECT ur.clinic_id FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role IN ('owner', 'admin')
  ));

-- Clinical scales
CREATE POLICY "Clinical scales viewable by authenticated"
  ON public.clinical_scales FOR SELECT TO authenticated
  USING (
    is_system = true 
    OR clinic_id IN (SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can manage clinic scales"
  ON public.clinical_scales FOR ALL TO authenticated
  USING (
    clinic_id IN (
      SELECT ur.clinic_id FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role IN ('owner', 'admin')
    )
  );

-- Scale specialties
CREATE POLICY "Scale specialties viewable by authenticated"
  ON public.scale_specialties FOR SELECT TO authenticated USING (true);

-- Patient data policies
CREATE POLICY "Patient scale readings - clinic access"
  ON public.patient_scale_readings FOR ALL TO authenticated
  USING (clinic_id IN (SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Before after records - clinic access"
  ON public.before_after_records FOR ALL TO authenticated
  USING (clinic_id IN (SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Body measurements - clinic access"
  ON public.body_measurements FOR ALL TO authenticated
  USING (clinic_id IN (SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Recurring session plans - clinic access"
  ON public.recurring_session_plans FOR ALL TO authenticated
  USING (clinic_id IN (SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Recurring session entries - via plan access"
  ON public.recurring_session_entries FOR ALL TO authenticated
  USING (plan_id IN (
    SELECT id FROM public.recurring_session_plans 
    WHERE clinic_id IN (SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid())
  ));

CREATE POLICY "Therapeutic plans - clinic access"
  ON public.therapeutic_plans FOR ALL TO authenticated
  USING (clinic_id IN (SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Interactive map annotations - clinic access"
  ON public.interactive_map_annotations FOR ALL TO authenticated
  USING (clinic_id IN (SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Clinical media - clinic access"
  ON public.clinical_media FOR ALL TO authenticated
  USING (clinic_id IN (SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid()));

-- =============================================================================
-- SEED DATA: 10 CLINICAL MODULES
-- =============================================================================
INSERT INTO public.clinical_modules (key, name, description, category, icon, display_order) VALUES
('recurring_sessions', 'Sessões Recorrentes', 'Controle de pacotes de sessões e tratamentos contínuos', 'planning', 'CalendarRange', 1),
('clinical_scales', 'Escalas Clínicas', 'Avaliação com escalas validadas (Dor, NYHA, Glasgow, etc.)', 'assessment', 'Gauge', 2),
('procedures_module', 'Procedimentos', 'Registro detalhado de procedimentos realizados', 'clinical_record', 'Syringe', 3),
('advanced_uploads', 'Upload Avançado', 'Captura de imagens, vídeos e áudios clínicos', 'visual', 'Upload', 4),
('interactive_map', 'Mapa Interativo', 'Marcação em imagem corporal/facial clicável', 'visual', 'MapPin', 5),
('odontogram', 'Odontograma Digital', 'Mapeamento visual da arcada dentária', 'clinical_record', 'Smile', 6),
('body_measurements', 'Medidas Corporais', 'Acompanhamento de medidas antropométricas', 'assessment', 'Ruler', 7),
('before_after', 'Antes e Depois', 'Comparativo visual de evolução do tratamento', 'visual', 'ArrowLeftRight', 8),
('consent_terms', 'Termos e Consentimentos', 'Gestão de termos de consentimento informado', 'documentation', 'FileCheck', 9),
('therapeutic_plan', 'Plano Terapêutico', 'Planejamento de objetivos e intervenções', 'planning', 'ClipboardList', 10);

-- =============================================================================
-- SEED DATA: PRE-DEFINED CLINICAL SCALES
-- =============================================================================
INSERT INTO public.clinical_scales (name, description, scale_type, min_value, max_value, unit, options, interpretation_guide, is_system) VALUES
('EVA - Escala Visual Analógica de Dor', 'Avaliação da intensidade da dor de 0 a 10', 'numeric', 0, 10, NULL, NULL, 
 '{"ranges": [{"min": 0, "max": 0, "label": "Sem dor"}, {"min": 1, "max": 3, "label": "Dor leve"}, {"min": 4, "max": 6, "label": "Dor moderada"}, {"min": 7, "max": 10, "label": "Dor intensa"}]}', true),
 
('NYHA - Classificação Funcional', 'Classificação da insuficiência cardíaca', 'categorical', 1, 4, NULL,
 '[{"value": 1, "label": "Classe I - Sem limitação"}, {"value": 2, "label": "Classe II - Limitação leve"}, {"value": 3, "label": "Classe III - Limitação moderada"}, {"value": 4, "label": "Classe IV - Incapacidade"}]',
 '{"description": "New York Heart Association functional classification"}', true),

('Glasgow - Escala de Coma', 'Avaliação do nível de consciência', 'numeric', 3, 15, NULL, NULL,
 '{"ranges": [{"min": 3, "max": 8, "label": "Coma grave"}, {"min": 9, "max": 12, "label": "Coma moderado"}, {"min": 13, "max": 15, "label": "Coma leve / Normal"}]}', true),

('IMC - Índice de Massa Corporal', 'Calculado automaticamente (peso/altura²)', 'numeric', 10, 60, 'kg/m²', NULL,
 '{"ranges": [{"min": 0, "max": 18.5, "label": "Abaixo do peso"}, {"min": 18.5, "max": 24.9, "label": "Peso normal"}, {"min": 25, "max": 29.9, "label": "Sobrepeso"}, {"min": 30, "max": 60, "label": "Obesidade"}]}', true),

('PHQ-9 - Depressão', 'Patient Health Questionnaire para depressão', 'numeric', 0, 27, 'pontos', NULL,
 '{"ranges": [{"min": 0, "max": 4, "label": "Mínima"}, {"min": 5, "max": 9, "label": "Leve"}, {"min": 10, "max": 14, "label": "Moderada"}, {"min": 15, "max": 19, "label": "Moderadamente grave"}, {"min": 20, "max": 27, "label": "Grave"}]}', true),

('GAD-7 - Ansiedade', 'Generalized Anxiety Disorder scale', 'numeric', 0, 21, 'pontos', NULL,
 '{"ranges": [{"min": 0, "max": 4, "label": "Mínima"}, {"min": 5, "max": 9, "label": "Leve"}, {"min": 10, "max": 14, "label": "Moderada"}, {"min": 15, "max": 21, "label": "Grave"}]}', true),

('Braden - Risco de Lesão por Pressão', 'Avaliação de risco de úlcera de pressão', 'numeric', 6, 23, 'pontos', NULL,
 '{"ranges": [{"min": 6, "max": 9, "label": "Risco muito alto"}, {"min": 10, "max": 12, "label": "Risco alto"}, {"min": 13, "max": 14, "label": "Risco moderado"}, {"min": 15, "max": 18, "label": "Risco baixo"}, {"min": 19, "max": 23, "label": "Sem risco"}]}', true),

('Apgar - Recém-Nascido', 'Avaliação de vitalidade do recém-nascido', 'numeric', 0, 10, 'pontos', NULL,
 '{"ranges": [{"min": 0, "max": 3, "label": "Asfixia grave"}, {"min": 4, "max": 6, "label": "Asfixia moderada"}, {"min": 7, "max": 10, "label": "Normal"}]}', true);

-- =============================================================================
-- TRIGGERS
-- =============================================================================
CREATE OR REPLACE FUNCTION public.update_clinical_module_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_clinic_specialty_modules_timestamp
  BEFORE UPDATE ON public.clinic_specialty_modules
  FOR EACH ROW EXECUTE FUNCTION public.update_clinical_module_timestamp();

CREATE TRIGGER update_before_after_timestamp
  BEFORE UPDATE ON public.before_after_records
  FOR EACH ROW EXECUTE FUNCTION public.update_clinical_module_timestamp();

CREATE TRIGGER update_recurring_session_plans_timestamp
  BEFORE UPDATE ON public.recurring_session_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_clinical_module_timestamp();

CREATE TRIGGER update_therapeutic_plans_timestamp
  BEFORE UPDATE ON public.therapeutic_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_clinical_module_timestamp();