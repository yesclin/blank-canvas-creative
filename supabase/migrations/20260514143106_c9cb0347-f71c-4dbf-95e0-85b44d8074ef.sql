
-- ============================================================================
-- SUPPORT MODULE: tickets, messages, attachments, events + notifications
-- ============================================================================

-- ----- ENUMS via TEXT + CHECK (consistent with rest of project) --------------

-- ----- TABLE: support_tickets ------------------------------------------------
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  created_by uuid NULL,
  requester_name text NULL,
  requester_email text NULL,
  requester_role text NULL,
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  priority text NOT NULL DEFAULT 'media',
  status text NOT NULL DEFAULT 'aberto',
  assigned_to uuid NULL,
  route text NULL,
  module text NULL,
  environment text NOT NULL DEFAULT 'production',
  user_agent text NULL,
  screen_size text NULL,
  technical_context jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_error_message text NULL,
  related_occurrence_id uuid NULL REFERENCES public.platform_occurrences(id) ON DELETE SET NULL,
  resolved_at timestamptz NULL,
  resolved_by uuid NULL,
  resolution_summary text NULL,
  root_cause text NULL,
  preventive_action text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT support_tickets_priority_chk CHECK (priority IN ('baixa','media','alta','critica')),
  CONSTRAINT support_tickets_status_chk CHECK (status IN ('aberto','em_triagem','em_atendimento','aguardando_usuario','aguardando_suporte','resolvido','cancelado')),
  CONSTRAINT support_tickets_category_chk CHECK (category IN ('duvida','erro_sistema','problema_acesso','financeiro_assinatura','agenda','pacientes','prontuario','whatsapp','teleconsulta','relatorios','estoque','sugestao_melhoria','outro'))
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_clinic ON public.support_tickets(clinic_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_by ON public.support_tickets(created_by);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned_to ON public.support_tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority ON public.support_tickets(priority);

-- ----- TABLE: support_ticket_messages ----------------------------------------
CREATE TABLE IF NOT EXISTS public.support_ticket_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  author_user_id uuid NULL,
  author_name text NULL,
  author_email text NULL,
  author_type text NOT NULL,
  message text NOT NULL,
  is_internal boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT support_ticket_messages_author_type_chk CHECK (author_type IN ('clinic_user','support_user','system'))
);

CREATE INDEX IF NOT EXISTS idx_support_ticket_messages_ticket ON public.support_ticket_messages(ticket_id);

-- ----- TABLE: support_ticket_attachments -------------------------------------
CREATE TABLE IF NOT EXISTS public.support_ticket_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  message_id uuid NULL REFERENCES public.support_ticket_messages(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_path text NOT NULL,
  file_type text NULL,
  file_size integer NULL,
  uploaded_by uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_support_ticket_attachments_ticket ON public.support_ticket_attachments(ticket_id);

-- ----- TABLE: support_ticket_events ------------------------------------------
CREATE TABLE IF NOT EXISTS public.support_ticket_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  actor_user_id uuid NULL,
  event_type text NOT NULL,
  old_value text NULL,
  new_value text NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_support_ticket_events_ticket ON public.support_ticket_events(ticket_id);

-- ----- TABLE: user_notifications (simples, reutilizável) --------------------
CREATE TABLE IF NOT EXISTS public.user_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  clinic_id uuid NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info',
  link text NULL,
  read_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_notifications_user ON public.user_notifications(user_id, read_at);

-- ----- updated_at trigger ----------------------------------------------------
DROP TRIGGER IF EXISTS trg_support_tickets_updated_at ON public.support_tickets;
CREATE TRIGGER trg_support_tickets_updated_at
BEFORE UPDATE ON public.support_tickets
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ----- CODE GENERATOR --------------------------------------------------------
CREATE OR REPLACE FUNCTION public.generate_support_ticket_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_next bigint;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(code FROM 5) AS bigint)), 0) + 1
    INTO v_next
    FROM public.support_tickets
    WHERE code ~ '^SUP-[0-9]+$';
  RETURN 'SUP-' || LPAD(v_next::text, 6, '0');
END;
$$;

CREATE OR REPLACE FUNCTION public.tg_support_ticket_set_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.code IS NULL OR NEW.code = '' THEN
    NEW.code := public.generate_support_ticket_code();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_support_ticket_set_code ON public.support_tickets;
CREATE TRIGGER trg_support_ticket_set_code
BEFORE INSERT ON public.support_tickets
FOR EACH ROW EXECUTE FUNCTION public.tg_support_ticket_set_code();

-- ----- ENABLE RLS ------------------------------------------------------------
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_ticket_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_ticket_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

-- ----- POLICIES: support_tickets ---------------------------------------------
DROP POLICY IF EXISTS "support_tickets_select_clinic_or_admin" ON public.support_tickets;
CREATE POLICY "support_tickets_select_clinic_or_admin"
ON public.support_tickets
FOR SELECT
TO authenticated
USING (
  public.is_platform_admin(auth.uid())
  OR (
    clinic_id = public.get_user_clinic_id_for_rls()
    AND (
      created_by = auth.uid()
      OR public.is_clinic_admin(auth.uid(), clinic_id)
    )
  )
);

DROP POLICY IF EXISTS "support_tickets_insert_clinic" ON public.support_tickets;
CREATE POLICY "support_tickets_insert_clinic"
ON public.support_tickets
FOR INSERT
TO authenticated
WITH CHECK (
  clinic_id = public.get_user_clinic_id_for_rls()
  AND created_by = auth.uid()
);

