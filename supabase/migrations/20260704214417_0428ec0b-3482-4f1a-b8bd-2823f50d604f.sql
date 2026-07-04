
-- Fase 1: Fundação do módulo Financeiro
-- 1) Extend finance_transactions with installment + sale linkage
ALTER TABLE public.finance_transactions
  ADD COLUMN IF NOT EXISTS sale_id uuid REFERENCES public.sales(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS treatment_package_id uuid REFERENCES public.treatment_packages(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS installment_number int,
  ADD COLUMN IF NOT EXISTS installment_total int,
  ADD COLUMN IF NOT EXISTS installment_group_id uuid,
  ADD COLUMN IF NOT EXISTS canceled_at timestamptz,
  ADD COLUMN IF NOT EXISTS canceled_by uuid,
  ADD COLUMN IF NOT EXISTS cancel_reason text;

CREATE INDEX IF NOT EXISTS idx_finance_tx_appointment ON public.finance_transactions(appointment_id) WHERE appointment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_finance_tx_sale ON public.finance_transactions(sale_id) WHERE sale_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_finance_tx_package ON public.finance_transactions(treatment_package_id) WHERE treatment_package_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_finance_tx_clinic_due ON public.finance_transactions(clinic_id, due_date, status);
CREATE INDEX IF NOT EXISTS idx_finance_tx_installment_group ON public.finance_transactions(installment_group_id) WHERE installment_group_id IS NOT NULL;

-- 2) Cash register tables
CREATE TABLE IF NOT EXISTS public.cash_registers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  opened_by uuid NOT NULL,
  opened_at timestamptz NOT NULL DEFAULT now(),
  opening_amount numeric(14,2) NOT NULL DEFAULT 0,
  closed_by uuid,
  closed_at timestamptz,
  closing_amount numeric(14,2),
  expected_amount numeric(14,2),
  difference_amount numeric(14,2),
  summary_by_method jsonb,
  status text NOT NULL DEFAULT 'aberto' CHECK (status IN ('aberto','fechado','reaberto')),
  notes text,
  reopened_by uuid,
  reopened_at timestamptz,
  reopen_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cash_registers TO authenticated;
GRANT ALL ON public.cash_registers TO service_role;

ALTER TABLE public.cash_registers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cash_registers_select_clinic" ON public.cash_registers
  FOR SELECT USING (clinic_id = user_clinic_id(auth.uid()));
CREATE POLICY "cash_registers_insert_clinic" ON public.cash_registers
  FOR INSERT WITH CHECK (clinic_id = user_clinic_id(auth.uid()));
CREATE POLICY "cash_registers_update_admin" ON public.cash_registers
  FOR UPDATE USING (is_clinic_admin(auth.uid(), clinic_id) OR opened_by = auth.uid())
  WITH CHECK (clinic_id = user_clinic_id(auth.uid()));
CREATE POLICY "cash_registers_delete_admin" ON public.cash_registers
  FOR DELETE USING (is_clinic_admin(auth.uid(), clinic_id));

CREATE UNIQUE INDEX IF NOT EXISTS uniq_open_cash_per_user
  ON public.cash_registers(clinic_id, opened_by) WHERE status = 'aberto';

CREATE TRIGGER trg_cash_registers_updated
  BEFORE UPDATE ON public.cash_registers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) Cash movements
CREATE TABLE IF NOT EXISTS public.cash_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  cash_register_id uuid NOT NULL REFERENCES public.cash_registers(id) ON DELETE CASCADE,
  movement_type text NOT NULL CHECK (movement_type IN ('sangria','suprimento','recebimento','ajuste','abertura','fechamento')),
  amount numeric(14,2) NOT NULL,
  payment_method_id uuid REFERENCES public.payment_methods(id) ON DELETE SET NULL,
  transaction_id uuid REFERENCES public.finance_transactions(id) ON DELETE SET NULL,
  description text,
  performed_by uuid NOT NULL,
  performed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cash_movements TO authenticated;
GRANT ALL ON public.cash_movements TO service_role;

ALTER TABLE public.cash_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cash_movements_select_clinic" ON public.cash_movements
  FOR SELECT USING (clinic_id = user_clinic_id(auth.uid()));
CREATE POLICY "cash_movements_insert_clinic" ON public.cash_movements
  FOR INSERT WITH CHECK (clinic_id = user_clinic_id(auth.uid()));
CREATE POLICY "cash_movements_update_admin" ON public.cash_movements
  FOR UPDATE USING (is_clinic_admin(auth.uid(), clinic_id))
  WITH CHECK (clinic_id = user_clinic_id(auth.uid()));
CREATE POLICY "cash_movements_delete_admin" ON public.cash_movements
  FOR DELETE USING (is_clinic_admin(auth.uid(), clinic_id));

CREATE INDEX IF NOT EXISTS idx_cash_movements_register ON public.cash_movements(cash_register_id);
CREATE INDEX IF NOT EXISTS idx_cash_movements_clinic_date ON public.cash_movements(clinic_id, performed_at DESC);

