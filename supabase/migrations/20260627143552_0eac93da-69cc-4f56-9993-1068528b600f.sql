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
WHERE slug IS NOT NULL;

GRANT SELECT ON public.public_clinic_booking TO anon, authenticated;