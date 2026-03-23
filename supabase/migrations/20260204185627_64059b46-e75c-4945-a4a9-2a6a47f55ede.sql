-- Add constraint to prevent admins from being linked as professionals
-- This ensures proprietario_admin cannot have clinical specialties

-- Create a function to validate professional creation
-- Prevents admins/owners from being linked as professionals
CREATE OR REPLACE FUNCTION public.validate_professional_not_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the user is an admin or owner
  IF EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = NEW.user_id
      AND role IN ('owner', 'admin')
  ) THEN
    RAISE EXCEPTION 'Usuários do tipo proprietário/admin não podem ser vinculados como profissionais de saúde';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to prevent admin/owner from being professionals
DROP TRIGGER IF EXISTS prevent_admin_as_professional ON public.professionals;
CREATE TRIGGER prevent_admin_as_professional
  BEFORE INSERT OR UPDATE ON public.professionals
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_professional_not_admin();

-- Create a function to validate that changing role to admin removes professional link
CREATE OR REPLACE FUNCTION public.validate_role_change_removes_professional()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If changing to admin/owner role, check for existing professional record
  IF NEW.role IN ('owner', 'admin') THEN
    IF EXISTS (
      SELECT 1 FROM public.professionals
      WHERE user_id = NEW.user_id
        AND is_active = true
    ) THEN
      -- Deactivate the professional record
      UPDATE public.professionals
      SET is_active = false
      WHERE user_id = NEW.user_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on user_roles to handle role changes
DROP TRIGGER IF EXISTS on_role_change_handle_professional ON public.user_roles;
CREATE TRIGGER on_role_change_handle_professional
  AFTER INSERT OR UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_role_change_removes_professional();

-- Create a function to check if user is admin/owner (for frontend use)
CREATE OR REPLACE FUNCTION public.is_proprietario_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('owner', 'admin')
  )
$$;

-- Create a function to check if user can manage clinic settings
CREATE OR REPLACE FUNCTION public.can_manage_clinic(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_proprietario_admin(_user_id)
$$;

-- Create a function to check if user can manage users
CREATE OR REPLACE FUNCTION public.can_manage_users(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Only owners can manage users
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'owner'
  )
$$;

-- Add comments for documentation
COMMENT ON FUNCTION public.validate_professional_not_admin IS 'Impede que usuários admin/owner sejam vinculados como profissionais';
COMMENT ON FUNCTION public.is_proprietario_admin IS 'Verifica se usuário é proprietário ou administrador';
COMMENT ON FUNCTION public.can_manage_clinic IS 'Verifica se usuário pode gerenciar configurações da clínica';
COMMENT ON FUNCTION public.can_manage_users IS 'Verifica se usuário pode gerenciar outros usuários (apenas owner)';