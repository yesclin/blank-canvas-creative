
-- Add fiscal identification fields to clinics table
ALTER TABLE public.clinics 
ADD COLUMN IF NOT EXISTS fiscal_type TEXT CHECK (fiscal_type IN ('pf', 'pj')),
ADD COLUMN IF NOT EXISTS cpf TEXT,
ADD COLUMN IF NOT EXISTS cnpj TEXT,
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

-- Create audit log table for clinic changes
CREATE TABLE IF NOT EXISTS public.clinic_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL,
  changes JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on audit logs
ALTER TABLE public.clinic_audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for audit logs
CREATE POLICY "Users can view audit logs of their clinic"
ON public.clinic_audit_logs
FOR SELECT
USING (clinic_id IN (
  SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid()
));

CREATE POLICY "System can insert audit logs"
ON public.clinic_audit_logs
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_clinic_audit_logs_clinic_id ON public.clinic_audit_logs(clinic_id);
CREATE INDEX IF NOT EXISTS idx_clinic_audit_logs_created_at ON public.clinic_audit_logs(created_at DESC);

-- Add comment for documentation
COMMENT ON TABLE public.clinic_audit_logs IS 'Audit trail for clinic configuration changes';
