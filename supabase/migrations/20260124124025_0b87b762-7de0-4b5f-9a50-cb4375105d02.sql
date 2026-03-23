-- Create table for storing pending user invitations
CREATE TABLE public.user_invitations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role app_role NOT NULL DEFAULT 'profissional',
    full_name TEXT NOT NULL,
    invited_by UUID NOT NULL,
    token UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
    permissions app_module[] DEFAULT ARRAY[]::app_module[],
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
    accepted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    
    CONSTRAINT unique_pending_invitation UNIQUE (clinic_id, email, status)
);

-- Enable RLS
ALTER TABLE public.user_invitations ENABLE ROW LEVEL SECURITY;

-- Admins can view all invitations for their clinic
CREATE POLICY "Clinic admins can view invitations"
ON public.user_invitations
FOR SELECT
USING (
    public.is_clinic_admin(auth.uid(), clinic_id)
);

-- Admins can create invitations for their clinic
CREATE POLICY "Clinic admins can create invitations"
ON public.user_invitations
FOR INSERT
WITH CHECK (
    public.is_clinic_admin(auth.uid(), clinic_id)
    AND invited_by = auth.uid()
);

-- Admins can update invitations for their clinic
CREATE POLICY "Clinic admins can update invitations"
ON public.user_invitations
FOR UPDATE
USING (
    public.is_clinic_admin(auth.uid(), clinic_id)
);

-- Admins can delete invitations for their clinic
CREATE POLICY "Clinic admins can delete invitations"
ON public.user_invitations
FOR DELETE
USING (
    public.is_clinic_admin(auth.uid(), clinic_id)
);

-- Allow public access to validate invitation by token (for accepting invitations)
CREATE POLICY "Anyone can view invitation by token"
ON public.user_invitations
FOR SELECT
USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_user_invitations_updated_at
    BEFORE UPDATE ON public.user_invitations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Add audit log table for user actions
CREATE TABLE public.user_audit_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    target_user_id UUID,
    target_email TEXT,
    performed_by UUID NOT NULL,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on audit logs
ALTER TABLE public.user_audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Clinic admins can view audit logs"
ON public.user_audit_logs
FOR SELECT
USING (
    public.is_clinic_admin(auth.uid(), clinic_id)
);

-- System can insert audit logs (via edge function with service role)
CREATE POLICY "Authenticated users can insert audit logs"
ON public.user_audit_logs
FOR INSERT
WITH CHECK (
    auth.uid() = performed_by
);

-- Create index for faster queries
CREATE INDEX idx_user_invitations_clinic_status ON public.user_invitations(clinic_id, status);
CREATE INDEX idx_user_invitations_token ON public.user_invitations(token);
CREATE INDEX idx_user_invitations_email ON public.user_invitations(email);
CREATE INDEX idx_user_audit_logs_clinic ON public.user_audit_logs(clinic_id);
CREATE INDEX idx_user_audit_logs_target ON public.user_audit_logs(target_user_id);