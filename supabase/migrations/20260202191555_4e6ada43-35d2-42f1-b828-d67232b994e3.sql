-- Function to handle new user signup
-- Creates clinic, profile and user_role with 'owner' role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_clinic_id UUID;
  user_name TEXT;
BEGIN
  -- Extract name from user metadata or email
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );

  -- Create new clinic for the user
  INSERT INTO public.clinics (name)
  VALUES (COALESCE(user_name, 'Minha Clínica') || '''s Clinic')
  RETURNING id INTO new_clinic_id;

  -- Create profile for the user
  INSERT INTO public.profiles (
    user_id,
    clinic_id,
    full_name,
    is_active
  ) VALUES (
    NEW.id,
    new_clinic_id,
    user_name,
    true
  );

  -- Create user_role with 'owner' role (highest privilege)
  INSERT INTO public.user_roles (
    user_id,
    clinic_id,
    role
  ) VALUES (
    NEW.id,
    new_clinic_id,
    'owner'
  );

  RETURN NEW;
END;
$$;

-- Create trigger on auth.users to handle new signups
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Add comment explaining the trigger
COMMENT ON FUNCTION public.handle_new_user() IS 
'Automatically creates clinic, profile and owner role when a new user signs up';