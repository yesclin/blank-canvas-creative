-- Add missing columns to system_security_settings
ALTER TABLE public.system_security_settings
ADD COLUMN IF NOT EXISTS enable_digital_signature BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS enable_tab_permissions BOOLEAN NOT NULL DEFAULT false;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_system_security_settings_clinic_id 
ON public.system_security_settings(clinic_id);

-- Add unique constraint to ensure only one record per clinic
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'system_security_settings_clinic_id_unique'
  ) THEN
    ALTER TABLE public.system_security_settings 
    ADD CONSTRAINT system_security_settings_clinic_id_unique UNIQUE (clinic_id);
  END IF;
END $$;