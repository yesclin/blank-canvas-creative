-- Add new columns for UAZAPI instance management
ALTER TABLE public.clinic_channel_integrations
  ADD COLUMN IF NOT EXISTS instance_name text,
  ADD COLUMN IF NOT EXISTS instance_external_id text,
  ADD COLUMN IF NOT EXISTS instance_token text,
  ADD COLUMN IF NOT EXISTS instance_status text,
  ADD COLUMN IF NOT EXISTS instance_phone text,
  ADD COLUMN IF NOT EXISTS instance_profile_name text,
  ADD COLUMN IF NOT EXISTS instance_profile_pic_url text,
  ADD COLUMN IF NOT EXISTS is_business boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS webhook_url text,
  ADD COLUMN IF NOT EXISTS webhook_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_connection_check_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_connection_status text,
  ADD COLUMN IF NOT EXISTS last_error text,
  ADD COLUMN IF NOT EXISTS settings_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS is_default boolean NOT NULL DEFAULT true;

-- Deactivate legacy Evolution API integrations (preserve history)
UPDATE public.clinic_channel_integrations
SET is_active = false,
    is_default = false,
    status = 'not_configured'
WHERE provider = 'evolution-api';

-- Ensure only one default WhatsApp integration per clinic
CREATE UNIQUE INDEX IF NOT EXISTS idx_clinic_whatsapp_default_unique
ON public.clinic_channel_integrations (clinic_id)
WHERE channel = 'whatsapp' AND is_default = true AND is_active = true;

-- Index for fast lookups by clinic + channel
CREATE INDEX IF NOT EXISTS idx_clinic_channel_lookup
ON public.clinic_channel_integrations (clinic_id, channel, is_active);