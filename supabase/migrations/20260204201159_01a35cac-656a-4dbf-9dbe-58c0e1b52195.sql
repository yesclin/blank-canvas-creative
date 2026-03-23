-- Add primary specialty reference to clinics table
ALTER TABLE public.clinics
ADD COLUMN primary_specialty_id UUID REFERENCES public.specialties(id);

-- Add index for faster lookups
CREATE INDEX idx_clinics_primary_specialty ON public.clinics(primary_specialty_id);

-- Add comment for documentation
COMMENT ON COLUMN public.clinics.primary_specialty_id IS 'The main/primary specialty configured for this clinic during onboarding';