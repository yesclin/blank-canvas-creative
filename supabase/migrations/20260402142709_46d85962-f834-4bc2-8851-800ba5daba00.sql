
-- Tables
CREATE TABLE IF NOT EXISTS public.crm_pipeline_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  name TEXT NOT NULL, sort_order INT NOT NULL DEFAULT 0, color TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.crm_loss_reasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  name TEXT NOT NULL, is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.crm_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  name TEXT NOT NULL, email TEXT, phone TEXT, source TEXT,
  status TEXT NOT NULL DEFAULT 'novo', notes TEXT,
  patient_id UUID REFERENCES public.patients(id),
  assigned_to UUID REFERENCES auth.users(id),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.crm_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.crm_leads(id),
  patient_id UUID REFERENCES public.patients(id),
  pipeline_stage_id UUID REFERENCES public.crm_pipeline_stages(id),
  title TEXT NOT NULL, estimated_value NUMERIC(12,2),
  status TEXT NOT NULL DEFAULT 'aberta',
  professional_id UUID REFERENCES public.professionals(id),
  procedure_id UUID REFERENCES public.procedures(id),
  specialty_id UUID REFERENCES public.specialties(id),
  loss_reason_id UUID REFERENCES public.crm_loss_reasons(id),
  expected_close_date DATE, closed_at TIMESTAMPTZ, notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.crm_opportunity_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  opportunity_id UUID NOT NULL REFERENCES public.crm_opportunities(id) ON DELETE CASCADE,
  field_changed TEXT NOT NULL, old_value TEXT, new_value TEXT,
  changed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.crm_followups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  opportunity_id UUID REFERENCES public.crm_opportunities(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.crm_leads(id),
  followup_type TEXT NOT NULL DEFAULT 'ligacao',
  scheduled_at TIMESTAMPTZ NOT NULL, completed_at TIMESTAMPTZ,
  notes TEXT, status TEXT NOT NULL DEFAULT 'pendente',
  assigned_to UUID REFERENCES auth.users(id),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.crm_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  opportunity_id UUID REFERENCES public.crm_opportunities(id),
  patient_id UUID REFERENCES public.patients(id),
  professional_id UUID REFERENCES public.professionals(id),
  quote_number TEXT,
  total_value NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount_value NUMERIC(12,2) NOT NULL DEFAULT 0,
  final_value NUMERIC(12,2) NOT NULL DEFAULT 0,
  valid_until DATE, status TEXT NOT NULL DEFAULT 'rascunho', notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.crm_quote_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  quote_id UUID NOT NULL REFERENCES public.crm_quotes(id) ON DELETE CASCADE,
  procedure_id UUID REFERENCES public.procedures(id),
  description TEXT NOT NULL, quantity INT NOT NULL DEFAULT 1,
  unit_value NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
  total_value NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.crm_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  goal_type TEXT NOT NULL DEFAULT 'revenue', title TEXT NOT NULL,
  target_value NUMERIC(12,2) NOT NULL, current_value NUMERIC(12,2) NOT NULL DEFAULT 0,
  period_start DATE NOT NULL, period_end DATE NOT NULL,
  professional_id UUID REFERENCES public.professionals(id),
  status TEXT NOT NULL DEFAULT 'ativa',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.crm_pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_loss_reasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_opportunity_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_followups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_goals ENABLE ROW LEVEL SECURITY;

-- RLS helper
CREATE OR REPLACE FUNCTION public.get_user_clinic_id_for_rls()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT clinic_id FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1
$$;

-- RLS policies
CREATE POLICY "clinic_isolation" ON public.crm_pipeline_stages FOR ALL TO authenticated
  USING (clinic_id = public.get_user_clinic_id_for_rls()) WITH CHECK (clinic_id = public.get_user_clinic_id_for_rls());
CREATE POLICY "clinic_isolation" ON public.crm_loss_reasons FOR ALL TO authenticated
  USING (clinic_id = public.get_user_clinic_id_for_rls()) WITH CHECK (clinic_id = public.get_user_clinic_id_for_rls());
CREATE POLICY "clinic_isolation" ON public.crm_leads FOR ALL TO authenticated
  USING (clinic_id = public.get_user_clinic_id_for_rls()) WITH CHECK (clinic_id = public.get_user_clinic_id_for_rls());
CREATE POLICY "clinic_isolation" ON public.crm_opportunities FOR ALL TO authenticated
  USING (clinic_id = public.get_user_clinic_id_for_rls()) WITH CHECK (clinic_id = public.get_user_clinic_id_for_rls());
CREATE POLICY "clinic_isolation" ON public.crm_opportunity_history FOR ALL TO authenticated
  USING (clinic_id = public.get_user_clinic_id_for_rls()) WITH CHECK (clinic_id = public.get_user_clinic_id_for_rls());
CREATE POLICY "clinic_isolation" ON public.crm_followups FOR ALL TO authenticated
  USING (clinic_id = public.get_user_clinic_id_for_rls()) WITH CHECK (clinic_id = public.get_user_clinic_id_for_rls());
CREATE POLICY "clinic_isolation" ON public.crm_quotes FOR ALL TO authenticated
  USING (clinic_id = public.get_user_clinic_id_for_rls()) WITH CHECK (clinic_id = public.get_user_clinic_id_for_rls());
CREATE POLICY "clinic_isolation" ON public.crm_quote_items FOR ALL TO authenticated
  USING (clinic_id = public.get_user_clinic_id_for_rls()) WITH CHECK (clinic_id = public.get_user_clinic_id_for_rls());
CREATE POLICY "clinic_isolation" ON public.crm_goals FOR ALL TO authenticated
  USING (clinic_id = public.get_user_clinic_id_for_rls()) WITH CHECK (clinic_id = public.get_user_clinic_id_for_rls());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_crm_leads_clinic ON public.crm_leads(clinic_id);
CREATE INDEX IF NOT EXISTS idx_crm_leads_status ON public.crm_leads(clinic_id, status);
CREATE INDEX IF NOT EXISTS idx_crm_opportunities_clinic ON public.crm_opportunities(clinic_id);
CREATE INDEX IF NOT EXISTS idx_crm_opportunities_stage ON public.crm_opportunities(clinic_id, pipeline_stage_id);
CREATE INDEX IF NOT EXISTS idx_crm_opportunities_status ON public.crm_opportunities(clinic_id, status);
CREATE INDEX IF NOT EXISTS idx_crm_followups_clinic ON public.crm_followups(clinic_id);
CREATE INDEX IF NOT EXISTS idx_crm_followups_scheduled ON public.crm_followups(clinic_id, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_crm_quotes_clinic ON public.crm_quotes(clinic_id);
CREATE INDEX IF NOT EXISTS idx_crm_goals_clinic ON public.crm_goals(clinic_id);
CREATE INDEX IF NOT EXISTS idx_crm_opportunity_history_opp ON public.crm_opportunity_history(opportunity_id);

-- Permissions
INSERT INTO public.permission_templates (role, module, actions, restrictions) VALUES
  ('owner', 'comercial', '{view,create,edit,delete,export}', '{}'),
  ('admin', 'comercial', '{view,create,edit,delete,export}', '{}'),
  ('recepcionista', 'comercial', '{view,create,edit}', '{}'),
  ('profissional', 'comercial', '{}', '{}')
ON CONFLICT DO NOTHING;

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.trigger_set_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

-- Triggers
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.crm_pipeline_stages FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.crm_loss_reasons FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.crm_leads FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.crm_opportunities FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.crm_followups FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.crm_quotes FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.crm_quote_items FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.crm_goals FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();
