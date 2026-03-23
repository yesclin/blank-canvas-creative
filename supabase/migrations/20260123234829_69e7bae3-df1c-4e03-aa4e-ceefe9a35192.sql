-- Tabela principal de prontuários (um por paciente)
CREATE TABLE public.medical_records (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(clinic_id, patient_id)
);

-- Dados clínicos base do paciente (alergias, doenças, medicamentos)
CREATE TABLE public.patient_clinical_data (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    allergies TEXT[] DEFAULT '{}',
    chronic_diseases TEXT[] DEFAULT '{}',
    current_medications TEXT[] DEFAULT '{}',
    family_history TEXT,
    clinical_restrictions TEXT,
    blood_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(clinic_id, patient_id)
);

-- Responsável legal do paciente
CREATE TABLE public.patient_guardians (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    relationship TEXT NOT NULL,
    cpf TEXT,
    phone TEXT,
    email TEXT,
    is_primary BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Evoluções clínicas (core do prontuário)
CREATE TABLE public.clinical_evolutions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    professional_id UUID NOT NULL REFERENCES public.professionals(id),
    appointment_id UUID REFERENCES public.appointments(id),
    template_id UUID REFERENCES public.medical_record_templates(id),
    specialty TEXT,
    evolution_type TEXT NOT NULL DEFAULT 'consultation',
    content JSONB NOT NULL DEFAULT '{}',
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'draft',
    next_steps TEXT,
    signed_at TIMESTAMP WITH TIME ZONE,
    signed_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Alertas clínicos
CREATE TABLE public.clinical_alerts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    created_by UUID REFERENCES public.profiles(id),
    alert_type TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'info',
    title TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    acknowledged_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Anexos do prontuário
CREATE TABLE public.medical_attachments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    evolution_id UUID REFERENCES public.clinical_evolutions(id),
    uploaded_by UUID REFERENCES public.profiles(id),
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER,
    file_url TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'document',
    description TEXT,
    is_before_after BOOLEAN DEFAULT false,
    before_after_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Log de auditoria do prontuário
CREATE TABLE public.medical_record_audit_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    old_data JSONB,
    new_data JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Modelos de campos por especialidade
CREATE TABLE public.specialty_field_templates (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE,
    specialty TEXT NOT NULL,
    field_name TEXT NOT NULL,
    field_label TEXT NOT NULL,
    field_type TEXT NOT NULL DEFAULT 'text',
    field_options JSONB,
    field_order INTEGER DEFAULT 0,
    is_required BOOLEAN DEFAULT false,
    is_system BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_clinical_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_evolutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_record_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.specialty_field_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for medical_records
CREATE POLICY "Users can view medical records of their clinic"
ON public.medical_records FOR SELECT
USING (clinic_id = user_clinic_id(auth.uid()));

CREATE POLICY "Users can insert medical records in their clinic"
ON public.medical_records FOR INSERT
WITH CHECK (clinic_id = user_clinic_id(auth.uid()));

CREATE POLICY "Users can update medical records of their clinic"
ON public.medical_records FOR UPDATE
USING (clinic_id = user_clinic_id(auth.uid()));

-- RLS Policies for patient_clinical_data
CREATE POLICY "Users can view clinical data of their clinic"
ON public.patient_clinical_data FOR SELECT
USING (clinic_id = user_clinic_id(auth.uid()));

CREATE POLICY "Users can insert clinical data in their clinic"
ON public.patient_clinical_data FOR INSERT
WITH CHECK (clinic_id = user_clinic_id(auth.uid()));

CREATE POLICY "Users can update clinical data of their clinic"
ON public.patient_clinical_data FOR UPDATE
USING (clinic_id = user_clinic_id(auth.uid()));

-- RLS Policies for patient_guardians
CREATE POLICY "Users can view guardians of their clinic"
ON public.patient_guardians FOR SELECT
USING (clinic_id = user_clinic_id(auth.uid()));

CREATE POLICY "Users can manage guardians of their clinic"
ON public.patient_guardians FOR ALL
USING (clinic_id = user_clinic_id(auth.uid()));

-- RLS Policies for clinical_evolutions
CREATE POLICY "Users can view evolutions of their clinic"
ON public.clinical_evolutions FOR SELECT
USING (clinic_id = user_clinic_id(auth.uid()));

CREATE POLICY "Users can insert evolutions in their clinic"
ON public.clinical_evolutions FOR INSERT
WITH CHECK (clinic_id = user_clinic_id(auth.uid()));

CREATE POLICY "Users can update evolutions of their clinic"
ON public.clinical_evolutions FOR UPDATE
USING (clinic_id = user_clinic_id(auth.uid()));

-- RLS Policies for clinical_alerts
CREATE POLICY "Users can view alerts of their clinic"
ON public.clinical_alerts FOR SELECT
USING (clinic_id = user_clinic_id(auth.uid()));

CREATE POLICY "Users can manage alerts of their clinic"
ON public.clinical_alerts FOR ALL
USING (clinic_id = user_clinic_id(auth.uid()));

-- RLS Policies for medical_attachments
CREATE POLICY "Users can view attachments of their clinic"
ON public.medical_attachments FOR SELECT
USING (clinic_id = user_clinic_id(auth.uid()));

CREATE POLICY "Users can manage attachments of their clinic"
ON public.medical_attachments FOR ALL
USING (clinic_id = user_clinic_id(auth.uid()));

-- RLS Policies for audit_logs
CREATE POLICY "Admins can view audit logs"
ON public.medical_record_audit_logs FOR SELECT
USING (is_clinic_admin(auth.uid(), clinic_id));

CREATE POLICY "System can insert audit logs"
ON public.medical_record_audit_logs FOR INSERT
WITH CHECK (clinic_id = user_clinic_id(auth.uid()));

-- RLS Policies for specialty_field_templates
CREATE POLICY "Users can view specialty templates"
ON public.specialty_field_templates FOR SELECT
USING (clinic_id IS NULL OR clinic_id = user_clinic_id(auth.uid()));

CREATE POLICY "Admins can manage specialty templates"
ON public.specialty_field_templates FOR ALL
USING (clinic_id = user_clinic_id(auth.uid()) AND is_clinic_admin(auth.uid(), clinic_id));

-- Triggers for updated_at
CREATE TRIGGER update_medical_records_updated_at
    BEFORE UPDATE ON public.medical_records
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_patient_clinical_data_updated_at
    BEFORE UPDATE ON public.patient_clinical_data
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_patient_guardians_updated_at
    BEFORE UPDATE ON public.patient_guardians
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_clinical_evolutions_updated_at
    BEFORE UPDATE ON public.clinical_evolutions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_clinical_alerts_updated_at
    BEFORE UPDATE ON public.clinical_alerts
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default specialty field templates
INSERT INTO public.specialty_field_templates (specialty, field_name, field_label, field_type, field_order, is_system) VALUES
-- Clínica Médica Geral
('medical_general', 'chief_complaint', 'Queixa Principal', 'textarea', 1, true),
('medical_general', 'hda', 'História da Doença Atual (HDA)', 'textarea', 2, true),
('medical_general', 'medical_history', 'Histórico Médico', 'textarea', 3, true),
('medical_general', 'physical_exam', 'Exame Físico', 'textarea', 4, true),
('medical_general', 'diagnostic_hypothesis', 'Hipóteses Diagnósticas', 'textarea', 5, true),
('medical_general', 'cid10', 'CID-10', 'text', 6, true),
('medical_general', 'exams_requested', 'Solicitação de Exames', 'textarea', 7, true),
('medical_general', 'prescription', 'Prescrição', 'textarea', 8, true),
('medical_general', 'conduct', 'Conduta', 'textarea', 9, true),
('medical_general', 'guidelines', 'Orientações', 'textarea', 10, true),

-- Odontologia
('dentistry', 'dental_anamnesis', 'Anamnese Odontológica', 'textarea', 1, true),
('dentistry', 'odontogram', 'Odontograma', 'odontogram', 2, true),
('dentistry', 'procedures_performed', 'Procedimentos Realizados', 'textarea', 3, true),
('dentistry', 'materials_used', 'Materiais Utilizados', 'textarea', 4, true),
('dentistry', 'session_evolution', 'Evolução da Sessão', 'textarea', 5, true),
('dentistry', 'treatment_plan', 'Plano de Tratamento', 'textarea', 6, true),

-- Psicologia/Psiquiatria
('psychology', 'initial_complaint', 'Queixa Inicial', 'textarea', 1, true),
('psychology', 'emotional_history', 'Histórico Emocional', 'textarea', 2, true),
('psychology', 'psychological_evaluation', 'Avaliação Psicológica', 'textarea', 3, true),
('psychology', 'clinical_scales', 'Escalas Clínicas', 'textarea', 4, true),
('psychology', 'session_evolution', 'Evolução da Sessão', 'textarea', 5, true),
('psychology', 'professional_notes', 'Observações do Profissional', 'textarea', 6, true),
('psychology', 'referrals', 'Encaminhamentos', 'textarea', 7, true),

-- Fisioterapia
('physiotherapy', 'functional_assessment', 'Avaliação Funcional Inicial', 'textarea', 1, true),
('physiotherapy', 'physiotherapy_diagnosis', 'Diagnóstico Fisioterapêutico', 'textarea', 2, true),
('physiotherapy', 'treatment_objectives', 'Objetivos do Tratamento', 'textarea', 3, true),
('physiotherapy', 'therapeutic_plan', 'Plano Terapêutico', 'textarea', 4, true),
('physiotherapy', 'session_evolution', 'Evolução da Sessão', 'textarea', 5, true),
('physiotherapy', 'pain_scale', 'Escala de Dor', 'number', 6, true),
('physiotherapy', 'exercises_applied', 'Exercícios Aplicados', 'textarea', 7, true),

-- Nutrição
('nutrition', 'food_anamnesis', 'Anamnese Alimentar', 'textarea', 1, true),
('nutrition', 'anthropometric_assessment', 'Avaliação Antropométrica', 'textarea', 2, true),
('nutrition', 'weight', 'Peso (kg)', 'number', 3, true),
('nutrition', 'height', 'Altura (cm)', 'number', 4, true),
('nutrition', 'imc', 'IMC', 'number', 5, true),
('nutrition', 'food_history', 'Histórico Alimentar', 'textarea', 6, true),
('nutrition', 'nutritional_plan', 'Plano Nutricional', 'textarea', 7, true),
('nutrition', 'evolution', 'Evolução', 'textarea', 8, true),

-- Estética/Harmonização
('aesthetics', 'aesthetic_evaluation', 'Avaliação Estética', 'textarea', 1, true),
('aesthetics', 'patient_complaint', 'Queixa do Paciente', 'textarea', 2, true),
('aesthetics', 'procedures_performed', 'Procedimentos Realizados', 'textarea', 3, true),
('aesthetics', 'products_used', 'Produtos Utilizados (Lote/Validade)', 'textarea', 4, true),
('aesthetics', 'informed_consent', 'Consentimento Informado', 'checkbox', 5, true),
('aesthetics', 'evolution', 'Evolução', 'textarea', 6, true),
('aesthetics', 'post_procedure_notes', 'Observações Pós-Procedimento', 'textarea', 7, true);