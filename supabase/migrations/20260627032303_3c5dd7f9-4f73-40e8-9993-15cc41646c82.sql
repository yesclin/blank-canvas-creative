
DO $$ BEGIN
  CREATE TYPE public.commission_rule_kind AS ENUM ('percentual','fixo','por_procedimento','por_especialidade','por_pacote');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.commission_entry_status AS ENUM ('pendente','aprovado','pago','cancelado');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.commission_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  professional_id uuid REFERENCES public.professionals(id) ON DELETE CASCADE,
  procedure_id uuid REFERENCES public.procedures(id) ON DELETE SET NULL,
  specialty_id uuid REFERENCES public.specialties(id) ON DELETE SET NULL,
  package_id uuid REFERENCES public.treatment_packages(id) ON DELETE SET NULL,
  kind public.commission_rule_kind NOT NULL,
  percentual numeric(6,3),
  valor_fixo numeric(12,2),
  pay_trigger text NOT NULL DEFAULT 'on_payment',
  priority int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.commission_rules TO authenticated;
GRANT ALL ON public.commission_rules TO service_role;
ALTER TABLE public.commission_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "commission_rules_admin_all" ON public.commission_rules
  FOR ALL TO authenticated
  USING (clinic_id = public.get_user_clinic_id_for_rls() AND (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'admin')))
  WITH CHECK (clinic_id = public.get_user_clinic_id_for_rls() AND (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'admin')));
