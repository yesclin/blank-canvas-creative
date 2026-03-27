
-- =============================================
-- BATCH 5: Remaining phantom tables (odontology, patient sub-records, facial maps, etc.)
-- =============================================

-- odontogram_teeth
CREATE TABLE IF NOT EXISTS public.odontogram_teeth (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  odontogram_id uuid NOT NULL REFERENCES public.odontograms(id) ON DELETE CASCADE,
  tooth_number integer NOT NULL,
  status text DEFAULT 'healthy',
  conditions jsonb DEFAULT '[]',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(odontogram_id, tooth_number)
);
ALTER TABLE public.odontogram_teeth ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View teeth" ON public.odontogram_teeth FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM odontograms o WHERE o.id = odontogram_id AND o.clinic_id = user_clinic_id(auth.uid())));
CREATE POLICY "Insert teeth" ON public.odontogram_teeth FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM odontograms o WHERE o.id = odontogram_id AND o.clinic_id = user_clinic_id(auth.uid())));
CREATE POLICY "Update teeth" ON public.odontogram_teeth FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM odontograms o WHERE o.id = odontogram_id AND o.clinic_id = user_clinic_id(auth.uid())));
CREATE POLICY "Admins manage teeth" ON public.odontogram_teeth FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM odontograms o WHERE o.id = odontogram_id AND is_clinic_admin(auth.uid(), o.clinic_id))) WITH CHECK (EXISTS (SELECT 1 FROM odontograms o WHERE o.id = odontogram_id AND is_clinic_admin(auth.uid(), o.clinic_id)));

-- facial_maps
CREATE TABLE IF NOT EXISTS public.facial_maps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  professional_id uuid REFERENCES public.professionals(id),
  map_type text DEFAULT 'face',
  data jsonb DEFAULT '{}',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.facial_maps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clinical view facial maps" ON public.facial_maps FOR SELECT TO authenticated USING (clinic_id = user_clinic_id(auth.uid()) AND can_access_clinical_content(auth.uid()));
CREATE POLICY "Insert facial maps" ON public.facial_maps FOR INSERT TO authenticated WITH CHECK (clinic_id = user_clinic_id(auth.uid()) AND can_access_clinical_content(auth.uid()));
CREATE POLICY "Update facial maps" ON public.facial_maps FOR UPDATE TO authenticated USING (clinic_id = user_clinic_id(auth.uid()) AND can_access_clinical_content(auth.uid()));
CREATE POLICY "Admins manage facial maps" ON public.facial_maps FOR ALL TO authenticated USING (is_clinic_admin(auth.uid(), clinic_id)) WITH CHECK (is_clinic_admin(auth.uid(), clinic_id));

-- facial_map_images
CREATE TABLE IF NOT EXISTS public.facial_map_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facial_map_id uuid NOT NULL REFERENCES public.facial_maps(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  annotations jsonb DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.facial_map_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View map images" ON public.facial_map_images FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM facial_maps fm WHERE fm.id = facial_map_id AND fm.clinic_id = user_clinic_id(auth.uid())));
CREATE POLICY "Insert map images" ON public.facial_map_images FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM facial_maps fm WHERE fm.id = facial_map_id AND fm.clinic_id = user_clinic_id(auth.uid())));
CREATE POLICY "Admins manage map images" ON public.facial_map_images FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM facial_maps fm WHERE fm.id = facial_map_id AND is_clinic_admin(auth.uid(), fm.clinic_id))) WITH CHECK (EXISTS (SELECT 1 FROM facial_maps fm WHERE fm.id = facial_map_id AND is_clinic_admin(auth.uid(), fm.clinic_id)));

-- facial_map_applications
CREATE TABLE IF NOT EXISTS public.facial_map_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facial_map_id uuid NOT NULL REFERENCES public.facial_maps(id) ON DELETE CASCADE,
  product_name text,
  region text,
  units numeric,
  notes text,
  data jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.facial_map_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View map apps" ON public.facial_map_applications FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM facial_maps fm WHERE fm.id = facial_map_id AND fm.clinic_id = user_clinic_id(auth.uid())));
CREATE POLICY "Insert map apps" ON public.facial_map_applications FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM facial_maps fm WHERE fm.id = facial_map_id AND fm.clinic_id = user_clinic_id(auth.uid())));
CREATE POLICY "Admins manage map apps" ON public.facial_map_applications FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM facial_maps fm WHERE fm.id = facial_map_id AND is_clinic_admin(auth.uid(), fm.clinic_id))) WITH CHECK (EXISTS (SELECT 1 FROM facial_maps fm WHERE fm.id = facial_map_id AND is_clinic_admin(auth.uid(), fm.clinic_id)));

