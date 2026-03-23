-- Add area column to specialties table for better categorization
ALTER TABLE public.specialties
ADD COLUMN IF NOT EXISTS area text;

-- Add comment for documentation
COMMENT ON COLUMN public.specialties.area IS 'Optional area/category for the specialty (e.g., Saúde Mental, Estética, etc.)';