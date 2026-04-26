-- Trigger de auto-trial: 7 dias no plano profissional + auditoria condicional
CREATE OR REPLACE FUNCTION public.tg_clinic_auto_trial()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_plan uuid;
BEGIN
  SELECT id INTO v_plan FROM public.subscription_plans WHERE slug='profissional' AND is_active=true LIMIT 1;
  IF v_plan IS NULL THEN
    SELECT id INTO v_plan FROM public.subscription_plans WHERE is_active=true ORDER BY sort_order LIMIT 1;
  END IF;

  IF v_plan IS NOT NULL THEN
    INSERT INTO public.clinic_subscriptions (clinic_id, plan_id, status, cycle, trial_ends_at, current_period_start, current_period_end)
    VALUES (NEW.id, v_plan, 'trial', 'monthly', now()+interval '7 days', now(), now()+interval '7 days')
    ON CONFLICT (clinic_id) DO NOTHING;

    IF auth.uid() IS NOT NULL THEN
      INSERT INTO public.platform_audit_logs (actor_user_id, action, target_type, target_id, clinic_id, metadata)
      VALUES (auth.uid(), 'subscription.trial_started', 'clinic_subscription', NEW.id, NEW.id,
              jsonb_build_object('plan_id', v_plan, 'trial_days', 7));
    END IF;
  END IF;
  RETURN NEW;
END $$;

-- Expira trials vencidos
CREATE OR REPLACE FUNCTION public.expire_overdue_trials()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_count integer; v_row record;
BEGIN
  IF auth.uid() IS NOT NULL THEN
    FOR v_row IN SELECT id, clinic_id FROM public.clinic_subscriptions
                 WHERE status='trial' AND trial_ends_at IS NOT NULL AND trial_ends_at < now()
    LOOP
      INSERT INTO public.platform_audit_logs (actor_user_id, action, target_type, target_id, clinic_id, metadata)
      VALUES (auth.uid(), 'subscription.trial_expired', 'clinic_subscription', v_row.id, v_row.clinic_id,
              jsonb_build_object('expired_at', now()));
    END LOOP;
  END IF;

  UPDATE public.clinic_subscriptions SET status='overdue', updated_at=now()
  WHERE status='trial' AND trial_ends_at IS NOT NULL AND trial_ends_at < now();
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END $$;
GRANT EXECUTE ON FUNCTION public.expire_overdue_trials() TO authenticated;

