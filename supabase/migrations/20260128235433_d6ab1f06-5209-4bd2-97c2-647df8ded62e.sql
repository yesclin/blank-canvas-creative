-- Add appointment_id to sales table (patient_id already exists)
ALTER TABLE public.sales
ADD COLUMN appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_sales_appointment_id ON public.sales(appointment_id);

-- Add comment for documentation
COMMENT ON COLUMN public.sales.appointment_id IS 'Optional reference to the appointment associated with this sale';