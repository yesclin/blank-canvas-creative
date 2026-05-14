
-- ============ platform_integration_providers ============
CREATE TABLE IF NOT EXISTS public.platform_integration_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  name text NOT NULL,
  category text NOT NULL,
  status text NOT NULL DEFAULT 'configuracao_pendente',
  environment text NOT NULL DEFAULT 'production',
  base_url text NULL,
  api_key_masked text NULL,
  token_masked text NULL,
  webhook_secret_masked text NULL,
  timeout_seconds integer NOT NULL DEFAULT 30,
  retry_limit integer NOT NULL DEFAULT 3,
  is_enabled boolean NOT NULL DEFAULT false,
  last_healthcheck_at timestamptz NULL,
  last_healthcheck_status text NULL,
  last_error_message text NULL,
  notes text NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.platform_integration_providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "platform admins manage integration providers"
ON public.platform_integration_providers
FOR ALL
TO authenticated
USING (public.is_platform_admin(auth.uid()))
WITH CHECK (public.is_platform_admin(auth.uid()));

CREATE INDEX IF NOT EXISTS idx_pip_category ON public.platform_integration_providers(category);
CREATE INDEX IF NOT EXISTS idx_pip_status ON public.platform_integration_providers(status);

-- ============ platform_integration_webhooks ============
CREATE TABLE IF NOT EXISTS public.platform_integration_webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NULL REFERENCES public.platform_integration_providers(id) ON DELETE SET NULL,
  name text NOT NULL,
  provider_key text NOT NULL,
  url text NOT NULL,
  secret_masked text NULL,
  secret_hash text NULL,
  status text NOT NULL DEFAULT 'ativo',
  last_received_at timestamptz NULL,
  failure_count integer NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.platform_integration_webhooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "platform admins manage integration webhooks"
ON public.platform_integration_webhooks
FOR ALL
TO authenticated
USING (public.is_platform_admin(auth.uid()))
WITH CHECK (public.is_platform_admin(auth.uid()));

CREATE INDEX IF NOT EXISTS idx_piw_provider_key ON public.platform_integration_webhooks(provider_key);

-- ============ platform_integration_logs ============
CREATE TABLE IF NOT EXISTS public.platform_integration_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_key text NOT NULL,
  clinic_id uuid NULL REFERENCES public.clinics(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  status text NOT NULL,
  http_status integer NULL,
  request_id text NULL,
  message text NULL,
  request_payload jsonb NULL,
  response_payload jsonb NULL,
  error_stack text NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.platform_integration_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "platform admins read integration logs"
ON public.platform_integration_logs
FOR SELECT
TO authenticated
USING (public.is_platform_admin(auth.uid()));

CREATE POLICY "platform admins insert integration logs"
ON public.platform_integration_logs
FOR INSERT
TO authenticated
WITH CHECK (public.is_platform_admin(auth.uid()));

CREATE INDEX IF NOT EXISTS idx_pil_provider_key ON public.platform_integration_logs(provider_key);
CREATE INDEX IF NOT EXISTS idx_pil_created_at ON public.platform_integration_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pil_status ON public.platform_integration_logs(status);
CREATE INDEX IF NOT EXISTS idx_pil_clinic ON public.platform_integration_logs(clinic_id);

-- ============ platform_integration_settings ============
CREATE TABLE IF NOT EXISTS public.platform_integration_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  logs_enabled boolean NOT NULL DEFAULT true,
  log_retention_days integer NOT NULL DEFAULT 90,
  default_timeout_seconds integer NOT NULL DEFAULT 30,
  default_retry_limit integer NOT NULL DEFAULT 3,
  notify_critical_failures boolean NOT NULL DEFAULT true,
  alert_email text NULL,
  alert_webhook_url text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.platform_integration_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "platform admins manage integration settings"
ON public.platform_integration_settings
FOR ALL
TO authenticated
USING (public.is_platform_admin(auth.uid()))
WITH CHECK (public.is_platform_admin(auth.uid()));

INSERT INTO public.platform_integration_settings (id) VALUES (gen_random_uuid())
ON CONFLICT DO NOTHING;

-- ============ updated_at trigger ============
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_pip_updated_at ON public.platform_integration_providers;
CREATE TRIGGER trg_pip_updated_at BEFORE UPDATE ON public.platform_integration_providers
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

DROP TRIGGER IF EXISTS trg_piw_updated_at ON public.platform_integration_webhooks;
CREATE TRIGGER trg_piw_updated_at BEFORE UPDATE ON public.platform_integration_webhooks
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

DROP TRIGGER IF EXISTS trg_pis_updated_at ON public.platform_integration_settings;
CREATE TRIGGER trg_pis_updated_at BEFORE UPDATE ON public.platform_integration_settings
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============ Seed providers ============
INSERT INTO public.platform_integration_providers (key, name, category, status, environment) VALUES
  ('whatsapp_uazapi', 'WhatsApp UAZAPI', 'Mensageria', 'configuracao_pendente', 'production'),
  ('whatsapp_evolution', 'WhatsApp Evolution API', 'Mensageria', 'configuracao_pendente', 'production'),
  ('transactional_email', 'E-mail transacional', 'Comunicação', 'configuracao_pendente', 'production'),
  ('sms', 'SMS', 'Comunicação', 'configuracao_pendente', 'production'),
  ('supabase_storage', 'Supabase Storage', 'Armazenamento', 'ativo', 'production'),
  ('platform_webhooks', 'Webhooks da plataforma', 'Webhook', 'ativo', 'production'),
  ('payment_gateway', 'Gateway de pagamento', 'Pagamentos', 'configuracao_pendente', 'production'),
  ('teleconsultation', 'Teleconsulta', 'Vídeo/Teleconsulta', 'ativo', 'production')
ON CONFLICT (key) DO NOTHING;
