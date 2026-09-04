CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;

CREATE INDEX IF NOT EXISTS idx_patients_clinic_active_name
  ON public.patients (clinic_id, is_active, full_name);

CREATE INDEX IF NOT EXISTS idx_patients_full_name_trgm
  ON public.patients USING gin (full_name extensions.gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_patients_cpf_trgm
  ON public.patients USING gin (cpf extensions.gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_patients_phone_trgm
  ON public.patients USING gin (phone extensions.gin_trgm_ops);

ANALYZE public.patients;