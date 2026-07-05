
-- 1. Vínculos
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS treatment_package_id uuid REFERENCES public.treatment_packages(id) ON DELETE SET NULL;

ALTER TABLE public.finance_transactions
  ADD COLUMN IF NOT EXISTS treatment_package_id uuid REFERENCES public.treatment_packages(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_appointments_treatment_package
  ON public.appointments(treatment_package_id) WHERE treatment_package_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_finance_tx_treatment_package
  ON public.finance_transactions(treatment_package_id) WHERE treatment_package_id IS NOT NULL;

-- 2. Recalcular used_sessions e status do pacote
CREATE OR REPLACE FUNCTION public.recalc_treatment_package_sessions()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_pkg uuid;
  v_used int;
  v_total int;
BEGIN
  v_pkg := COALESCE(NEW.treatment_package_id, OLD.treatment_package_id);
  IF v_pkg IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  SELECT COUNT(*) INTO v_used
    FROM public.appointments
   WHERE treatment_package_id = v_pkg
     AND status = 'finalizado';

  SELECT total_sessions INTO v_total FROM public.treatment_packages WHERE id = v_pkg;

  UPDATE public.treatment_packages
     SET used_sessions = v_used,
         status = CASE
                    WHEN v_total IS NOT NULL AND v_used >= v_total THEN 'concluido'
                    WHEN status = 'concluido' AND v_used < v_total THEN 'ativo'
                    ELSE status
                  END,
         updated_at = now()
   WHERE id = v_pkg;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_recalc_pkg_sessions ON public.appointments;
CREATE TRIGGER trg_recalc_pkg_sessions
AFTER INSERT OR UPDATE OF status, treatment_package_id OR DELETE
ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.recalc_treatment_package_sessions();

-- 3. Recalcular paid_amount do pacote a partir de finance_transactions pagas
CREATE OR REPLACE FUNCTION public.recalc_treatment_package_paid()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_pkg uuid;
  v_paid numeric;
BEGIN
  v_pkg := COALESCE(NEW.treatment_package_id, OLD.treatment_package_id);
  IF v_pkg IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  SELECT COALESCE(SUM(COALESCE(paid_amount, amount)), 0) INTO v_paid
    FROM public.finance_transactions
   WHERE treatment_package_id = v_pkg
     AND type = 'receita'
     AND status = 'pago';

  UPDATE public.treatment_packages
     SET paid_amount = v_paid,
         updated_at = now()
   WHERE id = v_pkg;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_recalc_pkg_paid ON public.finance_transactions;
CREATE TRIGGER trg_recalc_pkg_paid
AFTER INSERT OR UPDATE OF status, paid_amount, amount, treatment_package_id OR DELETE
ON public.finance_transactions
FOR EACH ROW EXECUTE FUNCTION public.recalc_treatment_package_paid();
