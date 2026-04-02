
-- crm_leads: add missing columns
ALTER TABLE public.crm_leads ADD COLUMN IF NOT EXISTS birth_date DATE;
ALTER TABLE public.crm_leads ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE public.crm_leads ADD COLUMN IF NOT EXISTS campaign_name TEXT;
ALTER TABLE public.crm_leads ADD COLUMN IF NOT EXISTS specialty_interest_id UUID REFERENCES public.specialties(id);
ALTER TABLE public.crm_leads ADD COLUMN IF NOT EXISTS procedure_interest_id UUID REFERENCES public.procedures(id);
ALTER TABLE public.crm_leads ADD COLUMN IF NOT EXISTS converted_patient_id UUID REFERENCES public.patients(id);

-- crm_opportunities: add missing columns
ALTER TABLE public.crm_opportunities ADD COLUMN IF NOT EXISTS closing_probability INT DEFAULT 0;
ALTER TABLE public.crm_opportunities ADD COLUMN IF NOT EXISTS is_won BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.crm_opportunities ADD COLUMN IF NOT EXISTS is_lost BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.crm_opportunities ADD COLUMN IF NOT EXISTS assigned_to_user_id UUID REFERENCES auth.users(id);
ALTER TABLE public.crm_opportunities ADD COLUMN IF NOT EXISTS loss_reason TEXT;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_crm_leads_specialty ON public.crm_leads(clinic_id, specialty_interest_id);
CREATE INDEX IF NOT EXISTS idx_crm_leads_assigned ON public.crm_leads(clinic_id, assigned_to);
CREATE INDEX IF NOT EXISTS idx_crm_opportunities_lead ON public.crm_opportunities(lead_id);
CREATE INDEX IF NOT EXISTS idx_crm_opportunities_assigned ON public.crm_opportunities(clinic_id, assigned_to_user_id);