-- 4) Finance permissions per user (granular capabilities)
CREATE TABLE IF NOT EXISTS public.finance_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  view_all boolean NOT NULL DEFAULT false,
  view_own boolean NOT NULL DEFAULT true,
  create_tx boolean NOT NULL DEFAULT false,
  edit_tx boolean NOT NULL DEFAULT false,
  cancel_tx boolean NOT NULL DEFAULT false,
  settle_payment boolean NOT NULL DEFAULT false,
  refund_payment boolean NOT NULL DEFAULT false,
  view_reports boolean NOT NULL DEFAULT false,
  view_commissions boolean NOT NULL DEFAULT false,
  change_amounts boolean NOT NULL DEFAULT false,
  open_cash boolean NOT NULL DEFAULT false,
  close_cash boolean NOT NULL DEFAULT false,
  reopen_cash boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (clinic_id, user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.finance_permissions TO authenticated;
GRANT ALL ON public.finance_permissions TO service_role;

ALTER TABLE public.finance_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "finance_permissions_select" ON public.finance_permissions
  FOR SELECT USING (
    clinic_id = user_clinic_id(auth.uid())
    AND (user_id = auth.uid() OR is_clinic_admin(auth.uid(), clinic_id))
  );
CREATE POLICY "finance_permissions_admin_manage" ON public.finance_permissions
  FOR ALL USING (is_clinic_admin(auth.uid(), clinic_id))
  WITH CHECK (is_clinic_admin(auth.uid(), clinic_id));

CREATE TRIGGER trg_finance_permissions_updated
  BEFORE UPDATE ON public.finance_permissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Helper function
CREATE OR REPLACE FUNCTION public.has_finance_permission(_user_id uuid, _clinic_id uuid, _permission text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _row public.finance_permissions%ROWTYPE;
BEGIN
  IF is_clinic_admin(_user_id, _clinic_id) THEN
    RETURN true;
  END IF;
  SELECT * INTO _row FROM public.finance_permissions
    WHERE user_id = _user_id AND clinic_id = _clinic_id;
  IF NOT FOUND THEN RETURN false; END IF;
  RETURN CASE _permission
    WHEN 'view_all' THEN _row.view_all
    WHEN 'view_own' THEN _row.view_own
    WHEN 'create_tx' THEN _row.create_tx
    WHEN 'edit_tx' THEN _row.edit_tx
    WHEN 'cancel_tx' THEN _row.cancel_tx
    WHEN 'settle_payment' THEN _row.settle_payment
    WHEN 'refund_payment' THEN _row.refund_payment
    WHEN 'view_reports' THEN _row.view_reports
    WHEN 'view_commissions' THEN _row.view_commissions
    WHEN 'change_amounts' THEN _row.change_amounts
    WHEN 'open_cash' THEN _row.open_cash
    WHEN 'close_cash' THEN _row.close_cash
    WHEN 'reopen_cash' THEN _row.reopen_cash
    ELSE false
  END;
END;
$$;

-- 5) Universal audit trigger for finance_transactions and cash_registers
CREATE OR REPLACE FUNCTION public.finance_universal_audit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _action text;
  _clinic uuid;
  _tx_id uuid;
BEGIN
  IF TG_OP = 'INSERT' THEN _action := 'insert';
  ELSIF TG_OP = 'UPDATE' THEN _action := 'update';
  ELSE _action := 'delete';
  END IF;

  IF TG_TABLE_NAME = 'finance_transactions' THEN
    _clinic := COALESCE(NEW.clinic_id, OLD.clinic_id);
    _tx_id := COALESCE(NEW.id, OLD.id);
  ELSE
    _clinic := COALESCE(NEW.clinic_id, OLD.clinic_id);
    _tx_id := NULL;
  END IF;

  INSERT INTO public.finance_audit_logs (clinic_id, transaction_id, action, actor_id, before_data, after_data, reason)
  VALUES (
    _clinic,
    _tx_id,
    TG_TABLE_NAME || ':' || _action,
    auth.uid(),
    CASE WHEN TG_OP <> 'INSERT' THEN to_jsonb(OLD) END,
    CASE WHEN TG_OP <> 'DELETE' THEN to_jsonb(NEW) END,
    CASE WHEN TG_OP = 'UPDATE' AND TG_TABLE_NAME='finance_transactions'
         THEN COALESCE(NEW.reversal_reason, NEW.cancel_reason)
         ELSE NULL END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_finance_tx_audit ON public.finance_transactions;
CREATE TRIGGER trg_finance_tx_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.finance_transactions
  FOR EACH ROW EXECUTE FUNCTION public.finance_universal_audit();

DROP TRIGGER IF EXISTS trg_cash_registers_audit ON public.cash_registers;
CREATE TRIGGER trg_cash_registers_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.cash_registers
  FOR EACH ROW EXECUTE FUNCTION public.finance_universal_audit();
