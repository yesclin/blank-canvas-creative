
ALTER TABLE public.finance_transactions
  ADD COLUMN IF NOT EXISTS supplier_name text,
  ADD COLUMN IF NOT EXISTS cost_center text,
  ADD COLUMN IF NOT EXISTS recurrence text,
  ADD COLUMN IF NOT EXISTS receipt_url text,
  ADD COLUMN IF NOT EXISTS paid_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS parent_transaction_id uuid REFERENCES public.finance_transactions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_finance_tx_parent ON public.finance_transactions(parent_transaction_id);
CREATE INDEX IF NOT EXISTS idx_finance_tx_due ON public.finance_transactions(clinic_id, due_date);
CREATE INDEX IF NOT EXISTS idx_finance_tx_status ON public.finance_transactions(clinic_id, status);
