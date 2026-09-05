CREATE OR REPLACE FUNCTION public.provision_specialty(_clinic_id uuid, _specialty_slug text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  v_is_service boolean := coalesce(
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role'), '') = 'service_role';
  v_specialty_id uuid;
BEGIN
  IF NOT v_is_service
     AND NOT (auth.uid() IS NOT NULL AND public.is_clinic_admin(auth.uid(), _clinic_id)) THEN
    RAISE EXCEPTION 'Sem permissão para ativar especialidades desta clínica' USING ERRCODE = '42501';
  END IF;

  PERFORM public.provision_specialty_internal(_clinic_id, _specialty_slug);

  SELECT id INTO v_specialty_id
  FROM public.specialties
  WHERE clinic_id = _clinic_id AND slug = _specialty_slug
  LIMIT 1;

  RETURN jsonb_build_object('success', true, 'clinic_id', _clinic_id,
                            'slug', _specialty_slug, 'specialty_id', v_specialty_id);
END; $$;