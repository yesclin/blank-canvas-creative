-- Add specialty_type enum if not exists
DO $$ BEGIN
  CREATE TYPE public.specialty_type AS ENUM ('padrao', 'personalizada');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add type column to specialties table if not exists
ALTER TABLE public.specialties 
ADD COLUMN IF NOT EXISTS specialty_type public.specialty_type NOT NULL DEFAULT 'personalizada';

-- Make clinic_id nullable for global/standard specialties
ALTER TABLE public.specialties 
ALTER COLUMN clinic_id DROP NOT NULL;

-- Add unique constraint for standard specialty names (global level)
DROP INDEX IF EXISTS unique_standard_specialty_name;
CREATE UNIQUE INDEX unique_standard_specialty_name 
ON public.specialties (name) 
WHERE specialty_type = 'padrao' AND clinic_id IS NULL;

-- Add unique constraint for custom specialty names within a clinic
DROP INDEX IF EXISTS unique_custom_specialty_name_per_clinic;
CREATE UNIQUE INDEX unique_custom_specialty_name_per_clinic 
ON public.specialties (clinic_id, name) 
WHERE specialty_type = 'personalizada' AND clinic_id IS NOT NULL;

-- Update RLS policies to allow reading global specialties
DROP POLICY IF EXISTS "Users can view specialties" ON public.specialties;
DROP POLICY IF EXISTS "Users can view global and clinic specialties" ON public.specialties;

CREATE POLICY "Users can view global and clinic specialties"
ON public.specialties
FOR SELECT
USING (
  -- Global standard specialties are visible to all authenticated users
  (specialty_type = 'padrao' AND clinic_id IS NULL)
  OR
  -- Clinic-specific specialties visible to clinic members
  (clinic_id IN (SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid()))
);

-- Only admins/owners can manage specialties (INSERT/UPDATE/DELETE)
DROP POLICY IF EXISTS "Admins can manage specialties" ON public.specialties;
DROP POLICY IF EXISTS "Admins can manage clinic specialties" ON public.specialties;

CREATE POLICY "Owners can manage clinic specialties"
ON public.specialties
FOR ALL
USING (
  -- For custom specialties, check if user is owner of the clinic
  clinic_id IN (
    SELECT pro.clinic_id 
    FROM public.professionals pro
    WHERE pro.user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.user_id = auth.uid() 
      AND p.clinic_id = pro.clinic_id
    )
  )
)
WITH CHECK (
  clinic_id IN (
    SELECT pro.clinic_id 
    FROM public.professionals pro
    WHERE pro.user_id = auth.uid()
  )
);

-- Seed standard specialties (globally available)
INSERT INTO public.specialties (name, specialty_type, clinic_id, is_active, area) VALUES
  ('Clínica Geral', 'padrao', NULL, true, 'Medicina'),
  ('Pediatria', 'padrao', NULL, true, 'Medicina'),
  ('Ginecologia e Obstetrícia', 'padrao', NULL, true, 'Medicina'),
  ('Cardiologia', 'padrao', NULL, true, 'Medicina'),
  ('Dermatologia', 'padrao', NULL, true, 'Medicina'),
  ('Ortopedia', 'padrao', NULL, true, 'Medicina'),
  ('Oftalmologia', 'padrao', NULL, true, 'Medicina'),
  ('Neurologia', 'padrao', NULL, true, 'Medicina'),
  ('Psiquiatria', 'padrao', NULL, true, 'Saúde Mental'),
  ('Endocrinologia', 'padrao', NULL, true, 'Medicina'),
  ('Gastroenterologia', 'padrao', NULL, true, 'Medicina'),
  ('Urologia', 'padrao', NULL, true, 'Medicina'),
  ('Otorrinolaringologia', 'padrao', NULL, true, 'Medicina'),
  ('Pneumologia', 'padrao', NULL, true, 'Medicina'),
  ('Reumatologia', 'padrao', NULL, true, 'Medicina'),
  ('Geriatria', 'padrao', NULL, true, 'Medicina'),
  ('Angiologia', 'padrao', NULL, true, 'Medicina'),
  ('Odontologia Geral', 'padrao', NULL, true, 'Odontologia'),
  ('Ortodontia', 'padrao', NULL, true, 'Odontologia'),
  ('Endodontia', 'padrao', NULL, true, 'Odontologia'),
  ('Periodontia', 'padrao', NULL, true, 'Odontologia'),
  ('Implantodontia', 'padrao', NULL, true, 'Odontologia'),
  ('Odontopediatria', 'padrao', NULL, true, 'Odontologia'),
  ('Prótese Dentária', 'padrao', NULL, true, 'Odontologia'),
  ('Cirurgia Bucomaxilofacial', 'padrao', NULL, true, 'Odontologia'),
  ('Harmonização Orofacial', 'padrao', NULL, true, 'Odontologia'),
  ('Psicologia Clínica', 'padrao', NULL, true, 'Saúde Mental'),
  ('Neuropsicologia', 'padrao', NULL, true, 'Saúde Mental'),
  ('Psicoterapia', 'padrao', NULL, true, 'Saúde Mental'),
  ('Fisioterapia Geral', 'padrao', NULL, true, 'Reabilitação'),
  ('Fisioterapia Ortopédica', 'padrao', NULL, true, 'Reabilitação'),
  ('Fisioterapia Neurológica', 'padrao', NULL, true, 'Reabilitação'),
  ('Fisioterapia Respiratória', 'padrao', NULL, true, 'Reabilitação'),
  ('RPG', 'padrao', NULL, true, 'Reabilitação'),
  ('Pilates', 'padrao', NULL, true, 'Reabilitação'),
  ('Nutrição Clínica', 'padrao', NULL, true, 'Nutrição'),
  ('Nutrição Esportiva', 'padrao', NULL, true, 'Nutrição'),
  ('Nutrição Funcional', 'padrao', NULL, true, 'Nutrição'),
  ('Enfermagem', 'padrao', NULL, true, 'Enfermagem'),
  ('Estética Facial', 'padrao', NULL, true, 'Estética'),
  ('Estética Corporal', 'padrao', NULL, true, 'Estética'),
  ('Biomedicina Estética', 'padrao', NULL, true, 'Estética'),
  ('Fonoaudiologia', 'padrao', NULL, true, 'Reabilitação'),
  ('Terapia Ocupacional', 'padrao', NULL, true, 'Reabilitação'),
  ('Acupuntura', 'padrao', NULL, true, 'Terapias Integrativas'),
  ('Quiropraxia', 'padrao', NULL, true, 'Terapias Integrativas'),
  ('Osteopatia', 'padrao', NULL, true, 'Terapias Integrativas')
ON CONFLICT DO NOTHING;

-- Update existing clinic specialties to be 'personalizada' type
UPDATE public.specialties 
SET specialty_type = 'personalizada' 
WHERE clinic_id IS NOT NULL AND specialty_type IS NULL;