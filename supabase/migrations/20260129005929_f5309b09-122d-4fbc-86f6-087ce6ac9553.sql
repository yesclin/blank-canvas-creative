-- Add status and cancellation fields to sales table
ALTER TABLE public.sales
ADD COLUMN status TEXT NOT NULL DEFAULT 'active',
ADD COLUMN canceled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN canceled_by UUID REFERENCES auth.users(id);

-- Add check constraint for valid status values
ALTER TABLE public.sales
ADD CONSTRAINT sales_status_check CHECK (status IN ('active', 'canceled'));

-- Create index for filtering by status
CREATE INDEX idx_sales_status ON public.sales(status);

-- Add comment for documentation
COMMENT ON COLUMN public.sales.status IS 'Sale status: active or canceled';
COMMENT ON COLUMN public.sales.canceled_at IS 'Timestamp when sale was canceled';
COMMENT ON COLUMN public.sales.canceled_by IS 'User who canceled the sale';