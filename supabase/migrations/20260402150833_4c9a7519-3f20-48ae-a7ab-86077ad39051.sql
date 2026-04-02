
-- =============================================
-- 1. PAYMENT METHODS TABLE
-- =============================================
CREATE TABLE public.payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  name text NOT NULL,
  code text NOT NULL,
  category text NOT NULL DEFAULT 'other',
  description text,
  accepts_change boolean NOT NULL DEFAULT false,
  allows_installments boolean NOT NULL DEFAULT false,
  max_installments integer NOT NULL DEFAULT 1,
  requires_authorization_code boolean NOT NULL DEFAULT false,
  requires_due_date boolean NOT NULL DEFAULT false,
  auto_settle boolean NOT NULL DEFAULT true,
  fee_type text,
  fee_value numeric(10,2) DEFAULT 0,
  display_order integer NOT NULL DEFAULT 0,
  color text,
  icon text,
  is_system boolean NOT NULL DEFAULT false,
  is_default boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Unique constraints
CREATE UNIQUE INDEX idx_payment_methods_clinic_code ON public.payment_methods(clinic_id, code);

-- Performance indexes
CREATE INDEX idx_payment_methods_clinic_active ON public.payment_methods(clinic_id, is_active, display_order);

-- RLS
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view payment methods of their clinic"
ON public.payment_methods FOR SELECT
TO authenticated
USING (
  clinic_id IN (
    SELECT ur.clinic_id FROM public.user_roles ur WHERE ur.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert payment methods for their clinic"
ON public.payment_methods FOR INSERT
TO authenticated
WITH CHECK (
  clinic_id IN (
    SELECT ur.clinic_id FROM public.user_roles ur WHERE ur.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update payment methods of their clinic"
ON public.payment_methods FOR UPDATE
TO authenticated
USING (
  clinic_id IN (
    SELECT ur.clinic_id FROM public.user_roles ur WHERE ur.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete payment methods of their clinic"
ON public.payment_methods FOR DELETE
TO authenticated
USING (
  clinic_id IN (
    SELECT ur.clinic_id FROM public.user_roles ur WHERE ur.user_id = auth.uid()
  )
);

-- Updated_at trigger
CREATE TRIGGER update_payment_methods_updated_at
BEFORE UPDATE ON public.payment_methods
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- 2. APPOINTMENT PAYMENTS TABLE
-- =============================================
CREATE TABLE public.appointment_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  appointment_id uuid NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  professional_id uuid REFERENCES public.professionals(id) ON DELETE SET NULL,
  payment_method_id uuid NOT NULL REFERENCES public.payment_methods(id) ON DELETE RESTRICT,
  finance_transaction_id uuid REFERENCES public.finance_transactions(id) ON DELETE SET NULL,
  received_amount numeric(10,2) NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  received_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  installments integer NOT NULL DEFAULT 1,
  installment_number integer NOT NULL DEFAULT 1,
  authorization_code text,
  due_date date,
  notes text,
  status text NOT NULL DEFAULT 'received',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_appointment_payments_clinic_apt ON public.appointment_payments(clinic_id, appointment_id);
CREATE INDEX idx_appointment_payments_clinic_patient ON public.appointment_payments(clinic_id, patient_id);
CREATE INDEX idx_appointment_payments_finance_tx ON public.appointment_payments(finance_transaction_id);

-- RLS
ALTER TABLE public.appointment_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view appointment payments of their clinic"
ON public.appointment_payments FOR SELECT
TO authenticated
USING (
  clinic_id IN (
    SELECT ur.clinic_id FROM public.user_roles ur WHERE ur.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert appointment payments for their clinic"
ON public.appointment_payments FOR INSERT
TO authenticated
WITH CHECK (
  clinic_id IN (
    SELECT ur.clinic_id FROM public.user_roles ur WHERE ur.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update appointment payments of their clinic"
ON public.appointment_payments FOR UPDATE
TO authenticated
USING (
  clinic_id IN (
    SELECT ur.clinic_id FROM public.user_roles ur WHERE ur.user_id = auth.uid()
  )
);

-- Updated_at trigger
CREATE TRIGGER update_appointment_payments_updated_at
BEFORE UPDATE ON public.appointment_payments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- 3. ADD payment_method_id TO EXISTING TABLES
-- =============================================
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS payment_method_id uuid REFERENCES public.payment_methods(id) ON DELETE SET NULL;

ALTER TABLE public.finance_transactions
  ADD COLUMN IF NOT EXISTS payment_method_id uuid REFERENCES public.payment_methods(id) ON DELETE SET NULL;

-- =============================================
-- 4. SEED FUNCTION FOR DEFAULT PAYMENT METHODS
-- =============================================
CREATE OR REPLACE FUNCTION public.seed_default_payment_methods(_clinic_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.payment_methods (clinic_id, name, code, category, accepts_change, allows_installments, max_installments, requires_due_date, auto_settle, is_system, is_default, display_order)
  VALUES
    (_clinic_id, 'Dinheiro',          'dinheiro',         'cash',      true,  false, 1,  false, true,  true, true,  1),
    (_clinic_id, 'PIX',               'pix',              'instant',   false, false, 1,  false, true,  true, false, 2),
    (_clinic_id, 'Cartão de Débito',  'cartao_debito',    'card',      false, false, 1,  false, true,  true, false, 3),
    (_clinic_id, 'Cartão de Crédito', 'cartao_credito',   'card',      false, true,  12, false, true,  true, false, 4),
    (_clinic_id, 'Transferência',     'transferencia',    'bank',      false, false, 1,  false, true,  true, false, 5),
    (_clinic_id, 'Boleto',            'boleto',           'bank',      false, false, 1,  true,  false, true, false, 6),
    (_clinic_id, 'Convênio',          'convenio',         'insurance', false, false, 1,  false, false, true, false, 7),
    (_clinic_id, 'Cortesia',          'cortesia',         'courtesy',  false, false, 1,  false, true,  true, false, 8)
  ON CONFLICT (clinic_id, code) DO NOTHING;
END;
$$;

-- Seed for all existing clinics
DO $$
DECLARE
  _cid uuid;
BEGIN
  FOR _cid IN SELECT id FROM public.clinics LOOP
    PERFORM public.seed_default_payment_methods(_cid);
  END LOOP;
END;
$$;
