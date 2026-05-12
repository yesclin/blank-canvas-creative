
ALTER TABLE public.anamnesis_templates DISABLE TRIGGER USER;

-- 1. Desativar specialty duplicada de Estética
UPDATE public.specialties
SET is_active = false
WHERE id = 'ff7d74f8-a61f-4cc8-b4f8-90f8ea8679f2';

-- 2. Arquivar templates da specialty duplicada
UPDATE public.anamnesis_templates
SET is_active = false, archived = true, is_default = false
WHERE specialty_id = 'ff7d74f8-a61f-4cc8-b4f8-90f8ea8679f2';

-- 3. Arquivar templates oficiais quebrados (<=1 campo)
UPDATE public.anamnesis_templates
SET is_active = false, archived = true, is_default = false
WHERE is_system = true
  AND (CASE WHEN jsonb_typeof(campos) = 'array' THEN jsonb_array_length(campos) ELSE 0 END) <= 1;

-- 4. 1 default por especialidade
WITH ranked AS (
  SELECT id, specialty_id,
    ROW_NUMBER() OVER (
      PARTITION BY specialty_id
      ORDER BY (CASE WHEN jsonb_typeof(campos)='array' THEN jsonb_array_length(campos) ELSE 0 END) DESC,
               created_at ASC
    ) as rn
  FROM public.anamnesis_templates
  WHERE is_system = true AND is_active = true AND archived = false AND is_default = true
)
UPDATE public.anamnesis_templates t
SET is_default = false
FROM ranked r
WHERE t.id = r.id AND r.rn > 1;

ALTER TABLE public.anamnesis_templates ENABLE TRIGGER USER;
