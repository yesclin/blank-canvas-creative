-- Add delivered_at and read_at columns to message_logs
ALTER TABLE public.message_logs ADD COLUMN IF NOT EXISTS delivered_at timestamptz;
ALTER TABLE public.message_logs ADD COLUMN IF NOT EXISTS read_at timestamptz;

-- Add index for faster dashboard queries
CREATE INDEX IF NOT EXISTS idx_message_logs_clinic_status ON public.message_logs (clinic_id, status);
CREATE INDEX IF NOT EXISTS idx_message_logs_clinic_created ON public.message_logs (clinic_id, created_at);

-- Add index on message_queue for scheduled dispatch
CREATE INDEX IF NOT EXISTS idx_message_queue_pending ON public.message_queue (clinic_id, status, scheduled_for);

-- Enable pg_cron and pg_net extensions for scheduled dispatch
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;