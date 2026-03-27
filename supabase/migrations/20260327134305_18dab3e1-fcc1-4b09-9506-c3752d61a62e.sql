
-- =============================================
-- CORE PHANTOM TABLES - BATCH 3: User Audit, Stock, Procedures, Custom Fields
-- =============================================

-- user_audit_logs: audit trail for user management actions
CREATE TABLE IF NOT EXISTS public.user_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  action text NOT NULL,
  target_user_id uuid,
  target_email text,
  performed_by uuid NOT NULL,
  details jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view user audit logs" ON public.user_audit_logs FOR SELECT TO authenticated USING (is_clinic_admin(auth.uid(), clinic_id));
CREATE POLICY "Users insert user audit logs" ON public.user_audit_logs FOR INSERT TO authenticated WITH CHECK (clinic_id = user_clinic_id(auth.uid()));

-- stock_alerts: stock level alerts
CREATE TABLE IF NOT EXISTS public.stock_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  alert_type text NOT NULL DEFAULT 'low_stock',
  threshold numeric,
  is_active boolean NOT NULL DEFAULT true,
  last_triggered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.stock_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage stock alerts" ON public.stock_alerts FOR ALL TO authenticated USING (is_clinic_admin(auth.uid(), clinic_id)) WITH CHECK (is_clinic_admin(auth.uid(), clinic_id));
CREATE POLICY "Users view stock alerts" ON public.stock_alerts FOR SELECT TO authenticated USING (clinic_id = user_clinic_id(auth.uid()));

-- stock_prediction_settings
CREATE TABLE IF NOT EXISTS public.stock_prediction_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE UNIQUE,
  prediction_enabled boolean NOT NULL DEFAULT true,
  prediction_days integer NOT NULL DEFAULT 30,
  safety_margin_percent numeric NOT NULL DEFAULT 20,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.stock_prediction_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage prediction settings" ON public.stock_prediction_settings FOR ALL TO authenticated USING (is_clinic_admin(auth.uid(), clinic_id)) WITH CHECK (is_clinic_admin(auth.uid(), clinic_id));
CREATE POLICY "Users view prediction settings" ON public.stock_prediction_settings FOR SELECT TO authenticated USING (clinic_id = user_clinic_id(auth.uid()));

-- procedure_materials: materials linked to procedures
CREATE TABLE IF NOT EXISTS public.procedure_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  procedure_id uuid NOT NULL REFERENCES public.procedures(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity numeric NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(procedure_id, product_id)
);
ALTER TABLE public.procedure_materials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View procedure materials" ON public.procedure_materials FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM procedures p WHERE p.id = procedure_id AND p.clinic_id = user_clinic_id(auth.uid())));
CREATE POLICY "Admins manage procedure materials" ON public.procedure_materials FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM procedures p WHERE p.id = procedure_id AND is_clinic_admin(auth.uid(), p.clinic_id))) WITH CHECK (EXISTS (SELECT 1 FROM procedures p WHERE p.id = procedure_id AND is_clinic_admin(auth.uid(), p.clinic_id)));

-- procedure_kits: kits of materials for procedures
CREATE TABLE IF NOT EXISTS public.procedure_kits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  procedure_id uuid NOT NULL REFERENCES public.procedures(id) ON DELETE CASCADE,
  product_kit_id uuid NOT NULL REFERENCES public.product_kits(id) ON DELETE CASCADE,
  quantity numeric NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(procedure_id, product_kit_id)
);
ALTER TABLE public.procedure_kits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View procedure kits" ON public.procedure_kits FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM procedures p WHERE p.id = procedure_id AND p.clinic_id = user_clinic_id(auth.uid())));
CREATE POLICY "Admins manage procedure kits" ON public.procedure_kits FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM procedures p WHERE p.id = procedure_id AND is_clinic_admin(auth.uid(), p.clinic_id))) WITH CHECK (EXISTS (SELECT 1 FROM procedures p WHERE p.id = procedure_id AND is_clinic_admin(auth.uid(), p.clinic_id)));

-- material_kit_items: items within a material kit (alternative reference)
CREATE TABLE IF NOT EXISTS public.material_kit_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kit_id uuid NOT NULL REFERENCES public.product_kits(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity numeric NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(kit_id, product_id)
);
ALTER TABLE public.material_kit_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View kit items" ON public.material_kit_items FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM product_kits pk WHERE pk.id = kit_id AND pk.clinic_id = user_clinic_id(auth.uid())));
CREATE POLICY "Admins manage kit items" ON public.material_kit_items FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM product_kits pk WHERE pk.id = kit_id AND is_clinic_admin(auth.uid(), pk.clinic_id))) WITH CHECK (EXISTS (SELECT 1 FROM product_kits pk WHERE pk.id = kit_id AND is_clinic_admin(auth.uid(), pk.clinic_id)));

-- procedure_product_kits
CREATE TABLE IF NOT EXISTS public.procedure_product_kits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  procedure_id uuid NOT NULL REFERENCES public.procedures(id) ON DELETE CASCADE,
  product_kit_id uuid NOT NULL REFERENCES public.product_kits(id) ON DELETE CASCADE,
  quantity numeric NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(procedure_id, product_kit_id)
);
ALTER TABLE public.procedure_product_kits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View proc product kits" ON public.procedure_product_kits FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM procedures p WHERE p.id = procedure_id AND p.clinic_id = user_clinic_id(auth.uid())));
CREATE POLICY "Admins manage proc product kits" ON public.procedure_product_kits FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM procedures p WHERE p.id = procedure_id AND is_clinic_admin(auth.uid(), p.clinic_id))) WITH CHECK (EXISTS (SELECT 1 FROM procedures p WHERE p.id = procedure_id AND is_clinic_admin(auth.uid(), p.clinic_id)));

-- custom_prontuario_fields
CREATE TABLE IF NOT EXISTS public.custom_prontuario_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  specialty_id uuid REFERENCES public.specialties(id),
  tab_key text NOT NULL,
  field_key text NOT NULL,
  label text NOT NULL,
  field_type text NOT NULL DEFAULT 'text',
  field_order integer NOT NULL DEFAULT 0,
  is_required boolean NOT NULL DEFAULT false,
  options jsonb,
  config jsonb DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.custom_prontuario_fields ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage custom fields" ON public.custom_prontuario_fields FOR ALL TO authenticated USING (is_clinic_admin(auth.uid(), clinic_id)) WITH CHECK (is_clinic_admin(auth.uid(), clinic_id));
CREATE POLICY "Users view custom fields" ON public.custom_prontuario_fields FOR SELECT TO authenticated USING (clinic_id = user_clinic_id(auth.uid()));
