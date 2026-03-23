
-- Add delay_type, delay_value, and channel to automation_rules
ALTER TABLE public.automation_rules
  ADD COLUMN IF NOT EXISTS delay_type text NOT NULL DEFAULT 'immediate',
  ADD COLUMN IF NOT EXISTS delay_value integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS channel text NOT NULL DEFAULT 'whatsapp';

-- Add max_automations to clinics for plan control
ALTER TABLE public.clinics
  ADD COLUMN IF NOT EXISTS max_automations integer NOT NULL DEFAULT 2;

-- Create indexes on message_queue for efficient scheduled message queries
CREATE INDEX IF NOT EXISTS idx_message_queue_status_scheduled
  ON public.message_queue (status, scheduled_for)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_message_queue_clinic_id
  ON public.message_queue (clinic_id);

-- Update RLS policies for message_queue to ensure clinic isolation
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'message_queue' AND policyname = 'Clinic members can view their message queue'
  ) THEN
    CREATE POLICY "Clinic members can view their message queue"
      ON public.message_queue FOR SELECT
      USING (
        clinic_id IN (
          SELECT clinic_id FROM public.profiles WHERE id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'message_queue' AND policyname = 'Clinic members can insert into message queue'
  ) THEN
    CREATE POLICY "Clinic members can insert into message queue"
      ON public.message_queue FOR INSERT
      WITH CHECK (
        clinic_id IN (
          SELECT clinic_id FROM public.profiles WHERE id = auth.uid()
        )
      );
  END IF;
END $$;
