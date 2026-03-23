-- Fix RLS policies for specialties table to allow admins/owners to create specialties during onboarding
-- The issue is that the current policy requires a "professionals" entry, but admins might not have one yet

-- First, drop the problematic policy
DROP POLICY IF EXISTS "Owners can manage clinic specialties" ON public.specialties;

-- Create a new policy that allows users with admin/owner role in the clinic to manage specialties
-- This uses the user_roles table instead of professionals table
CREATE POLICY "Admins and owners can manage clinic specialties"
ON public.specialties
FOR ALL
USING (
  clinic_id IN (
    SELECT ur.clinic_id 
    FROM user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('admin', 'owner')
  )
)
WITH CHECK (
  clinic_id IN (
    SELECT ur.clinic_id 
    FROM user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('admin', 'owner')
  )
);

-- Also add a fallback policy for users linked to the clinic via profiles (for initial setup)
CREATE POLICY "Users can create specialties for their clinic"
ON public.specialties
FOR INSERT
WITH CHECK (
  clinic_id IN (
    SELECT p.clinic_id 
    FROM profiles p 
    WHERE p.user_id = auth.uid()
  )
);