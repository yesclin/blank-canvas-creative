
-- Add specialty_id column to procedures table (FK to specialties)
ALTER TABLE public.procedures
ADD COLUMN specialty_id uuid REFERENCES public.specialties(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX idx_procedures_specialty_id ON public.procedures(specialty_id);

-- Backfill specialty_id from the legacy text 'specialty' column where possible
UPDATE public.procedures p
SET specialty_id = s.id
FROM public.specialties s
WHERE p.specialty IS NOT NULL
  AND p.specialty_id IS NULL
  AND LOWER(TRIM(p.specialty)) = LOWER(TRIM(s.name))
  AND s.clinic_id = p.clinic_id;
