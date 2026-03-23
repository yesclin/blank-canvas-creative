-- =====================================================
-- MÓDULO DE CONFIGURAÇÕES DO PRONTUÁRIO - YESCLIN
-- =====================================================

-- 1. Configuração de Abas do Prontuário por Especialidade/Profissional
CREATE TABLE public.prontuario_tabs_config (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    specialty TEXT, -- NULL = configuração geral da clínica
    professional_id UUID REFERENCES public.professionals(id) ON DELETE CASCADE, -- NULL = configuração da especialidade
    
    -- Configuração das abas (JSON com ordem e visibilidade)
    tabs_config JSONB NOT NULL DEFAULT '[
        {"id": "overview", "label": "Resumo", "enabled": true, "order": 1},
        {"id": "anamnesis", "label": "Anamnese", "enabled": true, "order": 2},
        {"id": "evolution", "label": "Evolução Clínica", "enabled": true, "order": 3},
        {"id": "diagnosis", "label": "Diagnóstico", "enabled": true, "order": 4},
        {"id": "procedures", "label": "Procedimentos", "enabled": true, "order": 5},
        {"id": "prescriptions", "label": "Prescrições", "enabled": true, "order": 6},
        {"id": "exams", "label": "Exames & Imagens", "enabled": true, "order": 7},
        {"id": "documents", "label": "Documentos", "enabled": true, "order": 8},
        {"id": "consent", "label": "Consentimentos", "enabled": true, "order": 9},
        {"id": "history", "label": "Histórico / Auditoria", "enabled": true, "order": 10}
    ]'::jsonb,
    
    -- Modelo de anamnese padrão
    default_anamnesis_template_id UUID REFERENCES public.medical_record_templates(id) ON DELETE SET NULL,
    use_system_default BOOLEAN NOT NULL DEFAULT true, -- Usar modelo geral do sistema
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    
    -- Constraint: apenas uma config por clinic+specialty+professional
    CONSTRAINT unique_tabs_config UNIQUE (clinic_id, specialty, professional_id)
);

-- 2. Modelos de Anamnese por Profissional
CREATE TABLE public.professional_anamnesis_models (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
    template_id UUID NOT NULL REFERENCES public.medical_record_templates(id) ON DELETE CASCADE,
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    
    CONSTRAINT unique_professional_template UNIQUE (professional_id, template_id)
);

-- 3. Configuração Visual do Prontuário
CREATE TABLE public.prontuario_visual_config (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    professional_id UUID REFERENCES public.professionals(id) ON DELETE CASCADE, -- NULL = config da clínica
    
    -- Cores
    primary_color TEXT NOT NULL DEFAULT '#3B82F6',
    secondary_color TEXT NOT NULL DEFAULT '#10B981',
    accent_color TEXT NOT NULL DEFAULT '#8B5CF6',
    
    -- Logo
    logo_url TEXT,
    logo_position TEXT NOT NULL DEFAULT 'left', -- left, center, right
    
    -- Layout
    layout_mode TEXT NOT NULL DEFAULT 'standard', -- compact, standard, expanded
    font_size TEXT NOT NULL DEFAULT 'medium', -- small, medium, large
    show_patient_photo BOOLEAN NOT NULL DEFAULT true,
    show_alerts_header BOOLEAN NOT NULL DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    
    CONSTRAINT unique_visual_config UNIQUE (clinic_id, professional_id)
);

-- 4. Configuração de Impressão/Exportação
CREATE TABLE public.prontuario_print_config (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    
    -- Cabeçalho
    include_logo BOOLEAN NOT NULL DEFAULT true,
    include_clinic_info BOOLEAN NOT NULL DEFAULT true,
    header_text TEXT,
    
    -- Rodapé
    include_page_numbers BOOLEAN NOT NULL DEFAULT true,
    footer_text TEXT,
    
    -- Seções exportáveis
    exportable_sections JSONB NOT NULL DEFAULT '[
        {"id": "overview", "label": "Resumo", "default_include": true},
        {"id": "anamnesis", "label": "Anamnese", "default_include": true},
        {"id": "evolution", "label": "Evoluções", "default_include": true},
        {"id": "diagnosis", "label": "Diagnóstico", "default_include": true},
        {"id": "procedures", "label": "Procedimentos", "default_include": true},
        {"id": "prescriptions", "label": "Prescrições", "default_include": true},
        {"id": "exams", "label": "Exames", "default_include": false},
        {"id": "attachments", "label": "Anexos", "default_include": false}
    ]'::jsonb,
    
    -- Estilo
    paper_size TEXT NOT NULL DEFAULT 'A4', -- A4, Letter
    orientation TEXT NOT NULL DEFAULT 'portrait', -- portrait, landscape
    margin_mm INTEGER NOT NULL DEFAULT 20,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    
    CONSTRAINT unique_print_config UNIQUE (clinic_id)
);

-- 5. Configuração de Segurança e LGPD
CREATE TABLE public.prontuario_security_config (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    
    -- Bloqueio de edição
    block_after_signature BOOLEAN NOT NULL DEFAULT true,
    signature_lock_hours INTEGER NOT NULL DEFAULT 24, -- Horas para bloquear após assinatura
    allow_amendment BOOLEAN NOT NULL DEFAULT true, -- Permitir retificação (com justificativa)
    
    -- Consentimento LGPD
    require_consent_before_access BOOLEAN NOT NULL DEFAULT true,
    consent_validity_days INTEGER NOT NULL DEFAULT 365,
    show_consent_status BOOLEAN NOT NULL DEFAULT true,
    
    -- Auditoria
    log_all_access BOOLEAN NOT NULL DEFAULT true,
    log_print_export BOOLEAN NOT NULL DEFAULT true,
    log_data_changes BOOLEAN NOT NULL DEFAULT true,
    retention_years INTEGER NOT NULL DEFAULT 20, -- Retenção de logs em anos
    
    -- Acesso
    require_2fa_for_access BOOLEAN NOT NULL DEFAULT false,
    session_timeout_minutes INTEGER NOT NULL DEFAULT 30,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    
    CONSTRAINT unique_security_config UNIQUE (clinic_id)
);

