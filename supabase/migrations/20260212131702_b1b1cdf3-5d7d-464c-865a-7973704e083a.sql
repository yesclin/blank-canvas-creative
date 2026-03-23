-- Enable realtime for message_logs and clinic_channel_integrations
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.clinic_channel_integrations;