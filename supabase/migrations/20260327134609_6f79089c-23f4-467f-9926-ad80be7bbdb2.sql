
-- =============================================
-- BATCH 6: Remaining phantom tables
-- =============================================

-- patient_prescricoes
CREATE TABLE IF NOT EXISTS public.patient_prescricoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  professional_id uuid REFERENCES public.professionals(id),
  tipo text DEFAULT 'medicamentosa',
  data jsonb NOT NULL DEFAULT '{}',
  status text DEFAULT 'rascunho',
  signed_at timestamptz,
  signed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.patient_prescricoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clinical view prescricoes" ON public.patient_prescricoes FOR SELECT TO authenticated USING (clinic_id = user_clinic_id(auth.uid()) AND can_access_clinical_content(auth.uid()));
CREATE POLICY "Insert prescricoes" ON public.patient_prescricoes FOR INSERT TO authenticated WITH CHECK (clinic_id = user_clinic_id(auth.uid()) AND can_access_clinical_content(auth.uid()));
CREATE POLICY "Update prescricoes" ON public.patient_prescricoes FOR UPDATE TO authenticated USING (clinic_id = user_clinic_id(auth.uid()) AND can_access_clinical_content(auth.uid()));
CREATE POLICY "Admins manage prescricoes" ON public.patient_prescricoes FOR ALL TO authenticated USING (is_clinic_admin(auth.uid(), clinic_id)) WITH CHECK (is_clinic_admin(auth.uid(), clinic_id));

-- patient_prescricao_itens
CREATE TABLE IF NOT EXISTS public.patient_prescricao_itens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prescricao_id uuid NOT NULL REFERENCES public.patient_prescricoes(id) ON DELETE CASCADE,
  medicamento text NOT NULL,
  dosagem text,
  via text,
  frequencia text,
  duracao text,
  observacoes text,
  ordem integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.patient_prescricao_itens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View prescricao itens" ON public.patient_prescricao_itens FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM patient_prescricoes p WHERE p.id = prescricao_id AND p.clinic_id = user_clinic_id(auth.uid())));
CREATE POLICY "Insert prescricao itens" ON public.patient_prescricao_itens FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM patient_prescricoes p WHERE p.id = prescricao_id AND p.clinic_id = user_clinic_id(auth.uid())));
CREATE POLICY "Update prescricao itens" ON public.patient_prescricao_itens FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM patient_prescricoes p WHERE p.id = prescricao_id AND p.clinic_id = user_clinic_id(auth.uid())));
CREATE POLICY "Delete prescricao itens" ON public.patient_prescricao_itens FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM patient_prescricoes p WHERE p.id = prescricao_id AND p.clinic_id = user_clinic_id(auth.uid())));

-- patient_exames_fisicos
CREATE TABLE IF NOT EXISTS public.patient_exames_fisicos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  professional_id uuid REFERENCES public.professionals(id),
  data jsonb NOT NULL DEFAULT '{}',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.patient_exames_fisicos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clinical view exames" ON public.patient_exames_fisicos FOR SELECT TO authenticated USING (clinic_id = user_clinic_id(auth.uid()) AND can_access_clinical_content(auth.uid()));
CREATE POLICY "Insert exames" ON public.patient_exames_fisicos FOR INSERT TO authenticated WITH CHECK (clinic_id = user_clinic_id(auth.uid()) AND can_access_clinical_content(auth.uid()));
CREATE POLICY "Update exames" ON public.patient_exames_fisicos FOR UPDATE TO authenticated USING (clinic_id = user_clinic_id(auth.uid()) AND can_access_clinical_content(auth.uid()));
CREATE POLICY "Admins manage exames" ON public.patient_exames_fisicos FOR ALL TO authenticated USING (is_clinic_admin(auth.uid(), clinic_id)) WITH CHECK (is_clinic_admin(auth.uid(), clinic_id));

-- patient_documentos (specialty-level documents)
CREATE TABLE IF NOT EXISTS public.patient_documentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  professional_id uuid REFERENCES public.professionals(id),
  tipo text NOT NULL,
  titulo text NOT NULL,
  conteudo jsonb DEFAULT '{}',
  file_url text,
  status text DEFAULT 'rascunho',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.patient_documentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clinical view docs" ON public.patient_documentos FOR SELECT TO authenticated USING (clinic_id = user_clinic_id(auth.uid()) AND can_access_clinical_content(auth.uid()));