-- 6. Log de Acesso ao Prontuário (LGPD compliant)
CREATE TABLE public.prontuario_access_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    
    action TEXT NOT NULL, -- view, edit, print, export, sign, amend
    section TEXT, -- Qual seção foi acessada
    details JSONB, -- Detalhes adicionais da ação
    
    ip_address TEXT,
    user_agent TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 7. Status de Consentimento do Paciente
CREATE TABLE public.patient_consent_status (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    
    consent_type TEXT NOT NULL DEFAULT 'lgpd', -- lgpd, treatment, marketing
    status TEXT NOT NULL DEFAULT 'pending', -- pending, granted, revoked
    
    granted_at TIMESTAMP WITH TIME ZONE,
    revoked_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    
    consent_document_url TEXT,
    ip_address TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    
    CONSTRAINT unique_patient_consent UNIQUE (clinic_id, patient_id, consent_type)
);

-- =====================================================
-- ENABLE RLS
-- =====================================================

ALTER TABLE public.prontuario_tabs_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_anamnesis_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prontuario_visual_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prontuario_print_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prontuario_security_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prontuario_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_consent_status ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- prontuario_tabs_config
CREATE POLICY "Users can view own clinic tabs config"
    ON public.prontuario_tabs_config FOR SELECT
    USING (clinic_id IN (SELECT clinic_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can manage own clinic tabs config"
    ON public.prontuario_tabs_config FOR ALL
    USING (clinic_id IN (SELECT clinic_id FROM public.profiles WHERE id = auth.uid()));

-- professional_anamnesis_models
CREATE POLICY "Users can view own clinic anamnesis models"
    ON public.professional_anamnesis_models FOR SELECT
    USING (clinic_id IN (SELECT clinic_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can manage own clinic anamnesis models"
    ON public.professional_anamnesis_models FOR ALL
    USING (clinic_id IN (SELECT clinic_id FROM public.profiles WHERE id = auth.uid()));

-- prontuario_visual_config
CREATE POLICY "Users can view own clinic visual config"
    ON public.prontuario_visual_config FOR SELECT
    USING (clinic_id IN (SELECT clinic_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can manage own clinic visual config"
    ON public.prontuario_visual_config FOR ALL
    USING (clinic_id IN (SELECT clinic_id FROM public.profiles WHERE id = auth.uid()));

-- prontuario_print_config
CREATE POLICY "Users can view own clinic print config"
    ON public.prontuario_print_config FOR SELECT
    USING (clinic_id IN (SELECT clinic_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can manage own clinic print config"
    ON public.prontuario_print_config FOR ALL
    USING (clinic_id IN (SELECT clinic_id FROM public.profiles WHERE id = auth.uid()));

-- prontuario_security_config
CREATE POLICY "Users can view own clinic security config"
    ON public.prontuario_security_config FOR SELECT
    USING (clinic_id IN (SELECT clinic_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can manage own clinic security config"
    ON public.prontuario_security_config FOR ALL
    USING (clinic_id IN (SELECT clinic_id FROM public.profiles WHERE id = auth.uid()));

-- prontuario_access_logs
CREATE POLICY "Users can view own clinic access logs"
    ON public.prontuario_access_logs FOR SELECT
    USING (clinic_id IN (SELECT clinic_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert access logs for own clinic"
    ON public.prontuario_access_logs FOR INSERT
    WITH CHECK (clinic_id IN (SELECT clinic_id FROM public.profiles WHERE id = auth.uid()));

-- patient_consent_status
CREATE POLICY "Users can view own clinic consent status"
    ON public.patient_consent_status FOR SELECT
    USING (clinic_id IN (SELECT clinic_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can manage own clinic consent status"
    ON public.patient_consent_status FOR ALL
    USING (clinic_id IN (SELECT clinic_id FROM public.profiles WHERE id = auth.uid()));

-- =====================================================
-- TRIGGERS FOR updated_at
-- =====================================================

CREATE TRIGGER update_prontuario_tabs_config_updated_at
    BEFORE UPDATE ON public.prontuario_tabs_config
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_prontuario_visual_config_updated_at
    BEFORE UPDATE ON public.prontuario_visual_config
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_prontuario_print_config_updated_at
    BEFORE UPDATE ON public.prontuario_print_config
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_prontuario_security_config_updated_at
    BEFORE UPDATE ON public.prontuario_security_config
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_patient_consent_status_updated_at
    BEFORE UPDATE ON public.patient_consent_status
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_prontuario_tabs_clinic ON public.prontuario_tabs_config(clinic_id);
CREATE INDEX idx_prontuario_tabs_specialty ON public.prontuario_tabs_config(specialty);
CREATE INDEX idx_professional_anamnesis_professional ON public.professional_anamnesis_models(professional_id);
CREATE INDEX idx_prontuario_visual_clinic ON public.prontuario_visual_config(clinic_id);
CREATE INDEX idx_prontuario_access_patient ON public.prontuario_access_logs(patient_id);
CREATE INDEX idx_prontuario_access_created ON public.prontuario_access_logs(created_at DESC);
CREATE INDEX idx_patient_consent_patient ON public.patient_consent_status(patient_id);
CREATE INDEX idx_patient_consent_status ON public.patient_consent_status(status);