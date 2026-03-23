-- Create table for custom prontuario fields
CREATE TABLE public.custom_prontuario_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    field_type VARCHAR(20) NOT NULL,
    description TEXT,
    placeholder VARCHAR(200),
    options JSONB,
    is_required BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    display_order INTEGER NOT NULL DEFAULT 0,
    all_appointments BOOLEAN NOT NULL DEFAULT false,
    specialty_id UUID REFERENCES public.specialties(id) ON DELETE SET NULL,
    procedure_id UUID REFERENCES public.procedures(id) ON DELETE SET NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT valid_field_type CHECK (field_type IN ('text', 'textarea', 'number', 'date', 'select', 'checkbox', 'multiselect')),
    CONSTRAINT valid_association CHECK (all_appointments = true OR specialty_id IS NOT NULL OR procedure_id IS NOT NULL)
);

CREATE INDEX idx_custom_fields_clinic ON public.custom_prontuario_fields(clinic_id);
CREATE INDEX idx_custom_fields_specialty ON public.custom_prontuario_fields(specialty_id) WHERE specialty_id IS NOT NULL;
CREATE INDEX idx_custom_fields_procedure ON public.custom_prontuario_fields(procedure_id) WHERE procedure_id IS NOT NULL;

CREATE TABLE public.custom_field_values (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    field_id UUID NOT NULL REFERENCES public.custom_prontuario_fields(id) ON DELETE CASCADE,
    evolution_id UUID REFERENCES public.clinical_evolutions(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    value JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(field_id, evolution_id)
);

CREATE INDEX idx_custom_values_evolution ON public.custom_field_values(evolution_id);
CREATE INDEX idx_custom_values_patient ON public.custom_field_values(patient_id);

ALTER TABLE public.custom_prontuario_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_field_values ENABLE ROW LEVEL SECURITY;

-- RLS for custom_prontuario_fields - Users can view from their clinic
CREATE POLICY "Users can view custom fields from their clinic"
ON public.custom_prontuario_fields FOR SELECT
USING (clinic_id IN (SELECT p.clinic_id FROM public.profiles p WHERE p.id = auth.uid()));

-- Admins can manage custom fields (using user_roles table)
CREATE POLICY "Admins can insert custom fields"
ON public.custom_prontuario_fields FOR INSERT
WITH CHECK (
    clinic_id IN (
        SELECT ur.clinic_id FROM public.user_roles ur 
        WHERE ur.user_id = auth.uid() AND ur.role IN ('owner', 'admin')
    )
);

CREATE POLICY "Admins can update custom fields"
ON public.custom_prontuario_fields FOR UPDATE
USING (
    clinic_id IN (
        SELECT ur.clinic_id FROM public.user_roles ur 
        WHERE ur.user_id = auth.uid() AND ur.role IN ('owner', 'admin')
    )
);

CREATE POLICY "Admins can delete custom fields"
ON public.custom_prontuario_fields FOR DELETE
USING (
    clinic_id IN (
        SELECT ur.clinic_id FROM public.user_roles ur 
        WHERE ur.user_id = auth.uid() AND ur.role IN ('owner', 'admin')
    )
);

-- RLS for custom_field_values
CREATE POLICY "Users can view custom field values from their clinic"
ON public.custom_field_values FOR SELECT
USING (clinic_id IN (SELECT p.clinic_id FROM public.profiles p WHERE p.id = auth.uid()));

CREATE POLICY "Users can insert custom field values"
ON public.custom_field_values FOR INSERT
WITH CHECK (clinic_id IN (SELECT p.clinic_id FROM public.profiles p WHERE p.id = auth.uid()));

CREATE POLICY "Users can update custom field values"
ON public.custom_field_values FOR UPDATE
USING (clinic_id IN (SELECT p.clinic_id FROM public.profiles p WHERE p.id = auth.uid()));

CREATE TRIGGER update_custom_fields_updated_at
    BEFORE UPDATE ON public.custom_prontuario_fields
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_custom_values_updated_at
    BEFORE UPDATE ON public.custom_field_values
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();