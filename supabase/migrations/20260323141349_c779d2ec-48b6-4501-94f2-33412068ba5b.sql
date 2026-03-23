
-- ============================================
-- CORE BOOTSTRAP: All essential tables for YesClin
-- ============================================

-- Enum para papéis de usuário
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('owner', 'admin', 'profissional', 'recepcionista');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Enum para módulos do sistema
DO $$ BEGIN
  CREATE TYPE public.app_module AS ENUM (
    'dashboard', 'agenda', 'pacientes', 'prontuario', 'comunicacao',
    'financeiro', 'convenios', 'estoque', 'relatorios', 'configuracoes'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Enum para ações
DO $$ BEGIN
  CREATE TYPE public.app_action AS ENUM ('view', 'create', 'edit', 'delete', 'export');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- TABELA: clinics (tenant principal)
-- ============================================
CREATE TABLE IF NOT EXISTS public.clinics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    logo_url TEXT,
    phone TEXT,
    whatsapp TEXT,
    email TEXT,
    address_street TEXT,
    address_number TEXT,
    address_complement TEXT,
    address_neighborhood TEXT,
    address_city TEXT,
    address_state TEXT,
    address_zip TEXT,
    opening_hours JSONB DEFAULT '{}',
    primary_specialty_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- TABELA: profiles
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT,
    avatar_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    tour_completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- TABELA: user_roles (separada para segurança)
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, clinic_id, role)
);

