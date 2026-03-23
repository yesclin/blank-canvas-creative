
-- Add archive fields to anamnesis_templates
ALTER TABLE public.anamnesis_templates 
ADD COLUMN IF NOT EXISTS archived boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS archived_at timestamptz,
ADD COLUMN IF NOT EXISTS archived_by uuid;

-- Add structure_snapshot to anamnesis_records for historical integrity
ALTER TABLE public.anamnesis_records
ADD COLUMN IF NOT EXISTS structure_snapshot jsonb;

-- Create index for filtering active non-archived templates
CREATE INDEX IF NOT EXISTS idx_anamnesis_templates_active_archived 
ON public.anamnesis_templates (is_active, archived) WHERE archived = false;
