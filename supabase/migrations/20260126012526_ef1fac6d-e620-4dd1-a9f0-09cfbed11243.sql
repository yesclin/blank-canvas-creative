-- Create the updated_at function if it doesn't exist
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. MEDICAL RECORD ATTACHMENT CONFIG
CREATE TABLE IF NOT EXISTS public.medical_record_attachment_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE UNIQUE,
  allowed_file_types TEXT[] NOT NULL DEFAULT ARRAY['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'],
  max_file_size_mb INTEGER NOT NULL DEFAULT 10,
  auto_organize_by_date BOOLEAN NOT NULL DEFAULT true,
  auto_organize_by_type BOOLEAN NOT NULL DEFAULT true,
  categories JSONB NOT NULL DEFAULT '["exames", "imagens", "documentos", "laudos", "outros"]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6. MEDICAL RECORD PRINT CONFIG
CREATE TABLE IF NOT EXISTS public.medical_record_print_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE UNIQUE,
  include_header BOOLEAN NOT NULL DEFAULT true,
  include_footer BOOLEAN NOT NULL DEFAULT true,
  include_logo BOOLEAN NOT NULL DEFAULT true,
  include_patient_data BOOLEAN NOT NULL DEFAULT true,
  include_professional_data BOOLEAN NOT NULL DEFAULT true,
  sections_to_print JSONB NOT NULL DEFAULT '["resumo", "anamnese", "evolucao", "diagnostico", "prescricoes"]'::jsonb,
  paper_size TEXT NOT NULL DEFAULT 'A4' CHECK (paper_size IN ('A4', 'Letter', 'Legal')),
  orientation TEXT NOT NULL DEFAULT 'portrait' CHECK (orientation IN ('portrait', 'landscape')),
  margin_top_mm INTEGER NOT NULL DEFAULT 20,
  margin_bottom_mm INTEGER NOT NULL DEFAULT 20,
  margin_left_mm INTEGER NOT NULL DEFAULT 15,
  margin_right_mm INTEGER NOT NULL DEFAULT 15,
  header_text TEXT,
  footer_text TEXT,
  use_clinic_colors BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 7. MEDICAL RECORD SECURITY CONFIG
CREATE TABLE IF NOT EXISTS public.medical_record_security_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE UNIQUE,
  lock_after_signature BOOLEAN NOT NULL DEFAULT true,
  signature_lock_hours INTEGER NOT NULL DEFAULT 24,
  require_consent_before_access BOOLEAN NOT NULL DEFAULT true,
  audit_enabled BOOLEAN NOT NULL DEFAULT true,
  audit_retention_days INTEGER NOT NULL DEFAULT 365,
  allow_evolution_edit_minutes INTEGER NOT NULL DEFAULT 60,
  require_justification_for_edit BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 8. MEDICAL RECORD AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.medical_record_audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
  user_id UUID,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  user_agent TEXT,
  justification TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. MEDICAL RECORD VISUAL SETTINGS
CREATE TABLE IF NOT EXISTS public.medical_record_visual_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE UNIQUE,
  primary_color TEXT NOT NULL DEFAULT '#6366f1',
  secondary_color TEXT NOT NULL DEFAULT '#8b5cf6',
  accent_color TEXT NOT NULL DEFAULT '#f59e0b',
  logo_url TEXT,
  logo_position TEXT NOT NULL DEFAULT 'left' CHECK (logo_position IN ('left', 'center', 'right')),
  layout TEXT NOT NULL DEFAULT 'standard' CHECK (layout IN ('compact', 'standard', 'expanded')),
  font_size TEXT NOT NULL DEFAULT 'medium' CHECK (font_size IN ('small', 'medium', 'large')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.medical_record_attachment_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_record_print_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_record_security_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_record_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_record_visual_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view attachment config for their clinic" ON public.medical_record_attachment_config;
DROP POLICY IF EXISTS "Users can upsert attachment config for their clinic" ON public.medical_record_attachment_config;
CREATE POLICY "Users can view attachment config for their clinic" ON public.medical_record_attachment_config
  FOR SELECT USING (clinic_id IN (SELECT clinic_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Users can manage attachment config for their clinic" ON public.medical_record_attachment_config
  FOR ALL USING (clinic_id IN (SELECT clinic_id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can view print config for their clinic" ON public.medical_record_print_config;
DROP POLICY IF EXISTS "Users can upsert print config for their clinic" ON public.medical_record_print_config;
CREATE POLICY "Users can view print config for their clinic" ON public.medical_record_print_config
  FOR SELECT USING (clinic_id IN (SELECT clinic_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Users can manage print config for their clinic" ON public.medical_record_print_config
  FOR ALL USING (clinic_id IN (SELECT clinic_id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can view security config for their clinic" ON public.medical_record_security_config;
DROP POLICY IF EXISTS "Users can upsert security config for their clinic" ON public.medical_record_security_config;
CREATE POLICY "Users can view security config for their clinic" ON public.medical_record_security_config
  FOR SELECT USING (clinic_id IN (SELECT clinic_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Users can manage security config for their clinic" ON public.medical_record_security_config
  FOR ALL USING (clinic_id IN (SELECT clinic_id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can view audit logs for their clinic" ON public.medical_record_audit_logs;
DROP POLICY IF EXISTS "Users can insert audit logs for their clinic" ON public.medical_record_audit_logs;
CREATE POLICY "Users can view audit logs for their clinic" ON public.medical_record_audit_logs
  FOR SELECT USING (clinic_id IN (SELECT clinic_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Users can insert audit logs for their clinic" ON public.medical_record_audit_logs
  FOR INSERT WITH CHECK (clinic_id IN (SELECT clinic_id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can view visual settings for their clinic" ON public.medical_record_visual_settings;
DROP POLICY IF EXISTS "Users can upsert visual settings for their clinic" ON public.medical_record_visual_settings;
CREATE POLICY "Users can view visual settings for their clinic" ON public.medical_record_visual_settings
  FOR SELECT USING (clinic_id IN (SELECT clinic_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Users can manage visual settings for their clinic" ON public.medical_record_visual_settings
  FOR ALL USING (clinic_id IN (SELECT clinic_id FROM public.profiles WHERE id = auth.uid()));

-- Triggers for updated_at
DROP TRIGGER IF EXISTS set_medical_record_attachment_config_updated_at ON public.medical_record_attachment_config;
CREATE TRIGGER set_medical_record_attachment_config_updated_at
  BEFORE UPDATE ON public.medical_record_attachment_config
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_medical_record_print_config_updated_at ON public.medical_record_print_config;
CREATE TRIGGER set_medical_record_print_config_updated_at
  BEFORE UPDATE ON public.medical_record_print_config
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_medical_record_security_config_updated_at ON public.medical_record_security_config;
CREATE TRIGGER set_medical_record_security_config_updated_at
  BEFORE UPDATE ON public.medical_record_security_config
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_medical_record_visual_settings_updated_at ON public.medical_record_visual_settings;
CREATE TRIGGER set_medical_record_visual_settings_updated_at
  BEFORE UPDATE ON public.medical_record_visual_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_medical_record_audit_logs_clinic ON public.medical_record_audit_logs(clinic_id);
CREATE INDEX IF NOT EXISTS idx_medical_record_audit_logs_patient ON public.medical_record_audit_logs(patient_id);
CREATE INDEX IF NOT EXISTS idx_medical_record_audit_logs_created ON public.medical_record_audit_logs(created_at);