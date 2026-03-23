-- Add specialty_id column to procedures table as FK to specialties
-- This replaces the text-based specialty field with a proper FK relationship

-- Step 1: Add the specialty_id column
ALTER TABLE public.procedures 
ADD COLUMN specialty_id UUID REFERENCES public.specialties(id) ON DELETE SET NULL;

-- Step 2: Create index for better query performance
CREATE INDEX idx_procedures_specialty_id ON public.procedures(specialty_id);

-- Step 3: Add comment for documentation
COMMENT ON COLUMN public.procedures.specialty_id IS 'FK to specialties table for automatic medical record context';

-- Note: The existing TEXT 'specialty' column is kept for backwards compatibility
-- It can be removed in a future migration after data is migrated