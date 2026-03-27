
-- =============================================
-- CORE PHANTOM TABLES - BATCH 1: Clinical Modules & Scales
-- =============================================

-- clinical_modules: catalog of available clinical modules per specialty
CREATE TABLE IF NOT EXISTS public.clinical_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'clinical',
  icon text,
  display_order integer NOT NULL DEFAULT 0,
  is_system boolean NOT NULL DEFAULT true,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.clinical_modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view clinical modules" ON public.clinical_modules FOR SELECT TO authenticated USING (true);
CREATE POLICY "Only admins insert modules" ON public.clinical_modules FOR INSERT TO authenticated WITH CHECK (false);

-- clinic_specialty_modules: per-clinic overrides of which modules are enabled for a specialty
CREATE TABLE IF NOT EXISTS public.clinic_specialty_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  specialty_id uuid NOT NULL REFERENCES public.specialties(id) ON DELETE CASCADE,
  module_key text NOT NULL,
  is_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(clinic_id, specialty_id, module_key)
);
ALTER TABLE public.clinic_specialty_modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage specialty modules" ON public.clinic_specialty_modules FOR ALL TO authenticated USING (is_clinic_admin(auth.uid(), clinic_id)) WITH CHECK (is_clinic_admin(auth.uid(), clinic_id));
CREATE POLICY "Users view specialty modules" ON public.clinic_specialty_modules FOR SELECT TO authenticated USING (clinic_id = user_clinic_id(auth.uid()));

-- clinical_scales: clinical measurement scales (EVA, etc.)
CREATE TABLE IF NOT EXISTS public.clinical_scales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid REFERENCES public.clinics(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  scale_type text NOT NULL DEFAULT 'numeric',
  min_value numeric,
  max_value numeric,
  unit text,
  options jsonb,
  interpretation_guide jsonb,
  is_system boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.clinical_scales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View system or clinic scales" ON public.clinical_scales FOR SELECT TO authenticated USING (is_system = true OR clinic_id = user_clinic_id(auth.uid()));
CREATE POLICY "Admins manage clinic scales" ON public.clinical_scales FOR ALL TO authenticated USING (clinic_id = user_clinic_id(auth.uid()) AND is_clinic_admin(auth.uid(), clinic_id)) WITH CHECK (clinic_id = user_clinic_id(auth.uid()) AND is_clinic_admin(auth.uid(), clinic_id));

-- scale_specialties: link scales to specialties
CREATE TABLE IF NOT EXISTS public.scale_specialties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scale_id uuid NOT NULL REFERENCES public.clinical_scales(id) ON DELETE CASCADE,
  specialty_id uuid NOT NULL REFERENCES public.specialties(id) ON DELETE CASCADE,
  UNIQUE(scale_id, specialty_id)
);
ALTER TABLE public.scale_specialties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view scale specialties" ON public.scale_specialties FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage scale specialties" ON public.scale_specialties FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM clinical_scales cs WHERE cs.id = scale_id AND is_clinic_admin(auth.uid(), cs.clinic_id))) WITH CHECK (EXISTS (SELECT 1 FROM clinical_scales cs WHERE cs.id = scale_id AND is_clinic_admin(auth.uid(), cs.clinic_id)));

-- patient_scale_readings: patient measurements using scales
CREATE TABLE IF NOT EXISTS public.patient_scale_readings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  scale_id uuid NOT NULL REFERENCES public.clinical_scales(id) ON DELETE CASCADE,
  professional_id uuid REFERENCES public.professionals(id),
  value numeric NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.patient_scale_readings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clinic users view readings" ON public.patient_scale_readings FOR SELECT TO authenticated USING (clinic_id = user_clinic_id(auth.uid()) AND can_access_clinical_content(auth.uid()));
CREATE POLICY "Clinical users insert readings" ON public.patient_scale_readings FOR INSERT TO authenticated WITH CHECK (clinic_id = user_clinic_id(auth.uid()) AND can_access_clinical_content(auth.uid()));
CREATE POLICY "Admins manage readings" ON public.patient_scale_readings FOR ALL TO authenticated USING (is_clinic_admin(auth.uid(), clinic_id)) WITH CHECK (is_clinic_admin(auth.uid(), clinic_id));
