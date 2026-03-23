-- Add tour completion tracking to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS tour_completed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.tour_completed_at IS 'Timestamp when user completed the onboarding tour';