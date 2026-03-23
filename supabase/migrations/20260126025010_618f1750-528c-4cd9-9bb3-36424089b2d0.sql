-- Add parent_term_id for version history tracking
ALTER TABLE public.consent_terms 
ADD COLUMN IF NOT EXISTS parent_term_id UUID REFERENCES public.consent_terms(id) ON DELETE SET NULL;

-- Create patient_consents table for tracking patient consent acceptance
CREATE TABLE IF NOT EXISTS public.patient_consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    term_id UUID NOT NULL REFERENCES public.consent_terms(id) ON DELETE CASCADE,
    term_version TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'granted', -- granted, revoked
    granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    revoked_at TIMESTAMPTZ,
    ip_address TEXT,
    user_agent TEXT,
    granted_by UUID, -- user who collected consent
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create system_security_settings table for LGPD module settings
CREATE TABLE IF NOT EXISTS public.system_security_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE UNIQUE,
    require_consent_on_registration BOOLEAN NOT NULL DEFAULT true,
    allow_patient_data_deletion BOOLEAN NOT NULL DEFAULT true,
    anonymize_reports BOOLEAN NOT NULL DEFAULT false,
    enforce_consent_before_care BOOLEAN NOT NULL DEFAULT true,
    lock_record_without_consent BOOLEAN NOT NULL DEFAULT false,
    enable_access_logging BOOLEAN NOT NULL DEFAULT true,
    log_retention_days INTEGER NOT NULL DEFAULT 365,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.patient_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_security_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for patient_consents
CREATE POLICY "Users can view patient consents in their clinic" 
ON public.patient_consents 
FOR SELECT 
USING (clinic_id = public.user_clinic_id(auth.uid()));

CREATE POLICY "Users can insert patient consents in their clinic" 
ON public.patient_consents 
FOR INSERT 
WITH CHECK (clinic_id = public.user_clinic_id(auth.uid()));

CREATE POLICY "Users can update patient consents in their clinic" 
ON public.patient_consents 
FOR UPDATE 
USING (clinic_id = public.user_clinic_id(auth.uid()));

-- RLS Policies for system_security_settings
CREATE POLICY "Users can view security settings in their clinic" 
ON public.system_security_settings 
FOR SELECT 
USING (clinic_id = public.user_clinic_id(auth.uid()));

CREATE POLICY "Admins can manage security settings" 
ON public.system_security_settings 
FOR ALL 
USING (public.is_clinic_admin(auth.uid(), clinic_id));

-- Update triggers
CREATE TRIGGER update_patient_consents_updated_at
BEFORE UPDATE ON public.patient_consents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_system_security_settings_updated_at
BEFORE UPDATE ON public.system_security_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Ensure consent_terms has proper RLS
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'consent_terms' AND policyname = 'Users can view consent terms in their clinic'
    ) THEN
        CREATE POLICY "Users can view consent terms in their clinic" 
        ON public.consent_terms 
        FOR SELECT 
        USING (clinic_id = public.user_clinic_id(auth.uid()));
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'consent_terms' AND policyname = 'Admins can manage consent terms'
    ) THEN
        CREATE POLICY "Admins can manage consent terms" 
        ON public.consent_terms 
        FOR ALL 
        USING (public.is_clinic_admin(auth.uid(), clinic_id));
    END IF;
END $$;

-- Ensure access_logs has proper RLS
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'access_logs' AND policyname = 'Users can view access logs in their clinic'
    ) THEN
        CREATE POLICY "Users can view access logs in their clinic" 
        ON public.access_logs 
        FOR SELECT 
        USING (clinic_id = public.user_clinic_id(auth.uid()));
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'access_logs' AND policyname = 'Users can insert access logs in their clinic'
    ) THEN
        CREATE POLICY "Users can insert access logs in their clinic" 
        ON public.access_logs 
        FOR INSERT 
        WITH CHECK (clinic_id = public.user_clinic_id(auth.uid()));
    END IF;
END $$;