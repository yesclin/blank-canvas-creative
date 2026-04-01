
-- Add missing columns to message_queue for manual operation tracking
ALTER TABLE public.message_queue
  ADD COLUMN IF NOT EXISTS sent_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS origin text NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS campaign_id uuid;

-- Create saved_segments table for reusable patient filters
CREATE TABLE IF NOT EXISTS public.saved_segments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  filters jsonb NOT NULL DEFAULT '{}',
  is_system boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on saved_segments
ALTER TABLE public.saved_segments ENABLE ROW LEVEL SECURITY;

-- RLS: users can see segments from their clinic
CREATE POLICY "Users can view own clinic segments"
  ON public.saved_segments FOR SELECT
  TO authenticated
  USING (
    clinic_id IN (
      SELECT p.clinic_id FROM public.profiles p WHERE p.id = auth.uid()
    )
  );

-- RLS: users can create segments for their clinic
CREATE POLICY "Users can create segments for own clinic"
  ON public.saved_segments FOR INSERT
  TO authenticated
  WITH CHECK (
    clinic_id IN (
      SELECT p.clinic_id FROM public.profiles p WHERE p.id = auth.uid()
    )
  );

-- RLS: users can update segments from their clinic
CREATE POLICY "Users can update own clinic segments"
  ON public.saved_segments FOR UPDATE
  TO authenticated
  USING (
    clinic_id IN (
      SELECT p.clinic_id FROM public.profiles p WHERE p.id = auth.uid()
    )
  );

-- RLS: users can delete segments from their clinic
CREATE POLICY "Users can delete own clinic segments"
  ON public.saved_segments FOR DELETE
  TO authenticated
  USING (
    clinic_id IN (
      SELECT p.clinic_id FROM public.profiles p WHERE p.id = auth.uid()
    )
  );
