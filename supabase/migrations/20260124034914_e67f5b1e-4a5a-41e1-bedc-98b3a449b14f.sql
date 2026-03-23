-- Enum para módulos do sistema
CREATE TYPE public.app_module AS ENUM (
  'dashboard',
  'agenda',
  'pacientes',
  'prontuario',
  'comunicacao',
  'financeiro',
  'convenios',
  'estoque',
  'relatorios',
  'configuracoes'
);

-- Enum para ações
CREATE TYPE public.app_action AS ENUM (
  'view',
  'create',
  'edit',
  'delete',
  'export'
);

-- Tabela de permissões detalhadas por módulo
CREATE TABLE public.module_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  module app_module NOT NULL,
  actions app_action[] NOT NULL DEFAULT '{}',
  restrictions JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, clinic_id, module)
);

-- Tabela de templates de permissão padrão por role
CREATE TABLE public.permission_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role app_role NOT NULL,
  module app_module NOT NULL,
  actions app_action[] NOT NULL DEFAULT '{}',
  restrictions JSONB DEFAULT '{}',
  is_system BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(role, module)
);

-- Enable RLS
ALTER TABLE public.module_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permission_templates ENABLE ROW LEVEL SECURITY;

-- RLS for module_permissions
CREATE POLICY "Users can view own module permissions"
ON public.module_permissions FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all module permissions in clinic"
ON public.module_permissions FOR SELECT
USING (is_clinic_admin(auth.uid(), clinic_id));

CREATE POLICY "Admins can manage module permissions"
ON public.module_permissions FOR ALL
USING (is_clinic_admin(auth.uid(), clinic_id));

-- RLS for permission_templates
CREATE POLICY "Anyone can view permission templates"
ON public.permission_templates FOR SELECT
TO authenticated
USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_module_permissions_updated_at
BEFORE UPDATE ON public.module_permissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default permission templates
-- OWNER - Full access
INSERT INTO public.permission_templates (role, module, actions) VALUES
('owner', 'dashboard', ARRAY['view', 'export']::app_action[]),
('owner', 'agenda', ARRAY['view', 'create', 'edit', 'delete']::app_action[]),
('owner', 'pacientes', ARRAY['view', 'create', 'edit', 'delete']::app_action[]),
('owner', 'prontuario', ARRAY['view', 'create', 'edit', 'delete']::app_action[]),
('owner', 'comunicacao', ARRAY['view', 'create', 'edit', 'delete']::app_action[]),
('owner', 'financeiro', ARRAY['view', 'create', 'edit', 'delete', 'export']::app_action[]),
('owner', 'convenios', ARRAY['view', 'create', 'edit', 'delete']::app_action[]),
('owner', 'estoque', ARRAY['view', 'create', 'edit', 'delete']::app_action[]),
('owner', 'relatorios', ARRAY['view', 'export']::app_action[]),
('owner', 'configuracoes', ARRAY['view', 'create', 'edit', 'delete']::app_action[]);

-- ADMIN - Full access
INSERT INTO public.permission_templates (role, module, actions) VALUES
('admin', 'dashboard', ARRAY['view', 'export']::app_action[]),
('admin', 'agenda', ARRAY['view', 'create', 'edit', 'delete']::app_action[]),
('admin', 'pacientes', ARRAY['view', 'create', 'edit', 'delete']::app_action[]),
('admin', 'prontuario', ARRAY['view', 'create', 'edit', 'delete']::app_action[]),
('admin', 'comunicacao', ARRAY['view', 'create', 'edit', 'delete']::app_action[]),
('admin', 'financeiro', ARRAY['view', 'create', 'edit', 'delete', 'export']::app_action[]),
('admin', 'convenios', ARRAY['view', 'create', 'edit', 'delete']::app_action[]),
('admin', 'estoque', ARRAY['view', 'create', 'edit', 'delete']::app_action[]),
('admin', 'relatorios', ARRAY['view', 'export']::app_action[]),
('admin', 'configuracoes', ARRAY['view', 'create', 'edit', 'delete']::app_action[]);

