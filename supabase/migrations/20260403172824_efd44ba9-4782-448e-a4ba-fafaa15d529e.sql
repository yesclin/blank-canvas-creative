
-- Provision 4 advanced aesthetics anamnesis templates
-- Uses the specialty_id from the specialties table for 'estetica' slug

DO $$
DECLARE
  v_specialty_id uuid;
  v_clinic_id uuid;
  v_template_id uuid;
BEGIN
  -- Iterate over all clinics that have the estetica specialty enabled
  FOR v_clinic_id, v_specialty_id IN
    SELECT DISTINCT c.id, s.id
    FROM clinics c
    JOIN specialties s ON s.clinic_id = c.id AND s.slug = 'estetica' AND s.is_active = true
  LOOP
    -- Template 1: Anamnese Estética Facial
    IF NOT EXISTS (
      SELECT 1 FROM anamnesis_templates 
      WHERE clinic_id = v_clinic_id AND specialty_id = v_specialty_id 
      AND name = 'Anamnese Estética Facial - YesClin'
    ) THEN
      INSERT INTO anamnesis_templates (
        clinic_id, specialty_id, name, description, icon, is_active, is_default, is_system, archived, campos, fields, template_type
      ) VALUES (
        v_clinic_id, v_specialty_id,
        'Anamnese Estética Facial - YesClin',
        'Avaliação facial com Fitzpatrick, Baumann, acne, discromia e hiperpigmentação periocular',
        'Sparkles', true, false, true, false, '[]'::jsonb, '[]'::jsonb, 'anamnese_estetica_facial'
      ) RETURNING id INTO v_template_id;

      INSERT INTO anamnesis_template_versions (template_id, version, version_number, structure, fields) 
      VALUES (v_template_id, 1, 1, '[]'::jsonb, '[]'::jsonb);

      UPDATE anamnesis_templates SET current_version_id = (
        SELECT id FROM anamnesis_template_versions WHERE template_id = v_template_id ORDER BY version DESC LIMIT 1
      ) WHERE id = v_template_id;
    END IF;

    -- Template 2: Anamnese Pele e Avaliação Facial
    IF NOT EXISTS (
      SELECT 1 FROM anamnesis_templates 
      WHERE clinic_id = v_clinic_id AND specialty_id = v_specialty_id 
      AND name = 'Anamnese Pele e Avaliação Facial - YesClin'
    ) THEN
      INSERT INTO anamnesis_templates (
        clinic_id, specialty_id, name, description, icon, is_active, is_default, is_system, archived, campos, fields, template_type
      ) VALUES (
        v_clinic_id, v_specialty_id,
        'Anamnese Pele e Avaliação Facial - YesClin',
        'Avaliação dermatológica com escalas de cicatrizes, rosácea, discromia e Glogau',
        'ScanFace', true, false, true, false, '[]'::jsonb, '[]'::jsonb, 'anamnese_pele_avaliacao'
      ) RETURNING id INTO v_template_id;

      INSERT INTO anamnesis_template_versions (template_id, version, version_number, structure, fields)
      VALUES (v_template_id, 1, 1, '[]'::jsonb, '[]'::jsonb);

      UPDATE anamnesis_templates SET current_version_id = (
        SELECT id FROM anamnesis_template_versions WHERE template_id = v_template_id ORDER BY version DESC LIMIT 1
      ) WHERE id = v_template_id;
    END IF;

    -- Template 3: Anamnese Capilar
    IF NOT EXISTS (
      SELECT 1 FROM anamnesis_templates 
      WHERE clinic_id = v_clinic_id AND specialty_id = v_specialty_id 
      AND name = 'Anamnese Capilar - YesClin'
    ) THEN
      INSERT INTO anamnesis_templates (
        clinic_id, specialty_id, name, description, icon, is_active, is_default, is_system, archived, campos, fields, template_type
      ) VALUES (
        v_clinic_id, v_specialty_id,
        'Anamnese Capilar - YesClin',
        'Avaliação capilar com displasias, escalas de Savin e Norwood-Hamilton, tricoscopia',
        'Scissors', true, false, true, false, '[]'::jsonb, '[]'::jsonb, 'anamnese_capilar'
      ) RETURNING id INTO v_template_id;

      INSERT INTO anamnesis_template_versions (template_id, version, version_number, structure, fields)
      VALUES (v_template_id, 1, 1, '[]'::jsonb, '[]'::jsonb);

      UPDATE anamnesis_templates SET current_version_id = (
        SELECT id FROM anamnesis_template_versions WHERE template_id = v_template_id ORDER BY version DESC LIMIT 1
      ) WHERE id = v_template_id;
    END IF;

    -- Template 4: Anamnese Corporal
    IF NOT EXISTS (
      SELECT 1 FROM anamnesis_templates 
      WHERE clinic_id = v_clinic_id AND specialty_id = v_specialty_id 
      AND name = 'Anamnese Corporal - YesClin'
    ) THEN
      INSERT INTO anamnesis_templates (
        clinic_id, specialty_id, name, description, icon, is_active, is_default, is_system, archived, campos, fields, template_type
      ) VALUES (
        v_clinic_id, v_specialty_id,
        'Anamnese Corporal - YesClin',
        'Avaliação corporal com IMC, adipometria, perimetria, celulite, estrias e diástase',
        'User', true, false, true, false, '[]'::jsonb, '[]'::jsonb, 'anamnese_corporal_avancada'
      ) RETURNING id INTO v_template_id;

      INSERT INTO anamnesis_template_versions (template_id, version, version_number, structure, fields)
      VALUES (v_template_id, 1, 1, '[]'::jsonb, '[]'::jsonb);

      UPDATE anamnesis_templates SET current_version_id = (
        SELECT id FROM anamnesis_template_versions WHERE template_id = v_template_id ORDER BY version DESC LIMIT 1
      ) WHERE id = v_template_id;
    END IF;

  END LOOP;
END;
$$;
