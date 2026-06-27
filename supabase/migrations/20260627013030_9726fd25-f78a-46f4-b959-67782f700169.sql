REVOKE EXECUTE ON FUNCTION public.get_appointment_medical_record_context(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_appointment_medical_record_context(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_appointment_medical_record_context(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_appointment_medical_record_context(uuid) TO service_role;