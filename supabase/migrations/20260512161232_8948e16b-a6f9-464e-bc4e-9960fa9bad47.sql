
ALTER TABLE public.anamnesis_templates DISABLE TRIGGER USER;

-- Reactivate system templates that have content (>=2 fields) and were incorrectly deactivated
UPDATE public.anamnesis_templates
SET is_active = true
WHERE is_system = true
  AND archived = false
  AND is_active = false
  AND jsonb_array_length(COALESCE(fields,'[]'::jsonb)) >= 2;

-- Re-enforce single default PER (clinic_id, specialty_id)
WITH ranked AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY COALESCE(clinic_id::text,'__global__'), specialty_id
           ORDER BY is_default DESC, jsonb_array_length(COALESCE(fields,'[]'::jsonb)) DESC, created_at ASC
         ) AS rn
  FROM public.anamnesis_templates
  WHERE is_active = true AND archived = false
)
UPDATE public.anamnesis_templates t
SET is_default = (r.rn = 1)
FROM ranked r
WHERE t.id = r.id;

ALTER TABLE public.anamnesis_templates ENABLE TRIGGER USER;
