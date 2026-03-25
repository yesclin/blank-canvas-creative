-- ============================================
-- FINANCIAL MODULE: Add missing columns
-- ============================================

-- 1. finance_transactions: add transaction_date and origin
ALTER TABLE public.finance_transactions 
  ADD COLUMN IF NOT EXISTS transaction_date date,
  ADD COLUMN IF NOT EXISTS origin text;

-- Backfill transaction_date from paid_at or created_at
UPDATE public.finance_transactions 
SET transaction_date = COALESCE(paid_at::date, created_at::date)
WHERE transaction_date IS NULL;

-- Make transaction_date NOT NULL with default
ALTER TABLE public.finance_transactions 
  ALTER COLUMN transaction_date SET DEFAULT CURRENT_DATE,
  ALTER COLUMN transaction_date SET NOT NULL;

-- 2. sales: add missing columns
ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS sale_date timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS sale_number text,
  ADD COLUMN IF NOT EXISTS transaction_id uuid REFERENCES public.finance_transactions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pendente',
  ADD COLUMN IF NOT EXISTS subtotal numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_percent numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS canceled_at timestamptz,
  ADD COLUMN IF NOT EXISTS canceled_by uuid,
  ADD COLUMN IF NOT EXISTS created_by uuid;

-- Backfill sale_date from created_at
UPDATE public.sales SET sale_date = created_at WHERE sale_date IS NULL;
-- Backfill payment_status from status
UPDATE public.sales SET payment_status = status WHERE payment_status = 'pendente' AND status != 'pendente';
-- Backfill subtotal
UPDATE public.sales SET subtotal = COALESCE(total_amount, 0) + COALESCE(discount_amount, 0) WHERE subtotal = 0;

-- 3. sale_items: add missing columns
ALTER TABLE public.sale_items
  ADD COLUMN IF NOT EXISTS product_name text DEFAULT '',
  ADD COLUMN IF NOT EXISTS discount_amount numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cost_price numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_cost numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS profit numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS margin_percent numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS notes text;

-- 4. insurance_fee_calculations: add missing columns for MeuFinanceiro
ALTER TABLE public.insurance_fee_calculations
  ADD COLUMN IF NOT EXISTS service_date date,
  ADD COLUMN IF NOT EXISTS gross_value numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS professional_fee numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_date date,
  ADD COLUMN IF NOT EXISTS professional_id uuid REFERENCES public.professionals(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS patient_id uuid REFERENCES public.patients(id) ON DELETE SET NULL;

-- Backfill service_date from created_at
UPDATE public.insurance_fee_calculations 
SET service_date = created_at::date WHERE service_date IS NULL;

-- Backfill gross_value from calculated_amount
UPDATE public.insurance_fee_calculations 
SET gross_value = COALESCE(calculated_amount, 0) WHERE gross_value = 0;

-- 5. treatment_packages: add missing columns
ALTER TABLE public.treatment_packages
  ADD COLUMN IF NOT EXISTS procedure_id uuid REFERENCES public.procedures(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS professional_id uuid REFERENCES public.professionals(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS payment_method text,
  ADD COLUMN IF NOT EXISTS valid_until date,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS created_by uuid;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_finance_transactions_date ON public.finance_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_finance_transactions_type ON public.finance_transactions(type);
CREATE INDEX IF NOT EXISTS idx_sales_sale_date ON public.sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_insurance_fee_calc_service_date ON public.insurance_fee_calculations(service_date);
CREATE INDEX IF NOT EXISTS idx_insurance_fee_calc_professional ON public.insurance_fee_calculations(professional_id);