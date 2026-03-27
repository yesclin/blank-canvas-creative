
-- =============================================
-- CORE PHANTOM TABLES - BATCH 2: Medical Record Config & Permissions
-- =============================================

-- medical_record_visual_settings
CREATE TABLE IF NOT EXISTS public.medical_record_visual_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE UNIQUE,
  primary_color text DEFAULT '#6366f1',
  secondary_color text DEFAULT '#8b5cf6',
  accent_color text DEFAULT '#f59e0b',
  logo_url text,
  logo_position text DEFAULT 'left',
  layout text DEFAULT 'standard',
  font_size text DEFAULT 'medium',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.medical_record_visual_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage visual settings" ON public.medical_record_visual_settings FOR ALL TO authenticated USING (is_clinic_admin(auth.uid(), clinic_id)) WITH CHECK (is_clinic_admin(auth.uid(), clinic_id));
CREATE POLICY "Users view visual settings" ON public.medical_record_visual_settings FOR SELECT TO authenticated USING (clinic_id = user_clinic_id(auth.uid()));

-- medical_record_security_config
CREATE TABLE IF NOT EXISTS public.medical_record_security_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE UNIQUE,
  lock_after_signature boolean NOT NULL DEFAULT true,
  signature_lock_hours integer NOT NULL DEFAULT 24,
  require_consent_before_access boolean NOT NULL DEFAULT true,
  audit_enabled boolean NOT NULL DEFAULT true,
  audit_retention_days integer NOT NULL DEFAULT 365,
  allow_evolution_edit_minutes integer NOT NULL DEFAULT 60,
  require_justification_for_edit boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.medical_record_security_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage security config" ON public.medical_record_security_config FOR ALL TO authenticated USING (is_clinic_admin(auth.uid(), clinic_id)) WITH CHECK (is_clinic_admin(auth.uid(), clinic_id));
CREATE POLICY "Users view security config" ON public.medical_record_security_config FOR SELECT TO authenticated USING (clinic_id = user_clinic_id(auth.uid()));

-- medical_record_tab_permissions
CREATE TABLE IF NOT EXISTS public.medical_record_tab_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  role text NOT NULL,
  tab_key text NOT NULL,
  can_view boolean NOT NULL DEFAULT true,
  can_edit boolean NOT NULL DEFAULT false,
  can_export boolean NOT NULL DEFAULT false,
  can_sign boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(clinic_id, role, tab_key)
);
ALTER TABLE public.medical_record_tab_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage tab perms" ON public.medical_record_tab_permissions FOR ALL TO authenticated USING (is_clinic_admin(auth.uid(), clinic_id)) WITH CHECK (is_clinic_admin(auth.uid(), clinic_id));
CREATE POLICY "Users view tab perms" ON public.medical_record_tab_permissions FOR SELECT TO authenticated USING (clinic_id = user_clinic_id(auth.uid()));

-- medical_record_action_permissions
CREATE TABLE IF NOT EXISTS public.medical_record_action_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  role text NOT NULL,
  action_key text NOT NULL,
  allowed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(clinic_id, role, action_key)
);
ALTER TABLE public.medical_record_action_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage action perms" ON public.medical_record_action_permissions FOR ALL TO authenticated USING (is_clinic_admin(auth.uid(), clinic_id)) WITH CHECK (is_clinic_admin(auth.uid(), clinic_id));
CREATE POLICY "Users view action perms" ON public.medical_record_action_permissions FOR SELECT TO authenticated USING (clinic_id = user_clinic_id(auth.uid()));

-- medical_record_templates
CREATE TABLE IF NOT EXISTS public.medical_record_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  specialty_id uuid REFERENCES public.specialties(id),
  name text NOT NULL,
  is_default boolean NOT NULL DEFAULT false,
  config jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.medical_record_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage mr templates" ON public.medical_record_templates FOR ALL TO authenticated USING (is_clinic_admin(auth.uid(), clinic_id)) WITH CHECK (is_clinic_admin(auth.uid(), clinic_id));
CREATE POLICY "Users view mr templates" ON public.medical_record_templates FOR SELECT TO authenticated USING (clinic_id = user_clinic_id(auth.uid()));

-- medical_record_fields
CREATE TABLE IF NOT EXISTS public.medical_record_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  template_id uuid REFERENCES public.medical_record_templates(id) ON DELETE CASCADE,
  tab_key text NOT NULL,
  field_key text NOT NULL,
  label text NOT NULL,
  field_type text NOT NULL DEFAULT 'text',
  field_order integer NOT NULL DEFAULT 0,
  is_required boolean NOT NULL DEFAULT false,
  options jsonb,
  config jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.medical_record_fields ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage mr fields" ON public.medical_record_fields FOR ALL TO authenticated USING (is_clinic_admin(auth.uid(), clinic_id)) WITH CHECK (is_clinic_admin(auth.uid(), clinic_id));
CREATE POLICY "Users view mr fields" ON public.medical_record_fields FOR SELECT TO authenticated USING (clinic_id = user_clinic_id(auth.uid()));
