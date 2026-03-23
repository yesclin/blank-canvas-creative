-- Enum para papéis de usuário
CREATE TYPE public.app_role AS ENUM ('owner', 'admin', 'profissional', 'recepcionista');

-- Enum para status de atendimento
CREATE TYPE public.appointment_status AS ENUM ('agendado', 'em_atendimento', 'finalizado', 'cancelado', 'faltou');

-- Enum para tipo de atendimento
CREATE TYPE public.appointment_type AS ENUM ('consulta', 'retorno', 'procedimento');

-- Tabela de clínicas (tenant principal)
CREATE TABLE public.clinics (
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
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de perfis de usuário
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de papéis de usuário (separada para segurança)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, clinic_id, role)
);

-- Tabela de permissões de usuário
CREATE TABLE public.user_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
    permission_agenda BOOLEAN NOT NULL DEFAULT false,
    permission_atendimento BOOLEAN NOT NULL DEFAULT false,
    permission_prontuario BOOLEAN NOT NULL DEFAULT false,
    permission_pacientes BOOLEAN NOT NULL DEFAULT false,
    permission_relatorios BOOLEAN NOT NULL DEFAULT false,
    permission_controles BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, clinic_id)
);

-- Tabela de procedimentos
CREATE TABLE public.procedures (
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

-- Tabela de materiais
CREATE TABLE public.materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    unit TEXT NOT NULL DEFAULT 'unidade',
    min_quantity INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de vínculo procedimento-material
CREATE TABLE public.procedure_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    procedure_id UUID REFERENCES public.procedures(id) ON DELETE CASCADE NOT NULL,
    material_id UUID REFERENCES public.materials(id) ON DELETE CASCADE NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (procedure_id, material_id)
);

-- Tabela de configuração de agenda da clínica
CREATE TABLE public.clinic_schedule_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL UNIQUE,
    working_days JSONB NOT NULL DEFAULT '["seg", "ter", "qua", "qui", "sex"]',
    start_time TIME NOT NULL DEFAULT '08:00',
    end_time TIME NOT NULL DEFAULT '18:00',
    default_duration_minutes INTEGER NOT NULL DEFAULT 30,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de bloqueios de agenda
CREATE TABLE public.schedule_blocks (
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

-- Tabela de modelos de prontuário
CREATE TABLE public.medical_record_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    specialty TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de campos personalizados de prontuário
CREATE TABLE public.template_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID REFERENCES public.medical_record_templates(id) ON DELETE CASCADE NOT NULL,
    field_name TEXT NOT NULL,
    field_type TEXT NOT NULL DEFAULT 'text',
    field_order INTEGER NOT NULL DEFAULT 0,
    is_required BOOLEAN NOT NULL DEFAULT false,
    options JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de configuração de anexos do prontuário
CREATE TABLE public.medical_record_attachment_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL UNIQUE,
    allowed_file_types JSONB NOT NULL DEFAULT '["pdf", "jpg", "jpeg", "png"]',
    max_file_size_mb INTEGER NOT NULL DEFAULT 10,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de termos de consentimento LGPD
CREATE TABLE public.consent_terms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    version TEXT NOT NULL DEFAULT '1.0',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de logs de acesso (segurança)
CREATE TABLE public.access_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
    action TEXT NOT NULL,
    resource TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.procedures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.procedure_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinic_schedule_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_record_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_record_attachment_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_logs ENABLE ROW LEVEL SECURITY;

-- Função para verificar se usuário pertence à clínica
CREATE OR REPLACE FUNCTION public.user_clinic_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT clinic_id FROM public.profiles WHERE user_id = _user_id LIMIT 1
$$;

-- Função para verificar papel do usuário
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = _user_id AND role = _role
    )
$$;

-- Função para verificar se é owner ou admin
CREATE OR REPLACE FUNCTION public.is_clinic_admin(_user_id UUID, _clinic_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = _user_id 
        AND clinic_id = _clinic_id
        AND role IN ('owner', 'admin')
    )
$$;

-- Políticas RLS para clinics
CREATE POLICY "Users can view their own clinic"
ON public.clinics FOR SELECT
USING (id = public.user_clinic_id(auth.uid()));

CREATE POLICY "Admins can update their clinic"
ON public.clinics FOR UPDATE
USING (public.is_clinic_admin(auth.uid(), id));

CREATE POLICY "Authenticated users can create clinic"
ON public.clinics FOR INSERT
TO authenticated
WITH CHECK (true);

-- Políticas RLS para profiles
CREATE POLICY "Users can view profiles of same clinic"
ON public.profiles FOR SELECT
USING (clinic_id = public.user_clinic_id(auth.uid()));

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage profiles"
ON public.profiles FOR ALL
USING (public.is_clinic_admin(auth.uid(), clinic_id));

-- Políticas RLS para user_roles
CREATE POLICY "Users can view roles of same clinic"
ON public.user_roles FOR SELECT
USING (clinic_id = public.user_clinic_id(auth.uid()));

CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL
USING (public.is_clinic_admin(auth.uid(), clinic_id));

-- Políticas RLS para user_permissions
CREATE POLICY "Users can view permissions of same clinic"
ON public.user_permissions FOR SELECT
USING (clinic_id = public.user_clinic_id(auth.uid()));

