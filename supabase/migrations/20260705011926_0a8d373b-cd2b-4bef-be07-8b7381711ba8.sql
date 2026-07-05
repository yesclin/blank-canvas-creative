
-- Trigger de auditoria em finance_transactions
CREATE OR REPLACE FUNCTION public.trg_audit_finance_transaction()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_clinic uuid;
  v_reason text;
  v_action text;
BEGIN
  v_clinic := COALESCE(NEW.clinic_id, OLD.clinic_id);
  v_reason := COALESCE(NEW.cancel_reason, NEW.reversal_reason, NULL);
  v_action := CASE TG_OP
    WHEN 'INSERT' THEN 'transaction.created'
    WHEN 'UPDATE' THEN
      CASE
        WHEN OLD.status IS DISTINCT FROM NEW.status AND NEW.status='cancelado' THEN 'transaction.cancelled'
        WHEN OLD.status IS DISTINCT FROM NEW.status AND NEW.status='pago' THEN 'transaction.paid'
        WHEN OLD.paid_amount IS DISTINCT FROM NEW.paid_amount THEN 'transaction.settled'
        WHEN OLD.amount IS DISTINCT FROM NEW.amount OR OLD.due_date IS DISTINCT FROM NEW.due_date THEN 'transaction.renegotiated'
        ELSE 'transaction.updated'
      END
    WHEN 'DELETE' THEN 'transaction.deleted'
  END;

  INSERT INTO public.finance_audit_logs(
    clinic_id, transaction_id, action, actor_id, before_data, after_data, reason
  ) VALUES (
    v_clinic,
    COALESCE(NEW.id, OLD.id),
    v_action,
    auth.uid(),
    CASE WHEN TG_OP <> 'INSERT' THEN to_jsonb(OLD) END,
    CASE WHEN TG_OP <> 'DELETE' THEN to_jsonb(NEW) END,
    v_reason
  );
  RETURN COALESCE(NEW, OLD);
END; $$;

DROP TRIGGER IF EXISTS trg_audit_finance_transaction ON public.finance_transactions;
CREATE TRIGGER trg_audit_finance_transaction
AFTER INSERT OR UPDATE OR DELETE ON public.finance_transactions
FOR EACH ROW EXECUTE FUNCTION public.trg_audit_finance_transaction();

-- Renegociação segura de parcelas
CREATE OR REPLACE FUNCTION public.renegotiate_transaction(
  _id uuid,
  _new_amount numeric,
  _new_due_date date,
  _reason text
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE t public.finance_transactions;
BEGIN
  IF _reason IS NULL OR length(trim(_reason)) < 3 THEN
    RAISE EXCEPTION 'Motivo obrigatório para renegociação';
  END IF;
  SELECT * INTO t FROM public.finance_transactions WHERE id = _id;
  IF t.id IS NULL THEN RAISE EXCEPTION 'Lançamento não encontrado'; END IF;
  IF t.status NOT IN ('pendente','parcial') THEN
    RAISE EXCEPTION 'Só é possível renegociar lançamentos pendentes ou parciais';
  END IF;
  IF _new_amount IS NULL OR _new_amount <= 0 THEN
    RAISE EXCEPTION 'Novo valor inválido';
  END IF;
  IF _new_amount < COALESCE(t.paid_amount, 0) THEN
    RAISE EXCEPTION 'Novo valor não pode ser menor que o já pago';
  END IF;

  UPDATE public.finance_transactions
     SET amount = _new_amount,
         due_date = COALESCE(_new_due_date, due_date),
         notes = COALESCE(notes,'') || E'\n[Renegociado] ' || _reason,
         status = CASE WHEN COALESCE(paid_amount,0) >= _new_amount THEN 'pago' ELSE
                       CASE WHEN COALESCE(paid_amount,0) > 0 THEN 'parcial' ELSE 'pendente' END END,
         updated_at = now()
   WHERE id = _id;
END; $$;
