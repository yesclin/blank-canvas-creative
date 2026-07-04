REVOKE EXECUTE ON FUNCTION public.get_enabled_anamnesis_templates_for_prontuario(uuid, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_enabled_anamnesis_templates_for_prontuario(uuid, uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_enabled_anamnesis_templates_for_prontuario(uuid, uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.resolve_clinic_resource_specialty_id(uuid, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.resolve_clinic_resource_specialty_id(uuid, text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.resolve_clinic_resource_specialty_id(uuid, text, text) TO authenticated;