CREATE UNIQUE INDEX IF NOT EXISTS uq_user_invitations_pending_clinic_email
ON public.user_invitations (clinic_id, lower(email))
WHERE status = 'pending';