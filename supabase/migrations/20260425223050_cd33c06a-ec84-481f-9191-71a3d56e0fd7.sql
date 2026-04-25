-- =========================================================================
-- SUPER ADMIN MODULE — CORE MIGRATION
-- =========================================================================

-- ---------- ENUMS ----------
DO $$ BEGIN
  CREATE TYPE public.subscription_status AS ENUM ('trial','active','overdue','blocked','canceled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.subscription_cycle AS ENUM ('monthly','yearly');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.occurrence_severity AS ENUM ('info','warning','error','critical');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.occurrence_status AS ENUM ('novo','em_analise','corrigido','ignorado','recorrente');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.support_session_status AS ENUM ('active','ended','expired');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------- platform_admins ----------
CREATE TABLE IF NOT EXISTS public.platform_admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  full_name text,
  email text,
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;

-- Security definer: única forma segura de checar dentro de policies sem recursão
CREATE OR REPLACE FUNCTION public.is_platform_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.platform_admins
    WHERE user_id = _user_id AND is_active = true
  );
$$;

-- Conta total de admins (usado pela tela de seed)
CREATE OR REPLACE FUNCTION public.count_platform_admins()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::int FROM public.platform_admins WHERE is_active = true;
$$;

-- Promoção do PRIMEIRO super admin (one-shot): só funciona se a tabela está vazia
CREATE OR REPLACE FUNCTION public.claim_first_platform_admin(_full_name text DEFAULT NULL)
RETURNS public.platform_admins
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_email text;
  v_existing integer;
  v_row public.platform_admins;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'auth_required';
  END IF;

  SELECT count_platform_admins() INTO v_existing;
  IF v_existing > 0 THEN
    RAISE EXCEPTION 'super_admin_already_exists';
  END IF;

  SELECT email INTO v_email FROM auth.users WHERE id = v_uid;

  INSERT INTO public.platform_admins (user_id, full_name, email, is_active, created_by)
  VALUES (v_uid, COALESCE(_full_name, v_email), v_email, true, v_uid)
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

-- Policies platform_admins: somente super admins gerenciam; o próprio user pode ver seu registro
DROP POLICY IF EXISTS "platform_admins self read" ON public.platform_admins;
CREATE POLICY "platform_admins self read" ON public.platform_admins
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_platform_admin(auth.uid()));

DROP POLICY IF EXISTS "platform_admins manage" ON public.platform_admins;
CREATE POLICY "platform_admins manage" ON public.platform_admins
  FOR ALL TO authenticated
  USING (public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_platform_admin(auth.uid()));

-- ---------- subscription_plans ----------
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  price_monthly numeric(10,2) NOT NULL DEFAULT 0,
  price_yearly numeric(10,2) NOT NULL DEFAULT 0,
  -- limits (NULL = unlimited)
  max_professionals integer,
  max_patients integer,
  max_specialties integer,
  max_appointments_monthly integer,
  max_whatsapp_instances integer,
  -- feature flags
  feature_whatsapp boolean NOT NULL DEFAULT false,
  feature_teleconsulta boolean NOT NULL DEFAULT false,
  feature_crm boolean NOT NULL DEFAULT false,
  feature_marketing boolean NOT NULL DEFAULT false,
  feature_automations boolean NOT NULL DEFAULT false,
  feature_inventory boolean NOT NULL DEFAULT false,
  feature_insurances boolean NOT NULL DEFAULT false,
  feature_advanced_reports boolean NOT NULL DEFAULT false,
  feature_audit boolean NOT NULL DEFAULT false,
  feature_odontogram boolean NOT NULL DEFAULT false,
  feature_facial_map boolean NOT NULL DEFAULT false,
  feature_priority_support boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "plans super admin manage" ON public.subscription_plans;
CREATE POLICY "plans super admin manage" ON public.subscription_plans
  FOR ALL TO authenticated
  USING (public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_platform_admin(auth.uid()));

-- Clientes podem LER planos ativos (para mostrar comparativo / upgrade)
DROP POLICY IF EXISTS "plans public read active" ON public.subscription_plans;
CREATE POLICY "plans public read active" ON public.subscription_plans
  FOR SELECT TO authenticated
  USING (is_active = true);

