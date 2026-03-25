-- ================================================================
-- YESCLIN COMPLETE SCHEMA - PART 1: ENUMS & CORE EXTENSIONS
-- ================================================================

-- ==================== ENUMS ====================
DO $$ BEGIN
  CREATE TYPE public.product_type AS ENUM ('material_clinico', 'insumo', 'item_venda', 'medicamento');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.stock_movement_type AS ENUM ('entrada', 'saida', 'ajuste', 'consumo_procedimento', 'venda', 'devolucao');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.transaction_type AS ENUM ('receita', 'despesa');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.transaction_status AS ENUM ('pendente', 'pago', 'cancelado', 'estornado');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.document_status AS ENUM ('rascunho', 'assinado', 'cancelado');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.invitation_status AS ENUM ('pending', 'accepted', 'expired', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.consent_status AS ENUM ('granted', 'revoked', 'pending');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.tiss_guide_type AS ENUM ('consulta', 'sadt', 'internacao', 'honorarios', 'odontologica');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.tiss_guide_status AS ENUM ('rascunho', 'enviada', 'autorizada', 'negada', 'paga', 'glosada');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ==================== USER INVITATIONS ====================
CREATE TABLE IF NOT EXISTS public.user_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role public.app_role NOT NULL DEFAULT 'profissional',
  invited_by UUID NOT NULL,
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  status public.invitation_status NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_user_invitations_clinic ON public.user_invitations(clinic_id);
CREATE INDEX IF NOT EXISTS idx_user_invitations_email ON public.user_invitations(email);
CREATE INDEX IF NOT EXISTS idx_user_invitations_token ON public.user_invitations(token);

-- ==================== PROFESSIONAL SPECIALTIES (junction) ====================
CREATE TABLE IF NOT EXISTS public.professional_specialties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  specialty_id UUID NOT NULL REFERENCES public.specialties(id) ON DELETE CASCADE,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(professional_id, specialty_id)
);
CREATE INDEX IF NOT EXISTS idx_prof_spec_professional ON public.professional_specialties(professional_id);
CREATE INDEX IF NOT EXISTS idx_prof_spec_specialty ON public.professional_specialties(specialty_id);

-- ==================== PROFESSIONAL SCHEDULES ====================
CREATE TABLE IF NOT EXISTS public.professional_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  slot_duration_minutes INTEGER NOT NULL DEFAULT 30,
  room_id UUID REFERENCES public.rooms(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(professional_id, day_of_week, start_time)
);
CREATE INDEX IF NOT EXISTS idx_prof_sched_professional ON public.professional_schedules(professional_id);
CREATE INDEX IF NOT EXISTS idx_prof_sched_clinic ON public.professional_schedules(clinic_id);

-- ==================== PROFESSIONAL AUTHORIZED ROOMS ====================
CREATE TABLE IF NOT EXISTS public.professional_authorized_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(professional_id, room_id)
);

-- ==================== PROFESSIONAL AUTHORIZED PROCEDURES ====================
CREATE TABLE IF NOT EXISTS public.professional_authorized_procedures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  procedure_id UUID NOT NULL REFERENCES public.procedures(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(professional_id, procedure_id)
);

-- ==================== PATIENT EXTENSIONS ====================
CREATE TABLE IF NOT EXISTS public.patient_guardians (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  cpf TEXT,
  phone TEXT,
  relationship TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_patient_guardians_patient ON public.patient_guardians(patient_id);

CREATE TABLE IF NOT EXISTS public.patient_insurances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  insurance_id UUID NOT NULL REFERENCES public.insurances(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  card_number TEXT,
  plan_name TEXT,
  validity_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(patient_id, insurance_id)
);
CREATE INDEX IF NOT EXISTS idx_patient_insurances_patient ON public.patient_insurances(patient_id);

CREATE TABLE IF NOT EXISTS public.patient_clinical_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  flag_type TEXT NOT NULL,
  description TEXT,
  severity TEXT DEFAULT 'info',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_patient_flags_patient ON public.patient_clinical_flags(patient_id);

-- ==================== AGENDA EXTENSIONS ====================
CREATE TABLE IF NOT EXISTS public.appointment_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  color TEXT DEFAULT '#3B82F6',
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(clinic_id, slug)
);

CREATE TABLE IF NOT EXISTS public.appointment_statuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  color TEXT DEFAULT '#6B7280',
  icon TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(clinic_id, slug)
);

CREATE TABLE IF NOT EXISTS public.appointment_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  rule_type TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.idle_alert_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  idle_threshold_minutes INTEGER NOT NULL DEFAULT 15,
  alert_type TEXT NOT NULL DEFAULT 'visual',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(clinic_id)
);

CREATE TABLE IF NOT EXISTS public.appointment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  old_status TEXT,
  new_status TEXT,
  notes TEXT,
  performed_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_appt_events_appointment ON public.appointment_events(appointment_id);
CREATE INDEX IF NOT EXISTS idx_appt_events_clinic ON public.appointment_events(clinic_id);