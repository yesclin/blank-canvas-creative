
-- Add booking source and patient snapshot fields
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS booking_source text DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS patient_snapshot_name text,
  ADD COLUMN IF NOT EXISTS patient_snapshot_phone text;

-- Backfill booking_source from existing flags
UPDATE public.appointments
SET booking_source = CASE
  WHEN is_fit_in = true THEN 'encaixe'
  WHEN is_return = true THEN 'retorno'
  WHEN created_source = 'public_booking' THEN 'link_publico'
  ELSE 'manual'
END
WHERE booking_source IS NULL OR booking_source = 'manual';

-- Backfill patient snapshots from current patient data
UPDATE public.appointments a
SET 
  patient_snapshot_name = p.full_name,
  patient_snapshot_phone = p.phone
FROM public.patients p
WHERE a.patient_id = p.id
  AND a.patient_snapshot_name IS NULL;
