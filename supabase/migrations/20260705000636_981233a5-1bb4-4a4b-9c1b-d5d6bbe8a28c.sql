
-- Prevent two open cash registers for the same user in the same clinic
CREATE UNIQUE INDEX IF NOT EXISTS uq_cash_register_open_per_user
  ON public.cash_registers (clinic_id, opened_by)
  WHERE status = 'aberto';

-- Helper: is current user admin/owner of the clinic
CREATE OR REPLACE FUNCTION public.finance_is_admin_or_owner(_clinic_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role IN ('owner','admin')
  );
$$;
REVOKE EXECUTE ON FUNCTION public.finance_is_admin_or_owner(uuid) FROM anon;

-- Trigger: block movements on a closed cash register (except admin/owner)
CREATE OR REPLACE FUNCTION public.cash_movements_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _status text;
  _clinic uuid;
BEGIN
  SELECT status, clinic_id INTO _status, _clinic
  FROM public.cash_registers
  WHERE id = COALESCE(NEW.cash_register_id, OLD.cash_register_id);

  IF _status = 'fechado' AND NOT public.finance_is_admin_or_owner(_clinic) THEN
    RAISE EXCEPTION 'Caixa fechado: somente owner/admin pode alterar movimentos.';
  END IF;
  RETURN COALESCE(NEW, OLD);
END; $$;

DROP TRIGGER IF EXISTS trg_cash_movements_guard ON public.cash_movements;
CREATE TRIGGER trg_cash_movements_guard
BEFORE INSERT OR UPDATE OR DELETE ON public.cash_movements
FOR EACH ROW EXECUTE FUNCTION public.cash_movements_guard();

-- Trigger: block updates on a closed cash register unless admin/owner (allow reopen fields flip)
CREATE OR REPLACE FUNCTION public.cash_registers_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status = 'fechado'
     AND NOT public.finance_is_admin_or_owner(OLD.clinic_id) THEN
    RAISE EXCEPTION 'Caixa já fechado: apenas owner/admin pode alterar.';
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_cash_registers_guard ON public.cash_registers;
CREATE TRIGGER trg_cash_registers_guard
BEFORE UPDATE ON public.cash_registers
FOR EACH ROW EXECUTE FUNCTION public.cash_registers_guard();
