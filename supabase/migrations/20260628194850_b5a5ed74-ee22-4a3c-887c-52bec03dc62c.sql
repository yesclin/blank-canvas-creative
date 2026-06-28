
CREATE OR REPLACE FUNCTION public.is_public_booking_enabled(_clinic_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT public_booking_enabled FROM public.clinics WHERE id = _clinic_id),
    false
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_public_booking_enabled(uuid) TO anon, authenticated;

DROP POLICY IF EXISTS "Anon can create public bookings" ON public.appointments;

CREATE POLICY "Anon can create public bookings"
ON public.appointments
FOR INSERT
TO anon
WITH CHECK (
  created_source = 'public_patient'
  AND public.is_public_booking_enabled(clinic_id)
);
