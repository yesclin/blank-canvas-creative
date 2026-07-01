-- ============================================================================
-- clinic_resources: centralized per-clinic resource enablement
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.clinic_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  resource_type text NOT NULL,
  resource_key text NOT NULL,
  resource_id uuid,
  specialty_id uuid,
  specialty_slug text,
  parent_specialty_slug text,
  enabled boolean NOT NULL DEFAULT true,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid,
  CONSTRAINT clinic_resources_unique UNIQUE (clinic_id, resource_type, resource_key)
);

CREATE INDEX IF NOT EXISTS idx_clinic_resources_clinic_type
  ON public.clinic_resources (clinic_id, resource_type) WHERE enabled = true;
CREATE INDEX IF NOT EXISTS idx_clinic_resources_specialty
  ON public.clinic_resources (clinic_id, specialty_slug);

GRANT SELECT ON public.clinic_resources TO authenticated;
GRANT ALL ON public.clinic_resources TO service_role;

ALTER TABLE public.clinic_resources ENABLE ROW LEVEL SECURITY;

-- Read: any clinic member can read their clinic's resources
CREATE POLICY "clinic_resources_select_members"
  ON public.clinic_resources FOR SELECT
  TO authenticated
  USING (
    public.is_platform_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.clinic_id = clinic_resources.clinic_id
    )
  );

-- Write: only platform admins
CREATE POLICY "clinic_resources_write_admin"
  ON public.clinic_resources FOR ALL
  TO authenticated
  USING (public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_platform_admin(auth.uid()));

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_clinic_resources_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS trg_clinic_resources_updated_at ON public.clinic_resources;
CREATE TRIGGER trg_clinic_resources_updated_at
  BEFORE UPDATE ON public.clinic_resources
  FOR EACH ROW EXECUTE FUNCTION public.set_clinic_resources_updated_at();

-- ============================================================================
-- Backfill from legacy tables
-- ============================================================================

-- template overrides → anamnesis / evolution / plan / document / etc.
INSERT INTO public.clinic_resources (
  clinic_id, resource_type, resource_key, resource_id, specialty_id, enabled, reason, updated_by, created_at, updated_at
)
SELECT
  o.clinic_id,
  COALESCE(NULLIF(o.template_kind, ''), 'anamnesis') AS resource_type,
  COALESCE(o.resource_key, 'tpl:' || o.template_id::text) AS resource_key,
  o.template_id,
  o.specialty_id,
  o.enabled,
  o.reason,
  o.created_by,
  o.created_at,
  o.updated_at
FROM public.clinic_template_overrides o
WHERE o.clinic_id IS NOT NULL
ON CONFLICT (clinic_id, resource_type, resource_key) DO NOTHING;

-- feature overrides → module / prontuario_function
INSERT INTO public.clinic_resources (
  clinic_id, resource_type, resource_key, enabled, reason, updated_by, created_at, updated_at
)
SELECT
  f.clinic_id,
  'module' AS resource_type,
  'mod:' || f.feature_key,
  f.enabled,
  f.reason,
  f.created_by,
  f.created_at,
  f.created_at
FROM public.clinic_feature_overrides f
WHERE f.clinic_id IS NOT NULL
ON CONFLICT (clinic_id, resource_type, resource_key) DO NOTHING;

-- ============================================================================
-- RPC: get_clinic_resources(_clinic_id)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_clinic_resources(_clinic_id uuid)
RETURNS TABLE (
  id uuid,
  clinic_id uuid,
  resource_type text,
  resource_key text,
  resource_id uuid,
  specialty_id uuid,
  specialty_slug text,
  parent_specialty_slug text,
  enabled boolean,
  updated_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id, clinic_id, resource_type, resource_key, resource_id, specialty_id,
         specialty_slug, parent_specialty_slug, enabled, updated_at
  FROM public.clinic_resources
  WHERE clinic_id = _clinic_id;
$$;
GRANT EXECUTE ON FUNCTION public.get_clinic_resources(uuid) TO authenticated;

-- ============================================================================
-- Comment legacy tables as deprecated
-- ============================================================================
COMMENT ON TABLE public.clinic_template_overrides IS 'DEPRECATED — replaced by public.clinic_resources. Kept read-only for one release.';
COMMENT ON TABLE public.clinic_feature_overrides  IS 'DEPRECATED — replaced by public.clinic_resources. Kept read-only for one release.';
