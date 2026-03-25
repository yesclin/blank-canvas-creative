-- ================================================================
-- YESCLIN: Specialty Provisioning Function + updated_at triggers + handle_new_user update
-- ================================================================

-- ==================== UPDATED_AT TRIGGER FOR ALL NEW TABLES ====================
-- Reuse existing update_updated_at_column function

DO $$ 
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'user_invitations','professional_schedules','patient_guardians','patient_insurances',
    'patient_clinical_flags','appointment_types','appointment_rules','idle_alert_settings',
    'products','product_kits','medical_record_tabs','anamnesis_templates',
    'anamnesis_records','clinical_evolutions','clinical_alerts','clinical_documents',
    'interactive_map_annotations','therapeutic_plans','recurring_session_plans',
    'finance_transactions','treatment_packages','sales','insurance_authorizations',
    'insurance_fee_rules','message_templates','automation_rules',
    'consent_terms','clinic_document_settings','clinic_document_counter'
  ])
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS set_updated_at ON public.%I; CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();',
      tbl, tbl
    );
  END LOOP;
END $$;

-- ==================== IMMUTABILITY TRIGGER FOR SIGNED RECORDS ====================
CREATE OR REPLACE FUNCTION public.prevent_signed_record_update()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.status = 'assinado' AND NEW.status != 'cancelado' THEN
    RAISE EXCEPTION 'Registros assinados são imutáveis. Não é possível editar após assinatura.';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER protect_signed_evolutions BEFORE UPDATE ON public.clinical_evolutions
  FOR EACH ROW EXECUTE FUNCTION prevent_signed_record_update();

CREATE TRIGGER protect_signed_anamnesis BEFORE UPDATE ON public.anamnesis_records
  FOR EACH ROW EXECUTE FUNCTION prevent_signed_record_update();

CREATE TRIGGER protect_signed_documents BEFORE UPDATE ON public.clinical_documents
  FOR EACH ROW EXECUTE FUNCTION prevent_signed_record_update();

-- ==================== SPECIALTY PROVISIONING FUNCTION ====================
-- Idempotent: can be called multiple times without duplicating data
-- Uses ON CONFLICT DO NOTHING for all inserts

