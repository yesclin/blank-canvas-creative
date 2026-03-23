
-- Fix existing user who signed up before tables existed
-- Create clinic, profile and owner role for Bruna Lopes
DO $$
DECLARE
  existing_user_id UUID := '75a14ece-2724-49fb-8b57-9f35af095525';
  new_clinic_id UUID;
  profile_exists BOOLEAN;
BEGIN
  -- Check if profile already exists
  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE user_id = existing_user_id) INTO profile_exists;
  
  IF NOT profile_exists THEN
    -- Create clinic
    INSERT INTO public.clinics (name)
    VALUES ('Bruna Lopes - Clínica')
    RETURNING id INTO new_clinic_id;
    
    -- Create profile (active)
    INSERT INTO public.profiles (user_id, clinic_id, full_name, email, is_active)
    VALUES (existing_user_id, new_clinic_id, 'Bruna Lopes', 'brunarlopess@outlook.com', true);
    
    -- Create owner role
    INSERT INTO public.user_roles (user_id, clinic_id, role)
    VALUES (existing_user_id, new_clinic_id, 'owner');
    
    RAISE NOTICE 'Created clinic, profile and owner role for user %', existing_user_id;
  END IF;
END $$;