CREATE POLICY "Insert docs" ON public.patient_documentos FOR INSERT TO authenticated WITH CHECK (clinic_id = user_clinic_id(auth.uid()) AND can_access_clinical_content(auth.uid()));
CREATE POLICY "Update docs" ON public.patient_documentos FOR UPDATE TO authenticated USING (clinic_id = user_clinic_id(auth.uid()) AND can_access_clinical_content(auth.uid()));
CREATE POLICY "Admins manage docs" ON public.patient_documentos FOR ALL TO authenticated USING (is_clinic_admin(auth.uid(), clinic_id)) WITH CHECK (is_clinic_admin(auth.uid(), clinic_id));

-- patient_generated_documents
CREATE TABLE IF NOT EXISTS public.patient_generated_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  professional_id uuid REFERENCES public.professionals(id),
  document_type text NOT NULL,
  title text NOT NULL,
  content jsonb DEFAULT '{}',
  pdf_url text,
  validation_code text,
  status text DEFAULT 'rascunho',
  signed_at timestamptz,
  signed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.patient_generated_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clinical view gen docs" ON public.patient_generated_documents FOR SELECT TO authenticated USING (clinic_id = user_clinic_id(auth.uid()) AND can_access_clinical_content(auth.uid()));
CREATE POLICY "Insert gen docs" ON public.patient_generated_documents FOR INSERT TO authenticated WITH CHECK (clinic_id = user_clinic_id(auth.uid()) AND can_access_clinical_content(auth.uid()));
CREATE POLICY "Update gen docs" ON public.patient_generated_documents FOR UPDATE TO authenticated USING (clinic_id = user_clinic_id(auth.uid()) AND can_access_clinical_content(auth.uid()));
CREATE POLICY "Admins manage gen docs" ON public.patient_generated_documents FOR ALL TO authenticated USING (is_clinic_admin(auth.uid(), clinic_id)) WITH CHECK (is_clinic_admin(auth.uid(), clinic_id));

-- modelos_receita_profissional (professional prescription templates)
CREATE TABLE IF NOT EXISTS public.modelos_receita_profissional (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  professional_id uuid REFERENCES public.professionals(id),
  nome text NOT NULL,
  itens jsonb NOT NULL DEFAULT '[]',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.modelos_receita_profissional ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View own prescription models" ON public.modelos_receita_profissional FOR SELECT TO authenticated USING (clinic_id = user_clinic_id(auth.uid()));
CREATE POLICY "Insert prescription models" ON public.modelos_receita_profissional FOR INSERT TO authenticated WITH CHECK (clinic_id = user_clinic_id(auth.uid()));
CREATE POLICY "Update prescription models" ON public.modelos_receita_profissional FOR UPDATE TO authenticated USING (clinic_id = user_clinic_id(auth.uid()));
CREATE POLICY "Admins manage prescription models" ON public.modelos_receita_profissional FOR ALL TO authenticated USING (is_clinic_admin(auth.uid(), clinic_id)) WITH CHECK (is_clinic_admin(auth.uid(), clinic_id));

-- documentos_clinicos (alternate document reference used by some components)
CREATE TABLE IF NOT EXISTS public.documentos_clinicos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  professional_id uuid REFERENCES public.professionals(id),
  tipo text NOT NULL,
  titulo text NOT NULL,
  conteudo jsonb DEFAULT '{}',
  status text DEFAULT 'rascunho',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.documentos_clinicos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clinical view documentos_clinicos" ON public.documentos_clinicos FOR SELECT TO authenticated USING (clinic_id = user_clinic_id(auth.uid()) AND can_access_clinical_content(auth.uid()));
CREATE POLICY "Insert documentos_clinicos" ON public.documentos_clinicos FOR INSERT TO authenticated WITH CHECK (clinic_id = user_clinic_id(auth.uid()) AND can_access_clinical_content(auth.uid()));
CREATE POLICY "Update documentos_clinicos" ON public.documentos_clinicos FOR UPDATE TO authenticated USING (clinic_id = user_clinic_id(auth.uid()) AND can_access_clinical_content(auth.uid()));
CREATE POLICY "Admins manage documentos_clinicos" ON public.documentos_clinicos FOR ALL TO authenticated USING (is_clinic_admin(auth.uid(), clinic_id)) WITH CHECK (is_clinic_admin(auth.uid(), clinic_id));

-- documentos_log (document access/action log)
CREATE TABLE IF NOT EXISTS public.documentos_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  document_id uuid,
  document_type text,
  action text NOT NULL,
  user_id uuid,
  details jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.documentos_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view doc log" ON public.documentos_log FOR SELECT TO authenticated USING (is_clinic_admin(auth.uid(), clinic_id));
CREATE POLICY "Insert doc log" ON public.documentos_log FOR INSERT TO authenticated WITH CHECK (clinic_id = user_clinic_id(auth.uid()));
