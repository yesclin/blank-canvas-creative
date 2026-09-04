REVOKE ALL ON FUNCTION public.process_appointment_consumption(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.revert_appointment_consumption(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.process_appointment_consumption(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.revert_appointment_consumption(uuid) TO authenticated, service_role;