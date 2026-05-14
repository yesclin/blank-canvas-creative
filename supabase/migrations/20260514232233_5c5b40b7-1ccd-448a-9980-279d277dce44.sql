
-- Singleton key/value table for platform-wide settings (Super Admin only)
CREATE TABLE IF NOT EXISTS public.platform_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  description text,
  category text NOT NULL DEFAULT 'general',
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "platform_settings read" ON public.platform_settings;
DROP POLICY IF EXISTS "platform_settings write" ON public.platform_settings;

CREATE POLICY "platform_settings read"
  ON public.platform_settings FOR SELECT
  USING (public.is_platform_admin(auth.uid()));

CREATE POLICY "platform_settings write"
  ON public.platform_settings FOR ALL
  USING (public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_platform_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.touch_platform_settings()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_touch_platform_settings ON public.platform_settings;
CREATE TRIGGER trg_touch_platform_settings
  BEFORE UPDATE ON public.platform_settings
  FOR EACH ROW EXECUTE FUNCTION public.touch_platform_settings();

-- Seed defaults (idempotent)
INSERT INTO public.platform_settings (key, value, description, category) VALUES
  ('platform.name', '"YesClin"'::jsonb, 'Nome público da plataforma', 'branding'),
  ('platform.support_email', '"suporte@yesclin.com"'::jsonb, 'E-mail de suporte', 'branding'),
  ('platform.primary_color', '"#0F766E"'::jsonb, 'Cor primária da marca', 'branding'),
  ('trial.duration_days', '14'::jsonb, 'Duração padrão do trial em dias', 'trial'),
  ('trial.auto_block_after_overdue_days', '7'::jsonb, 'Dias de atraso para bloqueio automático', 'trial'),
  ('limits.default_max_professionals', '5'::jsonb, 'Limite padrão de profissionais', 'limits'),
  ('limits.default_max_patients', '500'::jsonb, 'Limite padrão de pacientes', 'limits'),
  ('limits.default_max_appointments_monthly', '1000'::jsonb, 'Limite padrão de agendamentos/mês', 'limits'),
  ('security.session_timeout_minutes', '60'::jsonb, 'Timeout de sessão (min)', 'security'),
  ('security.require_2fa_for_admins', 'false'::jsonb, '2FA obrigatório para admins', 'security'),
  ('security.password_min_length', '8'::jsonb, 'Tamanho mínimo de senha', 'security'),
  ('audit.log_retention_days', '365'::jsonb, 'Retenção de logs em dias', 'audit'),
  ('audit.export_enabled', 'true'::jsonb, 'Permitir exportação de auditoria', 'audit'),
  ('email.from_name', '"YesClin"'::jsonb, 'Nome do remetente padrão', 'email'),
  ('email.from_address', '"no-reply@yesclin.com"'::jsonb, 'E-mail remetente padrão', 'email')
ON CONFLICT (key) DO NOTHING;
