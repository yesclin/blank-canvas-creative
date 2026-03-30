
-- Provision psychology templates for all clinics that already have psicologia active
DO $$
DECLARE
  _rec RECORD;
  _result INTEGER;
BEGIN
  FOR _rec IN 
    SELECT s.clinic_id, s.id as specialty_id
    FROM specialties s 
    WHERE s.slug = 'psicologia' AND s.is_active = true
  LOOP
    _result := public.provision_psicologia_anamnesis_templates(_rec.clinic_id, _rec.specialty_id);
    RAISE NOTICE 'Provisioned % templates for clinic %', _result, _rec.clinic_id;
  END LOOP;
END;
$$;

-- Also clean up any mismatched "Clínica Geral" templates on psicologia specialties
UPDATE anamnesis_templates 
SET specialty_id = NULL, is_active = false
WHERE name ILIKE '%Clínica Geral%' 
  AND specialty_id IN (SELECT id FROM specialties WHERE slug = 'psicologia');
