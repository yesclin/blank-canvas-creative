
-- =============================================
-- CHECK CONSTRAINTS for payment_methods
-- =============================================
ALTER TABLE public.payment_methods
  ADD CONSTRAINT chk_payment_methods_category
    CHECK (category IN ('cash', 'instant', 'card', 'bank', 'insurance', 'courtesy', 'internal_credit', 'other'));

ALTER TABLE public.payment_methods
  ADD CONSTRAINT chk_payment_methods_fee_type
    CHECK (fee_type IS NULL OR fee_type IN ('percent', 'fixed'));

ALTER TABLE public.payment_methods
  ADD CONSTRAINT chk_payment_methods_max_installments
    CHECK (max_installments >= 1);

-- UNIQUE on (clinic_id, name)
CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_methods_clinic_name
  ON public.payment_methods(clinic_id, name);

-- =============================================
-- CHECK CONSTRAINTS for appointment_payments
-- =============================================
ALTER TABLE public.appointment_payments
  ADD CONSTRAINT chk_appointment_payments_received_amount
    CHECK (received_amount > 0);

ALTER TABLE public.appointment_payments
  ADD CONSTRAINT chk_appointment_payments_installments
    CHECK (installments >= 1);

ALTER TABLE public.appointment_payments
  ADD CONSTRAINT chk_appointment_payments_installment_number
    CHECK (installment_number >= 1);

ALTER TABLE public.appointment_payments
  ADD CONSTRAINT chk_appointment_payments_status
    CHECK (status IN ('pending', 'received', 'canceled', 'refunded'));
