
CREATE TABLE IF NOT EXISTS public.prontuario_resource_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_key text NOT NULL UNIQUE,
  resource_type text NOT NULL,
  specialty_slug text,
  title text NOT NULL,
  description text,
  source_table text,
  source_id uuid,
  preview_payload jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.prontuario_resource_catalog TO authenticated;
GRANT ALL ON public.prontuario_resource_catalog TO service_role;
ALTER TABLE public.prontuario_resource_catalog ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Catalog readable by authenticated" ON public.prontuario_resource_catalog;
CREATE POLICY "Catalog readable by authenticated"
  ON public.prontuario_resource_catalog FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Catalog writable by super admin" ON public.prontuario_resource_catalog;
CREATE POLICY "Catalog writable by super admin"
  ON public.prontuario_resource_catalog FOR ALL TO authenticated
  USING (public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_platform_admin(auth.uid()));

ALTER TABLE public.clinic_template_overrides
  ADD COLUMN IF NOT EXISTS resource_key text;

CREATE UNIQUE INDEX IF NOT EXISTS clinic_template_overrides_clinic_resource_key
  ON public.clinic_template_overrides(clinic_id, resource_key)
  WHERE resource_key IS NOT NULL;

INSERT INTO public.prontuario_resource_catalog
  (resource_key, resource_type, specialty_slug, title, description, source_table, preview_payload)
VALUES
  ('estetica.facial_map', 'funcao', 'aesthetics', 'Mapa Facial', 'Mapeamento geolocalizado de aplicações por região facial.', 'feature', '{"sections":["Mapa SVG interativo","Registro de aplicações","Duplicação por sessão"]}'::jsonb),
  ('estetica.before_after', 'funcao', 'aesthetics', 'Antes e Depois', 'Comparativo fotográfico de evolução estética.', 'feature', '{"sections":["Upload de fotos","Comparativo lado a lado"]}'::jsonb),
  ('estetica.products_used', 'funcao', 'aesthetics', 'Produtos Utilizados', 'Controle de insumos por atendimento.', 'feature', '{"sections":["Lote/validade","Quantidade","Custo"]}'::jsonb),
  ('odontologia.odontogram', 'funcao', 'dentistry', 'Odontograma', 'Mapeamento dental por face e condição.', 'feature', '{"sections":["Mapa de dentes","Procedimentos por dente"]}'::jsonb),
  ('psicologia.plano_terapeutico', 'funcao', 'psychology', 'Plano Terapêutico', 'Objetivos terapêuticos e progresso por sessão.', 'feature', '{"sections":["Objetivos","Metas","Evolução"]}'::jsonb),
  ('psicologia.escalas', 'funcao', 'psychology', 'Escalas Psicológicas', 'Instrumentos validados.', 'feature', null),
  ('psicologia.plano_crise', 'funcao', 'psychology', 'Plano de Ação em Crise', 'Plano estruturado para situações de crise.', 'feature', null),
  ('pediatria.grafico_oms', 'funcao', 'pediatrics', 'Gráficos OMS', 'Percentis OMS de crescimento.', 'feature', null),
  ('global.prescricao', 'funcao', null, 'Prescrição', 'Receituário eletrônico com assinatura.', 'feature', null),
  ('global.documentos', 'aba', null, 'Documentos Clínicos', 'Geração e assinatura de documentos clínicos.', 'feature', null),
  ('global.evolucao', 'aba', null, 'Evolução Clínica', 'Registro evolutivo da consulta.', 'feature', null),
  ('global.anexos', 'aba', null, 'Anexos / Exames', 'Upload e organização de anexos.', 'feature', null),
  ('global.alertas', 'aba', null, 'Alertas Clínicos', 'Alertas críticos do paciente.', 'feature', null),
  ('global.timeline', 'aba', null, 'Linha do Tempo', 'Linha do tempo agregada do paciente.', 'feature', null),
  ('global.consentimentos', 'aba', null, 'Consentimentos', 'Termos de consentimento assinados.', 'feature', null)
ON CONFLICT (resource_key) DO UPDATE
  SET title = EXCLUDED.title, description = EXCLUDED.description,
      preview_payload = EXCLUDED.preview_payload, updated_at = now();

INSERT INTO public.prontuario_resource_catalog
  (resource_key, resource_type, specialty_slug, title, description, source_table, source_id, preview_payload)
SELECT
  'tpl:medical:' || t.id::text,
  COALESCE(t.type, 'evolucao'),
  COALESCE(s.slug, 'other_specialty'),
  t.name,
  COALESCE(t.description, 'Modelo de prontuário do sistema.'),
  'medical_record_templates',
  t.id,
  jsonb_build_object('config_preview', LEFT(COALESCE(t.config::text, ''), 800))
FROM public.medical_record_templates t
LEFT JOIN public.specialties s ON s.id = t.specialty_id
WHERE COALESCE(t.is_system, false) = true
ON CONFLICT (resource_key) DO UPDATE
  SET title = EXCLUDED.title, updated_at = now();

INSERT INTO public.prontuario_resource_catalog
  (resource_key, resource_type, specialty_slug, title, description, source_table, source_id, preview_payload)
SELECT
  'tpl:anamnesis:' || t.id::text,
  'anamnese',
  COALESCE(s.slug, t.specialty, 'other_specialty'),
  t.name,
  COALESCE(t.description, 'Modelo de anamnese do sistema.'),
  'anamnesis_templates',
  t.id,
  jsonb_build_object('fields_preview', LEFT(COALESCE(t.fields::text, t.campos::text, ''), 800))
FROM public.anamnesis_templates t
LEFT JOIN public.specialties s ON s.id = t.specialty_id
WHERE COALESCE(t.is_system, false) = true
ON CONFLICT (resource_key) DO UPDATE
  SET title = EXCLUDED.title, updated_at = now();

CREATE OR REPLACE FUNCTION public.get_prontuario_resource_catalog(p_clinic_id uuid)
RETURNS TABLE (
  resource_key text, resource_type text, specialty_slug text,
  title text, description text, source_table text, source_id uuid,
  preview_payload jsonb, enabled boolean, has_override boolean, override_reason text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.resource_key, c.resource_type, c.specialty_slug, c.title, c.description,
         c.source_table, c.source_id, c.preview_payload,
         COALESCE(o.enabled, true) AS enabled,
         (o.id IS NOT NULL) AS has_override,
         o.reason AS override_reason
  FROM public.prontuario_resource_catalog c
  LEFT JOIN public.clinic_template_overrides o
    ON o.clinic_id = p_clinic_id AND o.resource_key = c.resource_key
   AND (o.expires_at IS NULL OR o.expires_at > now())
  WHERE c.is_active = true
  ORDER BY c.specialty_slug NULLS FIRST, c.resource_type, c.title;
$$;
GRANT EXECUTE ON FUNCTION public.get_prontuario_resource_catalog(uuid) TO authenticated;
