-- Create medical_record_tab_permissions table
CREATE TABLE public.medical_record_tab_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  tab_key TEXT NOT NULL,
  can_view BOOLEAN NOT NULL DEFAULT false,
  can_edit BOOLEAN NOT NULL DEFAULT false,
  can_export BOOLEAN NOT NULL DEFAULT false,
  can_sign BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(clinic_id, role, tab_key)
);

-- Create medical_record_action_permissions table
CREATE TABLE public.medical_record_action_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  action_key TEXT NOT NULL,
  allowed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(clinic_id, role, action_key)
);

-- Enable RLS
ALTER TABLE public.medical_record_tab_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_record_action_permissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tab permissions
CREATE POLICY "Users can view tab permissions for their clinic"
ON public.medical_record_tab_permissions
FOR SELECT
USING (
  clinic_id IN (
    SELECT clinic_id FROM public.user_roles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage tab permissions"
ON public.medical_record_tab_permissions
FOR ALL
USING (
  clinic_id IN (
    SELECT clinic_id FROM public.user_roles 
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  )
)
WITH CHECK (
  clinic_id IN (
    SELECT clinic_id FROM public.user_roles 
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  )
);

-- RLS Policies for action permissions
CREATE POLICY "Users can view action permissions for their clinic"
ON public.medical_record_action_permissions
FOR SELECT
USING (
  clinic_id IN (
    SELECT clinic_id FROM public.user_roles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage action permissions"
ON public.medical_record_action_permissions
FOR ALL
USING (
  clinic_id IN (
    SELECT clinic_id FROM public.user_roles 
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  )
)
WITH CHECK (
  clinic_id IN (
    SELECT clinic_id FROM public.user_roles 
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  )
);

-- Triggers for updated_at
CREATE TRIGGER update_medical_record_tab_permissions_updated_at
BEFORE UPDATE ON public.medical_record_tab_permissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_medical_record_action_permissions_updated_at
BEFORE UPDATE ON public.medical_record_action_permissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes
CREATE INDEX idx_tab_permissions_clinic_role ON public.medical_record_tab_permissions(clinic_id, role);
CREATE INDEX idx_action_permissions_clinic_role ON public.medical_record_action_permissions(clinic_id, role);

-- Function to check tab permission (SECURITY DEFINER to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.check_medical_record_tab_permission(
  _user_id UUID,
  _tab_key TEXT,
  _permission TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role TEXT;
  _clinic_id UUID;
  _result BOOLEAN;
BEGIN
  -- Get user role and clinic
  SELECT role, clinic_id INTO _role, _clinic_id
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1;
  
  -- Admins and owners have full access
  IF _role IN ('owner', 'admin') THEN
    RETURN true;
  END IF;
  
  -- Check specific permission
  IF _permission = 'view' THEN
    SELECT can_view INTO _result
    FROM public.medical_record_tab_permissions
    WHERE clinic_id = _clinic_id AND role = _role AND tab_key = _tab_key;
  ELSIF _permission = 'edit' THEN
    SELECT can_edit INTO _result
    FROM public.medical_record_tab_permissions
    WHERE clinic_id = _clinic_id AND role = _role AND tab_key = _tab_key;
  ELSIF _permission = 'export' THEN
    SELECT can_export INTO _result
    FROM public.medical_record_tab_permissions
    WHERE clinic_id = _clinic_id AND role = _role AND tab_key = _tab_key;
  ELSIF _permission = 'sign' THEN
    SELECT can_sign INTO _result
    FROM public.medical_record_tab_permissions
    WHERE clinic_id = _clinic_id AND role = _role AND tab_key = _tab_key;
  END IF;
  
  -- If no permission found, default to false (except for owner/admin)
  RETURN COALESCE(_result, false);
END;
$$;

-- Function to check action permission
CREATE OR REPLACE FUNCTION public.check_medical_record_action_permission(
  _user_id UUID,
  _action_key TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role TEXT;
  _clinic_id UUID;
  _result BOOLEAN;
BEGIN
  -- Get user role and clinic
  SELECT role, clinic_id INTO _role, _clinic_id
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1;
  
  -- Admins and owners have full access
  IF _role IN ('owner', 'admin') THEN
    RETURN true;
  END IF;
  
  -- Check specific action
  SELECT allowed INTO _result
  FROM public.medical_record_action_permissions
  WHERE clinic_id = _clinic_id AND role = _role AND action_key = _action_key;
  
  RETURN COALESCE(_result, false);
END;
$$;