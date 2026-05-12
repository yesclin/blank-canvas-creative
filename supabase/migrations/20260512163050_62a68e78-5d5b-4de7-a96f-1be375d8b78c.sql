-- Reativa templates de anamnese que possuem conteúdo válido (versão ou campos/fields)
-- A migração anterior marcou como inativos templates personalizados que de fato tinham estrutura.
UPDATE public.anamnesis_templates
SET is_active = true,
    updated_at = now()
WHERE is_active = false
  AND archived = false
  AND (
    current_version_id IS NOT NULL
    OR jsonb_array_length(COALESCE(campos,'[]'::jsonb)) > 0
    OR jsonb_array_length(COALESCE(fields,'[]'::jsonb)) > 0
  );

-- Garante que apenas um template por (clinic_id, specialty_id) seja default
WITH ranked AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY clinic_id, specialty_id
           ORDER BY is_system DESC, created_at ASC
         ) AS rn
  FROM public.anamnesis_templates
  WHERE is_active = true AND is_default = true
)
UPDATE public.anamnesis_templates t
SET is_default = false
FROM ranked r
WHERE t.id = r.id AND r.rn > 1;