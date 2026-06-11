REVOKE EXECUTE ON FUNCTION public.restore_system_anamnesis_templates(uuid, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.restore_system_anamnesis_templates(uuid, uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.restore_system_anamnesis_templates(uuid, uuid) TO authenticated;