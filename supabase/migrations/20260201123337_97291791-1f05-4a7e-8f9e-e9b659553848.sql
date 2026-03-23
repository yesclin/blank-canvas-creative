-- Fix message_logs table to make it append-only for audit compliance
-- 1. Add soft delete column for audit trail preservation
ALTER TABLE public.message_logs ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
ALTER TABLE public.message_logs ADD COLUMN IF NOT EXISTS deleted_by UUID DEFAULT NULL;

-- 2. Drop existing permissive FOR ALL policy
DROP POLICY IF EXISTS "Clinic isolation for message_logs" ON public.message_logs;

-- 3. Create restrictive policies (append-only with soft delete)
-- Users can INSERT new message logs
CREATE POLICY "Users can insert message logs"
  ON public.message_logs FOR INSERT
  TO authenticated
  WITH CHECK (clinic_id = user_clinic_id(auth.uid()));

-- Users can SELECT non-deleted message logs from their clinic
CREATE POLICY "Users can view message logs"
  ON public.message_logs FOR SELECT
  TO authenticated
  USING (clinic_id = user_clinic_id(auth.uid()) AND deleted_at IS NULL);

-- Only admins can UPDATE (for soft delete only)
CREATE POLICY "Admins can soft delete message logs"
  ON public.message_logs FOR UPDATE
  TO authenticated
  USING (clinic_id = user_clinic_id(auth.uid()) AND is_clinic_admin(auth.uid(), clinic_id))
  WITH CHECK (clinic_id = user_clinic_id(auth.uid()) AND is_clinic_admin(auth.uid(), clinic_id));

-- Admins can also view soft-deleted logs for audit purposes
CREATE POLICY "Admins can view all message logs including deleted"
  ON public.message_logs FOR SELECT
  TO authenticated
  USING (clinic_id = user_clinic_id(auth.uid()) AND is_clinic_admin(auth.uid(), clinic_id));

-- No DELETE policy - prevent hard deletes entirely
-- This ensures audit trail cannot be tampered with