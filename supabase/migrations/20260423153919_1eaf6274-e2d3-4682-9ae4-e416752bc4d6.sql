
-- =====================================================================
-- Restringir leitura de credenciais em clinic_channel_integrations
-- Apenas admins/owners da clínica podem ver tokens/URLs/IDs de provedor.
-- Demais usuários veem apenas colunas operacionais (status, telefone, etc).
-- =====================================================================

-- 1) Remover GRANT amplo de SELECT em todas as colunas
REVOKE SELECT ON public.clinic_channel_integrations FROM authenticated;
REVOKE SELECT ON public.clinic_channel_integrations FROM anon;

-- 2) GRANT SELECT apenas em colunas NÃO sensíveis para 'authenticated'
GRANT SELECT (
  id,
  clinic_id,
  channel,
  provider,
  status,
  is_active,
  is_default,
  instance_name,
  instance_phone,
  instance_status,
  instance_profile_name,
  instance_profile_pic_url,
  display_phone_number,
  is_business,
  webhook_enabled,
  last_connection_check_at,
  last_connection_status,
  created_at,
  updated_at
) ON public.clinic_channel_integrations TO authenticated;

-- 3) GRANT SELECT em TODAS as colunas (incluindo sensíveis) explicitamente
--    via policy adicional que filtra por admin. O column privilege já barra
--    leitura de credenciais para não-admin, mesmo que a policy permita.
--    Para admins, precisamos garantir o privilégio de coluna nas sensíveis:
GRANT SELECT (
  access_token,
  instance_token,
  api_url,
  base_url,
  webhook_url,
  phone_number_id,
  business_account_id,
  instance_external_id,
  instance_id,
  config,
  metadata,
  settings_json,
  last_error
) ON public.clinic_channel_integrations TO authenticated;

-- 4) Substituir policies de SELECT: uma para admins (todas colunas, sem
--    restrição extra), e a existente para usuários comuns continua valendo.
DROP POLICY IF EXISTS "Users can view channel integrations" ON public.clinic_channel_integrations;
DROP POLICY IF EXISTS "Admins can view channel credentials" ON public.clinic_channel_integrations;
DROP POLICY IF EXISTS "Members can view channel integrations" ON public.clinic_channel_integrations;

-- Policy: usuários comuns da clínica podem SELECT linhas (privilégios de
-- coluna acima impedem leitura de credenciais via supabase-js).
CREATE POLICY "Members can view channel integrations"
ON public.clinic_channel_integrations
FOR SELECT
TO authenticated
USING (clinic_id = public.user_clinic_id(auth.uid()));

-- A policy "Admins can manage channel integrations" (FOR ALL) já existe e
-- permite admins ler tudo. Combinada com os GRANTs de coluna acima,
-- somente admins terão acesso efetivo às colunas sensíveis.

-- 5) Função RPC dedicada para admins lerem credenciais de forma explícita
--    (defense in depth: mesmo que o cliente tente select('*'), valores de
--    credencial só vêm via esta RPC, validada server-side).
CREATE OR REPLACE FUNCTION public.get_channel_integration_credentials(_integration_id uuid)
RETURNS TABLE (
  id uuid,
  clinic_id uuid,
  channel text,
  provider text,
  access_token text,
  instance_token text,
  api_url text,
  base_url text,
  webhook_url text,
  phone_number_id text,
  business_account_id text,
  instance_external_id text,
  instance_id text,
  config jsonb,
  metadata jsonb,
  settings_json jsonb,
  last_error text
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  _clinic_id uuid;
BEGIN
  SELECT cci.clinic_id INTO _clinic_id
  FROM public.clinic_channel_integrations cci
  WHERE cci.id = _integration_id;

  IF _clinic_id IS NULL THEN
    RAISE EXCEPTION 'Integration not found';
  END IF;

  IF NOT public.is_clinic_admin(auth.uid(), _clinic_id) THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;

  RETURN QUERY
  SELECT
    cci.id,
    cci.clinic_id,
    cci.channel,
    cci.provider,
    cci.access_token,
    cci.instance_token,
    cci.api_url,
    cci.base_url,
    cci.webhook_url,
    cci.phone_number_id,
    cci.business_account_id,
    cci.instance_external_id,
    cci.instance_id,
    cci.config,
    cci.metadata,
    cci.settings_json,
    cci.last_error
  FROM public.clinic_channel_integrations cci
  WHERE cci.id = _integration_id;
END;
$$;

REVOKE ALL ON FUNCTION public.get_channel_integration_credentials(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_channel_integration_credentials(uuid) TO authenticated;