DROP POLICY IF EXISTS "support_tickets_update_owner_or_admin" ON public.support_tickets;
CREATE POLICY "support_tickets_update_owner_or_admin"
ON public.support_tickets
FOR UPDATE
TO authenticated
USING (
  public.is_platform_admin(auth.uid())
  OR (
    clinic_id = public.get_user_clinic_id_for_rls()
    AND (created_by = auth.uid() OR public.is_clinic_admin(auth.uid(), clinic_id))
  )
)
WITH CHECK (
  public.is_platform_admin(auth.uid())
  OR (
    clinic_id = public.get_user_clinic_id_for_rls()
    AND (created_by = auth.uid() OR public.is_clinic_admin(auth.uid(), clinic_id))
  )
);

-- ----- POLICIES: support_ticket_messages -------------------------------------
DROP POLICY IF EXISTS "support_messages_select" ON public.support_ticket_messages;
CREATE POLICY "support_messages_select"
ON public.support_ticket_messages
FOR SELECT
TO authenticated
USING (
  public.is_platform_admin(auth.uid())
  OR (
    NOT is_internal
    AND EXISTS (
      SELECT 1 FROM public.support_tickets t
      WHERE t.id = ticket_id
        AND t.clinic_id = public.get_user_clinic_id_for_rls()
        AND (t.created_by = auth.uid() OR public.is_clinic_admin(auth.uid(), t.clinic_id))
    )
  )
);

DROP POLICY IF EXISTS "support_messages_insert" ON public.support_ticket_messages;
CREATE POLICY "support_messages_insert"
ON public.support_ticket_messages
FOR INSERT
TO authenticated
WITH CHECK (
  -- platform admin pode tudo
  public.is_platform_admin(auth.uid())
  OR (
    -- clinic_user só pública e em ticket que pode ver
    NOT is_internal
    AND author_type = 'clinic_user'
    AND author_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.support_tickets t
      WHERE t.id = ticket_id
        AND t.clinic_id = public.get_user_clinic_id_for_rls()
        AND (t.created_by = auth.uid() OR public.is_clinic_admin(auth.uid(), t.clinic_id))
    )
  )
);

-- ----- POLICIES: support_ticket_attachments ----------------------------------
DROP POLICY IF EXISTS "support_attachments_select" ON public.support_ticket_attachments;
CREATE POLICY "support_attachments_select"
ON public.support_ticket_attachments
FOR SELECT
TO authenticated
USING (
  public.is_platform_admin(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.support_tickets t
    WHERE t.id = ticket_id
      AND t.clinic_id = public.get_user_clinic_id_for_rls()
      AND (t.created_by = auth.uid() OR public.is_clinic_admin(auth.uid(), t.clinic_id))
  )
);

DROP POLICY IF EXISTS "support_attachments_insert" ON public.support_ticket_attachments;
CREATE POLICY "support_attachments_insert"
ON public.support_ticket_attachments
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_platform_admin(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.support_tickets t
    WHERE t.id = ticket_id
      AND t.clinic_id = public.get_user_clinic_id_for_rls()
      AND (t.created_by = auth.uid() OR public.is_clinic_admin(auth.uid(), t.clinic_id))
  )
);

-- ----- POLICIES: support_ticket_events ---------------------------------------
DROP POLICY IF EXISTS "support_events_select" ON public.support_ticket_events;
CREATE POLICY "support_events_select"
ON public.support_ticket_events
FOR SELECT
TO authenticated
USING (
  public.is_platform_admin(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.support_tickets t
    WHERE t.id = ticket_id
      AND t.clinic_id = public.get_user_clinic_id_for_rls()
      AND (t.created_by = auth.uid() OR public.is_clinic_admin(auth.uid(), t.clinic_id))
  )
);

DROP POLICY IF EXISTS "support_events_insert" ON public.support_ticket_events;
CREATE POLICY "support_events_insert"
ON public.support_ticket_events
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_platform_admin(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.support_tickets t
    WHERE t.id = ticket_id
      AND t.clinic_id = public.get_user_clinic_id_for_rls()
      AND (t.created_by = auth.uid() OR public.is_clinic_admin(auth.uid(), t.clinic_id))
  )
);

-- ----- POLICIES: user_notifications -----------------------------------------
DROP POLICY IF EXISTS "user_notifications_select_own" ON public.user_notifications;
CREATE POLICY "user_notifications_select_own"
ON public.user_notifications
FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.is_platform_admin(auth.uid()));

DROP POLICY IF EXISTS "user_notifications_update_own" ON public.user_notifications;
CREATE POLICY "user_notifications_update_own"
ON public.user_notifications
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "user_notifications_insert_admin" ON public.user_notifications;
CREATE POLICY "user_notifications_insert_admin"
ON public.user_notifications
FOR INSERT
TO authenticated
WITH CHECK (public.is_platform_admin(auth.uid()) OR user_id = auth.uid());

-- ============================================================================
-- STORAGE BUCKET: support-attachments (privado)
-- ============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('support-attachments', 'support-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Policies de storage: usuário só acessa pasta da sua clínica
DROP POLICY IF EXISTS "support_storage_select" ON storage.objects;
CREATE POLICY "support_storage_select"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'support-attachments'
  AND (
    public.is_platform_admin(auth.uid())
    OR (storage.foldername(name))[1] = public.get_user_clinic_id_for_rls()::text
  )
);

DROP POLICY IF EXISTS "support_storage_insert" ON storage.objects;
CREATE POLICY "support_storage_insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'support-attachments'
  AND (
    public.is_platform_admin(auth.uid())
    OR (storage.foldername(name))[1] = public.get_user_clinic_id_for_rls()::text
  )
);

DROP POLICY IF EXISTS "support_storage_delete" ON storage.objects;
CREATE POLICY "support_storage_delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'support-attachments'
  AND (
    public.is_platform_admin(auth.uid())
    OR (storage.foldername(name))[1] = public.get_user_clinic_id_for_rls()::text
  )
);
