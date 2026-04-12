
-- Add evolution_type column to clinical_evolutions for specialty-specific filtering
ALTER TABLE public.clinical_evolutions
ADD COLUMN IF NOT EXISTS evolution_type text DEFAULT 'general';

-- Add index for efficient filtering
CREATE INDEX IF NOT EXISTS idx_clinical_evolutions_evolution_type 
ON public.clinical_evolutions(evolution_type);
