-- Create appointment_types table
CREATE TABLE public.appointment_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT NOT NULL DEFAULT 'bg-blue-500',
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create appointment_statuses table
CREATE TABLE public.appointment_statuses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT NOT NULL DEFAULT 'bg-slate-500',
  display_order INTEGER NOT NULL DEFAULT 0,
  is_system BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create appointment_rules table (single record per clinic)
CREATE TABLE public.appointment_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE UNIQUE,
  arrival_tolerance_minutes INTEGER NOT NULL DEFAULT 15,
  min_advance_hours INTEGER NOT NULL DEFAULT 2,
  confirmation_advance_hours INTEGER NOT NULL DEFAULT 24,
  max_reschedules INTEGER NOT NULL DEFAULT 3,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create idle_alert_settings table (single record per clinic)
CREATE TABLE public.idle_alert_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE UNIQUE,
  enabled BOOLEAN NOT NULL DEFAULT true,
  min_idle_hours NUMERIC NOT NULL DEFAULT 2,
  min_continuous_minutes INTEGER NOT NULL DEFAULT 60,
  min_occupancy_percent INTEGER NOT NULL DEFAULT 60,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.appointment_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idle_alert_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for appointment_types
CREATE POLICY "Users can view appointment types of their clinic"
ON public.appointment_types FOR SELECT
USING (clinic_id = user_clinic_id(auth.uid()));

CREATE POLICY "Admins can manage appointment types"
ON public.appointment_types FOR ALL
USING (is_clinic_admin(auth.uid(), clinic_id));

-- RLS policies for appointment_statuses
CREATE POLICY "Users can view appointment statuses of their clinic"
ON public.appointment_statuses FOR SELECT
USING (clinic_id = user_clinic_id(auth.uid()));

CREATE POLICY "Admins can manage appointment statuses"
ON public.appointment_statuses FOR ALL
USING (is_clinic_admin(auth.uid(), clinic_id));

-- RLS policies for appointment_rules
CREATE POLICY "Users can view appointment rules of their clinic"
ON public.appointment_rules FOR SELECT
USING (clinic_id = user_clinic_id(auth.uid()));

CREATE POLICY "Admins can manage appointment rules"
ON public.appointment_rules FOR ALL
USING (is_clinic_admin(auth.uid(), clinic_id));

-- RLS policies for idle_alert_settings
CREATE POLICY "Users can view idle alert settings of their clinic"
ON public.idle_alert_settings FOR SELECT
USING (clinic_id = user_clinic_id(auth.uid()));

CREATE POLICY "Admins can manage idle alert settings"
ON public.idle_alert_settings FOR ALL
USING (is_clinic_admin(auth.uid(), clinic_id));

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for updated_at
CREATE TRIGGER update_appointment_types_updated_at
BEFORE UPDATE ON public.appointment_types
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_appointment_statuses_updated_at
BEFORE UPDATE ON public.appointment_statuses
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_appointment_rules_updated_at
BEFORE UPDATE ON public.appointment_rules
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_idle_alert_settings_updated_at
BEFORE UPDATE ON public.idle_alert_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();