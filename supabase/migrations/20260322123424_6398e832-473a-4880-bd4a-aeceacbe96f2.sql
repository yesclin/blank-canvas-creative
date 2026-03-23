
-- Create version for default Odontologia template (clinic 076ec70c)
INSERT INTO anamnesis_template_versions (id, template_id, version_number, structure, created_by)
SELECT 
  gen_random_uuid(),
  'ba7015b6-8653-42df-bcaa-9a9fe4df4019',
  1,
  v.structure,
  NULL
FROM anamnesis_template_versions v
WHERE v.id = '47a21061-75e8-46ea-a0da-997e0c6081ca'
AND NOT EXISTS (
  SELECT 1 FROM anamnesis_template_versions WHERE template_id = 'ba7015b6-8653-42df-bcaa-9a9fe4df4019'
);

-- Update template pointer and campos
UPDATE anamnesis_templates 
SET current_version_id = (
  SELECT id FROM anamnesis_template_versions 
  WHERE template_id = 'ba7015b6-8653-42df-bcaa-9a9fe4df4019' 
  ORDER BY version_number DESC LIMIT 1
),
campos = (
  SELECT structure FROM anamnesis_template_versions 
  WHERE template_id = 'ba7015b6-8653-42df-bcaa-9a9fe4df4019' 
  ORDER BY version_number DESC LIMIT 1
),
is_default = true
WHERE id = 'ba7015b6-8653-42df-bcaa-9a9fe4df4019';

-- Same for second clinic's default template
INSERT INTO anamnesis_template_versions (id, template_id, version_number, structure, created_by)
SELECT 
  gen_random_uuid(),
  '4cdae8e9-d472-4647-a397-d1a353b29180',
  1,
  v.structure,
  NULL
FROM anamnesis_template_versions v
WHERE v.id = '47a21061-75e8-46ea-a0da-997e0c6081ca'
AND NOT EXISTS (
  SELECT 1 FROM anamnesis_template_versions WHERE template_id = '4cdae8e9-d472-4647-a397-d1a353b29180'
);

UPDATE anamnesis_templates 
SET current_version_id = (
  SELECT id FROM anamnesis_template_versions 
  WHERE template_id = '4cdae8e9-d472-4647-a397-d1a353b29180' 
  ORDER BY version_number DESC LIMIT 1
),
campos = (
  SELECT structure FROM anamnesis_template_versions 
  WHERE template_id = '4cdae8e9-d472-4647-a397-d1a353b29180' 
  ORDER BY version_number DESC LIMIT 1
),
is_default = true
WHERE id = '4cdae8e9-d472-4647-a397-d1a353b29180';
