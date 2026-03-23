
-- Table for WhatsApp (and future channel) integrations per clinic
CREATE TABLE public.clinic_channel_integrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  channel TEXT NOT NULL DEFAULT 'whatsapp',
  provider TEXT NOT NULL DEFAULT 'meta_cloud_api',
  phone_number_id TEXT,
  business_account_id TEXT,
  access_token TEXT,
  status TEXT NOT NULL DEFAULT 'not_configured' CHECK (status IN ('active', 'invalid', 'not_configured')),
  display_phone_number TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(clinic_id, channel)
);

-- Enable RLS
ALTER TABLE public.clinic_channel_integrations ENABLE ROW LEVEL SECURITY;

-- RLS policies - only clinic members can access their own integrations
CREATE POLICY "Users can view their clinic integrations"
  ON public.clinic_channel_integrations FOR SELECT
  USING (clinic_id IN (SELECT clinic_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert their clinic integrations"
  ON public.clinic_channel_integrations FOR INSERT
  WITH CHECK (clinic_id IN (SELECT clinic_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update their clinic integrations"
  ON public.clinic_channel_integrations FOR UPDATE
  USING (clinic_id IN (SELECT clinic_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete their clinic integrations"
  ON public.clinic_channel_integrations FOR DELETE
  USING (clinic_id IN (SELECT clinic_id FROM public.profiles WHERE id = auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_clinic_channel_integrations_updated_at
  BEFORE UPDATE ON public.clinic_channel_integrations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
