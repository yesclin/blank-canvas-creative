
-- Add specialty and user columns to crm_goals
ALTER TABLE public.crm_goals
  ADD COLUMN IF NOT EXISTS specialty_id uuid REFERENCES public.specialties(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Indexes for filtering
CREATE INDEX IF NOT EXISTS idx_crm_goals_clinic_period ON public.crm_goals(clinic_id, period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_crm_goals_professional ON public.crm_goals(professional_id);
CREATE INDEX IF NOT EXISTS idx_crm_goals_specialty ON public.crm_goals(specialty_id);
