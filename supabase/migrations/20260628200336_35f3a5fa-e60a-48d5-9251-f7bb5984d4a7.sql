
REVOKE EXECUTE ON FUNCTION public.notify_clinic_users(uuid, app_role[], text, text, text, text, text, uuid, text, uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.notify_clinic_users(uuid, app_role[], text, text, text, text, text, uuid, text, uuid[]) TO authenticated, service_role;
