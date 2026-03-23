
-- Fix overly permissive clinics INSERT policy
-- The handle_new_user trigger runs as SECURITY DEFINER so it bypasses RLS.
-- Regular users should not be able to insert clinics directly.
DROP POLICY IF EXISTS "System can insert clinics" ON public.clinics;

CREATE POLICY "Only trigger can insert clinics"
ON public.clinics FOR INSERT
TO authenticated
WITH CHECK (
  NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE user_id = auth.uid()
  )
);