-- Pode mutar?
CREATE OR REPLACE FUNCTION public.clinic_can_mutate(_clinic_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT CASE
    WHEN _clinic_id IS NULL THEN true
    WHEN NOT EXISTS (SELECT 1 FROM public.clinic_subscriptions WHERE clinic_id=_clinic_id) THEN true
    ELSE COALESCE((SELECT status NOT IN ('overdue','canceled','blocked')
                   FROM public.clinic_subscriptions WHERE clinic_id=_clinic_id), true)
  END;
$$;
GRANT EXECUTE ON FUNCTION public.clinic_can_mutate(uuid) TO authenticated;

-- Trigger de bloqueio
CREATE OR REPLACE FUNCTION public.tg_block_if_subscription_inactive()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_clinic uuid; v_status text;
BEGIN
  v_clinic := (to_jsonb(NEW)->>'clinic_id')::uuid;
  IF v_clinic IS NULL THEN RETURN NEW; END IF;
  SELECT status::text INTO v_status FROM public.clinic_subscriptions WHERE clinic_id=v_clinic;
  IF v_status IN ('overdue','canceled','blocked') THEN
    RAISE EXCEPTION 'SUBSCRIPTION_INACTIVE: Sua assinatura está %. Escolha um plano para continuar utilizando o YesClin.', v_status
      USING ERRCODE='check_violation';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_block_inactive_patients ON public.patients;
CREATE TRIGGER trg_block_inactive_patients BEFORE INSERT ON public.patients FOR EACH ROW EXECUTE FUNCTION public.tg_block_if_subscription_inactive();

DROP TRIGGER IF EXISTS trg_block_inactive_appointments ON public.appointments;
CREATE TRIGGER trg_block_inactive_appointments BEFORE INSERT ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.tg_block_if_subscription_inactive();

DROP TRIGGER IF EXISTS trg_block_inactive_appointment_sessions ON public.appointment_sessions;
CREATE TRIGGER trg_block_inactive_appointment_sessions BEFORE INSERT ON public.appointment_sessions FOR EACH ROW EXECUTE FUNCTION public.tg_block_if_subscription_inactive();

-- Auditoria de mudanças de assinatura (condicional ao usuário)
CREATE OR REPLACE FUNCTION public.tg_audit_subscription_changes()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN NEW; END IF;

  IF TG_OP='INSERT' THEN
    INSERT INTO public.platform_audit_logs (actor_user_id, action, target_type, target_id, clinic_id, metadata)
    VALUES (auth.uid(), 'subscription.created', 'clinic_subscription', NEW.id, NEW.clinic_id,
            jsonb_build_object('plan_id', NEW.plan_id, 'status', NEW.status, 'cycle', NEW.cycle));
    RETURN NEW;
  END IF;

  IF TG_OP='UPDATE' THEN
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      INSERT INTO public.platform_audit_logs (actor_user_id, action, target_type, target_id, clinic_id, metadata)
      VALUES (auth.uid(), 'subscription.status_changed', 'clinic_subscription', NEW.id, NEW.clinic_id,
              jsonb_build_object('from', OLD.status, 'to', NEW.status));
    END IF;
    IF NEW.plan_id IS DISTINCT FROM OLD.plan_id THEN
      INSERT INTO public.platform_audit_logs (actor_user_id, action, target_type, target_id, clinic_id, metadata)
      VALUES (auth.uid(), 'subscription.plan_changed', 'clinic_subscription', NEW.id, NEW.clinic_id,
              jsonb_build_object('from_plan', OLD.plan_id, 'to_plan', NEW.plan_id, 'cycle', NEW.cycle));
    END IF;
    IF NEW.cycle IS DISTINCT FROM OLD.cycle THEN
      INSERT INTO public.platform_audit_logs (actor_user_id, action, target_type, target_id, clinic_id, metadata)
      VALUES (auth.uid(), 'subscription.cycle_changed', 'clinic_subscription', NEW.id, NEW.clinic_id,
              jsonb_build_object('from', OLD.cycle, 'to', NEW.cycle));
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_audit_subscription_changes ON public.clinic_subscriptions;
CREATE TRIGGER trg_audit_subscription_changes AFTER INSERT OR UPDATE ON public.clinic_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.tg_audit_subscription_changes();

-- RPC: cliente solicita assinatura
CREATE OR REPLACE FUNCTION public.request_subscription(_cycle text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_user uuid := auth.uid(); v_clinic uuid;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated' USING ERRCODE='insufficient_privilege'; END IF;
  IF _cycle NOT IN ('monthly','yearly') THEN RAISE EXCEPTION 'Invalid cycle'; END IF;
  SELECT clinic_id INTO v_clinic FROM public.profiles WHERE user_id=v_user LIMIT 1;
  IF v_clinic IS NULL THEN RAISE EXCEPTION 'No clinic for user'; END IF;
  INSERT INTO public.platform_audit_logs (actor_user_id, action, target_type, target_id, clinic_id, metadata)
  VALUES (v_user, 'subscription.requested', 'clinic_subscription', NULL, v_clinic,
          jsonb_build_object('cycle', _cycle, 'requested_at', now()));
  RETURN jsonb_build_object('ok', true, 'cycle', _cycle, 'clinic_id', v_clinic);
END $$;
GRANT EXECUTE ON FUNCTION public.request_subscription(text) TO authenticated;

-- Backfill
WITH plan AS (SELECT id FROM public.subscription_plans WHERE slug='profissional' AND is_active=true LIMIT 1)
UPDATE public.clinic_subscriptions s
SET status='active', plan_id=(SELECT id FROM plan), cycle='monthly',
    trial_ends_at=NULL, current_period_start=now(), current_period_end=now()+interval '30 days',
    internal_notes=COALESCE(internal_notes,'') || E'\n[backfill] migrado para Profissional ativo sem cobrança em ' || now()::text,
    updated_at=now()
WHERE s.status IN ('trial','overdue') AND EXISTS (SELECT 1 FROM plan);

INSERT INTO public.clinic_subscriptions (clinic_id, plan_id, status, cycle, current_period_start, current_period_end, internal_notes)
SELECT c.id, (SELECT id FROM public.subscription_plans WHERE slug='profissional' AND is_active=true LIMIT 1),
       'active','monthly', now(), now()+interval '30 days',
       '[backfill] criado como Profissional ativo sem cobrança'
FROM public.clinics c
WHERE NOT EXISTS (SELECT 1 FROM public.clinic_subscriptions s WHERE s.clinic_id=c.id)
  AND EXISTS (SELECT 1 FROM public.subscription_plans WHERE slug='profissional' AND is_active=true);