-- ============================================
-- TABELA: specialties
-- ============================================
CREATE TABLE IF NOT EXISTS public.specialties (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT,
    description TEXT,
    color TEXT DEFAULT '#3B82F6',
    specialty_type TEXT DEFAULT 'padrao',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add FK for clinics.primary_specialty_id now that specialties exists
ALTER TABLE public.clinics 
  ADD CONSTRAINT clinics_primary_specialty_fk 
  FOREIGN KEY (primary_specialty_id) REFERENCES public.specialties(id);

-- ============================================
-- TABELA: professionals
-- ============================================
CREATE TABLE IF NOT EXISTS public.professionals (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    specialty_id UUID REFERENCES public.specialties(id) ON DELETE SET NULL,
    registration_number TEXT,
    avatar_url TEXT,
    color TEXT DEFAULT '#10B981',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- TABELA: patients
-- ============================================
CREATE TABLE IF NOT EXISTS public.patients (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    cpf TEXT,
    birth_date DATE,
    gender TEXT,
    address_street TEXT,
    address_number TEXT,
    address_complement TEXT,
    address_neighborhood TEXT,
    address_city TEXT,
    address_state TEXT,
    address_zip TEXT,
    notes TEXT,
    has_clinical_alert BOOLEAN NOT NULL DEFAULT false,
    clinical_alert_text TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- TABELA: onboarding_progress
-- ============================================
CREATE TABLE IF NOT EXISTS public.onboarding_progress (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    current_step INTEGER NOT NULL DEFAULT 0,
    completed_steps JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_completed BOOLEAN NOT NULL DEFAULT false,
    skipped_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    preferences JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(clinic_id, user_id)
);

-- ============================================
-- TABELA: module_permissions
-- ============================================
CREATE TABLE IF NOT EXISTS public.module_permissions (
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

-- ============================================
-- TABELA: permission_templates
-- ============================================
CREATE TABLE IF NOT EXISTS public.permission_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role app_role NOT NULL,
    module app_module NOT NULL,
    actions app_action[] NOT NULL DEFAULT '{}',
    restrictions JSONB DEFAULT '{}',
    is_system BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(role, module)
);

-- ============================================
-- TABELA: procedures
-- ============================================
CREATE TABLE IF NOT EXISTS public.procedures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    specialty TEXT,
    description TEXT,
    duration_minutes INTEGER NOT NULL DEFAULT 30,
    price DECIMAL(10,2),
    allows_return BOOLEAN NOT NULL DEFAULT false,
    return_days INTEGER,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- TABELA: insurances
-- ============================================
CREATE TABLE IF NOT EXISTS public.insurances (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    ans_code TEXT,
    contact_phone TEXT,
    contact_email TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- TABELA: rooms
-- ============================================
CREATE TABLE IF NOT EXISTS public.rooms (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- TABELA: appointments
-- ============================================
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
    room_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL,
    specialty_id UUID REFERENCES public.specialties(id) ON DELETE SET NULL,
    insurance_id UUID REFERENCES public.insurances(id) ON DELETE SET NULL,
    procedure_id UUID REFERENCES public.procedures(id) ON DELETE SET NULL,
    scheduled_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 30,
    appointment_type TEXT NOT NULL DEFAULT 'consulta',
    status TEXT NOT NULL DEFAULT 'nao_confirmado',
    is_first_visit BOOLEAN NOT NULL DEFAULT false,
    is_return BOOLEAN NOT NULL DEFAULT false,
    has_pending_payment BOOLEAN NOT NULL DEFAULT false,
    is_fit_in BOOLEAN NOT NULL DEFAULT false,
    payment_type TEXT DEFAULT 'particular',
    notes TEXT,
    cancellation_reason TEXT,
    arrived_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- ============================================
-- TABELA: clinic_schedule_config
-- ============================================
CREATE TABLE IF NOT EXISTS public.clinic_schedule_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL UNIQUE,
    working_days JSONB NOT NULL DEFAULT '["seg", "ter", "qua", "qui", "sex"]',
    start_time TIME NOT NULL DEFAULT '08:00',
    end_time TIME NOT NULL DEFAULT '18:00',
    default_duration_minutes INTEGER NOT NULL DEFAULT 30,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- TABELA: schedule_blocks
-- ============================================
CREATE TABLE IF NOT EXISTS public.schedule_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    all_day BOOLEAN NOT NULL DEFAULT true,
    start_time TIME,
    end_time TIME,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- ENABLE RLS
-- ============================================
ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.specialties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permission_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.procedures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinic_schedule_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_blocks ENABLE ROW LEVEL SECURITY;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Get user's clinic_id
CREATE OR REPLACE FUNCTION public.user_clinic_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT clinic_id FROM public.profiles WHERE user_id = _user_id LIMIT 1 $$;

-- Check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

-- Check if user is owner or admin of a clinic
CREATE OR REPLACE FUNCTION public.is_clinic_admin(_user_id UUID, _clinic_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND clinic_id = _clinic_id AND role IN ('owner', 'admin')) $$;

-- updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

-- ============================================
-- RLS POLICIES
-- ============================================

-- clinics
CREATE POLICY "Users can view their own clinic" ON public.clinics FOR SELECT USING (id = public.user_clinic_id(auth.uid()));
CREATE POLICY "Admins can update their clinic" ON public.clinics FOR UPDATE USING (public.is_clinic_admin(auth.uid(), id));
CREATE POLICY "System can insert clinics" ON public.clinics FOR INSERT TO authenticated WITH CHECK (true);

-- profiles
CREATE POLICY "Users can view profiles of same clinic" ON public.profiles FOR SELECT USING (clinic_id = public.user_clinic_id(auth.uid()));
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins can manage profiles" ON public.profiles FOR ALL USING (public.is_clinic_admin(auth.uid(), clinic_id));

-- user_roles
CREATE POLICY "Users can view roles of same clinic" ON public.user_roles FOR SELECT USING (clinic_id = public.user_clinic_id(auth.uid()));
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.is_clinic_admin(auth.uid(), clinic_id));

-- specialties
CREATE POLICY "Users can view specialties of their clinic" ON public.specialties FOR SELECT USING (clinic_id IS NULL OR clinic_id = user_clinic_id(auth.uid()));
CREATE POLICY "Admins can manage specialties" ON public.specialties FOR ALL USING (is_clinic_admin(auth.uid(), clinic_id));

-- professionals
CREATE POLICY "Users can view professionals of their clinic" ON public.professionals FOR SELECT USING (clinic_id = user_clinic_id(auth.uid()));
CREATE POLICY "Admins can manage professionals" ON public.professionals FOR ALL USING (is_clinic_admin(auth.uid(), clinic_id));

-- patients
CREATE POLICY "Users can view patients of their clinic" ON public.patients FOR SELECT USING (clinic_id = user_clinic_id(auth.uid()));
CREATE POLICY "Users can insert patients in their clinic" ON public.patients FOR INSERT WITH CHECK (clinic_id = user_clinic_id(auth.uid()));
CREATE POLICY "Users can update patients of their clinic" ON public.patients FOR UPDATE USING (clinic_id = user_clinic_id(auth.uid()));
CREATE POLICY "Admins can delete patients" ON public.patients FOR DELETE USING (is_clinic_admin(auth.uid(), clinic_id));

-- onboarding_progress
CREATE POLICY "Users can view own onboarding progress" ON public.onboarding_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own onboarding progress" ON public.onboarding_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own onboarding progress" ON public.onboarding_progress FOR UPDATE USING (auth.uid() = user_id);

-- module_permissions
CREATE POLICY "Users can view own module permissions" ON public.module_permissions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins can view all module permissions in clinic" ON public.module_permissions FOR SELECT USING (is_clinic_admin(auth.uid(), clinic_id));
CREATE POLICY "Admins can manage module permissions" ON public.module_permissions FOR ALL USING (is_clinic_admin(auth.uid(), clinic_id));

-- permission_templates
CREATE POLICY "Anyone can view permission templates" ON public.permission_templates FOR SELECT TO authenticated USING (true);

-- procedures
CREATE POLICY "Users can view procedures of their clinic" ON public.procedures FOR SELECT USING (clinic_id = user_clinic_id(auth.uid()));
CREATE POLICY "Admins can manage procedures" ON public.procedures FOR ALL USING (is_clinic_admin(auth.uid(), clinic_id));

-- insurances
CREATE POLICY "Users can view insurances of their clinic" ON public.insurances FOR SELECT USING (clinic_id = user_clinic_id(auth.uid()));
CREATE POLICY "Admins can manage insurances" ON public.insurances FOR ALL USING (is_clinic_admin(auth.uid(), clinic_id));

-- rooms
CREATE POLICY "Users can view rooms of their clinic" ON public.rooms FOR SELECT USING (clinic_id = user_clinic_id(auth.uid()));
CREATE POLICY "Admins can manage rooms" ON public.rooms FOR ALL USING (is_clinic_admin(auth.uid(), clinic_id));

-- appointments
CREATE POLICY "Users can view appointments of their clinic" ON public.appointments FOR SELECT USING (clinic_id = user_clinic_id(auth.uid()));
CREATE POLICY "Users can insert appointments in their clinic" ON public.appointments FOR INSERT WITH CHECK (clinic_id = user_clinic_id(auth.uid()));
CREATE POLICY "Users can update appointments of their clinic" ON public.appointments FOR UPDATE USING (clinic_id = user_clinic_id(auth.uid()));
CREATE POLICY "Admins can delete appointments" ON public.appointments FOR DELETE USING (is_clinic_admin(auth.uid(), clinic_id));

-- clinic_schedule_config
CREATE POLICY "Users can view schedule config of their clinic" ON public.clinic_schedule_config FOR SELECT USING (clinic_id = user_clinic_id(auth.uid()));
CREATE POLICY "Admins can manage schedule config" ON public.clinic_schedule_config FOR ALL USING (is_clinic_admin(auth.uid(), clinic_id));

-- schedule_blocks
CREATE POLICY "Users can view schedule blocks of their clinic" ON public.schedule_blocks FOR SELECT USING (clinic_id = user_clinic_id(auth.uid()));
CREATE POLICY "Admins can manage schedule blocks" ON public.schedule_blocks FOR ALL USING (is_clinic_admin(auth.uid(), clinic_id));

-- ============================================
-- TRIGGERS for updated_at
-- ============================================
CREATE TRIGGER update_clinics_updated_at BEFORE UPDATE ON public.clinics FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_specialties_updated_at BEFORE UPDATE ON public.specialties FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_professionals_updated_at BEFORE UPDATE ON public.professionals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON public.patients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_onboarding_progress_updated_at BEFORE UPDATE ON public.onboarding_progress FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_module_permissions_updated_at BEFORE UPDATE ON public.module_permissions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_procedures_updated_at BEFORE UPDATE ON public.procedures FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_insurances_updated_at BEFORE UPDATE ON public.insurances FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON public.rooms FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_clinic_schedule_config_updated_at BEFORE UPDATE ON public.clinic_schedule_config FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_schedule_blocks_updated_at BEFORE UPDATE ON public.schedule_blocks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_profiles_clinic ON public.profiles(clinic_id);
CREATE INDEX idx_profiles_user ON public.profiles(user_id);
CREATE INDEX idx_user_roles_user ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_clinic ON public.user_roles(clinic_id);
CREATE INDEX idx_appointments_clinic_date ON public.appointments(clinic_id, scheduled_date);
CREATE INDEX idx_appointments_professional ON public.appointments(professional_id, scheduled_date);
CREATE INDEX idx_appointments_patient ON public.appointments(patient_id);
CREATE INDEX idx_patients_clinic ON public.patients(clinic_id);
CREATE INDEX idx_professionals_clinic ON public.professionals(clinic_id);
CREATE INDEX idx_clinics_primary_specialty ON public.clinics(primary_specialty_id);

-- ============================================
-- PERMISSION TEMPLATE DEFAULTS
-- ============================================

-- OWNER - Full access
INSERT INTO public.permission_templates (role, module, actions, restrictions) VALUES
('owner', 'dashboard', ARRAY['view', 'create', 'edit', 'delete', 'export']::app_action[], '{}'),
('owner', 'agenda', ARRAY['view', 'create', 'edit', 'delete']::app_action[], '{}'),
('owner', 'pacientes', ARRAY['view', 'create', 'edit', 'delete']::app_action[], '{}'),
('owner', 'prontuario', ARRAY['view', 'create', 'edit', 'delete']::app_action[], '{}'),
('owner', 'comunicacao', ARRAY['view', 'create', 'edit', 'delete']::app_action[], '{}'),
('owner', 'financeiro', ARRAY['view', 'create', 'edit', 'delete', 'export']::app_action[], '{}'),
('owner', 'convenios', ARRAY['view', 'create', 'edit', 'delete']::app_action[], '{}'),
('owner', 'estoque', ARRAY['view', 'create', 'edit', 'delete']::app_action[], '{}'),
('owner', 'relatorios', ARRAY['view', 'export']::app_action[], '{}'),
('owner', 'configuracoes', ARRAY['view', 'create', 'edit', 'delete']::app_action[], '{}');

-- ADMIN - Full access
INSERT INTO public.permission_templates (role, module, actions, restrictions) VALUES
('admin', 'dashboard', ARRAY['view', 'create', 'edit', 'delete', 'export']::app_action[], '{}'),
('admin', 'agenda', ARRAY['view', 'create', 'edit', 'delete']::app_action[], '{}'),
('admin', 'pacientes', ARRAY['view', 'create', 'edit', 'delete']::app_action[], '{}'),
('admin', 'prontuario', ARRAY['view', 'create', 'edit', 'delete']::app_action[], '{}'),
('admin', 'comunicacao', ARRAY['view', 'create', 'edit', 'delete']::app_action[], '{}'),
('admin', 'financeiro', ARRAY['view', 'create', 'edit', 'delete', 'export']::app_action[], '{}'),
('admin', 'convenios', ARRAY['view', 'create', 'edit', 'delete']::app_action[], '{}'),
('admin', 'estoque', ARRAY['view', 'create', 'edit', 'delete']::app_action[], '{}'),
('admin', 'relatorios', ARRAY['view', 'export']::app_action[], '{}'),
('admin', 'configuracoes', ARRAY['view', 'create', 'edit', 'delete']::app_action[], '{}');

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

-- RECEPCIONISTA
INSERT INTO public.permission_templates (role, module, actions, restrictions) VALUES
('recepcionista', 'dashboard', ARRAY['view']::app_action[], '{"limited_stats": true}'),
('recepcionista', 'agenda', ARRAY['view', 'create', 'edit', 'delete']::app_action[], '{}'),
('recepcionista', 'pacientes', ARRAY['view', 'create', 'edit']::app_action[], '{}'),
('recepcionista', 'prontuario', ARRAY[]::app_action[], '{"blocked": true}'),
('recepcionista', 'comunicacao', ARRAY['view', 'create']::app_action[], '{}'),
('recepcionista', 'financeiro', ARRAY['view', 'create']::app_action[], '{"limited": true}'),
('recepcionista', 'convenios', ARRAY['view', 'create']::app_action[], '{"only_guides": true}'),
('recepcionista', 'estoque', ARRAY['view', 'create']::app_action[], '{"only_output": true}'),
('recepcionista', 'relatorios', ARRAY['view']::app_action[], '{"operational_only": true}'),
('recepcionista', 'configuracoes', ARRAY[]::app_action[], '{"blocked": true}');

-- ============================================
-- PERMISSION FUNCTIONS
-- ============================================

CREATE OR REPLACE FUNCTION public.user_has_module_permission(
  _user_id UUID, _module app_module, _action app_action DEFAULT 'view'
)
RETURNS BOOLEAN
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _clinic_id UUID; _role app_role;
  _custom_actions app_action[]; _template_actions app_action[];
BEGIN
  SELECT ur.clinic_id, ur.role INTO _clinic_id, _role
  FROM public.user_roles ur WHERE ur.user_id = _user_id LIMIT 1;
  IF _role IS NULL THEN RETURN false; END IF;

  SELECT actions INTO _custom_actions
  FROM public.module_permissions
  WHERE user_id = _user_id AND clinic_id = _clinic_id AND module = _module;
  IF _custom_actions IS NOT NULL THEN RETURN _action = ANY(_custom_actions); END IF;

  SELECT actions INTO _template_actions
  FROM public.permission_templates WHERE role = _role AND module = _module;
  RETURN _action = ANY(COALESCE(_template_actions, ARRAY[]::app_action[]));
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_all_permissions(_user_id UUID)
RETURNS TABLE(module app_module, actions app_action[], restrictions JSONB)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE _clinic_id UUID; _role app_role;
BEGIN
  SELECT ur.clinic_id, ur.role INTO _clinic_id, _role
  FROM public.user_roles ur WHERE ur.user_id = _user_id LIMIT 1;
  IF _role IS NULL THEN RETURN; END IF;

  RETURN QUERY
  SELECT COALESCE(mp.module, pt.module), COALESCE(mp.actions, pt.actions), COALESCE(mp.restrictions, pt.restrictions)
  FROM public.permission_templates pt
  LEFT JOIN public.module_permissions mp ON mp.module = pt.module AND mp.user_id = _user_id AND mp.clinic_id = _clinic_id
  WHERE pt.role = _role;
END;
$$;

-- ============================================
-- HANDLE NEW USER TRIGGER (CRITICAL: Owner auto-assignment)
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_clinic_id UUID;
  user_name TEXT;
  user_email TEXT;
BEGIN
  -- Extract name from user metadata or email
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );
  
  user_email := NEW.email;

  -- Create new clinic for the user
  INSERT INTO public.clinics (name)
  VALUES (COALESCE(user_name, 'Minha Clínica') || ' - Clínica')
  RETURNING id INTO new_clinic_id;

  -- Create profile with is_active = true (CRITICAL: owner must be active)
  INSERT INTO public.profiles (
    user_id, clinic_id, full_name, email, is_active
  ) VALUES (
    NEW.id, new_clinic_id, user_name, user_email, true
  );

  -- Create user_role with 'owner' role (CRITICAL: highest privilege)
  INSERT INTO public.user_roles (
    user_id, clinic_id, role
  ) VALUES (
    NEW.id, new_clinic_id, 'owner'
  );

  RETURN NEW;
END;
$$;

-- Create trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

COMMENT ON FUNCTION public.handle_new_user() IS 
'Automatically creates clinic, profile (active) and owner role when a new user signs up. The creator is ALWAYS the clinic owner with full permissions.';
