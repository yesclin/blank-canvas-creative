
-- Add avatar_url to patients
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS avatar_url text;

-- Add financial fields to appointments
ALTER TABLE public.appointments 
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'pendente',
  ADD COLUMN IF NOT EXISTS amount_expected numeric(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS amount_received numeric(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS amount_due numeric(12,2) DEFAULT 0;

-- Backfill: sync amount_expected from existing expected_value
UPDATE public.appointments 
SET amount_expected = COALESCE(expected_value, 0)
WHERE amount_expected = 0 AND expected_value IS NOT NULL AND expected_value > 0;

-- Backfill: set payment_status based on existing data
UPDATE public.appointments
SET payment_status = CASE
  WHEN payment_type = 'convenio' THEN 'faturar_convenio'
  WHEN has_pending_payment = true THEN 'pendente'
  WHEN expected_value IS NOT NULL AND expected_value > 0 AND has_pending_payment = false THEN 'pago'
  ELSE 'pendente'
END
WHERE payment_status = 'pendente';

-- Backfill amount_due
UPDATE public.appointments
SET amount_due = GREATEST(COALESCE(amount_expected, 0) - COALESCE(amount_received, 0), 0);

-- Create trigger function to auto-calculate amount_due and sync legacy fields
CREATE OR REPLACE FUNCTION public.sync_appointment_financial()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate amount_due
  NEW.amount_due := GREATEST(COALESCE(NEW.amount_expected, 0) - COALESCE(NEW.amount_received, 0), 0);
  
  -- Sync legacy expected_value
  IF NEW.amount_expected IS NOT NULL AND NEW.amount_expected > 0 THEN
    NEW.expected_value := NEW.amount_expected;
  END IF;
  
  -- Auto-determine payment_status based on rules
  IF NEW.payment_type = 'cortesia' THEN
    NEW.payment_status := 'isento';
  ELSIF NEW.payment_type = 'convenio' AND NEW.payment_status NOT IN ('pago', 'parcial') THEN
    NEW.payment_status := 'faturar_convenio';
  ELSIF COALESCE(NEW.amount_expected, 0) > 0 AND COALESCE(NEW.amount_received, 0) >= NEW.amount_expected THEN
    NEW.payment_status := 'pago';
  ELSIF COALESCE(NEW.amount_received, 0) > 0 AND COALESCE(NEW.amount_received, 0) < COALESCE(NEW.amount_expected, 0) THEN
    NEW.payment_status := 'parcial';
  END IF;
  
  -- Sync legacy has_pending_payment
  NEW.has_pending_payment := NEW.payment_status IN ('pendente', 'parcial');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger
DROP TRIGGER IF EXISTS trg_sync_appointment_financial ON public.appointments;
CREATE TRIGGER trg_sync_appointment_financial
  BEFORE INSERT OR UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_appointment_financial();
