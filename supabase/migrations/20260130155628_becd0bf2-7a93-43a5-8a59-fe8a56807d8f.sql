-- Add column to store the executed procedure cost (historical value)
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS procedure_cost numeric DEFAULT NULL;

-- Add comment explaining the column
COMMENT ON COLUMN public.appointments.procedure_cost IS 'Real cost calculated at execution time. Preserved as historical value even if product costs change later.';