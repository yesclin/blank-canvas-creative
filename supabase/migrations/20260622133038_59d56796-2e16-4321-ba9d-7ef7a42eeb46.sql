CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  new_clinic_id uuid;
  user_name text;
  user_email text;
  user_phone text;
  pending_invite_clinic uuid;
BEGIN
  user_name := NULLIF(BTRIM(COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  )), '');

  user_email := NEW.email;
  user_phone := NULLIF(regexp_replace(COALESCE(
    NEW.raw_user_meta_data->>'whatsapp',
    NEW.raw_user_meta_data->>'phone',
    ''
  ), '\D', '', 'g'), '');

  -- 1) Se há convite pendente para este e-mail, NÃO criar clínica nova.
  --    O accept-invite cuidará de profile/user_roles vinculados à clínica do convite.
  SELECT clinic_id INTO pending_invite_clinic
  FROM public.user_invitations
  WHERE lower(email) = lower(user_email)
    AND status = 'pending'
    AND expires_at > now()
  ORDER BY created_at DESC
  LIMIT 1;

  IF pending_invite_clinic IS NOT NULL THEN
    -- Cria/atualiza profile mínimo SEM clinic_id (será definido no accept-invite).
    INSERT INTO public.profiles (user_id, full_name, email, is_active)
    VALUES (NEW.id, COALESCE(user_name, 'Usuário'), user_email, true)
    ON CONFLICT (user_id) DO UPDATE
    SET full_name = COALESCE(NULLIF(public.profiles.full_name, ''), EXCLUDED.full_name),
        email = COALESCE(EXCLUDED.email, public.profiles.email),
        updated_at = now();
    RETURN NEW;
  END IF;

  -- 2) Fluxo normal de cadastro independente (proprietário criando a própria clínica).
  SELECT clinic_id INTO new_clinic_id
  FROM public.profiles
  WHERE user_id = NEW.id
  LIMIT 1;

  IF new_clinic_id IS NULL THEN
    SELECT clinic_id INTO new_clinic_id
    FROM public.user_roles
    WHERE user_id = NEW.id
    ORDER BY created_at ASC
    LIMIT 1;
  END IF;

  IF new_clinic_id IS NULL THEN
    INSERT INTO public.clinics (name, email, whatsapp, phone)
    VALUES (
      COALESCE(user_name, 'Minha Clínica') || ' - Clínica',
      user_email,
      user_phone,
      user_phone
    )
    RETURNING id INTO new_clinic_id;
  ELSE
    UPDATE public.clinics
    SET email = COALESCE(public.clinics.email, user_email),
        whatsapp = COALESCE(public.clinics.whatsapp, user_phone),
        phone = COALESCE(public.clinics.phone, user_phone),
        updated_at = now()
    WHERE id = new_clinic_id;
  END IF;

  INSERT INTO public.profiles (user_id, clinic_id, full_name, email, is_active)
  VALUES (NEW.id, new_clinic_id, COALESCE(user_name, 'Usuário'), user_email, true)
  ON CONFLICT (user_id) DO UPDATE
  SET clinic_id = COALESCE(public.profiles.clinic_id, EXCLUDED.clinic_id),
      full_name = COALESCE(NULLIF(public.profiles.full_name, ''), EXCLUDED.full_name),
      email = COALESCE(EXCLUDED.email, public.profiles.email),
      is_active = true,
      updated_at = now();

  INSERT INTO public.user_roles (user_id, clinic_id, role)
  VALUES (NEW.id, new_clinic_id, 'owner')
  ON CONFLICT (user_id, clinic_id, role) DO NOTHING;

  INSERT INTO public.professionals (clinic_id, user_id, full_name, email, phone, is_active)
  SELECT new_clinic_id, NEW.id, COALESCE(user_name, 'Usuário'), user_email, user_phone, true
  WHERE NOT EXISTS (
    SELECT 1 FROM public.professionals
    WHERE user_id = NEW.id AND clinic_id = new_clinic_id
  );

  UPDATE public.professionals
  SET full_name = COALESCE(NULLIF(public.professionals.full_name, ''), COALESCE(user_name, 'Usuário')),
      email = COALESCE(public.professionals.email, user_email),
      phone = COALESCE(public.professionals.phone, user_phone),
      is_active = true,
      updated_at = now()
  WHERE user_id = NEW.id AND clinic_id = new_clinic_id;

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
    (new_clinic_id, 'Procedimento', 'procedimento', 60, '#8B5CF6'),
    (new_clinic_id, 'Encaixe', 'encaixe', 15, '#F59E0B')
  ON CONFLICT (clinic_id, slug) DO NOTHING;

  INSERT INTO public.procedures (clinic_id, name, duration_minutes, price, is_active)
  VALUES
    (new_clinic_id, 'Consulta', 30, NULL, true),
    (new_clinic_id, 'Retorno', 30, NULL, true),
    (new_clinic_id, 'Encaixe', 15, NULL, true)
  ON CONFLICT DO NOTHING;

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
$function$;