
-- Add new columns to payment_methods for detailed type-specific information
ALTER TABLE public.payment_methods
  ADD COLUMN IF NOT EXISTS method_type text NOT NULL DEFAULT 'outro',
  ADD COLUMN IF NOT EXISTS bank_name text,
  ADD COLUMN IF NOT EXISTS bank_code text,
  ADD COLUMN IF NOT EXISTS agency text,
  ADD COLUMN IF NOT EXISTS account_number text,
  ADD COLUMN IF NOT EXISTS account_digit text,
  ADD COLUMN IF NOT EXISTS account_type text,
  ADD COLUMN IF NOT EXISTS account_holder_name text,
  ADD COLUMN IF NOT EXISTS account_holder_document text,
  ADD COLUMN IF NOT EXISTS pix_key_type text,
  ADD COLUMN IF NOT EXISTS pix_key text,
  ADD COLUMN IF NOT EXISTS wallet_provider text,
  ADD COLUMN IF NOT EXISTS acquirer_name text,
  ADD COLUMN IF NOT EXISTS card_brands text[],
  ADD COLUMN IF NOT EXISTS fee_percent numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fixed_fee numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS settlement_days integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS default_entry_account text,
  ADD COLUMN IF NOT EXISTS insurance_id uuid REFERENCES public.insurances(id),
  ADD COLUMN IF NOT EXISTS notes text;

-- Migrate existing data: map category to method_type for backwards compatibility
UPDATE public.payment_methods SET method_type = 
  CASE category
    WHEN 'cash' THEN 'dinheiro'
    WHEN 'instant' THEN 'pix'
    WHEN 'card' THEN 'cartao_credito'
    WHEN 'bank' THEN 'transferencia_bancaria'
    WHEN 'insurance' THEN 'convenio'
    WHEN 'courtesy' THEN 'outro'
    WHEN 'internal_credit' THEN 'outro'
    ELSE 'outro'
  END
WHERE method_type = 'outro';

-- Migrate existing fee_value to fee_percent where fee_type was percent
UPDATE public.payment_methods 
SET fee_percent = COALESCE(fee_value, 0)
WHERE fee_type = 'percent' AND (fee_percent IS NULL OR fee_percent = 0);

UPDATE public.payment_methods 
SET fixed_fee = COALESCE(fee_value, 0)
WHERE fee_type = 'fixed' AND (fixed_fee IS NULL OR fixed_fee = 0);
