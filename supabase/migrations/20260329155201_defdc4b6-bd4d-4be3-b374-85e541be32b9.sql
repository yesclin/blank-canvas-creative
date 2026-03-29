
-- Backfill: create version 1 for templates that have no versions
INSERT INTO public.anamnesis_template_versions (template_id, version, version_number, structure, fields)
SELECT at.id, 1, 1, 
       COALESCE(at.campos, at.fields, '[]'::jsonb), 
       COALESCE(at.fields, at.campos, '[]'::jsonb)
FROM public.anamnesis_templates at
WHERE NOT EXISTS (
  SELECT 1 FROM public.anamnesis_template_versions v WHERE v.template_id = at.id
);

-- Link current_version_id for templates that don't have it set
UPDATE public.anamnesis_templates at
SET current_version_id = (
  SELECT v.id FROM public.anamnesis_template_versions v 
  WHERE v.template_id = at.id 
  ORDER BY v.version DESC LIMIT 1
)
WHERE at.current_version_id IS NULL
  AND EXISTS (SELECT 1 FROM public.anamnesis_template_versions v WHERE v.template_id = at.id);