CREATE OR REPLACE FUNCTION public.provision_specialty(_clinic_id UUID, _specialty_slug TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _specialty_id UUID;
  _specialty_name TEXT;
  _result JSONB := '{}';
  _tab_id UUID;
  _tabs_created INTEGER := 0;
  _templates_created INTEGER := 0;
BEGIN
  -- Resolve specialty name from slug
  SELECT name INTO _specialty_name FROM (VALUES
    ('geral', 'Clínica Geral'),
    ('psicologia', 'Psicologia'),
    ('nutricao', 'Nutrição'),
    ('fisioterapia', 'Fisioterapia'),
    ('pilates', 'Pilates'),
    ('estetica', 'Estética / Harmonização Facial'),
    ('odontologia', 'Odontologia'),
    ('dermatologia', 'Dermatologia'),
    ('pediatria', 'Pediatria')
  ) AS t(slug, name) WHERE t.slug = _specialty_slug;

  IF _specialty_name IS NULL THEN
    RAISE EXCEPTION 'Especialidade não reconhecida: %', _specialty_slug;
  END IF;

  -- 1. Create or activate specialty record
  INSERT INTO public.specialties (clinic_id, name, slug, is_active, specialty_type)
  VALUES (_clinic_id, _specialty_name, _specialty_slug, true, 'padrao')
  ON CONFLICT (clinic_id, slug) WHERE clinic_id IS NOT NULL
    DO UPDATE SET is_active = true, updated_at = now()
  RETURNING id INTO _specialty_id;
  
  -- Fallback: if ON CONFLICT didn't return (no unique constraint match), fetch it
  IF _specialty_id IS NULL THEN
    SELECT id INTO _specialty_id FROM specialties 
    WHERE clinic_id = _clinic_id AND slug = _specialty_slug LIMIT 1;
  END IF;

  -- 2. Provision default medical record tabs based on specialty
  -- Common tabs for all specialties
  INSERT INTO public.medical_record_tabs (clinic_id, specialty_id, name, slug, sort_order, is_system)
  VALUES
    (_clinic_id, _specialty_id, 'Anamnese', 'anamnese', 1, true),
    (_clinic_id, _specialty_id, 'Evolução', 'evolucao', 2, true),
    (_clinic_id, _specialty_id, 'Documentos', 'documentos', 3, true),
    (_clinic_id, _specialty_id, 'Arquivos', 'arquivos', 4, true)
  ON CONFLICT (clinic_id, specialty_id, slug) DO NOTHING;
  GET DIAGNOSTICS _tabs_created = ROW_COUNT;

  -- Specialty-specific tabs
  IF _specialty_slug = 'odontologia' THEN
    INSERT INTO medical_record_tabs (clinic_id, specialty_id, name, slug, sort_order, is_system)
    VALUES (_clinic_id, _specialty_id, 'Odontograma', 'odontograma', 5, true)
    ON CONFLICT (clinic_id, specialty_id, slug) DO NOTHING;
  ELSIF _specialty_slug = 'nutricao' THEN
    INSERT INTO medical_record_tabs (clinic_id, specialty_id, name, slug, sort_order, is_system)
    VALUES 
      (_clinic_id, _specialty_id, 'Medidas Corporais', 'medidas', 5, true),
      (_clinic_id, _specialty_id, 'Plano Alimentar', 'plano-alimentar', 6, true)
    ON CONFLICT (clinic_id, specialty_id, slug) DO NOTHING;
  ELSIF _specialty_slug = 'fisioterapia' OR _specialty_slug = 'pilates' THEN
    INSERT INTO medical_record_tabs (clinic_id, specialty_id, name, slug, sort_order, is_system)
    VALUES (_clinic_id, _specialty_id, 'Plano Terapêutico', 'plano-terapeutico', 5, true)
    ON CONFLICT (clinic_id, specialty_id, slug) DO NOTHING;
  ELSIF _specialty_slug = 'estetica' THEN
    INSERT INTO medical_record_tabs (clinic_id, specialty_id, name, slug, sort_order, is_system)
    VALUES 
      (_clinic_id, _specialty_id, 'Mapa Facial', 'mapa-facial', 5, true),
      (_clinic_id, _specialty_id, 'Antes e Depois', 'antes-depois', 6, true)
    ON CONFLICT (clinic_id, specialty_id, slug) DO NOTHING;
  ELSIF _specialty_slug = 'dermatologia' THEN
    INSERT INTO medical_record_tabs (clinic_id, specialty_id, name, slug, sort_order, is_system)
    VALUES (_clinic_id, _specialty_id, 'Mapa Corporal', 'mapa-corporal', 5, true)
    ON CONFLICT (clinic_id, specialty_id, slug) DO NOTHING;
  ELSIF _specialty_slug = 'psicologia' THEN
    INSERT INTO medical_record_tabs (clinic_id, specialty_id, name, slug, sort_order, is_system)
    VALUES (_clinic_id, _specialty_id, 'Sessões', 'sessoes', 5, true)
    ON CONFLICT (clinic_id, specialty_id, slug) DO NOTHING;
  ELSIF _specialty_slug = 'pediatria' THEN
    INSERT INTO medical_record_tabs (clinic_id, specialty_id, name, slug, sort_order, is_system)
    VALUES (_clinic_id, _specialty_id, 'Crescimento', 'crescimento', 5, true)
    ON CONFLICT (clinic_id, specialty_id, slug) DO NOTHING;
  END IF;

  -- 3. Create default anamnesis template for the specialty
  INSERT INTO public.anamnesis_templates (clinic_id, specialty_id, name, is_system, fields)
  SELECT _clinic_id, _specialty_id, 'Anamnese Padrão - ' || _specialty_name, true, '[]'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM anamnesis_templates WHERE clinic_id = _clinic_id AND specialty_id = _specialty_id AND is_system = true
  );
  GET DIAGNOSTICS _templates_created = ROW_COUNT;

  _result := jsonb_build_object(
    'specialty_id', _specialty_id,
    'specialty_name', _specialty_name,
    'tabs_created', _tabs_created,
    'templates_created', _templates_created,
    'success', true
  );

  RETURN _result;
END;
$$;

-- ==================== UPDATE handle_new_user TO ALSO CREATE PROFESSIONAL ====================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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

  -- Create clinic
  INSERT INTO public.clinics (name) VALUES (COALESCE(user_name, 'Minha Clínica') || ' - Clínica')
  RETURNING id INTO new_clinic_id;

  -- Create profile (active)
  INSERT INTO public.profiles (user_id, clinic_id, full_name, email, is_active)
  VALUES (NEW.id, new_clinic_id, user_name, user_email, true);

  -- Create owner role
  INSERT INTO public.user_roles (user_id, clinic_id, role)
  VALUES (NEW.id, new_clinic_id, 'owner');

  -- Create professional linked to owner
  INSERT INTO public.professionals (clinic_id, user_id, full_name, email, is_active)
  VALUES (new_clinic_id, NEW.id, user_name, user_email, true);

  RETURN NEW;
END;
$$;

-- Ensure trigger exists on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();