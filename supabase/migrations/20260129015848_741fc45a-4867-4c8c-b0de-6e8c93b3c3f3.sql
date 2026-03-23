-- Drop existing check constraint
ALTER TABLE public.sales DROP CONSTRAINT IF EXISTS sales_status_check;

-- Update default value to Portuguese
ALTER TABLE public.sales ALTER COLUMN status SET DEFAULT 'ativo';

-- Update existing 'active' values to 'ativo'
UPDATE public.sales SET status = 'ativo' WHERE status = 'active';

-- Add new check constraint with Portuguese values
ALTER TABLE public.sales 
ADD CONSTRAINT sales_status_check CHECK (status IN ('ativo', 'cancelado'));