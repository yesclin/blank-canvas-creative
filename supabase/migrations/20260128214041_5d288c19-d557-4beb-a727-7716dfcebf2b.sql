-- Fix: Remove user-facing INSERT policies from access_logs table
-- Audit logs should only be insertable by trusted backend processes (edge functions with service role)

-- Drop the user-facing INSERT policies
DROP POLICY IF EXISTS "Users can insert access logs in their clinic" ON public.access_logs;
DROP POLICY IF EXISTS "System can insert access logs" ON public.access_logs;

-- Create a policy that only allows service role (backend) to insert
-- Note: When using service_role key in edge functions, RLS is bypassed, so we don't need INSERT policies
-- This ensures audit logs can only be created server-side

-- Optionally, create a restrictive INSERT policy that denies all authenticated users
-- This is a defense-in-depth measure
CREATE POLICY "No direct user INSERT on audit logs"
ON public.access_logs
FOR INSERT
TO authenticated
WITH CHECK (false);
