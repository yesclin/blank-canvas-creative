
-- ============================================================
-- MIGRATION 1: deactivate_specialty() + handle_new_user() seeds
-- ============================================================

-- -------------------------------------------------------
-- 1. NEW FUNCTION: deactivate_specialty
--    Transactional, idempotent, preserves clinical history
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.deactivate_specialty(_clinic_id uuid, _specialty_slug text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  _specialty_id UUID;
  _was_active BOOLEAN;
  _tabs_deactivated INTEGER := 0;
  _templates_deactivated INTEGER := 0;
BEGIN
  SELECT id, is_active INTO _specialty_id, _was_active
  FROM public.specialties
  WHERE clinic_id = _clinic_id AND slug = _specialty_slug
  LIMIT 1;

  IF _specialty_id IS NULL THEN
    RETURN jsonb_build_object(
      'specialty_id', null,
      'specialty_deactivated', false,
      'tabs_deactivated', 0,
      'templates_deactivated', 0,
      'message', 'Especialidade não encontrada para esta clínica'
    );
  END IF;

  IF NOT _was_active THEN
    RETURN jsonb_build_object(
      'specialty_id', _specialty_id,
      'specialty_deactivated', false,
      'tabs_deactivated', 0,
      'templates_deactivated', 0,
      'message', 'Especialidade já estava desativada'
    );
  END IF;

  UPDATE public.specialties
  SET is_active = false, updated_at = now()
  WHERE id = _specialty_id;

  UPDATE public.medical_record_tabs
  SET is_active = false, updated_at = now()
  WHERE clinic_id = _clinic_id AND specialty_id = _specialty_id AND is_active = true;
  GET DIAGNOSTICS _tabs_deactivated = ROW_COUNT;

  UPDATE public.anamnesis_templates
  SET is_active = false, updated_at = now()
  WHERE clinic_id = _clinic_id AND specialty_id = _specialty_id AND is_active = true;
  GET DIAGNOSTICS _templates_deactivated = ROW_COUNT;

  RETURN jsonb_build_object(
    'specialty_id', _specialty_id,
    'specialty_deactivated', true,
    'tabs_deactivated', _tabs_deactivated,
    'templates_deactivated', _templates_deactivated
  );
END;
$$;

-- -------------------------------------------------------
-- 2. ALTER FUNCTION: handle_new_user
--    Adds default seeds, preserves existing behavior
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  new_clinic_id UUID;
  user_name TEXT;
  user_email TEXT;
BEGIN
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );
  user_email := NEW.email;

  INSERT INTO public.clinics (name) VALUES (COALESCE(user_name, 'Minha Clínica') || ' - Clínica')
  RETURNING id INTO new_clinic_id;

  INSERT INTO public.profiles (user_id, clinic_id, full_name, email, is_active)
  VALUES (NEW.id, new_clinic_id, user_name, user_email, true);

  INSERT INTO public.user_roles (user_id, clinic_id, role)
  VALUES (NEW.id, new_clinic_id, 'owner');

  INSERT INTO public.professionals (clinic_id, user_id, full_name, email, is_active)
  VALUES (new_clinic_id, NEW.id, user_name, user_email, true);

  INSERT INTO public.appointment_statuses (clinic_id, name, slug, sort_order, is_system, color, icon)
  VALUES
    (new_clinic_id, 'Não Confirmado', 'nao_confirmado', 1, true, '#9CA3AF', 'clock'),
    (new_clinic_id, 'Confirmado', 'confirmado', 2, true, '#3B82F6', 'check-circle'),
    (new_clinic_id, 'Chegou', 'chegou', 3, true, '#F59E0B', 'log-in'),
    (new_clinic_id, 'Em Atendimento', 'em_atendimento', 4, true, '#8B5CF6', 'activity'),
    (new_clinic_id, 'Finalizado', 'finalizado', 5, true, '#10B981', 'check'),
    (new_clinic_id, 'Cancelado', 'cancelado', 6, true, '#EF4444', 'x-circle')
  ON CONFLICT (clinic_id, slug) DO NOTHING;

  INSERT INTO public.appointment_types (clinic_id, name, slug, duration_minutes, color)
  VALUES
    (new_clinic_id, 'Consulta', 'consulta', 30, '#3B82F6'),
    (new_clinic_id, 'Retorno', 'retorno', 20, '#10B981'),
    (new_clinic_id, 'Procedimento', 'procedimento', 60, '#8B5CF6')
  ON CONFLICT (clinic_id, slug) DO NOTHING;

  INSERT INTO public.finance_categories (clinic_id, name, type, is_system, color)
  VALUES
    (new_clinic_id, 'Consultas', 'receita', true, '#10B981'),
    (new_clinic_id, 'Procedimentos', 'receita', true, '#3B82F6'),
    (new_clinic_id, 'Produtos', 'receita', true, '#8B5CF6'),
    (new_clinic_id, 'Aluguel', 'despesa', true, '#EF4444'),
    (new_clinic_id, 'Materiais', 'despesa', true, '#F59E0B'),
    (new_clinic_id, 'Outros', 'despesa', true, '#6B7280')
  ON CONFLICT (clinic_id, name, type) DO NOTHING;

  RETURN NEW;
END;
$$;
