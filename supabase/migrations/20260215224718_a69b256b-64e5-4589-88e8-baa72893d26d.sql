-- Create RPC function for resetting anamnesis templates (bypasses trigger)
CREATE OR REPLACE FUNCTION public.reset_anamnesis_templates(p_clinic_id uuid, p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Disable validation trigger
  ALTER TABLE anamnesis_templates DISABLE TRIGGER validate_template_specialty;

  -- Archive all templates visible to this clinic
  UPDATE anamnesis_templates
  SET is_active = false,
      archived = true,
      archived_at = now(),
      archived_by = p_user_id,
      is_default = false
  WHERE archived = false
    AND (clinic_id IS NULL OR clinic_id = p_clinic_id);

  -- Re-enable trigger
  ALTER TABLE anamnesis_templates ENABLE TRIGGER validate_template_specialty;

  -- Audit log
  INSERT INTO audit_logs (clinic_id, user_id, action, entity_type, metadata, user_agent)
  VALUES (p_clinic_id, p_user_id, 'reset_anamnesis_templates', 'anamnesis_templates',
          jsonb_build_object('reset_at', now()::text), 'server');
END;
$$;