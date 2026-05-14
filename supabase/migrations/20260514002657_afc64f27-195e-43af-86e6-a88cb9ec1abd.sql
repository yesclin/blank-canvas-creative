-- ============================================================
-- platform_occurrences (gestão de ocorrências/bugs do Super Admin)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.platform_occurrences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  clinic_id uuid REFERENCES public.clinics(id) ON DELETE SET NULL,
  reported_by_user_id uuid,
  reported_by_name text,
  reported_by_email text,
  reported_by_phone text,
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  priority text NOT NULL DEFAULT 'media',
  status text NOT NULL DEFAULT 'aberta',
  assigned_to uuid,
  module text,
  route text,
  environment text NOT NULL DEFAULT 'production',
  error_message text,
  stack_trace text,
  user_agent text,
  technical_context jsonb NOT NULL DEFAULT '{}'::jsonb,
  related_entity_type text,
  related_entity_id text,
  root_cause text,
  resolution_summary text,
  corrective_action text,
  recurrence_prevention text,
  resolved_at timestamptz,
  resolved_by uuid,
  cancelled_at timestamptz,
  cancelled_by uuid,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT platform_occurrences_priority_chk CHECK (priority IN ('baixa','media','alta','critica')),
  CONSTRAINT platform_occurrences_status_chk CHECK (status IN ('aberta','em_triagem','em_andamento','aguardando_cliente','aguardando_desenvolvimento','resolvida','cancelada')),
  CONSTRAINT platform_occurrences_category_chk CHECK (category IN ('bug','instabilidade','erro_integracao','financeiro','permissao_acesso','prontuario','agenda','whatsapp','teleconsulta','estoque','relatorios','melhoria','duvida','outro'))
);

CREATE INDEX IF NOT EXISTS idx_platform_occurrences_status ON public.platform_occurrences(status);
CREATE INDEX IF NOT EXISTS idx_platform_occurrences_priority ON public.platform_occurrences(priority);
CREATE INDEX IF NOT EXISTS idx_platform_occurrences_clinic ON public.platform_occurrences(clinic_id);
CREATE INDEX IF NOT EXISTS idx_platform_occurrences_assigned ON public.platform_occurrences(assigned_to);
CREATE INDEX IF NOT EXISTS idx_platform_occurrences_created_at ON public.platform_occurrences(created_at DESC);

ALTER TABLE public.platform_occurrences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "occ platform admins manage" ON public.platform_occurrences;
CREATE POLICY "occ platform admins manage" ON public.platform_occurrences
  FOR ALL TO authenticated
  USING (public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_platform_admin(auth.uid()));

-- ============================================================
-- platform_occurrence_comments
-- ============================================================
CREATE TABLE IF NOT EXISTS public.platform_occurrence_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  occurrence_id uuid NOT NULL REFERENCES public.platform_occurrences(id) ON DELETE CASCADE,
  author_user_id uuid,
  comment text NOT NULL,
  is_internal boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_platform_occ_comments_occ ON public.platform_occurrence_comments(occurrence_id);

ALTER TABLE public.platform_occurrence_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "occ comments platform admins manage" ON public.platform_occurrence_comments;
CREATE POLICY "occ comments platform admins manage" ON public.platform_occurrence_comments
  FOR ALL TO authenticated
  USING (public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_platform_admin(auth.uid()));

-- ============================================================
-- platform_occurrence_events (timeline)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.platform_occurrence_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  occurrence_id uuid NOT NULL REFERENCES public.platform_occurrences(id) ON DELETE CASCADE,
  actor_user_id uuid,
  event_type text NOT NULL,
  old_value text,
  new_value text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_platform_occ_events_occ ON public.platform_occurrence_events(occurrence_id, created_at DESC);

ALTER TABLE public.platform_occurrence_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "occ events platform admins read" ON public.platform_occurrence_events;
CREATE POLICY "occ events platform admins read" ON public.platform_occurrence_events
  FOR SELECT TO authenticated
  USING (public.is_platform_admin(auth.uid()));

DROP POLICY IF EXISTS "occ events platform admins insert" ON public.platform_occurrence_events;
CREATE POLICY "occ events platform admins insert" ON public.platform_occurrence_events
  FOR INSERT TO authenticated
  WITH CHECK (public.is_platform_admin(auth.uid()));

