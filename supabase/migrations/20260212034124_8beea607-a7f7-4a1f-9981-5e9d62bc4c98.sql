
-- Adicionar colunas Z-API na tabela existente
ALTER TABLE public.clinic_channel_integrations
  ADD COLUMN IF NOT EXISTS base_url TEXT,
  ADD COLUMN IF NOT EXISTS instance_id TEXT;

-- Criar tabela de fila de mensagens
CREATE TABLE public.message_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
  automation_rule_id UUID REFERENCES public.automation_rules(id) ON DELETE SET NULL,
  channel TEXT NOT NULL DEFAULT 'whatsapp',
  phone TEXT NOT NULL,
  message_body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  provider_response JSONB,
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  next_retry_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_message_queue_clinic_status ON public.message_queue(clinic_id, status);
CREATE INDEX idx_message_queue_next_retry ON public.message_queue(next_retry_at) WHERE status = 'pending';

-- Enable RLS
ALTER TABLE public.message_queue ENABLE ROW LEVEL SECURITY;

-- RLS: usuários só veem mensagens da sua clínica
CREATE POLICY "Users can view their clinic messages"
  ON public.message_queue FOR SELECT
  USING (
    clinic_id IN (
      SELECT p.clinic_id FROM public.profiles p WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages for their clinic"
  ON public.message_queue FOR INSERT
  WITH CHECK (
    clinic_id IN (
      SELECT p.clinic_id FROM public.profiles p WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "Users can update their clinic messages"
  ON public.message_queue FOR UPDATE
  USING (
    clinic_id IN (
      SELECT p.clinic_id FROM public.profiles p WHERE p.id = auth.uid()
    )
  );

-- Trigger updated_at
CREATE TRIGGER update_message_queue_updated_at
  BEFORE UPDATE ON public.message_queue
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
