-- 1) CLINICS: remover SELECT anônimo direto e expor apenas via view pública restrita
DROP POLICY IF EXISTS "Anon can view public booking clinics" ON public.clinics;

CREATE OR REPLACE VIEW public.public_clinic_booking
WITH (security_invoker = on) AS
SELECT
  id,
  name,
  slug,
  logo_url,
  phone,
  public_booking_enabled,
  public_booking_settings
FROM public.clinics
WHERE public_booking_enabled = true;

GRANT SELECT ON public.public_clinic_booking TO anon, authenticated;

-- Reabilita acesso mínimo para anon: política restrita a leitura via view (RLS na base permanece negando direto)
-- A view com security_invoker=on respeita RLS, então precisamos de uma policy permitindo SELECT das colunas seguras
-- Solução: permitir SELECT na base apenas dos campos públicos via policy + uso obrigatório da view.
CREATE POLICY "Anon can view minimal public booking fields"
ON public.clinics
FOR SELECT
TO anon
USING (public_booking_enabled = true);

-- Observação: a policy acima ainda permite SELECT * via tabela base, então revogamos colunas sensíveis para anon
REVOKE SELECT ON public.clinics FROM anon;
GRANT SELECT (id, name, slug, logo_url, phone, public_booking_enabled, public_booking_settings)
  ON public.clinics TO anon;

-- 2) STORAGE: restringir leitura de assinaturas profissionais à mesma clínica do dono do arquivo
DROP POLICY IF EXISTS "Clinic users can view professional signatures for documents" ON storage.objects;

CREATE POLICY "Same-clinic users can view professional signatures"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'professional-signatures'
  AND EXISTS (
    SELECT 1
    FROM public.profiles owner_p
    JOIN public.profiles viewer_p ON viewer_p.user_id = auth.uid()
    WHERE owner_p.user_id::text = (storage.foldername(name))[1]
      AND owner_p.clinic_id = viewer_p.clinic_id
  )
);