-- Generic patient sub-tables for specialty clinical data
CREATE TABLE IF NOT EXISTS public.patient_anamneses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  professional_id uuid REFERENCES public.professionals(id),
  specialty_id uuid REFERENCES public.specialties(id),
  data jsonb NOT NULL DEFAULT '{}',
  status text DEFAULT 'rascunho',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.patient_anamneses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clinical view anamneses" ON public.patient_anamneses FOR SELECT TO authenticated USING (clinic_id = user_clinic_id(auth.uid()) AND can_access_clinical_content(auth.uid()));
CREATE POLICY "Insert anamneses" ON public.patient_anamneses FOR INSERT TO authenticated WITH CHECK (clinic_id = user_clinic_id(auth.uid()) AND can_access_clinical_content(auth.uid()));
CREATE POLICY "Update anamneses" ON public.patient_anamneses FOR UPDATE TO authenticated USING (clinic_id = user_clinic_id(auth.uid()) AND can_access_clinical_content(auth.uid()));
CREATE POLICY "Admins manage anamneses" ON public.patient_anamneses FOR ALL TO authenticated USING (is_clinic_admin(auth.uid(), clinic_id)) WITH CHECK (is_clinic_admin(auth.uid(), clinic_id));

-- patient_evolucoes
CREATE TABLE IF NOT EXISTS public.patient_evolucoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  professional_id uuid REFERENCES public.professionals(id),
  specialty_id uuid REFERENCES public.specialties(id),
  appointment_id uuid REFERENCES public.appointments(id),
  data jsonb NOT NULL DEFAULT '{}',
  status text DEFAULT 'rascunho',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.patient_evolucoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clinical view evolucoes" ON public.patient_evolucoes FOR SELECT TO authenticated USING (clinic_id = user_clinic_id(auth.uid()) AND can_access_clinical_content(auth.uid()));
CREATE POLICY "Insert evolucoes" ON public.patient_evolucoes FOR INSERT TO authenticated WITH CHECK (clinic_id = user_clinic_id(auth.uid()) AND can_access_clinical_content(auth.uid()));
CREATE POLICY "Update evolucoes" ON public.patient_evolucoes FOR UPDATE TO authenticated USING (clinic_id = user_clinic_id(auth.uid()) AND can_access_clinical_content(auth.uid()));
CREATE POLICY "Admins manage evolucoes" ON public.patient_evolucoes FOR ALL TO authenticated USING (is_clinic_admin(auth.uid(), clinic_id)) WITH CHECK (is_clinic_admin(auth.uid(), clinic_id));

-- patient_diagnosticos
CREATE TABLE IF NOT EXISTS public.patient_diagnosticos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  professional_id uuid REFERENCES public.professionals(id),
  codigo_cid text,
  descricao text NOT NULL,
  status text DEFAULT 'ativo',
  data jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.patient_diagnosticos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clinical view diagnosticos" ON public.patient_diagnosticos FOR SELECT TO authenticated USING (clinic_id = user_clinic_id(auth.uid()) AND can_access_clinical_content(auth.uid()));
CREATE POLICY "Insert diagnosticos" ON public.patient_diagnosticos FOR INSERT TO authenticated WITH CHECK (clinic_id = user_clinic_id(auth.uid()) AND can_access_clinical_content(auth.uid()));
CREATE POLICY "Update diagnosticos" ON public.patient_diagnosticos FOR UPDATE TO authenticated USING (clinic_id = user_clinic_id(auth.uid()) AND can_access_clinical_content(auth.uid()));
CREATE POLICY "Admins manage diagnosticos" ON public.patient_diagnosticos FOR ALL TO authenticated USING (is_clinic_admin(auth.uid(), clinic_id)) WITH CHECK (is_clinic_admin(auth.uid(), clinic_id));

-- patient_condutas
CREATE TABLE IF NOT EXISTS public.patient_condutas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  professional_id uuid REFERENCES public.professionals(id),
  descricao text NOT NULL,
  tipo text DEFAULT 'geral',
  data jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.patient_condutas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clinical view condutas" ON public.patient_condutas FOR SELECT TO authenticated USING (clinic_id = user_clinic_id(auth.uid()) AND can_access_clinical_content(auth.uid()));
CREATE POLICY "Insert condutas" ON public.patient_condutas FOR INSERT TO authenticated WITH CHECK (clinic_id = user_clinic_id(auth.uid()) AND can_access_clinical_content(auth.uid()));
CREATE POLICY "Update condutas" ON public.patient_condutas FOR UPDATE TO authenticated USING (clinic_id = user_clinic_id(auth.uid()) AND can_access_clinical_content(auth.uid()));
CREATE POLICY "Admins manage condutas" ON public.patient_condutas FOR ALL TO authenticated USING (is_clinic_admin(auth.uid(), clinic_id)) WITH CHECK (is_clinic_admin(auth.uid(), clinic_id));
