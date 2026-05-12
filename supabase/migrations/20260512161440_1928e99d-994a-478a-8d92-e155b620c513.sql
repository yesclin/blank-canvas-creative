-- Migrate Odontologia templates: copy campos -> fields and reactivate
UPDATE public.anamnesis_templates
SET
  fields = campos,
  is_active = true
WHERE specialty_id = '48cd91ad-825c-4f18-9223-56a32d2346a4'
  AND jsonb_array_length(COALESCE(campos,'[]'::jsonb)) > 0
  AND jsonb_array_length(COALESCE(fields,'[]'::jsonb)) = 0;

-- Ensure only one default per (clinic_id, specialty_id) for active templates
WITH ranked AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY COALESCE(clinic_id::text,'__global__'), specialty_id
           ORDER BY is_default DESC, jsonb_array_length(COALESCE(fields,'[]'::jsonb)) DESC, created_at ASC
         ) AS rn
  FROM public.anamnesis_templates
  WHERE is_active = true
    AND archived = false
    AND specialty_id = '48cd91ad-825c-4f18-9223-56a32d2346a4'
)
UPDATE public.anamnesis_templates t
SET is_default = (r.rn = 1)
FROM ranked r
WHERE t.id = r.id;
