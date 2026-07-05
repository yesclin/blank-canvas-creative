
-- ================================================================
-- FASE 2C: Comissões - extensão de estrutura
-- ================================================================

-- 1. Novos status
DO $$ BEGIN
  ALTER TYPE public.commission_entry_status ADD VALUE IF NOT EXISTS 'estornada';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TYPE public.commission_entry_status ADD VALUE IF NOT EXISTS 'bloqueada';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Novos tipos de regra (convênio / particular)
DO $$ BEGIN
  ALTER TYPE public.commission_rule_kind ADD VALUE IF NOT EXISTS 'por_convenio';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TYPE public.commission_rule_kind ADD VALUE IF NOT EXISTS 'por_particular';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. Colunas adicionais em commission_rules
ALTER TABLE public.commission_rules
  ADD COLUMN IF NOT EXISTS insurance_id uuid REFERENCES public.insurances(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS applies_to_particular boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS applies_to_convenio boolean NOT NULL DEFAULT false;

-- Garantir default de pay_trigger
ALTER TABLE public.commission_rules
  ALTER COLUMN pay_trigger SET DEFAULT 'on_finish';
UPDATE public.commission_rules SET pay_trigger = 'on_finish' WHERE pay_trigger IS NULL;

-- 4. Colunas adicionais em commission_entries
ALTER TABLE public.commission_entries
  ADD COLUMN IF NOT EXISTS patient_id uuid REFERENCES public.patients(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS procedure_id uuid REFERENCES public.procedures(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS insurance_id uuid REFERENCES public.insurances(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS payer_type text CHECK (payer_type IN ('particular','convenio','cortesia','isento')),
  ADD COLUMN IF NOT EXISTS gross_amount numeric,
  ADD COLUMN IF NOT EXISTS received_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS percent_applied numeric,
  ADD COLUMN IF NOT EXISTS fixed_applied numeric,
  ADD COLUMN IF NOT EXISTS due_date date,
  ADD COLUMN IF NOT EXISTS paid_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancelled_by uuid,
  ADD COLUMN IF NOT EXISTS cancel_reason text;

-- 5. Unicidade para evitar duplicação (por appointment + profissional + regra)
CREATE UNIQUE INDEX IF NOT EXISTS commission_entries_unique_appt_pro_rule
  ON public.commission_entries(appointment_id, professional_id, COALESCE(rule_id, '00000000-0000-0000-0000-000000000000'::uuid))
  WHERE appointment_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS commission_entries_pro_status_idx
  ON public.commission_entries(professional_id, status);
CREATE INDEX IF NOT EXISTS commission_entries_clinic_ref_idx
  ON public.commission_entries(clinic_id, reference_date);

-- 6. Função: resolver melhor regra para um contexto
CREATE OR REPLACE FUNCTION public.resolve_commission_rule(
  _clinic_id uuid,
  _professional_id uuid,
  _procedure_id uuid,
  _specialty_id uuid,
  _insurance_id uuid,
  _is_particular boolean
) RETURNS public.commission_rules
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  r public.commission_rules;
BEGIN
  SELECT * INTO r FROM public.commission_rules
  WHERE clinic_id = _clinic_id
    AND is_active = true
    AND (professional_id IS NULL OR professional_id = _professional_id)
    AND (
      (procedure_id IS NOT NULL AND procedure_id = _procedure_id) OR
      (specialty_id IS NOT NULL AND specialty_id = _specialty_id) OR
      (insurance_id IS NOT NULL AND insurance_id = _insurance_id) OR
      (applies_to_particular = true AND _is_particular = true) OR
      (applies_to_convenio = true AND _insurance_id IS NOT NULL) OR
      (procedure_id IS NULL AND specialty_id IS NULL AND insurance_id IS NULL
        AND applies_to_particular = false AND applies_to_convenio = false)
    )
  ORDER BY
    (procedure_id = _procedure_id)::int DESC,
    (insurance_id = _insurance_id)::int DESC,
    (specialty_id = _specialty_id)::int DESC,
    (professional_id = _professional_id)::int DESC,
    priority DESC NULLS LAST,
    created_at DESC
  LIMIT 1;
  RETURN r;
END; $$;

-- 7. Função: gerar entry a partir de um appointment finalizado ou transaction paga
CREATE OR REPLACE FUNCTION public.generate_commission_entry(
  _appointment_id uuid,
  _trigger text  -- 'on_finish' | 'on_payment'
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  a public.appointments;
  rule public.commission_rules;
  v_gross numeric := 0;
  v_received numeric := 0;
  v_amount numeric := 0;
  v_is_particular boolean;
  v_entry_id uuid;
  v_existing uuid;
BEGIN
  SELECT * INTO a FROM public.appointments WHERE id = _appointment_id;
  IF a.id IS NULL OR a.professional_id IS NULL THEN RETURN NULL; END IF;

  v_is_particular := (a.insurance_id IS NULL);

  SELECT COALESCE(SUM(amount),0) INTO v_gross
    FROM public.finance_transactions
    WHERE appointment_id = _appointment_id AND type='receita' AND status <> 'cancelado';

  SELECT COALESCE(SUM(amount),0) INTO v_received
    FROM public.finance_transactions
    WHERE appointment_id = _appointment_id AND type='receita' AND status='pago';

  rule := public.resolve_commission_rule(
    a.clinic_id, a.professional_id, a.procedure_id, a.specialty_id, a.insurance_id, v_is_particular
  );
  IF rule.id IS NULL THEN RETURN NULL; END IF;
  IF rule.pay_trigger IS NOT NULL AND rule.pay_trigger <> _trigger THEN
    -- só cria quando o gatilho da regra bater
    IF NOT (rule.pay_trigger = 'on_payment' AND _trigger = 'on_payment') AND
       NOT (rule.pay_trigger = 'on_finish'  AND _trigger = 'on_finish') THEN
      RETURN NULL;
    END IF;
  END IF;

  -- valor base conforme gatilho
  IF rule.pay_trigger = 'on_payment' THEN
    IF v_received <= 0 THEN RETURN NULL; END IF;
  END IF;

  -- cálculo
  IF rule.percentual IS NOT NULL AND rule.percentual > 0 THEN
    v_amount := ROUND(COALESCE(NULLIF(v_received,0), v_gross) * rule.percentual / 100.0, 2);
  ELSIF rule.valor_fixo IS NOT NULL THEN
    v_amount := rule.valor_fixo;
  ELSE
    v_amount := 0;
  END IF;

  IF v_amount <= 0 THEN RETURN NULL; END IF;

  -- dedup
  SELECT id INTO v_existing FROM public.commission_entries
   WHERE appointment_id = _appointment_id
     AND professional_id = a.professional_id
     AND COALESCE(rule_id,'00000000-0000-0000-0000-000000000000'::uuid) = COALESCE(rule.id,'00000000-0000-0000-0000-000000000000'::uuid)
   LIMIT 1;

  IF v_existing IS NOT NULL THEN
    UPDATE public.commission_entries SET
      base_amount = COALESCE(NULLIF(v_received,0), v_gross),
      commission_amount = v_amount,
      gross_amount = v_gross,
      received_amount = v_received,
      percent_applied = rule.percentual,
      fixed_applied = rule.valor_fixo,
      updated_at = now()
    WHERE id = v_existing AND status IN ('pendente','aprovado','bloqueada');
    RETURN v_existing;
  END IF;

  INSERT INTO public.commission_entries(
    clinic_id, professional_id, appointment_id, rule_id,
    patient_id, procedure_id, insurance_id, payer_type,
    base_amount, commission_amount, gross_amount, received_amount,
    percent_applied, fixed_applied,
    status, reference_date, due_date
  ) VALUES (
    a.clinic_id, a.professional_id, a.id, rule.id,
    a.patient_id, a.procedure_id, a.insurance_id,
    CASE WHEN a.insurance_id IS NULL THEN 'particular' ELSE 'convenio' END,
    COALESCE(NULLIF(v_received,0), v_gross), v_amount, v_gross, v_received,
    rule.percentual, rule.valor_fixo,
    'pendente', CURRENT_DATE, CURRENT_DATE + 30
  ) RETURNING id INTO v_entry_id;

  RETURN v_entry_id;
END; $$;

-- 8. Triggers
CREATE OR REPLACE FUNCTION public.trg_commission_on_appointment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'finalizado' AND (OLD.status IS DISTINCT FROM NEW.status) THEN
    PERFORM public.generate_commission_entry(NEW.id, 'on_finish');
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_commission_on_appointment ON public.appointments;
CREATE TRIGGER trg_commission_on_appointment
AFTER UPDATE ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.trg_commission_on_appointment();

CREATE OR REPLACE FUNCTION public.trg_commission_on_transaction()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.appointment_id IS NOT NULL AND NEW.status = 'pago' AND (OLD.status IS DISTINCT FROM NEW.status) THEN
    PERFORM public.generate_commission_entry(NEW.appointment_id, 'on_payment');
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_commission_on_transaction ON public.finance_transactions;
CREATE TRIGGER trg_commission_on_transaction
AFTER UPDATE ON public.finance_transactions
FOR EACH ROW EXECUTE FUNCTION public.trg_commission_on_transaction();

-- 9. Auditoria em finance_audit_logs
CREATE OR REPLACE FUNCTION public.trg_audit_commission()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_clinic uuid;
BEGIN
  v_clinic := COALESCE(NEW.clinic_id, OLD.clinic_id);
  INSERT INTO public.finance_audit_logs(clinic_id, user_id, action, entity, entity_id, old_data, new_data)
  VALUES (
    v_clinic, auth.uid(),
    CASE TG_OP WHEN 'INSERT' THEN 'commission.created'
               WHEN 'UPDATE' THEN 'commission.updated'
               WHEN 'DELETE' THEN 'commission.deleted' END,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP<>'INSERT' THEN to_jsonb(OLD) END,
    CASE WHEN TG_OP<>'DELETE' THEN to_jsonb(NEW) END
  );
  RETURN COALESCE(NEW, OLD);
END; $$;

DROP TRIGGER IF EXISTS trg_audit_commission_entries ON public.commission_entries;
CREATE TRIGGER trg_audit_commission_entries
AFTER INSERT OR UPDATE OR DELETE ON public.commission_entries
FOR EACH ROW EXECUTE FUNCTION public.trg_audit_commission();

DROP TRIGGER IF EXISTS trg_audit_commission_rules ON public.commission_rules;
CREATE TRIGGER trg_audit_commission_rules
AFTER INSERT OR UPDATE OR DELETE ON public.commission_rules
FOR EACH ROW EXECUTE FUNCTION public.trg_audit_commission();

-- 10. RPCs de ação
CREATE OR REPLACE FUNCTION public.mark_commission_paid(_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  UPDATE public.commission_entries
     SET status='pago', paid_at=now(), updated_at=now()
   WHERE id=_id AND status IN ('pendente','aprovado');
END; $$;

CREATE OR REPLACE FUNCTION public.cancel_commission(_id uuid, _reason text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  UPDATE public.commission_entries
     SET status='cancelado', cancelled_at=now(), cancelled_by=auth.uid(),
         cancel_reason=_reason, updated_at=now()
   WHERE id=_id AND status IN ('pendente','aprovado','bloqueada');
END; $$;

CREATE OR REPLACE FUNCTION public.refund_commission(_id uuid, _reason text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  UPDATE public.commission_entries
     SET status='estornada', cancelled_at=now(), cancelled_by=auth.uid(),
         cancel_reason=_reason, updated_at=now()
   WHERE id=_id AND status='pago';
END; $$;
