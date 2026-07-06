GRANT SELECT, INSERT, UPDATE, DELETE ON public.clinic_resources TO authenticated;
GRANT ALL ON public.clinic_resources TO service_role;

DROP POLICY IF EXISTS clinic_resources_select_members ON public.clinic_resources;

CREATE POLICY clinic_resources_select_members
ON public.clinic_resources
FOR SELECT
TO authenticated
USING (
  public.is_platform_admin(auth.uid())
  OR EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.user_id = auth.uid()
      AND p.clinic_id = clinic_resources.clinic_id
      AND COALESCE(p.is_active, true) = true
  )
);