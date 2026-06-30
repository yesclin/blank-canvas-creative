
-- Tabela de overrides de modelos de prontuário por clínica
CREATE TABLE IF NOT EXISTS public.clinic_template_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  template_id uuid NOT NULL,
  template_kind text NOT NULL CHECK (template_kind IN ('medical_record','anamnesis')),
  specialty_id uuid NULL,
  enabled boolean NOT NULL DEFAULT true,
  reason text,
  expires_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (clinic_id, template_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.clinic_template_overrides TO authenticated;
GRANT ALL ON public.clinic_template_overrides TO service_role;

ALTER TABLE public.clinic_template_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "platform_admin_all_template_overrides"
  ON public.clinic_template_overrides
  FOR ALL
  USING (public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_platform_admin(auth.uid()));

CREATE POLICY "clinic_read_own_template_overrides"
  ON public.clinic_template_overrides
  FOR SELECT
  USING (clinic_id IN (SELECT clinic_id FROM public.profiles WHERE id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_clinic_template_overrides_clinic
  ON public.clinic_template_overrides(clinic_id);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.tg_clinic_template_overrides_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TRIGGER trg_clinic_template_overrides_updated_at
  BEFORE UPDATE ON public.clinic_template_overrides
  FOR EACH ROW EXECUTE FUNCTION public.tg_clinic_template_overrides_updated_at();

-- RPC: catálogo de modelos do sistema da clínica, agrupado por especialidade
CREATE OR REPLACE FUNCTION public.get_super_admin_template_catalog(p_clinic_id uuid)
RETURNS TABLE (
  template_id uuid,
  template_kind text,
  title text,
  specialty_id uuid,
  specialty_slug text,
  specialty_name text,
  is_active boolean
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT t.id, 'medical_record'::text, t.name, t.specialty_id,
         s.slug, COALESCE(s.name,'Sem especialidade'), t.is_active
  FROM public.medical_record_templates t
  LEFT JOIN public.specialties s ON s.id = t.specialty_id
  WHERE t.clinic_id = p_clinic_id AND t.is_system = true
  UNION ALL
  SELECT t.id, 'anamnesis'::text, t.name, t.specialty_id,
         s.slug, COALESCE(s.name,'Sem especialidade'), t.is_active
  FROM public.anamnesis_templates t
  LEFT JOIN public.specialties s ON s.id = t.specialty_id
  WHERE t.clinic_id = p_clinic_id AND t.is_system = true
  ORDER BY 6, 3;
$$;

REVOKE ALL ON FUNCTION public.get_super_admin_template_catalog(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_super_admin_template_catalog(uuid) TO authenticated;
