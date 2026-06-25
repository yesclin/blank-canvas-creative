
-- Professionals: novos campos de conselho
ALTER TABLE public.professionals
  ADD COLUMN IF NOT EXISTS display_name text,
  ADD COLUMN IF NOT EXISTS council text,
  ADD COLUMN IF NOT EXISTS council_state text,
  ADD COLUMN IF NOT EXISTS rqe text,
  ADD COLUMN IF NOT EXISTS primary_specialty_id uuid REFERENCES public.specialties(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_technical_responsible boolean NOT NULL DEFAULT false;

-- Apenas 1 responsável técnico por clínica
CREATE UNIQUE INDEX IF NOT EXISTS professionals_unique_tech_responsible
  ON public.professionals(clinic_id)
  WHERE is_technical_responsible = true;

-- Clinics: aponta para o responsável técnico
ALTER TABLE public.clinics
  ADD COLUMN IF NOT EXISTS technical_responsible_professional_id uuid REFERENCES public.professionals(id) ON DELETE SET NULL;

-- User invitations: carregar dados de conselho até o aceite
ALTER TABLE public.user_invitations
  ADD COLUMN IF NOT EXISTS council text,
  ADD COLUMN IF NOT EXISTS council_state text,
  ADD COLUMN IF NOT EXISTS rqe text,
  ADD COLUMN IF NOT EXISTS primary_specialty_id uuid;

-- RPC usada pelo accept-invite (não existia ainda)
CREATE OR REPLACE FUNCTION public.create_professional_from_invitation(
  p_user_id uuid,
  p_clinic_id uuid,
  p_full_name text,
  p_email text,
  p_professional_type text DEFAULT NULL,
  p_registration_number text DEFAULT NULL,
  p_specialty_ids uuid[] DEFAULT ARRAY[]::uuid[],
  p_council text DEFAULT NULL,
  p_council_state text DEFAULT NULL,
  p_rqe text DEFAULT NULL,
  p_primary_specialty_id uuid DEFAULT NULL,
  p_display_name text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prof_id uuid;
  v_spec uuid;
BEGIN
  -- evita duplicar profissional para o mesmo usuário/clínica
  SELECT id INTO v_prof_id
  FROM public.professionals
  WHERE clinic_id = p_clinic_id AND user_id = p_user_id
  LIMIT 1;

  IF v_prof_id IS NULL THEN
    INSERT INTO public.professionals (
      clinic_id, user_id, full_name, email,
      registration_number, specialty_id,
      display_name, council, council_state, rqe, primary_specialty_id, is_active
    ) VALUES (
      p_clinic_id, p_user_id, p_full_name, p_email,
      p_registration_number,
      COALESCE(p_primary_specialty_id, (SELECT s FROM unnest(p_specialty_ids) s LIMIT 1)),
      COALESCE(p_display_name, p_full_name),
      p_council, p_council_state, p_rqe,
      COALESCE(p_primary_specialty_id, (SELECT s FROM unnest(p_specialty_ids) s LIMIT 1)),
      true
    )
    RETURNING id INTO v_prof_id;
  ELSE
    UPDATE public.professionals
    SET full_name = COALESCE(p_full_name, full_name),
        email = COALESCE(p_email, email),
        registration_number = COALESCE(p_registration_number, registration_number),
        display_name = COALESCE(p_display_name, display_name, full_name),
        council = COALESCE(p_council, council),
        council_state = COALESCE(p_council_state, council_state),
        rqe = COALESCE(p_rqe, rqe),
        primary_specialty_id = COALESCE(p_primary_specialty_id, primary_specialty_id),
        is_active = true,
        updated_at = now()
    WHERE id = v_prof_id;
  END IF;

  -- Sincroniza vínculo multi-especialidade
  IF array_length(p_specialty_ids, 1) IS NOT NULL THEN
    FOREACH v_spec IN ARRAY p_specialty_ids LOOP
      INSERT INTO public.professional_specialties (professional_id, specialty_id, is_primary)
      VALUES (v_prof_id, v_spec, v_spec = COALESCE(p_primary_specialty_id, p_specialty_ids[1]))
      ON CONFLICT (professional_id, specialty_id) DO UPDATE
        SET is_primary = EXCLUDED.is_primary;
    END LOOP;
  END IF;

  RETURN v_prof_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_professional_from_invitation(uuid, uuid, text, text, text, text, uuid[], text, text, text, uuid, text) TO service_role;
