
-- ============ Feature Flags ============
CREATE TABLE IF NOT EXISTS public.platform_feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'general',
  is_enabled boolean NOT NULL DEFAULT true,
  is_essential boolean NOT NULL DEFAULT false,
  is_premium boolean NOT NULL DEFAULT false,
  is_experimental boolean NOT NULL DEFAULT false,
  allow_clinic_override boolean NOT NULL DEFAULT true,
  impact_level text NOT NULL DEFAULT 'medium',
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.platform_feature_flags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "platform_feature_flags read" ON public.platform_feature_flags;
DROP POLICY IF EXISTS "platform_feature_flags write" ON public.platform_feature_flags;
CREATE POLICY "platform_feature_flags read" ON public.platform_feature_flags
  FOR SELECT USING (public.is_platform_admin(auth.uid()));
CREATE POLICY "platform_feature_flags write" ON public.platform_feature_flags
  FOR ALL USING (public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_platform_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.touch_platform_feature_flags()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_touch_platform_feature_flags ON public.platform_feature_flags;
CREATE TRIGGER trg_touch_platform_feature_flags
  BEFORE UPDATE ON public.platform_feature_flags
  FOR EACH ROW EXECUTE FUNCTION public.touch_platform_feature_flags();

INSERT INTO public.platform_feature_flags (key, name, description, category, is_enabled, is_essential, is_premium, is_experimental) VALUES
  ('agenda', 'Agenda', 'Agendamentos e calendário clínico', 'core', true, true, false, false),
  ('patients', 'Pacientes', 'Cadastro e ficha de pacientes', 'core', true, true, false, false),
  ('medical_records', 'Prontuário', 'Prontuário eletrônico clínico', 'clinical', true, true, false, false),
  ('attendance', 'Atendimento', 'Sessão clínica ativa', 'clinical', true, true, false, false),
  ('finance', 'Financeiro', 'Contas a pagar/receber e fluxo de caixa', 'finance', true, false, false, false),
  ('finance_personal', 'Meu Financeiro', 'Comissões e recebimentos do profissional', 'finance', true, false, false, false),
  ('inventory', 'Estoque', 'Controle de itens e movimentações', 'operations', true, false, false, false),
  ('insurances', 'Convênios', 'Gestão de convênios e tabelas', 'operations', true, false, true, false),
  ('reports', 'Relatórios', 'Relatórios operacionais e clínicos', 'analytics', true, false, false, false),
  ('crm', 'Comercial / CRM', 'Pipeline de leads e propostas', 'commercial', true, false, true, false),
  ('marketing', 'Marketing', 'Campanhas e jornadas', 'commercial', true, false, true, false),
  ('whatsapp', 'WhatsApp', 'Integração WhatsApp via UAZAPI', 'integrations', true, false, true, false),
  ('telehealth', 'Teleconsulta', 'Atendimento por vídeo', 'clinical', true, false, true, false),
  ('public_booking', 'Agendamento Público', 'Página pública de agendamento', 'commercial', true, false, false, false),
  ('audit', 'Auditoria', 'Logs administrativos e clínicos', 'security', true, true, false, false),
  ('lgpd', 'LGPD', 'Consentimentos e governança de dados', 'security', true, true, false, false),
  ('odontogram', 'Odontograma', 'Mapa odontológico', 'clinical', true, false, false, false),
  ('facial_map', 'Mapa Facial', 'Mapa facial estética', 'clinical', true, false, false, false),
  ('before_after', 'Before/After', 'Imagens antes/depois', 'clinical', true, false, false, false),
  ('institutional_documents', 'Documentos Institucionais', 'Modelos e contratos', 'operations', true, false, false, false),
  ('data_export', 'Exportação de dados', 'Exportar dados em CSV/PDF', 'security', true, false, false, false)
ON CONFLICT (key) DO NOTHING;

-- ============ Maintenance Windows ============
CREATE TABLE IF NOT EXISTS public.platform_maintenance_windows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text,
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean NOT NULL DEFAULT false,
  allow_super_admin_access boolean NOT NULL DEFAULT true,
  allow_clinic_access boolean NOT NULL DEFAULT false,
  show_banner boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.platform_maintenance_windows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "platform_maintenance read" ON public.platform_maintenance_windows;
DROP POLICY IF EXISTS "platform_maintenance write" ON public.platform_maintenance_windows;
CREATE POLICY "platform_maintenance read" ON public.platform_maintenance_windows
  FOR SELECT USING (public.is_platform_admin(auth.uid()));
CREATE POLICY "platform_maintenance write" ON public.platform_maintenance_windows
  FOR ALL USING (public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_platform_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.touch_platform_maintenance()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_touch_platform_maintenance ON public.platform_maintenance_windows;
CREATE TRIGGER trg_touch_platform_maintenance
  BEFORE UPDATE ON public.platform_maintenance_windows
  FOR EACH ROW EXECUTE FUNCTION public.touch_platform_maintenance();

-- ============ Additional platform_settings keys ============
INSERT INTO public.platform_settings (key, value, description, category) VALUES
  -- Geral
  ('platform.public_url', '"https://yesclin.com"'::jsonb, 'URL pública institucional', 'branding'),
  ('platform.app_url', '"https://app.yesclin.com"'::jsonb, 'URL do app das clínicas', 'branding'),
  ('platform.support_url', '"https://yesclin.com/suporte"'::jsonb, 'URL de suporte', 'branding'),
  ('platform.timezone', '"America/Sao_Paulo"'::jsonb, 'Fuso horário padrão', 'branding'),
  ('platform.locale', '"pt-BR"'::jsonb, 'Idioma padrão', 'branding'),
  ('platform.currency', '"BRL"'::jsonb, 'Moeda padrão', 'branding'),
  ('platform.status', '"operational"'::jsonb, 'Status (operational | maintenance | degraded)', 'branding'),
  -- Aviso global
  ('notice.enabled', 'false'::jsonb, 'Aviso global ativo', 'notice'),
  ('notice.title', '""'::jsonb, 'Título do aviso global', 'notice'),
  ('notice.message', '""'::jsonb, 'Mensagem do aviso global', 'notice'),
  ('notice.severity', '"info"'::jsonb, 'Tipo (info | warning | critical)', 'notice'),
  ('notice.audience', '"all"'::jsonb, 'Audiência (all | admins | super_admins)', 'notice'),
  -- Defaults clínica
  ('defaults.plan_slug', '"basic"'::jsonb, 'Plano padrão para novas clínicas', 'defaults'),
  ('defaults.trial_days', '14'::jsonb, 'Dias de trial padrão', 'defaults'),
  ('defaults.max_professionals', '5'::jsonb, 'Limite padrão de profissionais', 'defaults'),
  ('defaults.max_patients', '500'::jsonb, 'Limite padrão de pacientes', 'defaults'),
  ('defaults.max_appointments_monthly', '1000'::jsonb, 'Limite padrão de agendamentos/mês', 'defaults'),
  ('defaults.max_storage_mb', '5000'::jsonb, 'Limite padrão de armazenamento (MB)', 'defaults'),
  ('defaults.specialty', '"general"'::jsonb, 'Especialidade inicial padrão', 'defaults'),
  ('defaults.create_owner_professional', 'true'::jsonb, 'Criar profissional owner automaticamente', 'defaults'),
  ('defaults.create_anamnesis_templates', 'true'::jsonb, 'Criar modelos padrão de anamnese', 'defaults'),
  ('defaults.create_finance_categories', 'true'::jsonb, 'Criar categorias financeiras padrão', 'defaults'),
  ('defaults.create_appointment_statuses', 'true'::jsonb, 'Criar status de agenda padrão', 'defaults'),
  ('defaults.create_appointment_types', 'true'::jsonb, 'Criar tipos de agendamento padrão', 'defaults'),
  ('defaults.create_payment_methods', 'true'::jsonb, 'Criar formas de recebimento padrão', 'defaults'),
  -- Limites mínimos
  ('limits.min_professionals', '1'::jsonb, 'Limite mínimo de profissionais', 'limits'),
  ('limits.min_patients', '50'::jsonb, 'Limite mínimo de pacientes', 'limits'),
  ('limits.min_appointments', '100'::jsonb, 'Limite mínimo de agendamentos', 'limits'),
  ('limits.min_storage_mb', '500'::jsonb, 'Limite mínimo de armazenamento (MB)', 'limits'),
  ('limits.min_whatsapp_messages', '100'::jsonb, 'Limite mínimo de mensagens WhatsApp', 'limits'),
  ('limits.max_pending_invites', '20'::jsonb, 'Convites pendentes por clínica', 'limits'),
  ('limits.max_users_per_clinic', '50'::jsonb, 'Usuários por clínica', 'limits'),
  ('limits.basic_specialties', '2'::jsonb, 'Especialidades no plano básico', 'limits'),
  ('limits.max_integrations', '10'::jsonb, 'Integrações por clínica', 'limits'),
  -- Segurança
  ('security.session_timeout_minutes', '60'::jsonb, 'Timeout de sessão (min)', 'security'),
  ('security.require_strong_password', 'true'::jsonb, 'Exigir senha forte', 'security'),
  ('security.require_email_confirmation', 'true'::jsonb, 'Exigir confirmação de e-mail', 'security'),
  ('security.lock_after_invalid_attempts', 'true'::jsonb, 'Bloquear após tentativas inválidas', 'security'),
  ('security.max_invalid_attempts', '5'::jsonb, 'Máximo de tentativas inválidas', 'security'),
  ('security.lock_duration_minutes', '15'::jsonb, 'Duração do bloqueio (min)', 'security'),
  ('security.allow_multi_session', 'true'::jsonb, 'Permitir múltiplas sessões', 'security'),
  ('security.require_lgpd_onboarding', 'true'::jsonb, 'Exigir aceite LGPD no onboarding', 'security'),
  ('security.lgpd_default_enforcement', 'true'::jsonb, 'Enforcement LGPD padrão para novas clínicas', 'security'),
  ('security.log_sensitive_access', 'true'::jsonb, 'Registrar logs de acesso sensível', 'security'),
  ('security.log_admin_actions', 'true'::jsonb, 'Registrar logs administrativos', 'security'),
  -- Auditoria
  ('audit.enabled', 'true'::jsonb, 'Auditoria global ativa', 'audit'),
  ('audit.log_login', 'true'::jsonb, 'Registrar login/logout', 'audit'),
  ('audit.log_plan_change', 'true'::jsonb, 'Registrar alteração de plano', 'audit'),
  ('audit.log_subscription_change', 'true'::jsonb, 'Registrar alteração de assinatura', 'audit'),
  ('audit.log_permission_change', 'true'::jsonb, 'Registrar alteração de permissões', 'audit'),
  ('audit.log_settings_change', 'true'::jsonb, 'Registrar alteração de configurações', 'audit'),
  ('audit.retention_audit_days', '365'::jsonb, 'Retenção de audit_logs (dias)', 'audit'),
  ('audit.retention_access_days', '180'::jsonb, 'Retenção de access_logs (dias)', 'audit'),
  ('audit.retention_occurrences_days', '730'::jsonb, 'Retenção de ocorrências (dias)', 'audit'),
  ('audit.alert_min_severity', '"warning"'::jsonb, 'Severidade mínima para alertas', 'audit'),
  -- Integrações
  ('integrations.whatsapp_provider', '"uazapi"'::jsonb, 'Provedor WhatsApp padrão', 'integrations'),
  ('integrations.whatsapp_base_url', '""'::jsonb, 'URL base do provedor WhatsApp', 'integrations'),
  ('integrations.global_webhook', '""'::jsonb, 'Webhook global', 'integrations'),
  ('integrations.timeout_seconds', '30'::jsonb, 'Timeout padrão (s)', 'integrations'),
  ('integrations.max_retries', '3'::jsonb, 'Máx. tentativas de reenvio', 'integrations'),
  ('integrations.retry_interval_seconds', '60'::jsonb, 'Intervalo entre tentativas (s)', 'integrations'),
  ('integrations.email_enabled', 'true'::jsonb, 'E-mail transacional habilitado', 'integrations'),
  ('integrations.sms_enabled', 'false'::jsonb, 'SMS habilitado', 'integrations'),
  ('integrations.payment_gateway_enabled', 'false'::jsonb, 'Gateway de pagamento habilitado', 'integrations'),
  -- Aparência
  ('branding.brand_name', '"YesClin"'::jsonb, 'Nome da marca', 'appearance'),
  ('branding.logo_url', '""'::jsonb, 'URL do logo da plataforma', 'appearance'),
  ('branding.primary_color', '"#0F766E"'::jsonb, 'Cor primária', 'appearance'),
  ('branding.secondary_color', '"#0EA5E9"'::jsonb, 'Cor secundária', 'appearance'),
  ('branding.accent_color', '"#F59E0B"'::jsonb, 'Cor de destaque', 'appearance'),
  ('branding.footer_text', '"© YesClin"'::jsonb, 'Texto do rodapé', 'appearance'),
  ('branding.terms_url', '"https://yesclin.com/termos"'::jsonb, 'Link de Termos de Uso', 'appearance'),
  ('branding.privacy_url', '"https://yesclin.com/privacidade"'::jsonb, 'Link de Política de Privacidade', 'appearance')
ON CONFLICT (key) DO NOTHING;