CREATE POLICY "Admins can manage permissions"
ON public.user_permissions FOR ALL
USING (public.is_clinic_admin(auth.uid(), clinic_id));

-- Políticas RLS para procedures (isolamento por clínica)
CREATE POLICY "Users can view procedures of their clinic"
ON public.procedures FOR SELECT
USING (clinic_id = public.user_clinic_id(auth.uid()));

CREATE POLICY "Admins can manage procedures"
ON public.procedures FOR ALL
USING (public.is_clinic_admin(auth.uid(), clinic_id));

-- Políticas RLS para materials
CREATE POLICY "Users can view materials of their clinic"
ON public.materials FOR SELECT
USING (clinic_id = public.user_clinic_id(auth.uid()));

CREATE POLICY "Admins can manage materials"
ON public.materials FOR ALL
USING (public.is_clinic_admin(auth.uid(), clinic_id));

-- Políticas RLS para procedure_materials
CREATE POLICY "Users can view procedure_materials of their clinic"
ON public.procedure_materials FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.procedures p 
        WHERE p.id = procedure_id 
        AND p.clinic_id = public.user_clinic_id(auth.uid())
    )
);

CREATE POLICY "Admins can manage procedure_materials"
ON public.procedure_materials FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.procedures p 
        WHERE p.id = procedure_id 
        AND public.is_clinic_admin(auth.uid(), p.clinic_id)
    )
);

-- Políticas RLS para clinic_schedule_config
CREATE POLICY "Users can view schedule config of their clinic"
ON public.clinic_schedule_config FOR SELECT
USING (clinic_id = public.user_clinic_id(auth.uid()));

CREATE POLICY "Admins can manage schedule config"
ON public.clinic_schedule_config FOR ALL
USING (public.is_clinic_admin(auth.uid(), clinic_id));

-- Políticas RLS para schedule_blocks
CREATE POLICY "Users can view schedule blocks of their clinic"
ON public.schedule_blocks FOR SELECT
USING (clinic_id = public.user_clinic_id(auth.uid()));

CREATE POLICY "Admins can manage schedule blocks"
ON public.schedule_blocks FOR ALL
USING (public.is_clinic_admin(auth.uid(), clinic_id));

-- Políticas RLS para medical_record_templates
CREATE POLICY "Users can view templates of their clinic"
ON public.medical_record_templates FOR SELECT
USING (clinic_id = public.user_clinic_id(auth.uid()));

CREATE POLICY "Admins can manage templates"
ON public.medical_record_templates FOR ALL
USING (public.is_clinic_admin(auth.uid(), clinic_id));

-- Políticas RLS para template_fields
CREATE POLICY "Users can view template fields of their clinic"
ON public.template_fields FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.medical_record_templates t 
        WHERE t.id = template_id 
        AND t.clinic_id = public.user_clinic_id(auth.uid())
    )
);

CREATE POLICY "Admins can manage template fields"
ON public.template_fields FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.medical_record_templates t 
        WHERE t.id = template_id 
        AND public.is_clinic_admin(auth.uid(), t.clinic_id)
    )
);

-- Políticas RLS para medical_record_attachment_config
CREATE POLICY "Users can view attachment config of their clinic"
ON public.medical_record_attachment_config FOR SELECT
USING (clinic_id = public.user_clinic_id(auth.uid()));

CREATE POLICY "Admins can manage attachment config"
ON public.medical_record_attachment_config FOR ALL
USING (public.is_clinic_admin(auth.uid(), clinic_id));

-- Políticas RLS para consent_terms
CREATE POLICY "Users can view consent terms of their clinic"
ON public.consent_terms FOR SELECT
USING (clinic_id = public.user_clinic_id(auth.uid()));

CREATE POLICY "Admins can manage consent terms"
ON public.consent_terms FOR ALL
USING (public.is_clinic_admin(auth.uid(), clinic_id));

-- Políticas RLS para access_logs
CREATE POLICY "Admins can view access logs of their clinic"
ON public.access_logs FOR SELECT
USING (public.is_clinic_admin(auth.uid(), clinic_id));

CREATE POLICY "System can insert access logs"
ON public.access_logs FOR INSERT
TO authenticated
WITH CHECK (clinic_id = public.user_clinic_id(auth.uid()));

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Aplicar trigger em todas as tabelas com updated_at
CREATE TRIGGER update_clinics_updated_at BEFORE UPDATE ON public.clinics FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_permissions_updated_at BEFORE UPDATE ON public.user_permissions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_procedures_updated_at BEFORE UPDATE ON public.procedures FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_materials_updated_at BEFORE UPDATE ON public.materials FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_clinic_schedule_config_updated_at BEFORE UPDATE ON public.clinic_schedule_config FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_schedule_blocks_updated_at BEFORE UPDATE ON public.schedule_blocks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_medical_record_templates_updated_at BEFORE UPDATE ON public.medical_record_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_medical_record_attachment_config_updated_at BEFORE UPDATE ON public.medical_record_attachment_config FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_consent_terms_updated_at BEFORE UPDATE ON public.consent_terms FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();