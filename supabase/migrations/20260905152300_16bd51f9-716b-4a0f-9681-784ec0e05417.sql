-- =========================================================
-- SEGURANÇA: itens críticos 1 e 2 da auditoria
-- =========================================================

-- ---------------------------------------------------------
-- 1a. Revoga EXECUTE de anon em TODAS as funções SECURITY DEFINER
--     do schema public e devolve apenas às realmente públicas.
-- ---------------------------------------------------------
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon', r.sig);
  END LOOP;
END $$;

DO $$
DECLARE
  r record;
  public_fns text[] := ARRAY[
    'get_public_procedures','get_public_professionals','get_public_specialties',
    'get_public_effective_schedule','get_booked_slots','check_slot_available',
    'is_public_booking_enabled','find_or_create_public_patient',
    'submit_pre_registration','get_pre_registration_by_token',
    'get_teleconsulta_by_token','start_teleconsulta_precheck_by_token',
    'complete_teleconsulta_precheck_by_token','log_teleconsulta_event_by_token',
    'validate_teleconsultation_token','can_join_teleconsultation',
    'validate_clinical_document'
  ];
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef AND p.proname = ANY(public_fns)
  LOOP
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO anon', r.sig);
  END LOOP;
END $$;

-- ---------------------------------------------------------
-- 1b. Revoga EXECUTE de authenticated em funções de gatilho
--     (nunca são chamadas via API) e em internos/provisionamento.
-- ---------------------------------------------------------
DO $$
DECLARE
  r record;
  internal_fns text[] := ARRAY[
    'provision_estetica_anamnesis_templates','provision_fisioterapia_anamnesis_templates',
    'provision_nutricao_anamnesis_templates','provision_pilates_anamnesis_templates',
    'provision_psicologia_anamnesis_templates','provision_other_specialty_defaults',
    'provision_other_specialty_medical_record_templates',
    'seed_clinic_resources','seed_default_payment_methods',
    'ensure_public_booking_default_schedule','default_public_booking_week_schedule',
    'ensure_system_templates_integrity','enforce_plan_limit',
    'generate_commission_entry','generate_validation_code','generate_secure_token',
    'generate_platform_occurrence_code','generate_support_ticket_code',
    'generate_teleconsultation_token','generate_anamnesis_sign_metadata',
    'create_professional_from_invitation','get_super_admin_template_catalog',
    'resolve_commission_rule','notify_clinic_users','render_appointment_message',
    'normalize_anamnesis_template_version','handle_new_user','handle_consent_revocation',
    'sync_appointment_teleconsultation_status','expire_overdue_trials_all'
  ];
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef
      AND (p.prorettype = 'trigger'::regtype OR p.proname = ANY(internal_fns))
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM authenticated, PUBLIC', r.sig);
  END LOOP;
END $$;

-- ---------------------------------------------------------
-- 1c. COMISSÕES: exigem clínica do usuário + owner/admin
-- ---------------------------------------------------------
CREATE OR REPLACE FUNCTION public.mark_commission_paid(_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE v_clinic uuid;
BEGIN
  SELECT clinic_id INTO v_clinic FROM public.commission_entries WHERE id = _id;
  IF v_clinic IS NULL THEN RAISE EXCEPTION 'Comissão não encontrada'; END IF;
  IF auth.uid() IS NULL
     OR v_clinic <> public.get_user_clinic_id_for_rls()
     OR NOT (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'admin')) THEN
    RAISE EXCEPTION 'Sem permissão para alterar esta comissão' USING ERRCODE = '42501';
  END IF;
  UPDATE public.commission_entries
     SET status='pago', paid_at=now(), updated_at=now()
   WHERE id=_id AND clinic_id = v_clinic AND status IN ('pendente','aprovado');
END; $$;

CREATE OR REPLACE FUNCTION public.cancel_commission(_id uuid, _reason text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE v_clinic uuid;
BEGIN
  SELECT clinic_id INTO v_clinic FROM public.commission_entries WHERE id = _id;
  IF v_clinic IS NULL THEN RAISE EXCEPTION 'Comissão não encontrada'; END IF;
  IF auth.uid() IS NULL
     OR v_clinic <> public.get_user_clinic_id_for_rls()
     OR NOT (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'admin')) THEN
    RAISE EXCEPTION 'Sem permissão para alterar esta comissão' USING ERRCODE = '42501';
  END IF;
  UPDATE public.commission_entries
     SET status='cancelado', cancelled_at=now(), cancelled_by=auth.uid(),
         cancel_reason=_reason, updated_at=now()
   WHERE id=_id AND clinic_id = v_clinic AND status IN ('pendente','aprovado','bloqueada');
END; $$;

