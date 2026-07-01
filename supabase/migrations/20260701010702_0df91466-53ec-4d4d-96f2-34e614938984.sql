-- Seed function
CREATE OR REPLACE FUNCTION public.seed_clinic_resources(_clinic_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  INSERT INTO public.clinic_resources
    (clinic_id, resource_type, resource_key, resource_id, specialty_slug, enabled)
  SELECT _clinic_id, c.resource_type, c.resource_key, c.source_id, c.specialty_slug, true
  FROM public.prontuario_resource_catalog c
  WHERE c.is_active = true
  ON CONFLICT (clinic_id, resource_type, resource_key) DO NOTHING;
$$;
GRANT EXECUTE ON FUNCTION public.seed_clinic_resources(uuid) TO authenticated;

-- One-shot backfill for all existing clinics
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT id FROM public.clinics LOOP
    PERFORM public.seed_clinic_resources(r.id);
  END LOOP;
END $$;

-- Auto-seed for new clinics
CREATE OR REPLACE FUNCTION public.tg_seed_clinic_resources()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.seed_clinic_resources(NEW.id);
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_seed_clinic_resources ON public.clinics;
CREATE TRIGGER trg_seed_clinic_resources
  AFTER INSERT ON public.clinics
  FOR EACH ROW EXECUTE FUNCTION public.tg_seed_clinic_resources();
