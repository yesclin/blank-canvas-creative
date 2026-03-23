-- Drop the problematic view that exposes auth.users
DROP VIEW IF EXISTS public.user_management_view;

-- Create a secure function to get user email (only for same clinic admins)
-- This avoids exposing auth.users directly
CREATE OR REPLACE FUNCTION public.get_user_email_for_admin(_target_user_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_clinic_id uuid;
  v_target_clinic_id uuid;
  v_is_admin boolean;
  v_email text;
BEGIN
  -- Get caller's clinic
  SELECT clinic_id INTO v_caller_clinic_id 
  FROM public.profiles 
  WHERE user_id = auth.uid();
  
  -- Get target user's clinic
  SELECT clinic_id INTO v_target_clinic_id 
  FROM public.profiles 
  WHERE user_id = _target_user_id;
  
  -- Check if caller is admin/owner
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ) INTO v_is_admin;
  
  -- Only return email if:
  -- 1. Same clinic
  -- 2. Caller is admin/owner
  -- 3. Or it's the user's own email
  IF (v_caller_clinic_id = v_target_clinic_id AND v_is_admin) 
     OR _target_user_id = auth.uid() THEN
    SELECT email INTO v_email FROM auth.users WHERE id = _target_user_id;
    RETURN v_email;
  END IF;
  
  RETURN NULL;
END;
$$;

-- Create a secure table-based approach for user listing
-- This stores the email on the profiles table (synced via trigger)
-- Add email column to profiles if it doesn't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email text;

-- Create a trigger to sync email from auth.users to profiles
CREATE OR REPLACE FUNCTION public.sync_user_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles 
  SET email = NEW.email
  WHERE user_id = NEW.id;
  RETURN NEW;
END;
$$;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_email_update ON auth.users;

-- Create trigger on auth.users for email sync
CREATE TRIGGER on_auth_user_email_update
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_user_email();

-- Sync existing emails
UPDATE public.profiles p
SET email = au.email
FROM auth.users au
WHERE p.user_id = au.id AND p.email IS NULL;

-- Grant necessary permissions
REVOKE ALL ON FUNCTION public.get_user_email_for_admin FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_email_for_admin TO authenticated;