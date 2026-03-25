-- Fix search_path on prevent_signed_record_update
CREATE OR REPLACE FUNCTION public.prevent_signed_record_update()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF OLD.status = 'assinado' AND NEW.status != 'cancelado' THEN
    RAISE EXCEPTION 'Registros assinados são imutáveis. Não é possível editar após assinatura.';
  END IF;
  RETURN NEW;
END;
$$;

-- Add unique constraint on specialties(clinic_id, slug) if not exists
DO $$ BEGIN
  ALTER TABLE public.specialties ADD CONSTRAINT uq_specialties_clinic_slug UNIQUE (clinic_id, slug);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;