-- RECEPCIONISTA
INSERT INTO public.permission_templates (role, module, actions, restrictions) VALUES
('recepcionista', 'dashboard', ARRAY['view']::app_action[], '{"limited": true}'),
('recepcionista', 'agenda', ARRAY['view', 'create', 'edit', 'delete']::app_action[], '{}'),
('recepcionista', 'pacientes', ARRAY['view', 'create', 'edit']::app_action[], '{}'),
('recepcionista', 'prontuario', ARRAY[]::app_action[], '{"blocked": true}'),
('recepcionista', 'comunicacao', ARRAY['view', 'create']::app_action[], '{}'),
('recepcionista', 'financeiro', ARRAY['view', 'create']::app_action[], '{"limited": true}'),
('recepcionista', 'convenios', ARRAY['view', 'create']::app_action[], '{"only_guides": true}'),
('recepcionista', 'estoque', ARRAY['view', 'create']::app_action[], '{"only_output": true}'),
('recepcionista', 'relatorios', ARRAY['view']::app_action[], '{"operational_only": true}'),
('recepcionista', 'configuracoes', ARRAY[]::app_action[], '{"blocked": true}');

-- PROFISSIONAL
INSERT INTO public.permission_templates (role, module, actions, restrictions) VALUES
('profissional', 'dashboard', ARRAY['view']::app_action[], '{"own_data_only": true}'),
('profissional', 'agenda', ARRAY['view', 'edit']::app_action[], '{"own_schedule_only": true}'),
('profissional', 'pacientes', ARRAY['view']::app_action[], '{}'),
('profissional', 'prontuario', ARRAY['view', 'create', 'edit']::app_action[], '{"own_patients_only": true}'),
('profissional', 'comunicacao', ARRAY[]::app_action[], '{"blocked": true}'),
('profissional', 'financeiro', ARRAY[]::app_action[], '{"blocked": true}'),
('profissional', 'convenios', ARRAY['view']::app_action[], '{"read_only": true}'),
('profissional', 'estoque', ARRAY['view']::app_action[], '{"read_only": true}'),
('profissional', 'relatorios', ARRAY['view']::app_action[], '{"own_data_only": true}'),
('profissional', 'configuracoes', ARRAY[]::app_action[], '{"blocked": true}');

-- Function to check user permission for a module and action
CREATE OR REPLACE FUNCTION public.user_has_module_permission(
  _user_id UUID,
  _module app_module,
  _action app_action DEFAULT 'view'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _clinic_id UUID;
  _role app_role;
  _custom_actions app_action[];
  _template_actions app_action[];
BEGIN
  -- Get user's clinic and role
  SELECT ur.clinic_id, ur.role INTO _clinic_id, _role
  FROM public.user_roles ur
  WHERE ur.user_id = _user_id
  LIMIT 1;

  IF _role IS NULL THEN
    RETURN false;
  END IF;

  -- Check custom permissions first
  SELECT actions INTO _custom_actions
  FROM public.module_permissions
  WHERE user_id = _user_id
    AND clinic_id = _clinic_id
    AND module = _module;

  IF _custom_actions IS NOT NULL THEN
    RETURN _action = ANY(_custom_actions);
  END IF;

  -- Fall back to template permissions based on role
  SELECT actions INTO _template_actions
  FROM public.permission_templates
  WHERE role = _role AND module = _module;

  RETURN _action = ANY(COALESCE(_template_actions, ARRAY[]::app_action[]));
END;
$$;

-- Function to get all permissions for a user
CREATE OR REPLACE FUNCTION public.get_user_all_permissions(_user_id UUID)
RETURNS TABLE(
  module app_module,
  actions app_action[],
  restrictions JSONB
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _clinic_id UUID;
  _role app_role;
BEGIN
  -- Get user's clinic and role
  SELECT ur.clinic_id, ur.role INTO _clinic_id, _role
  FROM public.user_roles ur
  WHERE ur.user_id = _user_id
  LIMIT 1;

  IF _role IS NULL THEN
    RETURN;
  END IF;

  -- Return custom permissions if exist, otherwise template
  RETURN QUERY
  SELECT 
    COALESCE(mp.module, pt.module) as module,
    COALESCE(mp.actions, pt.actions) as actions,
    COALESCE(mp.restrictions, pt.restrictions) as restrictions
  FROM public.permission_templates pt
  LEFT JOIN public.module_permissions mp 
    ON mp.module = pt.module 
    AND mp.user_id = _user_id 
    AND mp.clinic_id = _clinic_id
  WHERE pt.role = _role;
END;
$$;