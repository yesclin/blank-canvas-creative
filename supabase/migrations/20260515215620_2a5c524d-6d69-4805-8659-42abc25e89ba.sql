
-- ============================================================
-- 1) clinic_channel_integrations: hide credential columns from non-admins
-- ============================================================
-- Keep the existing "Members can view channel integrations" SELECT policy so
-- non-admin members can still see connection status, but revoke column-level
-- SELECT on sensitive credential columns from regular authenticated users.
-- Admins continue to read everything via the existing "Admins can manage"
-- ALL policy and via the get_channel_integration_credentials RPC.

REVOKE SELECT (
  access_token,
  instance_token,
  api_url,
  base_url,
  webhook_url,
  phone_number_id,
  business_account_id,
  instance_external_id,
  instance_id,
  config,
  metadata,
  settings_json,
  last_error
) ON public.clinic_channel_integrations FROM authenticated, anon;

-- ============================================================
-- 2) clinics: stop exposing all columns to anon via public_booking_enabled
-- ============================================================
DROP POLICY IF EXISTS "Anon can view minimal public booking fields" ON public.clinics;

-- Ensure the safe view is readable by anon/authenticated. The view is plain
-- (not security_definer) but it only selects whitelisted columns, so even
-- without an anon SELECT policy on clinics it would not work — recreate it
-- as SECURITY INVOKER but grant SELECT through a SECURITY DEFINER variant.
DROP VIEW IF EXISTS public.public_clinic_booking;

CREATE VIEW public.public_clinic_booking
WITH (security_invoker = false) AS
SELECT
  id,
  name,
  slug,
  logo_url,
  phone,
  public_booking_enabled,
  public_booking_settings
FROM public.clinics
WHERE public_booking_enabled = true;

GRANT SELECT ON public.public_clinic_booking TO anon, authenticated;

-- ============================================================
-- 3) medical_signature_events: fix broken profiles.id = auth.uid() condition
-- ============================================================
DROP POLICY IF EXISTS "Clinic members can read signature events" ON public.medical_signature_events;

CREATE POLICY "Clinic members can read signature events"
ON public.medical_signature_events
FOR SELECT
TO authenticated
USING (
  clinic_id IN (
    SELECT profiles.clinic_id
    FROM public.profiles
    WHERE profiles.user_id = auth.uid()
  )
);

-- ============================================================
-- 4) clinic_signature_settings: fix broken profiles.id = auth.uid() conditions
-- ============================================================
DROP POLICY IF EXISTS "Authenticated clinic members can read signature settings" ON public.clinic_signature_settings;

CREATE POLICY "Authenticated clinic members can read signature settings"
ON public.clinic_signature_settings
FOR SELECT
TO authenticated
USING (
  clinic_id IN (
    SELECT profiles.clinic_id
    FROM public.profiles
    WHERE profiles.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Owner/admin can manage signature settings" ON public.clinic_signature_settings;

CREATE POLICY "Owner/admin can manage signature settings"
ON public.clinic_signature_settings
FOR ALL
TO authenticated
USING (
  clinic_id IN (
    SELECT p.clinic_id
    FROM public.profiles p
    JOIN public.user_roles ur ON ur.user_id = p.user_id
    WHERE p.user_id = auth.uid()
      AND ur.role IN ('admin'::app_role, 'owner'::app_role)
  )
)
WITH CHECK (
  clinic_id IN (
    SELECT p.clinic_id
    FROM public.profiles p
    JOIN public.user_roles ur ON ur.user_id = p.user_id
    WHERE p.user_id = auth.uid()
      AND ur.role IN ('admin'::app_role, 'owner'::app_role)
  )
);

-- ============================================================
-- 5) professional_signatures: allow clinic admins to read signatures so
--    document generators (PDFs, prescriptions) can embed them.
-- ============================================================
CREATE POLICY "Clinic admins can view professional signatures"
ON public.professional_signatures
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.professionals p
    WHERE p.id = professional_signatures.professional_id
      AND public.is_clinic_admin(auth.uid(), p.clinic_id)
  )
);