CREATE OR REPLACE FUNCTION public.refund_commission(_id uuid, _reason text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE v_clinic uuid;
BEGIN
  SELECT clinic_id INTO v_clinic FROM public.commission_entries WHERE id = _id;
  IF v_clinic IS NULL THEN RAISE EXCEPTION 'Comissão não encontrada'; END IF;
  IF auth.uid() IS NULL
     OR v_clinic <> public.get_user_clinic_id_for_rls()
     OR NOT (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'admin')) THEN
    RAISE EXCEPTION 'Sem permissão para alterar esta comissão' USING ERRCODE = '42501';
  END IF;
  UPDATE public.commission_entries
     SET status='estornada', cancelled_at=now(), cancelled_by=auth.uid(),
         cancel_reason=_reason, updated_at=now()
   WHERE id=_id AND clinic_id = v_clinic AND status='pago';
END; $$;

-- ---------------------------------------------------------
-- 1d. RENEGOCIAÇÃO FINANCEIRA: clínica do usuário + admin/owner financeiro
-- ---------------------------------------------------------
CREATE OR REPLACE FUNCTION public.renegotiate_transaction(_id uuid, _new_amount numeric, _new_due_date date, _reason text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE t public.finance_transactions;
BEGIN
  IF _reason IS NULL OR length(trim(_reason)) < 3 THEN
    RAISE EXCEPTION 'Motivo obrigatório para renegociação';
  END IF;
  SELECT * INTO t FROM public.finance_transactions WHERE id = _id;
  IF t.id IS NULL THEN RAISE EXCEPTION 'Lançamento não encontrado'; END IF;

  IF auth.uid() IS NULL
     OR t.clinic_id <> public.get_user_clinic_id_for_rls()
     OR NOT public.finance_is_admin_or_owner(t.clinic_id) THEN
    RAISE EXCEPTION 'Sem permissão para renegociar este lançamento' USING ERRCODE = '42501';
  END IF;

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
   WHERE id = _id AND clinic_id = t.clinic_id;
END; $$;

-- ---------------------------------------------------------
-- 1e. RESET DE MODELOS DE ANAMNESE: admin da própria clínica ou serviço interno
-- ---------------------------------------------------------
CREATE OR REPLACE FUNCTION public.reset_anamnesis_templates(p_clinic_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  v_is_service boolean := coalesce(
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role'), '') = 'service_role';
BEGIN
  IF NOT v_is_service
     AND NOT (auth.uid() IS NOT NULL AND public.is_clinic_admin(auth.uid(), p_clinic_id)) THEN
    RAISE EXCEPTION 'Sem permissão para redefinir modelos desta clínica' USING ERRCODE = '42501';
  END IF;

  UPDATE public.anamnesis_templates
  SET archived = TRUE, is_active = FALSE, updated_at = now()
  WHERE clinic_id = p_clinic_id
    AND system_locked = FALSE
    AND is_system = FALSE;
END; $$;

-- ---------------------------------------------------------
-- 1f. ESPECIALIDADES: guardas de administrador via wrappers
--     (implementações originais preservadas como *_internal)
-- ---------------------------------------------------------
ALTER FUNCTION public.provision_specialty(uuid, text) RENAME TO provision_specialty_internal;
REVOKE ALL ON FUNCTION public.provision_specialty_internal(uuid, text) FROM anon, authenticated, PUBLIC;

CREATE OR REPLACE FUNCTION public.provision_specialty(_clinic_id uuid, _specialty_slug text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  v_is_service boolean := coalesce(
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role'), '') = 'service_role';
BEGIN
  IF NOT v_is_service
     AND NOT (auth.uid() IS NOT NULL AND public.is_clinic_admin(auth.uid(), _clinic_id)) THEN
    RAISE EXCEPTION 'Sem permissão para ativar especialidades desta clínica' USING ERRCODE = '42501';
  END IF;
  RETURN public.provision_specialty_internal(_clinic_id, _specialty_slug);
END; $$;

ALTER FUNCTION public.deactivate_specialty(uuid, text) RENAME TO deactivate_specialty_internal;
REVOKE ALL ON FUNCTION public.deactivate_specialty_internal(uuid, text) FROM anon, authenticated, PUBLIC;

CREATE OR REPLACE FUNCTION public.deactivate_specialty(_clinic_id uuid, _specialty_slug text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  v_is_service boolean := coalesce(
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role'), '') = 'service_role';
BEGIN
  IF NOT v_is_service
     AND NOT (auth.uid() IS NOT NULL AND public.is_clinic_admin(auth.uid(), _clinic_id)) THEN
    RAISE EXCEPTION 'Sem permissão para desativar especialidades desta clínica' USING ERRCODE = '42501';
  END IF;
  RETURN public.deactivate_specialty_internal(_clinic_id, _specialty_slug);
END; $$;

GRANT EXECUTE ON FUNCTION public.provision_specialty(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.deactivate_specialty(uuid, text) TO authenticated;

-- ---------------------------------------------------------
-- 1g. EXPIRAÇÃO DE TRIALS: escopo da própria clínica
--     (super admin da plataforma processa todas)
-- ---------------------------------------------------------
CREATE OR REPLACE FUNCTION public.expire_overdue_trials()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  v_count integer := 0;
  v_row record;
  v_uid uuid := auth.uid();
  v_clinic uuid;
  v_all boolean;
BEGIN
  IF v_uid IS NULL THEN RETURN 0; END IF;

  v_all := public.is_platform_admin(v_uid);
  IF NOT v_all THEN
    v_clinic := public.get_user_clinic_id_for_rls();
    IF v_clinic IS NULL THEN RETURN 0; END IF;
  END IF;

  FOR v_row IN
    SELECT id, clinic_id FROM public.clinic_subscriptions
    WHERE status='trial' AND trial_ends_at IS NOT NULL AND trial_ends_at < now()
      AND (v_all OR clinic_id = v_clinic)
  LOOP
    INSERT INTO public.platform_audit_logs (actor_user_id, action, target_type, target_id, clinic_id, metadata)
    VALUES (v_uid, 'subscription.trial_expired', 'clinic_subscription', v_row.id, v_row.clinic_id,
            jsonb_build_object('expired_at', now()));
  END LOOP;

  UPDATE public.clinic_subscriptions SET status='overdue', updated_at=now()
  WHERE status='trial' AND trial_ends_at IS NOT NULL AND trial_ends_at < now()
    AND (v_all OR clinic_id = v_clinic);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END; $$;

-- ---------------------------------------------------------
-- 1h. PACIENTE PÚBLICO: só com agendamento online ativo ou staff da clínica
-- ---------------------------------------------------------
CREATE OR REPLACE FUNCTION public.find_or_create_public_patient(
  _clinic_id uuid, _full_name text, _phone text,
  _email text DEFAULT NULL::text, _cpf text DEFAULT NULL::text, _birth_date date DEFAULT NULL::date)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  _patient_id uuid;
BEGIN
  IF NOT public.is_public_booking_enabled(_clinic_id)
     AND NOT (auth.uid() IS NOT NULL AND _clinic_id = public.get_user_clinic_id_for_rls()) THEN
    RAISE EXCEPTION 'Agendamento público indisponível para esta clínica' USING ERRCODE = '42501';
  END IF;

  IF _cpf IS NOT NULL AND _cpf != '' THEN
    SELECT id INTO _patient_id FROM public.patients
    WHERE clinic_id = _clinic_id AND cpf = _cpf AND is_active = true LIMIT 1;
  END IF;

  IF _patient_id IS NULL AND _phone IS NOT NULL AND _phone != '' THEN
    SELECT id INTO _patient_id FROM public.patients
    WHERE clinic_id = _clinic_id AND phone = _phone AND is_active = true LIMIT 1;
  END IF;

  IF _patient_id IS NULL THEN
    INSERT INTO public.patients (clinic_id, full_name, phone, email, cpf, birth_date, is_active)
    VALUES (_clinic_id, _full_name, _phone, _email, _cpf, _birth_date, true)
    RETURNING id INTO _patient_id;
  END IF;

  RETURN _patient_id;
END; $$;

-- ---------------------------------------------------------
-- 2. get_user_all_permissions: remove overload insegura e
--    mantém uma única implementação canônica.
-- ---------------------------------------------------------
DROP FUNCTION IF EXISTS public.get_user_all_permissions(uuid);

CREATE OR REPLACE FUNCTION public.get_user_all_permissions(_user_id uuid, _clinic_id uuid DEFAULT NULL::uuid)
RETURNS TABLE(module app_module, actions app_action[], restrictions jsonb)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  v_clinic_id UUID;
  v_role app_role;
  v_is_service boolean := coalesce(
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role'), '') = 'service_role';
BEGIN
  SELECT ur.clinic_id, ur.role
  INTO v_clinic_id, v_role
  FROM public.user_roles ur
  WHERE ur.user_id = _user_id
    AND (_clinic_id IS NULL OR ur.clinic_id = _clinic_id)
  ORDER BY CASE WHEN _clinic_id IS NOT NULL AND ur.clinic_id = _clinic_id THEN 0 ELSE 1 END
  LIMIT 1;

  IF v_role IS NULL OR v_clinic_id IS NULL THEN
    RETURN;
  END IF;

  -- Autorização: o próprio usuário, um admin/owner da mesma clínica,
  -- ou o serviço interno (edge functions com service_role).
  IF NOT v_is_service
     AND NOT (auth.uid() IS NOT NULL AND auth.uid() = _user_id)
     AND NOT (auth.uid() IS NOT NULL AND public.is_clinic_admin(auth.uid(), v_clinic_id)) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    COALESCE(mp.module, pt.module) AS module,
    COALESCE(mp.actions, pt.actions) AS actions,
    COALESCE(mp.restrictions, pt.restrictions) AS restrictions
  FROM public.permission_templates pt
  LEFT JOIN public.module_permissions mp
    ON mp.module = pt.module
    AND mp.user_id = _user_id
    AND mp.clinic_id = v_clinic_id
  WHERE pt.role = v_role;
END; $$;

REVOKE ALL ON FUNCTION public.get_user_all_permissions(uuid, uuid) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_all_permissions(uuid, uuid) TO authenticated, service_role;