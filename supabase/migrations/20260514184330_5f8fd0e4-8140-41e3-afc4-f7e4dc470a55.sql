
-- Expand status check to include investigation states
ALTER TABLE public.platform_occurrences DROP CONSTRAINT IF EXISTS platform_occurrences_status_chk;
ALTER TABLE public.platform_occurrences ADD CONSTRAINT platform_occurrences_status_chk
  CHECK (status = ANY (ARRAY[
    'aberta','em_triagem','em_andamento','em_investigacao',
    'aguardando_cliente','aguardando_desenvolvimento',
    'corrigida','resolvida','cancelada'
  ]));

-- Investigation fields
ALTER TABLE public.platform_occurrences
  ADD COLUMN IF NOT EXISTS investigation_status text,
  ADD COLUMN IF NOT EXISTS investigation_severity text,
  ADD COLUMN IF NOT EXISTS investigation_assigned_to uuid,
  ADD COLUMN IF NOT EXISTS investigation_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS investigation_resolved_at timestamptz,
  ADD COLUMN IF NOT EXISTS investigation_root_cause text,
  ADD COLUMN IF NOT EXISTS investigation_diagnosis text,
  ADD COLUMN IF NOT EXISTS investigation_reproduction_steps text,
  ADD COLUMN IF NOT EXISTS investigation_impact text,
  ADD COLUMN IF NOT EXISTS investigation_action_taken text,
  ADD COLUMN IF NOT EXISTS investigation_next_action text,
  ADD COLUMN IF NOT EXISTS investigation_internal_notes text,
  ADD COLUMN IF NOT EXISTS investigation_checklist jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.platform_occurrences
  DROP CONSTRAINT IF EXISTS platform_occurrences_inv_status_chk;
ALTER TABLE public.platform_occurrences
  ADD CONSTRAINT platform_occurrences_inv_status_chk
  CHECK (investigation_status IS NULL OR investigation_status = ANY (ARRAY[
    'aberta','em_investigacao','aguardando_cliente','aguardando_desenvolvimento',
    'corrigida','resolvida','cancelada'
  ]));

ALTER TABLE public.platform_occurrences
  DROP CONSTRAINT IF EXISTS platform_occurrences_inv_severity_chk;
ALTER TABLE public.platform_occurrences
  ADD CONSTRAINT platform_occurrences_inv_severity_chk
  CHECK (investigation_severity IS NULL OR investigation_severity = ANY (ARRAY[
    'baixa','media','alta','critica'
  ]));