-- ---------- clinic_subscriptions ----------
CREATE TABLE IF NOT EXISTS public.clinic_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL UNIQUE REFERENCES public.clinics(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES public.subscription_plans(id) ON DELETE RESTRICT,
  status public.subscription_status NOT NULL DEFAULT 'trial',
  cycle public.subscription_cycle NOT NULL DEFAULT 'monthly',
  trial_ends_at timestamptz,
  current_period_start timestamptz NOT NULL DEFAULT now(),
  current_period_end timestamptz,
  contracted_amount numeric(10,2),
  internal_notes text,
  blocked_reason text,
  blocked_at timestamptz,
  canceled_at timestamptz,
  last_payment_at timestamptz,
  next_billing_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_clinic_subscriptions_status ON public.clinic_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_clinic_subscriptions_plan ON public.clinic_subscriptions(plan_id);
ALTER TABLE public.clinic_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "subs super admin manage" ON public.clinic_subscriptions;
CREATE POLICY "subs super admin manage" ON public.clinic_subscriptions
  FOR ALL TO authenticated
  USING (public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_platform_admin(auth.uid()));

-- Owners/admins/profissionais/recepcionistas leem apenas a assinatura DA própria clínica
DROP POLICY IF EXISTS "subs clinic members read" ON public.clinic_subscriptions;
CREATE POLICY "subs clinic members read" ON public.clinic_subscriptions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.clinic_id = clinic_subscriptions.clinic_id
    )
  );

-- ---------- clinic_feature_overrides ----------
CREATE TABLE IF NOT EXISTS public.clinic_feature_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  feature_key text NOT NULL,
  enabled boolean NOT NULL,
  reason text,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  UNIQUE (clinic_id, feature_key)
);
ALTER TABLE public.clinic_feature_overrides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "overrides super admin manage" ON public.clinic_feature_overrides;
CREATE POLICY "overrides super admin manage" ON public.clinic_feature_overrides
  FOR ALL TO authenticated
  USING (public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_platform_admin(auth.uid()));

DROP POLICY IF EXISTS "overrides clinic members read" ON public.clinic_feature_overrides;
CREATE POLICY "overrides clinic members read" ON public.clinic_feature_overrides
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.clinic_id = clinic_feature_overrides.clinic_id
    )
  );

-- ---------- system_occurrences ----------
CREATE TABLE IF NOT EXISTS public.system_occurrences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid REFERENCES public.clinics(id) ON DELETE SET NULL,
  user_id uuid,
  route text,
  module text,
  message text NOT NULL,
  stack_trace text,
  user_agent text,
  os text,
  severity public.occurrence_severity NOT NULL DEFAULT 'error',
  status public.occurrence_status NOT NULL DEFAULT 'novo',
  assignee_id uuid,
  internal_notes text,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_occurrences_status ON public.system_occurrences(status);
CREATE INDEX IF NOT EXISTS idx_occurrences_severity ON public.system_occurrences(severity);
CREATE INDEX IF NOT EXISTS idx_occurrences_occurred_at ON public.system_occurrences(occurred_at DESC);
ALTER TABLE public.system_occurrences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "occurrences super admin manage" ON public.system_occurrences;
CREATE POLICY "occurrences super admin manage" ON public.system_occurrences
  FOR ALL TO authenticated
  USING (public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_platform_admin(auth.uid()));

-- Permite que QUALQUER usuário autenticado registre o próprio erro (telemetria)
DROP POLICY IF EXISTS "occurrences self insert" ON public.system_occurrences;
CREATE POLICY "occurrences self insert" ON public.system_occurrences
  FOR INSERT TO authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

