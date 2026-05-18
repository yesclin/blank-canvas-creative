
-- 1) Restrict SELECT on clinic_channel_integrations to clinic admins/owners only
DROP POLICY IF EXISTS "Members can view channel integrations" ON public.clinic_channel_integrations;

CREATE POLICY "Admins can view channel integrations"
ON public.clinic_channel_integrations
FOR SELECT
USING (public.is_clinic_admin(auth.uid(), clinic_id));

-- 2) Make is_platform_super_admin strictly stricter than is_platform_admin
CREATE OR REPLACE FUNCTION public.is_platform_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.platform_admins
    WHERE user_id = _user_id AND is_active = true
  );
$function$;
