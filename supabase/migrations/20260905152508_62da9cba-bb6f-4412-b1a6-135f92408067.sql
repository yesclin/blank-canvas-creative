CREATE OR REPLACE FUNCTION public.reset_anamnesis_templates(p_clinic_id uuid, p_user_id uuid)
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