CREATE OR REPLACE FUNCTION public.get_user_all_permissions(_user_id UUID, _clinic_id UUID DEFAULT NULL)
RETURNS TABLE(
  module app_module,
  actions app_action[],
  restrictions JSONB
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_clinic_id UUID;
  v_role app_role;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> _user_id THEN
    RETURN;
  END IF;

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
END;
$$;