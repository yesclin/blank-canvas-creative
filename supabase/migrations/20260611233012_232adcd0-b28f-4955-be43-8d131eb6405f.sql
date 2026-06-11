
ALTER TABLE public.appointment_types
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS display_order INTEGER NOT NULL DEFAULT 0;

-- Backfill display_order per clinic by created_at order
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY clinic_id ORDER BY created_at) - 1 AS rn
  FROM public.appointment_types
)
UPDATE public.appointment_types t
SET display_order = ranked.rn
FROM ranked
WHERE t.id = ranked.id AND t.display_order = 0;

CREATE INDEX IF NOT EXISTS idx_appointment_types_clinic_order
  ON public.appointment_types (clinic_id, display_order);
