-- Fix PUBLIC_USER_INVITATIONS: Remove overly permissive SELECT policy
-- The "Anyone can view invitation by token" policy allows unauthenticated users to read ALL invitation records
-- This exposes employee emails, full names, and invitation tokens

-- Drop the insecure policy that allows anyone to view all invitations
DROP POLICY IF EXISTS "Anyone can view invitation by token" ON public.user_invitations;

-- Note: The validate-invite and accept-invite edge functions use the SUPABASE_SERVICE_ROLE_KEY
-- which bypasses RLS entirely, so they don't need a public SELECT policy.
-- Only clinic admins should be able to view invitations through the normal client.