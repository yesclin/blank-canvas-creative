-- Add allow_negative_stock setting to clinics table
ALTER TABLE public.clinics 
ADD COLUMN IF NOT EXISTS allow_negative_stock boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.clinics.allow_negative_stock IS 'Whether to allow sales that result in negative stock quantities';