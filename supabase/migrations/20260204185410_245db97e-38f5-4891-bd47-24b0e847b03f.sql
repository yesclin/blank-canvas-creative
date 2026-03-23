-- Create user type enum that maps to the business requirements
-- This provides a cleaner interface while using the existing app_role enum internally
CREATE TYPE public.user_type AS ENUM ('proprietario_admin', 'profissional_saude', 'recepcionista');

-- Create a security definer function to get user type
-- Maps app_role to user_type for business logic
CREATE OR REPLACE FUNCTION public.get_user_type(_user_id uuid)
RETURNS public.user_type
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    CASE 
      WHEN role IN ('owner', 'admin') THEN 'proprietario_admin'::public.user_type
      WHEN role = 'profissional' THEN 'profissional_saude'::public.user_type
      WHEN role = 'recepcionista' THEN 'recepcionista'::public.user_type
    END
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- Create a security definer function to check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
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
      AND role = _role
  )
$$;

-- Create a security definer function to check if user has a specific type
CREATE OR REPLACE FUNCTION public.has_user_type(_user_id uuid, _type public.user_type)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = _user_id
      AND (
        (_type = 'proprietario_admin' AND ur.role IN ('owner', 'admin'))
        OR (_type = 'profissional_saude' AND ur.role = 'profissional')
        OR (_type = 'recepcionista' AND ur.role = 'recepcionista')
      )
  )
$$;

-- Create a security definer function to check if user is active
CREATE OR REPLACE FUNCTION public.is_user_active(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_active FROM public.profiles WHERE user_id = _user_id LIMIT 1),
    false
  )
$$;

-- Create a security definer function to check if user is owner/admin
CREATE OR REPLACE FUNCTION public.is_admin_or_owner(_user_id uuid)
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

-- Create a security definer function to get user's clinic
CREATE OR REPLACE FUNCTION public.get_user_clinic(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT clinic_id
  FROM public.profiles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- Create a comprehensive function to check if user can access the system
-- User must be: authenticated, active, and have a valid clinic
CREATE OR REPLACE FUNCTION public.can_access_system(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.user_id = _user_id
      AND p.is_active = true
      AND p.clinic_id IS NOT NULL
  )
$$;

-- Update profiles RLS to ensure inactive users cannot access data
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Active users can view clinic profiles" ON public.profiles;

CREATE POLICY "Active users can view own profile"
ON public.profiles
FOR SELECT
USING (
  user_id = auth.uid()
  OR (
    clinic_id = public.get_user_clinic(auth.uid())
    AND public.is_user_active(auth.uid())
  )
);

-- Create a view for user management that combines profile and role info
CREATE OR REPLACE VIEW public.user_management_view AS
SELECT 
  p.id as profile_id,
  p.user_id,
  p.clinic_id,
  p.full_name as nome,
  au.email,
  ur.role as app_role,
  public.get_user_type(p.user_id) as tipo_usuario,
  p.is_active as status_ativo,
  p.created_at as data_criacao,
  p.updated_at,
  p.avatar_url,
  pro.id as professional_id,
  pro.registration_number,
  pro.phone as professional_phone
FROM public.profiles p
LEFT JOIN auth.users au ON p.user_id = au.id
LEFT JOIN public.user_roles ur ON p.user_id = ur.user_id AND p.clinic_id = ur.clinic_id
LEFT JOIN public.professionals pro ON p.user_id = pro.user_id AND p.clinic_id = pro.clinic_id;

-- Grant access to the view
GRANT SELECT ON public.user_management_view TO authenticated;

-- Add comment to document the user type mapping
COMMENT ON TYPE public.user_type IS 'Tipo de usuário do sistema: proprietario_admin (owner/admin), profissional_saude, recepcionista';
COMMENT ON FUNCTION public.get_user_type IS 'Retorna o tipo de usuário mapeado do app_role';
COMMENT ON FUNCTION public.has_user_type IS 'Verifica se o usuário possui um determinado tipo';
COMMENT ON FUNCTION public.is_user_active IS 'Verifica se o usuário está ativo no sistema';
COMMENT ON FUNCTION public.can_access_system IS 'Verifica se o usuário pode acessar o sistema (ativo + clínica válida)';