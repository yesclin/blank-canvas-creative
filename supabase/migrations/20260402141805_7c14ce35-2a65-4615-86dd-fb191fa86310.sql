
-- Add check constraint for payment_status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conrelid = 'public.appointments'::regclass 
    AND conname = 'chk_appointments_payment_status'
  ) THEN
    ALTER TABLE public.appointments
      ADD CONSTRAINT chk_appointments_payment_status
      CHECK (payment_status IN ('pendente', 'parcial', 'pago', 'isento', 'faturar_convenio'));
  END IF;
END $$;

-- Add check constraint for booking_source
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conrelid = 'public.appointments'::regclass 
    AND conname = 'chk_appointments_booking_source'
  ) THEN
    ALTER TABLE public.appointments
      ADD CONSTRAINT chk_appointments_booking_source
      CHECK (booking_source IS NULL OR booking_source IN ('manual', 'link_publico', 'retorno', 'encaixe', 'whatsapp', 'campanha', 'outro'));
  END IF;
END $$;
