-- =============================================
-- MÓDULO COMUNICAÇÃO & MARKETING - CRM CLÍNICO
-- =============================================

-- Tabela de Tags personalizadas
CREATE TABLE public.patient_tags (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#6366f1',
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(clinic_id, name)
);

-- Vínculo de tags com pacientes (many-to-many)
CREATE TABLE public.patient_tag_assignments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES public.patient_tags(id) ON DELETE CASCADE,
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    assigned_by UUID REFERENCES public.profiles(id),
    UNIQUE(patient_id, tag_id)
);

-- Status CRM do paciente
CREATE TABLE public.crm_patient_status (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE UNIQUE,
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'novo_contato' CHECK (status IN (
        'novo_contato', 
        'primeira_consulta_agendada', 
        'em_atendimento', 
        'tratamento_em_andamento', 
        'em_acompanhamento', 
        'inativo', 
        'alta_finalizado'
    )),
    preferred_contact TEXT DEFAULT 'whatsapp' CHECK (preferred_contact IN ('whatsapp', 'sms', 'email', 'phone')),
    opt_out_messages BOOLEAN DEFAULT false,
    opt_out_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    last_contact_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Templates de mensagens
CREATE TABLE public.message_templates (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN (
        'confirmacao_consulta',
        'lembrete_consulta',
        'pos_consulta',
        'convite_retorno',
        'pacote_fim',
        'pacote_vencido',
        'aniversario',
        'reativacao',
        'pesquisa_satisfacao',
        'campanha_geral'
    )),
    channel TEXT NOT NULL DEFAULT 'whatsapp' CHECK (channel IN ('whatsapp', 'sms', 'email')),
    subject TEXT,
    content TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    is_system BOOLEAN DEFAULT false,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Regras de automação
CREATE TABLE public.automation_rules (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    trigger_type TEXT NOT NULL CHECK (trigger_type IN (
        'appointment_created',
        'appointment_reminder',
        'appointment_finished',
        'return_reminder',
        'return_expiring',
        'package_80_percent',
        'package_expiring',
        'package_expired',
        'patient_missed',
        'patient_birthday',
        'patient_inactive'
    )),
    trigger_config JSONB DEFAULT '{}',
    template_id UUID REFERENCES public.message_templates(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 0,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Campanhas manuais
CREATE TABLE public.marketing_campaigns (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    template_id UUID REFERENCES public.message_templates(id) ON DELETE SET NULL,
    segment_config JSONB NOT NULL DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'cancelled')),
    scheduled_at TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    total_recipients INTEGER DEFAULT 0,
    sent_count INTEGER DEFAULT 0,
    delivered_count INTEGER DEFAULT 0,
    read_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Log de mensagens enviadas
CREATE TABLE public.message_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    template_id UUID REFERENCES public.message_templates(id) ON DELETE SET NULL,
    campaign_id UUID REFERENCES public.marketing_campaigns(id) ON DELETE SET NULL,
    automation_rule_id UUID REFERENCES public.automation_rules(id) ON DELETE SET NULL,
    channel TEXT NOT NULL CHECK (channel IN ('whatsapp', 'sms', 'email', 'system')),
    message_type TEXT NOT NULL CHECK (message_type IN ('automation', 'campaign', 'manual', 'system')),
    content TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed', 'cancelled')),
    status_updated_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    external_id TEXT,
    metadata JSONB DEFAULT '{}',
    sent_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Configurações de comunicação da clínica
CREATE TABLE public.communication_settings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE UNIQUE,
    daily_message_limit INTEGER DEFAULT 500,
    send_start_time TIME DEFAULT '08:00',
    send_end_time TIME DEFAULT '20:00',
    send_on_weekends BOOLEAN DEFAULT false,
    whatsapp_number TEXT,
    whatsapp_connected BOOLEAN DEFAULT false,
    default_channel TEXT DEFAULT 'whatsapp' CHECK (default_channel IN ('whatsapp', 'sms', 'email')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.patient_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_tag_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_patient_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communication_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Clinic isolation for patient_tags" ON public.patient_tags
    FOR ALL USING (clinic_id = public.user_clinic_id(auth.uid()));

CREATE POLICY "Clinic isolation for patient_tag_assignments" ON public.patient_tag_assignments
    FOR ALL USING (clinic_id = public.user_clinic_id(auth.uid()));

CREATE POLICY "Clinic isolation for crm_patient_status" ON public.crm_patient_status
    FOR ALL USING (clinic_id = public.user_clinic_id(auth.uid()));

CREATE POLICY "Users can view system and clinic templates" ON public.message_templates
    FOR SELECT USING (is_system = true OR clinic_id = public.user_clinic_id(auth.uid()));

CREATE POLICY "Users can manage clinic templates" ON public.message_templates
    FOR ALL USING (clinic_id = public.user_clinic_id(auth.uid()));

CREATE POLICY "Clinic isolation for automation_rules" ON public.automation_rules
    FOR ALL USING (clinic_id = public.user_clinic_id(auth.uid()));

CREATE POLICY "Clinic isolation for marketing_campaigns" ON public.marketing_campaigns
    FOR ALL USING (clinic_id = public.user_clinic_id(auth.uid()));

CREATE POLICY "Clinic isolation for message_logs" ON public.message_logs
    FOR ALL USING (clinic_id = public.user_clinic_id(auth.uid()));

CREATE POLICY "Clinic isolation for communication_settings" ON public.communication_settings
    FOR ALL USING (clinic_id = public.user_clinic_id(auth.uid()));

-- Triggers for updated_at
CREATE TRIGGER update_patient_tags_updated_at BEFORE UPDATE ON public.patient_tags
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_crm_patient_status_updated_at BEFORE UPDATE ON public.crm_patient_status
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_message_templates_updated_at BEFORE UPDATE ON public.message_templates
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_automation_rules_updated_at BEFORE UPDATE ON public.automation_rules
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_marketing_campaigns_updated_at BEFORE UPDATE ON public.marketing_campaigns
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_communication_settings_updated_at BEFORE UPDATE ON public.communication_settings
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para performance
CREATE INDEX idx_patient_tags_clinic ON public.patient_tags(clinic_id);
CREATE INDEX idx_patient_tag_assignments_patient ON public.patient_tag_assignments(patient_id);
CREATE INDEX idx_crm_patient_status_clinic ON public.crm_patient_status(clinic_id);
CREATE INDEX idx_crm_patient_status_status ON public.crm_patient_status(status);
CREATE INDEX idx_message_templates_clinic ON public.message_templates(clinic_id);
CREATE INDEX idx_message_templates_category ON public.message_templates(category);
CREATE INDEX idx_automation_rules_clinic ON public.automation_rules(clinic_id);
CREATE INDEX idx_automation_rules_trigger ON public.automation_rules(trigger_type);
CREATE INDEX idx_marketing_campaigns_clinic ON public.marketing_campaigns(clinic_id);
CREATE INDEX idx_marketing_campaigns_status ON public.marketing_campaigns(status);
CREATE INDEX idx_message_logs_clinic ON public.message_logs(clinic_id);
CREATE INDEX idx_message_logs_patient ON public.message_logs(patient_id);
CREATE INDEX idx_message_logs_status ON public.message_logs(status);
CREATE INDEX idx_message_logs_created ON public.message_logs(created_at DESC);

-- Insert system templates (is_system = true, clinic_id = null)
INSERT INTO public.message_templates (clinic_id, name, category, channel, content, is_system) VALUES
    (NULL, 'Confirmação de Consulta', 'confirmacao_consulta', 'whatsapp', 
     'Olá {{nome_paciente}}! 👋

Sua consulta está confirmada para {{data_consulta}} às {{hora_consulta}} com {{profissional}}.

Endereço: {{endereco_clinica}}

Confirme sua presença respondendo SIM.

Até breve! 💚', true),
    (NULL, 'Lembrete 24h', 'lembrete_consulta', 'whatsapp',
     'Olá {{nome_paciente}}! 🔔

Lembrando que amanhã você tem consulta às {{hora_consulta}} com {{profissional}}.

Caso precise reagendar, entre em contato.

Te esperamos! 💚', true),
    (NULL, 'Pós-Consulta', 'pos_consulta', 'whatsapp',
     'Olá {{nome_paciente}}! 💚

Foi um prazer atendê-lo(a) hoje!

Se tiver dúvidas sobre as orientações, estamos à disposição.

Cuide-se! 🙏', true),
    (NULL, 'Convite de Retorno', 'convite_retorno', 'whatsapp',
     'Olá {{nome_paciente}}! 👋

Já faz um tempo desde sua última visita. Que tal agendar seu retorno?

Clique aqui para agendar: {{link_agenda}}

Estamos te esperando! 💚', true),
    (NULL, 'Aniversário', 'aniversario', 'whatsapp',
     '🎂 Parabéns, {{nome_paciente}}!

Toda a equipe deseja um dia muito especial para você!

Que esse novo ciclo seja repleto de saúde e realizações! 🎉💚', true),
    (NULL, 'Reativação de Paciente', 'reativacao', 'whatsapp',
     'Olá {{nome_paciente}}! 💚

Sentimos sua falta! Que tal agendar uma consulta?

Estamos com novidades e adoraríamos te atender novamente.

Clique aqui: {{link_agenda}}', true),
    (NULL, 'Pesquisa de Satisfação', 'pesquisa_satisfacao', 'whatsapp',
     'Olá {{nome_paciente}}! 💚

Como foi seu atendimento conosco?

Sua opinião é muito importante para melhorarmos.

Responda de 1 a 5: ⭐', true)