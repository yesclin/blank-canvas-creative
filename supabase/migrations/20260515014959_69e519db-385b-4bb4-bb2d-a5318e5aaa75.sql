UPDATE public.platform_settings
SET value = 'false'::jsonb,
    description = 'Confirmação de e-mail desativada para permitir entrada automática após cadastro',
    updated_at = now()
WHERE key = 'security.require_email_confirmation';

INSERT INTO public.platform_settings (key, value, description, category)
SELECT 'security.require_email_confirmation', 'false'::jsonb, 'Confirmação de e-mail desativada para permitir entrada automática após cadastro', 'security'
WHERE NOT EXISTS (
  SELECT 1 FROM public.platform_settings WHERE key = 'security.require_email_confirmation'
);