-- ============================================================
-- Sequence + function para gerar código amigável OCC-XXXXXX
-- ============================================================
CREATE SEQUENCE IF NOT EXISTS public.platform_occurrences_code_seq START 1;

CREATE OR REPLACE FUNCTION public.generate_platform_occurrence_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_val bigint;
BEGIN
  next_val := nextval('public.platform_occurrences_code_seq');
  RETURN 'OCC-' || lpad(next_val::text, 6, '0');
END;
$$;

REVOKE ALL ON FUNCTION public.generate_platform_occurrence_code() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.generate_platform_occurrence_code() TO authenticated;

-- Trigger para preencher code automaticamente
CREATE OR REPLACE FUNCTION public.tg_platform_occurrences_set_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.code IS NULL OR NEW.code = '' THEN
    NEW.code := public.generate_platform_occurrence_code();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_platform_occurrences_code ON public.platform_occurrences;
CREATE TRIGGER trg_platform_occurrences_code
BEFORE INSERT ON public.platform_occurrences
FOR EACH ROW EXECUTE FUNCTION public.tg_platform_occurrences_set_code();

-- ============================================================
-- updated_at trigger
-- ============================================================
DROP TRIGGER IF EXISTS trg_platform_occurrences_upd ON public.platform_occurrences;
CREATE TRIGGER trg_platform_occurrences_upd
BEFORE UPDATE ON public.platform_occurrences
FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============================================================
-- Trigger para registrar eventos de mudança automaticamente
-- ============================================================
CREATE OR REPLACE FUNCTION public.tg_platform_occurrences_track_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor uuid;
BEGIN
  v_actor := auth.uid();

  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.platform_occurrence_events (occurrence_id, actor_user_id, event_type, new_value, metadata)
    VALUES (NEW.id, v_actor, 'created', NEW.status, jsonb_build_object('priority', NEW.priority, 'category', NEW.category));
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      INSERT INTO public.platform_occurrence_events (occurrence_id, actor_user_id, event_type, old_value, new_value)
      VALUES (NEW.id, v_actor, 'status_changed', OLD.status, NEW.status);
    END IF;
    IF NEW.priority IS DISTINCT FROM OLD.priority THEN
      INSERT INTO public.platform_occurrence_events (occurrence_id, actor_user_id, event_type, old_value, new_value)
      VALUES (NEW.id, v_actor, 'priority_changed', OLD.priority, NEW.priority);
    END IF;
    IF NEW.assigned_to IS DISTINCT FROM OLD.assigned_to THEN
      INSERT INTO public.platform_occurrence_events (occurrence_id, actor_user_id, event_type, old_value, new_value)
      VALUES (NEW.id, v_actor, 'assignee_changed', OLD.assigned_to::text, NEW.assigned_to::text);
    END IF;
    IF NEW.resolved_at IS DISTINCT FROM OLD.resolved_at AND NEW.resolved_at IS NOT NULL THEN
      INSERT INTO public.platform_occurrence_events (occurrence_id, actor_user_id, event_type, new_value, metadata)
      VALUES (NEW.id, v_actor, 'resolved', NEW.status, jsonb_build_object('resolution_summary', NEW.resolution_summary));
    END IF;
    IF NEW.cancelled_at IS DISTINCT FROM OLD.cancelled_at AND NEW.cancelled_at IS NOT NULL THEN
      INSERT INTO public.platform_occurrence_events (occurrence_id, actor_user_id, event_type, new_value)
      VALUES (NEW.id, v_actor, 'cancelled', NEW.status);
    END IF;
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_platform_occurrences_track ON public.platform_occurrences;
CREATE TRIGGER trg_platform_occurrences_track
AFTER INSERT OR UPDATE ON public.platform_occurrences
FOR EACH ROW EXECUTE FUNCTION public.tg_platform_occurrences_track_changes();

-- ============================================================
-- Trigger para registrar comentários no histórico
-- ============================================================
CREATE OR REPLACE FUNCTION public.tg_platform_occurrence_comments_track()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.platform_occurrence_events (occurrence_id, actor_user_id, event_type, new_value)
  VALUES (NEW.occurrence_id, NEW.author_user_id, 'comment_added', left(NEW.comment, 200));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_platform_occurrence_comments_track ON public.platform_occurrence_comments;
CREATE TRIGGER trg_platform_occurrence_comments_track
AFTER INSERT ON public.platform_occurrence_comments
FOR EACH ROW EXECUTE FUNCTION public.tg_platform_occurrence_comments_track();