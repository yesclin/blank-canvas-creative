
-- 1) Aliases table
CREATE TABLE IF NOT EXISTS public.clinic_specialty_aliases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  base_specialty_key text NOT NULL,
  display_name text NOT NULL CHECK (char_length(btrim(display_name)) BETWEEN 1 AND 60),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS clinic_specialty_aliases_clinic_key_uk
  ON public.clinic_specialty_aliases (clinic_id, base_specialty_key);

CREATE UNIQUE INDEX IF NOT EXISTS clinic_specialty_aliases_clinic_display_uk
  ON public.clinic_specialty_aliases (clinic_id, lower(btrim(display_name)));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.clinic_specialty_aliases TO authenticated;
GRANT ALL ON public.clinic_specialty_aliases TO service_role;

ALTER TABLE public.clinic_specialty_aliases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members read aliases"
  ON public.clinic_specialty_aliases FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.clinic_id = clinic_specialty_aliases.clinic_id
    )
  );

CREATE POLICY "owner/admin write aliases"
  ON public.clinic_specialty_aliases FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.clinic_id = clinic_specialty_aliases.clinic_id
        AND ur.role IN ('owner','admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.clinic_id = clinic_specialty_aliases.clinic_id
        AND ur.role IN ('owner','admin')
    )
  );

CREATE TRIGGER trg_aliases_updated_at
  BEFORE UPDATE ON public.clinic_specialty_aliases
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) Migrate existing personalizadas
DO $$
DECLARE
  r record;
  v_other_id uuid;
BEGIN
  FOR r IN
    SELECT DISTINCT clinic_id FROM public.specialties WHERE specialty_type = 'personalizada'
  LOOP
    -- Ensure "Outra Especialidade / Atendimento Geral" exists for this clinic
    SELECT id INTO v_other_id
    FROM public.specialties
    WHERE clinic_id = r.clinic_id AND slug = 'other_specialty'
    LIMIT 1;

    IF v_other_id IS NULL THEN
      INSERT INTO public.specialties (clinic_id, name, slug, description, area, specialty_type, is_active)
      VALUES (r.clinic_id, 'Outra Especialidade / Atendimento Geral', 'other_specialty',
              'Modelo básico de prontuário para atendimentos não cobertos pelas especialidades oficiais.',
              'Geral', 'padrao', true)
      RETURNING id INTO v_other_id;
    END IF;

    -- Save the first personalizada name as display_name (first row wins; UNIQUE enforces single alias)
    INSERT INTO public.clinic_specialty_aliases (clinic_id, base_specialty_key, display_name)
    SELECT r.clinic_id, 'other_specialty', left(btrim(s.name), 60)
    FROM public.specialties s
    WHERE s.clinic_id = r.clinic_id AND s.specialty_type = 'personalizada'
    ORDER BY s.created_at ASC
    LIMIT 1
    ON CONFLICT (clinic_id, base_specialty_key) DO NOTHING;

    -- Repoint references
    UPDATE public.clinic_specialty_modules csm
       SET specialty_id = v_other_id
     WHERE csm.clinic_id = r.clinic_id
       AND csm.specialty_id IN (
         SELECT id FROM public.specialties
         WHERE clinic_id = r.clinic_id AND specialty_type = 'personalizada'
       )
       AND NOT EXISTS (
         SELECT 1 FROM public.clinic_specialty_modules x
         WHERE x.clinic_id = csm.clinic_id
           AND x.specialty_id = v_other_id
           AND x.module_key = csm.module_key
       );

    -- Drop leftover duplicates that would violate the unique key
    DELETE FROM public.clinic_specialty_modules
     WHERE clinic_id = r.clinic_id
       AND specialty_id IN (
         SELECT id FROM public.specialties
         WHERE clinic_id = r.clinic_id AND specialty_type = 'personalizada'
       );

    UPDATE public.appointments
       SET specialty_id = v_other_id
     WHERE clinic_id = r.clinic_id
       AND specialty_id IN (
         SELECT id FROM public.specialties
         WHERE clinic_id = r.clinic_id AND specialty_type = 'personalizada'
       );

    UPDATE public.professional_specialties ps
       SET specialty_id = v_other_id
     WHERE ps.specialty_id IN (
       SELECT id FROM public.specialties
       WHERE clinic_id = r.clinic_id AND specialty_type = 'personalizada'
     )
     AND NOT EXISTS (
       SELECT 1 FROM public.professional_specialties x
       WHERE x.professional_id = ps.professional_id
         AND x.specialty_id = v_other_id
     );

    DELETE FROM public.professional_specialties
     WHERE specialty_id IN (
       SELECT id FROM public.specialties
       WHERE clinic_id = r.clinic_id AND specialty_type = 'personalizada'
     );

    -- Deactivate personalizadas (preserve rows for any other FK we missed)
    UPDATE public.specialties
       SET is_active = false
     WHERE clinic_id = r.clinic_id AND specialty_type = 'personalizada';
  END LOOP;
END $$;