-- ---------- platform_audit_logs ----------
CREATE TABLE IF NOT EXISTS public.platform_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid NOT NULL,
  actor_email text,
  action text NOT NULL,
  target_type text,
  target_id uuid,
  clinic_id uuid REFERENCES public.clinics(id) ON DELETE SET NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_platform_audit_created_at ON public.platform_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_platform_audit_actor ON public.platform_audit_logs(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_platform_audit_clinic ON public.platform_audit_logs(clinic_id);
ALTER TABLE public.platform_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit super admin read" ON public.platform_audit_logs;
CREATE POLICY "audit super admin read" ON public.platform_audit_logs
  FOR SELECT TO authenticated
  USING (public.is_platform_admin(auth.uid()));

-- Insert: super admins gravam para si próprios
DROP POLICY IF EXISTS "audit super admin insert" ON public.platform_audit_logs;
CREATE POLICY "audit super admin insert" ON public.platform_audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (public.is_platform_admin(auth.uid()) AND actor_user_id = auth.uid());

-- ---------- support_sessions ----------
CREATE TABLE IF NOT EXISTS public.support_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL,
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  reason text NOT NULL,
  status public.support_session_status NOT NULL DEFAULT 'active',
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  ip_address text,
  user_agent text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS idx_support_sessions_admin ON public.support_sessions(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_support_sessions_clinic ON public.support_sessions(clinic_id);
CREATE INDEX IF NOT EXISTS idx_support_sessions_status ON public.support_sessions(status);
ALTER TABLE public.support_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "support super admin manage" ON public.support_sessions;
CREATE POLICY "support super admin manage" ON public.support_sessions
  FOR ALL TO authenticated
  USING (public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_platform_admin(auth.uid()) AND admin_user_id = auth.uid());

-- ---------- timestamps triggers ----------
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_subscription_plans_upd BEFORE UPDATE ON public.subscription_plans
    FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_clinic_subscriptions_upd BEFORE UPDATE ON public.clinic_subscriptions
    FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_system_occurrences_upd BEFORE UPDATE ON public.system_occurrences
    FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_platform_admins_upd BEFORE UPDATE ON public.platform_admins
    FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------- SEED: 3 default plans ----------
INSERT INTO public.subscription_plans
  (name, slug, description, price_monthly, price_yearly,
   max_professionals, max_patients, max_specialties, max_appointments_monthly, max_whatsapp_instances,
   feature_whatsapp, feature_teleconsulta, feature_crm, feature_marketing, feature_automations,
   feature_inventory, feature_insurances, feature_advanced_reports, feature_audit,
   feature_odontogram, feature_facial_map, feature_priority_support, sort_order)
VALUES
  ('Starter', 'starter', 'Ideal para profissionais autônomos e clínicas iniciantes.',
   97.00, 970.00, 2, 500, 2, 200, 1,
   true, false, false, false, false, true, false, false, false, false, false, false, 1),
  ('Pro', 'pro', 'Para clínicas em crescimento com equipe e múltiplas especialidades.',
   297.00, 2970.00, 10, 5000, 6, 2000, 2,
   true, true, true, true, true, true, true, true, true, true, true, false, 2),
  ('Enterprise', 'enterprise', 'Sem limites e com suporte prioritário para grandes operações.',
   797.00, 7970.00, NULL, NULL, NULL, NULL, 5,
   true, true, true, true, true, true, true, true, true, true, true, true, 3)
ON CONFLICT (slug) DO NOTHING;

-- ---------- BACKFILL: trial subscription for existing clinics without one ----------
INSERT INTO public.clinic_subscriptions (clinic_id, plan_id, status, cycle, trial_ends_at, current_period_end)
SELECT c.id,
       (SELECT id FROM public.subscription_plans WHERE slug = 'pro' LIMIT 1),
       'trial', 'monthly',
       now() + interval '30 days',
       now() + interval '30 days'
FROM public.clinics c
LEFT JOIN public.clinic_subscriptions s ON s.clinic_id = c.id
WHERE s.id IS NULL;

-- ---------- Auto-trial trigger for NEW clinics ----------
CREATE OR REPLACE FUNCTION public.tg_clinic_auto_trial()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan uuid;
BEGIN
  SELECT id INTO v_plan FROM public.subscription_plans WHERE slug = 'pro' AND is_active = true LIMIT 1;
  IF v_plan IS NULL THEN
    SELECT id INTO v_plan FROM public.subscription_plans WHERE is_active = true ORDER BY sort_order LIMIT 1;
  END IF;
  IF v_plan IS NOT NULL THEN
    INSERT INTO public.clinic_subscriptions (clinic_id, plan_id, status, cycle, trial_ends_at, current_period_end)
    VALUES (NEW.id, v_plan, 'trial', 'monthly', now() + interval '30 days', now() + interval '30 days')
    ON CONFLICT (clinic_id) DO NOTHING;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_clinics_auto_trial ON public.clinics;
CREATE TRIGGER trg_clinics_auto_trial
  AFTER INSERT ON public.clinics
  FOR EACH ROW EXECUTE FUNCTION public.tg_clinic_auto_trial();

-- ---------- View: feature flags efetivas por clínica ----------
CREATE OR REPLACE VIEW public.clinic_effective_features
WITH (security_invoker=on) AS
SELECT
  c.id AS clinic_id,
  s.id AS subscription_id,
  s.plan_id,
  s.status AS subscription_status,
  p.slug AS plan_slug,
  p.name AS plan_name,
  COALESCE((SELECT enabled FROM public.clinic_feature_overrides o WHERE o.clinic_id = c.id AND o.feature_key='whatsapp' AND (o.expires_at IS NULL OR o.expires_at > now())), p.feature_whatsapp) AS feature_whatsapp,
  COALESCE((SELECT enabled FROM public.clinic_feature_overrides o WHERE o.clinic_id = c.id AND o.feature_key='teleconsulta' AND (o.expires_at IS NULL OR o.expires_at > now())), p.feature_teleconsulta) AS feature_teleconsulta,
  COALESCE((SELECT enabled FROM public.clinic_feature_overrides o WHERE o.clinic_id = c.id AND o.feature_key='crm' AND (o.expires_at IS NULL OR o.expires_at > now())), p.feature_crm) AS feature_crm,
  COALESCE((SELECT enabled FROM public.clinic_feature_overrides o WHERE o.clinic_id = c.id AND o.feature_key='marketing' AND (o.expires_at IS NULL OR o.expires_at > now())), p.feature_marketing) AS feature_marketing,
  COALESCE((SELECT enabled FROM public.clinic_feature_overrides o WHERE o.clinic_id = c.id AND o.feature_key='automations' AND (o.expires_at IS NULL OR o.expires_at > now())), p.feature_automations) AS feature_automations,
  COALESCE((SELECT enabled FROM public.clinic_feature_overrides o WHERE o.clinic_id = c.id AND o.feature_key='inventory' AND (o.expires_at IS NULL OR o.expires_at > now())), p.feature_inventory) AS feature_inventory,
  COALESCE((SELECT enabled FROM public.clinic_feature_overrides o WHERE o.clinic_id = c.id AND o.feature_key='insurances' AND (o.expires_at IS NULL OR o.expires_at > now())), p.feature_insurances) AS feature_insurances,
  COALESCE((SELECT enabled FROM public.clinic_feature_overrides o WHERE o.clinic_id = c.id AND o.feature_key='advanced_reports' AND (o.expires_at IS NULL OR o.expires_at > now())), p.feature_advanced_reports) AS feature_advanced_reports,
  COALESCE((SELECT enabled FROM public.clinic_feature_overrides o WHERE o.clinic_id = c.id AND o.feature_key='audit' AND (o.expires_at IS NULL OR o.expires_at > now())), p.feature_audit) AS feature_audit,
  COALESCE((SELECT enabled FROM public.clinic_feature_overrides o WHERE o.clinic_id = c.id AND o.feature_key='odontogram' AND (o.expires_at IS NULL OR o.expires_at > now())), p.feature_odontogram) AS feature_odontogram,
  COALESCE((SELECT enabled FROM public.clinic_feature_overrides o WHERE o.clinic_id = c.id AND o.feature_key='facial_map' AND (o.expires_at IS NULL OR o.expires_at > now())), p.feature_facial_map) AS feature_facial_map,
  COALESCE((SELECT enabled FROM public.clinic_feature_overrides o WHERE o.clinic_id = c.id AND o.feature_key='priority_support' AND (o.expires_at IS NULL OR o.expires_at > now())), p.feature_priority_support) AS feature_priority_support,
  p.max_professionals, p.max_patients, p.max_specialties, p.max_appointments_monthly, p.max_whatsapp_instances
FROM public.clinics c
LEFT JOIN public.clinic_subscriptions s ON s.clinic_id = c.id
LEFT JOIN public.subscription_plans p ON p.id = s.plan_id;

GRANT SELECT ON public.clinic_effective_features TO authenticated;