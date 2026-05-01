ALTER TABLE public.user_invitations
  ADD COLUMN IF NOT EXISTS full_name TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS permissions TEXT[] NULL,
  ADD COLUMN IF NOT EXISTS is_professional BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS professional_type TEXT NULL,
  ADD COLUMN IF NOT EXISTS registration_number TEXT NULL,
  ADD COLUMN IF NOT EXISTS specialty_ids UUID[] NOT NULL DEFAULT '{}';

ALTER TABLE public.user_invitations ALTER COLUMN full_name DROP DEFAULT;
NOTIFY pgrst, 'reload schema';