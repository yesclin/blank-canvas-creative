-- Fix: Remove overly permissive public SELECT policy on user_invitations
-- Edge functions use service_role key and bypass RLS, so this policy is unnecessary
DROP POLICY IF EXISTS "Anyone can view invitation by token" ON public.user_invitations;

-- Add a clinic-scoped policy so authenticated users can still list invitations for their clinic
CREATE POLICY "Clinic members can view their clinic invitations"
ON public.user_invitations
FOR SELECT
USING (
  clinic_id IN (
    SELECT p.clinic_id FROM profiles p WHERE p.user_id = auth.uid()
    UNION
    SELECT pr.clinic_id FROM professionals pr WHERE pr.user_id = auth.uid()
  )
);