ALTER TABLE public.clinics
  ADD COLUMN IF NOT EXISTS monthly_goal numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS margin_alert_enabled boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS margin_alert_min_percent numeric DEFAULT 20,
  ADD COLUMN IF NOT EXISTS margin_alert_period_days integer DEFAULT 30;