CREATE POLICY "commission_rules_pro_read_own" ON public.commission_rules
  FOR SELECT TO authenticated
  USING (clinic_id = public.get_user_clinic_id_for_rls() AND professional_id IN (SELECT id FROM public.professionals WHERE user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.commission_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  professional_id uuid NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  transaction_id uuid REFERENCES public.finance_transactions(id) ON DELETE SET NULL,
  appointment_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL,
  rule_id uuid REFERENCES public.commission_rules(id) ON DELETE SET NULL,
  payout_id uuid,
  base_amount numeric(12,2) NOT NULL DEFAULT 0,
  commission_amount numeric(12,2) NOT NULL DEFAULT 0,
  status public.commission_entry_status NOT NULL DEFAULT 'pendente',
  reference_date date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_commission_entries_clinic ON public.commission_entries(clinic_id, status);
CREATE INDEX IF NOT EXISTS idx_commission_entries_pro ON public.commission_entries(professional_id, reference_date);
CREATE INDEX IF NOT EXISTS idx_commission_entries_tx ON public.commission_entries(transaction_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.commission_entries TO authenticated;
GRANT ALL ON public.commission_entries TO service_role;
ALTER TABLE public.commission_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "commission_entries_admin_all" ON public.commission_entries
  FOR ALL TO authenticated
  USING (clinic_id = public.get_user_clinic_id_for_rls() AND (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'admin')))
  WITH CHECK (clinic_id = public.get_user_clinic_id_for_rls() AND (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'admin')));
CREATE POLICY "commission_entries_pro_read_own" ON public.commission_entries
  FOR SELECT TO authenticated
  USING (clinic_id = public.get_user_clinic_id_for_rls() AND professional_id IN (SELECT id FROM public.professionals WHERE user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.professional_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  professional_id uuid NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  period_start date NOT NULL,
  period_end date NOT NULL,
  total_amount numeric(12,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pendente',
  paid_at timestamptz,
  payment_method text,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.professional_payouts TO authenticated;
GRANT ALL ON public.professional_payouts TO service_role;
ALTER TABLE public.professional_payouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payouts_admin_all" ON public.professional_payouts
  FOR ALL TO authenticated
  USING (clinic_id = public.get_user_clinic_id_for_rls() AND (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'admin')))
  WITH CHECK (clinic_id = public.get_user_clinic_id_for_rls() AND (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'admin')));
CREATE POLICY "payouts_pro_read_own" ON public.professional_payouts
  FOR SELECT TO authenticated
  USING (clinic_id = public.get_user_clinic_id_for_rls() AND professional_id IN (SELECT id FROM public.professionals WHERE user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.finance_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL,
  transaction_id uuid,
  action text NOT NULL,
  actor_id uuid,
  before_data jsonb,
  after_data jsonb,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_finance_audit_tx ON public.finance_audit_logs(transaction_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_finance_audit_clinic ON public.finance_audit_logs(clinic_id, created_at DESC);
GRANT SELECT, INSERT ON public.finance_audit_logs TO authenticated;
GRANT ALL ON public.finance_audit_logs TO service_role;
ALTER TABLE public.finance_audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "finance_audit_admin_read" ON public.finance_audit_logs
  FOR SELECT TO authenticated
  USING (clinic_id = public.get_user_clinic_id_for_rls() AND (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'admin')));
CREATE POLICY "finance_audit_insert_clinic" ON public.finance_audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (clinic_id = public.get_user_clinic_id_for_rls());

CREATE OR REPLACE FUNCTION public.tg_finance_audit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_action text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.finance_audit_logs(clinic_id, transaction_id, action, actor_id, after_data)
    VALUES (NEW.clinic_id, NEW.id, 'created', auth.uid(), to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := CASE
      WHEN NEW.status IS DISTINCT FROM OLD.status THEN
        CASE NEW.status::text
          WHEN 'pago' THEN 'paid'
          WHEN 'estornado' THEN 'reversed'
          WHEN 'cancelado' THEN 'cancelled'
          ELSE 'updated' END
      ELSE 'updated' END;
    INSERT INTO public.finance_audit_logs(clinic_id, transaction_id, action, actor_id, before_data, after_data, reason)
    VALUES (NEW.clinic_id, NEW.id, v_action, auth.uid(), to_jsonb(OLD), to_jsonb(NEW), NEW.reversal_reason);
    RETURN NEW;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_finance_audit ON public.finance_transactions;
CREATE TRIGGER trg_finance_audit AFTER INSERT OR UPDATE ON public.finance_transactions
FOR EACH ROW EXECUTE FUNCTION public.tg_finance_audit();

CREATE OR REPLACE FUNCTION public.tg_finance_generate_commission()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_rule public.commission_rules%ROWTYPE; v_amount numeric(12,2);
BEGIN
  IF NEW.type::text <> 'receita' THEN RETURN NEW; END IF;
  IF NEW.professional_id IS NULL THEN RETURN NEW; END IF;
  IF NEW.status::text <> 'pago' THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND OLD.status::text = 'pago' THEN RETURN NEW; END IF;

  SELECT * INTO v_rule FROM public.commission_rules
  WHERE clinic_id = NEW.clinic_id AND is_active = true
    AND (professional_id = NEW.professional_id OR professional_id IS NULL)
    AND (procedure_id IS NULL OR procedure_id = NEW.procedure_id)
    AND (package_id   IS NULL OR package_id   = NEW.package_id)
  ORDER BY (procedure_id IS NOT NULL)::int DESC,
           (package_id   IS NOT NULL)::int DESC,
           (professional_id IS NOT NULL)::int DESC,
           priority DESC
  LIMIT 1;
  IF NOT FOUND THEN RETURN NEW; END IF;

  v_amount := CASE v_rule.kind
    WHEN 'percentual' THEN ROUND(NEW.amount * COALESCE(v_rule.percentual,0)/100, 2)
    WHEN 'fixo'       THEN COALESCE(v_rule.valor_fixo, 0)
    ELSE ROUND(NEW.amount * COALESCE(v_rule.percentual,0)/100, 2)
  END;

  INSERT INTO public.commission_entries(clinic_id, professional_id, transaction_id, appointment_id, rule_id, base_amount, commission_amount, status, reference_date)
  VALUES (NEW.clinic_id, NEW.professional_id, NEW.id, NEW.appointment_id, v_rule.id, NEW.amount, v_amount, 'pendente', COALESCE(NEW.paid_at::date, CURRENT_DATE));
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_finance_commission ON public.finance_transactions;
CREATE TRIGGER trg_finance_commission AFTER INSERT OR UPDATE OF status ON public.finance_transactions
FOR EACH ROW EXECUTE FUNCTION public.tg_finance_generate_commission();

DROP TRIGGER IF EXISTS trg_commission_rules_updated ON public.commission_rules;
CREATE TRIGGER trg_commission_rules_updated BEFORE UPDATE ON public.commission_rules
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS trg_commission_entries_updated ON public.commission_entries;
CREATE TRIGGER trg_commission_entries_updated BEFORE UPDATE ON public.commission_entries
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS trg_professional_payouts_updated ON public.professional_payouts;
CREATE TRIGGER trg_professional_payouts_updated BEFORE UPDATE ON public.professional_payouts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
