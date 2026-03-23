
-- Add missing columns to message_queue for full automation engine
ALTER TABLE public.message_queue 
  ADD COLUMN IF NOT EXISTS appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES public.message_templates(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS rendered_message TEXT,
  ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMPTZ DEFAULT now(),
  ALTER COLUMN max_attempts SET DEFAULT 2;

-- Update existing rows to have scheduled_for = created_at
UPDATE public.message_queue SET scheduled_for = created_at WHERE scheduled_for IS NULL;
UPDATE public.message_queue SET rendered_message = message_body WHERE rendered_message IS NULL;

-- Add index for worker polling
CREATE INDEX IF NOT EXISTS idx_message_queue_worker_poll 
  ON public.message_queue (status, scheduled_for) 
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_message_queue_clinic 
  ON public.message_queue (clinic_id, created_at DESC);

-- Update clinic_channel_integrations: add support for evolution_api provider
-- The existing provider column already supports text, just need to document evolution_api as valid value
-- Add api_url column for Evolution API base URL  
ALTER TABLE public.clinic_channel_integrations 
  ADD COLUMN IF NOT EXISTS api_url TEXT;

-- Add appointment_id to message_logs if not present
ALTER TABLE public.message_logs 
  ADD COLUMN IF NOT EXISTS appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS provider_response JSONB,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_message_logs_clinic_created 
  ON public.message_logs (clinic_id, created_at DESC);

-- Ensure RLS is enabled on all relevant tables (already enabled but just in case)
ALTER TABLE public.message_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_logs ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for message_logs (if not existing)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'message_logs' AND policyname = 'Clinic members can view their own message logs') THEN
    CREATE POLICY "Clinic members can view their own message logs"
      ON public.message_logs FOR SELECT
      USING (clinic_id = public.get_user_clinic_id());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'message_logs' AND policyname = 'Clinic members can insert message logs') THEN
    CREATE POLICY "Clinic members can insert message logs"
      ON public.message_logs FOR INSERT
      WITH CHECK (clinic_id = public.get_user_clinic_id());
  END IF;
END $$;

-- Create updated_at trigger for message_queue
CREATE OR REPLACE FUNCTION public.update_message_queue_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_message_queue_updated_at ON public.message_queue;
CREATE TRIGGER update_message_queue_updated_at
  BEFORE UPDATE ON public.message_queue
  FOR EACH ROW
  EXECUTE FUNCTION public.update_message_queue_updated_at();
