-- Create specialties table
CREATE TABLE public.specialties (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#3B82F6',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create rooms table
CREATE TABLE public.rooms (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create professionals table
CREATE TABLE public.professionals (
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
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create patients table
CREATE TABLE public.patients (
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
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create insurances table
CREATE TABLE public.insurances (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    ans_code TEXT,
    contact_phone TEXT,
    contact_email TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create appointments table
CREATE TABLE public.appointments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
    room_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL,
    specialty_id UUID REFERENCES public.specialties(id) ON DELETE SET NULL,
    insurance_id UUID REFERENCES public.insurances(id) ON DELETE SET NULL,
    procedure_id UUID REFERENCES public.procedures(id) ON DELETE SET NULL,
    
    -- Scheduling info
    scheduled_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 30,
    
    -- Appointment type and status
    appointment_type TEXT NOT NULL DEFAULT 'consulta', -- consulta, retorno, procedimento, encaixe
    status TEXT NOT NULL DEFAULT 'nao_confirmado', -- nao_confirmado, confirmado, chegou, em_atendimento, finalizado, faltou, cancelado
    
    -- Flags
    is_first_visit BOOLEAN NOT NULL DEFAULT false,
    is_return BOOLEAN NOT NULL DEFAULT false,
    has_pending_payment BOOLEAN NOT NULL DEFAULT false,
    is_fit_in BOOLEAN NOT NULL DEFAULT false,
    
    -- Payment
    payment_type TEXT DEFAULT 'particular', -- particular, convenio
    
    -- Additional info
    notes TEXT,
    cancellation_reason TEXT,
    
    -- Waiting room tracking
    arrived_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    finished_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable RLS on all tables
ALTER TABLE public.specialties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for specialties
CREATE POLICY "Users can view specialties of their clinic"
ON public.specialties FOR SELECT
USING (clinic_id = user_clinic_id(auth.uid()));

CREATE POLICY "Admins can manage specialties"
ON public.specialties FOR ALL
USING (is_clinic_admin(auth.uid(), clinic_id));

-- RLS Policies for rooms
CREATE POLICY "Users can view rooms of their clinic"
ON public.rooms FOR SELECT
USING (clinic_id = user_clinic_id(auth.uid()));

CREATE POLICY "Admins can manage rooms"
ON public.rooms FOR ALL
USING (is_clinic_admin(auth.uid(), clinic_id));

-- RLS Policies for professionals
CREATE POLICY "Users can view professionals of their clinic"
ON public.professionals FOR SELECT
USING (clinic_id = user_clinic_id(auth.uid()));

CREATE POLICY "Admins can manage professionals"
ON public.professionals FOR ALL
USING (is_clinic_admin(auth.uid(), clinic_id));

-- RLS Policies for patients
CREATE POLICY "Users can view patients of their clinic"
ON public.patients FOR SELECT
USING (clinic_id = user_clinic_id(auth.uid()));

CREATE POLICY "Users can insert patients in their clinic"
ON public.patients FOR INSERT
WITH CHECK (clinic_id = user_clinic_id(auth.uid()));

CREATE POLICY "Users can update patients of their clinic"
ON public.patients FOR UPDATE
USING (clinic_id = user_clinic_id(auth.uid()));

CREATE POLICY "Admins can delete patients"
ON public.patients FOR DELETE
USING (is_clinic_admin(auth.uid(), clinic_id));

-- RLS Policies for insurances
CREATE POLICY "Users can view insurances of their clinic"
ON public.insurances FOR SELECT
USING (clinic_id = user_clinic_id(auth.uid()));

CREATE POLICY "Admins can manage insurances"
ON public.insurances FOR ALL
USING (is_clinic_admin(auth.uid(), clinic_id));

-- RLS Policies for appointments
CREATE POLICY "Users can view appointments of their clinic"
ON public.appointments FOR SELECT
USING (clinic_id = user_clinic_id(auth.uid()));

CREATE POLICY "Users can insert appointments in their clinic"
ON public.appointments FOR INSERT
WITH CHECK (clinic_id = user_clinic_id(auth.uid()));

CREATE POLICY "Users can update appointments of their clinic"
ON public.appointments FOR UPDATE
USING (clinic_id = user_clinic_id(auth.uid()));

CREATE POLICY "Admins can delete appointments"
ON public.appointments FOR DELETE
USING (is_clinic_admin(auth.uid(), clinic_id));

-- Create indexes for better query performance
CREATE INDEX idx_appointments_clinic_date ON public.appointments(clinic_id, scheduled_date);
CREATE INDEX idx_appointments_professional ON public.appointments(professional_id, scheduled_date);
CREATE INDEX idx_appointments_patient ON public.appointments(patient_id);
CREATE INDEX idx_appointments_status ON public.appointments(status);
CREATE INDEX idx_patients_clinic ON public.patients(clinic_id);
CREATE INDEX idx_professionals_clinic ON public.professionals(clinic_id);

-- Triggers for updated_at
CREATE TRIGGER update_specialties_updated_at BEFORE UPDATE ON public.specialties
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON public.rooms
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_professionals_updated_at BEFORE UPDATE ON public.professionals
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON public.patients
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_insurances_updated_at BEFORE UPDATE ON public.insurances
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();