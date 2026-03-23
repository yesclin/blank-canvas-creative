-- =========================================
-- Professional Specialties (N:M relationship)
-- =========================================

-- Create the professional_specialties junction table for N:M relationship
CREATE TABLE IF NOT EXISTS public.professional_specialties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  specialty_id UUID NOT NULL REFERENCES public.specialties(id) ON DELETE CASCADE,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Each professional can only have each specialty once
  UNIQUE(professional_id, specialty_id)
);

-- Enable RLS
ALTER TABLE public.professional_specialties ENABLE ROW LEVEL SECURITY;

-- RLS policies - same clinic access
CREATE POLICY "Users can view professional_specialties in their clinic"
ON public.professional_specialties
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.professionals p
    JOIN public.profiles pr ON pr.clinic_id = p.clinic_id
    WHERE p.id = professional_id
    AND pr.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage professional_specialties"
ON public.professional_specialties
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.professionals p
    WHERE p.id = professional_id
    AND public.is_clinic_admin(auth.uid(), p.clinic_id)
  )
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_professional_specialties_professional 
ON public.professional_specialties(professional_id);

CREATE INDEX IF NOT EXISTS idx_professional_specialties_specialty 
ON public.professional_specialties(specialty_id);

-- =========================================
-- Add professional fields to user_invitations
-- =========================================

-- Add columns to store professional data for later creation
ALTER TABLE public.user_invitations
ADD COLUMN IF NOT EXISTS is_professional BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS professional_type TEXT,
ADD COLUMN IF NOT EXISTS registration_number TEXT,
ADD COLUMN IF NOT EXISTS specialty_ids UUID[] DEFAULT '{}';

-- =========================================
-- Migrate existing professionals to new structure
-- =========================================

-- Insert existing specialty relationships into the new junction table
INSERT INTO public.professional_specialties (professional_id, specialty_id, is_primary)
SELECT id, specialty_id, true
FROM public.professionals
WHERE specialty_id IS NOT NULL
ON CONFLICT (professional_id, specialty_id) DO NOTHING;

-- =========================================
-- Function to create professional from invitation
-- =========================================

CREATE OR REPLACE FUNCTION public.create_professional_from_invitation(
  p_user_id UUID,
  p_clinic_id UUID,
  p_full_name TEXT,
  p_email TEXT,
  p_professional_type TEXT,
  p_registration_number TEXT,
  p_specialty_ids UUID[]
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_professional_id UUID;
  v_specialty_id UUID;
  v_is_first BOOLEAN := true;
BEGIN
  -- Create the professional record
  INSERT INTO professionals (
    clinic_id,
    user_id,
    full_name,
    email,
    registration_number,
    is_active
  ) VALUES (
    p_clinic_id,
    p_user_id,
    p_full_name,
    p_email,
    p_registration_number,
    true
  )
  RETURNING id INTO v_professional_id;
  
  -- Create specialty associations
  FOREACH v_specialty_id IN ARRAY p_specialty_ids
  LOOP
    INSERT INTO professional_specialties (professional_id, specialty_id, is_primary)
    VALUES (v_professional_id, v_specialty_id, v_is_first);
    v_is_first := false;
  END LOOP;
  
  RETURN v_professional_id;
END;
$$;