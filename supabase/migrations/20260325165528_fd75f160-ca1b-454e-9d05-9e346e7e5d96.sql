
-- 1. Add professional_id to schedule_blocks
ALTER TABLE public.schedule_blocks
  ADD COLUMN IF NOT EXISTS professional_id uuid REFERENCES public.professionals(id) ON DELETE SET NULL;

-- 2. Add procedure_cost and expected_value to appointments
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS expected_value numeric,
  ADD COLUMN IF NOT EXISTS procedure_cost numeric;

-- 3. Create professional_schedule_config table
CREATE TABLE IF NOT EXISTS public.professional_schedule_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  professional_id uuid NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  use_clinic_default boolean NOT NULL DEFAULT true,
  working_days jsonb NOT NULL DEFAULT '{}',
  default_duration_minutes integer NOT NULL DEFAULT 30,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(clinic_id, professional_id)
);

ALTER TABLE public.professional_schedule_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage professional schedule config"
ON public.professional_schedule_config
FOR ALL
TO authenticated
USING (is_clinic_admin(auth.uid(), clinic_id));

CREATE POLICY "Users can view professional schedule config"
ON public.professional_schedule_config
FOR SELECT
TO authenticated
USING (clinic_id = user_clinic_id(auth.uid()));

-- 4. Add INSERT/UPDATE policies for schedule_blocks for non-admin users (recepcionistas)
CREATE POLICY "Users can insert schedule blocks in their clinic"
ON public.schedule_blocks
FOR INSERT
TO authenticated
WITH CHECK (clinic_id = user_clinic_id(auth.uid()));

CREATE POLICY "Users can update schedule blocks in their clinic"
ON public.schedule_blocks
FOR UPDATE
TO authenticated
USING (clinic_id = user_clinic_id(auth.uid()));
