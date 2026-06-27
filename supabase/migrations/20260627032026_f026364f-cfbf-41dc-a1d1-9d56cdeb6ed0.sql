
ALTER TABLE public.finance_transactions
  ADD COLUMN IF NOT EXISTS procedure_id uuid REFERENCES public.procedures(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS package_id uuid REFERENCES public.treatment_packages(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS insurance_id uuid REFERENCES public.insurances(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS received_by uuid,
  ADD COLUMN IF NOT EXISTS parent_transaction_id uuid REFERENCES public.finance_transactions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS paid_amount numeric(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reversal_reason text;

CREATE INDEX IF NOT EXISTS idx_finance_tx_clinic_status ON public.finance_transactions(clinic_id, status);
CREATE INDEX IF NOT EXISTS idx_finance_tx_appointment ON public.finance_transactions(appointment_id) WHERE appointment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_finance_tx_professional ON public.finance_transactions(professional_id) WHERE professional_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_finance_tx_package ON public.finance_transactions(package_id) WHERE package_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_finance_tx_due ON public.finance_transactions(clinic_id, due_date) WHERE status IN ('pendente','previsto','parcial','vencido');
