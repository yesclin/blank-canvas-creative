
-- 1. Add missing columns to automation_rules
ALTER TABLE public.automation_rules
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS trigger_type text,
  ADD COLUMN IF NOT EXISTS trigger_config jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS delay_type text DEFAULT 'immediate',
  ADD COLUMN IF NOT EXISTS delay_value integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS channel text DEFAULT 'whatsapp',
  ADD COLUMN IF NOT EXISTS priority integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id);

-- Migrate existing trigger_event data to trigger_type
UPDATE public.automation_rules SET trigger_type = trigger_event WHERE trigger_type IS NULL;
UPDATE public.automation_rules SET trigger_config = COALESCE(conditions, '{}'::jsonb) WHERE trigger_config = '{}'::jsonb AND conditions IS NOT NULL;

-- 2. Add missing columns to message_templates
ALTER TABLE public.message_templates
  ADD COLUMN IF NOT EXISTS subject text,
  ADD COLUMN IF NOT EXISTS is_system boolean DEFAULT false;

-- 3. Create message_queue table
CREATE TABLE IF NOT EXISTS public.message_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  patient_id uuid REFERENCES public.patients(id) ON DELETE SET NULL,
  appointment_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL,
  automation_rule_id uuid REFERENCES public.automation_rules(id) ON DELETE SET NULL,
  template_id uuid REFERENCES public.message_templates(id) ON DELETE SET NULL,
  channel text NOT NULL DEFAULT 'whatsapp',
  phone text NOT NULL DEFAULT '',
  message_body text NOT NULL DEFAULT '',
  rendered_message text,
  scheduled_for timestamptz,
  sent_at timestamptz,
  status text NOT NULL DEFAULT 'pending',
  error_message text,
  provider_response jsonb,
  attempts integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4. RLS on message_queue
ALTER TABLE public.message_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view message_queue for their clinic"
  ON public.message_queue FOR SELECT TO authenticated
  USING (clinic_id = public.user_clinic_id(auth.uid()));

CREATE POLICY "Users can insert message_queue for their clinic"
  ON public.message_queue FOR INSERT TO authenticated
  WITH CHECK (clinic_id = public.user_clinic_id(auth.uid()));

CREATE POLICY "Users can update message_queue for their clinic"
  ON public.message_queue FOR UPDATE TO authenticated
  USING (clinic_id = public.user_clinic_id(auth.uid()));
