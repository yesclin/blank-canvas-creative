
-- 1. Extend notifications table with module/entity metadata
ALTER TABLE public.user_notifications
  ADD COLUMN IF NOT EXISTS module text,
  ADD COLUMN IF NOT EXISTS entity_type text,
  ADD COLUMN IF NOT EXISTS entity_id uuid;

CREATE INDEX IF NOT EXISTS idx_user_notifications_user_unread
  ON public.user_notifications (user_id, read_at, created_at DESC);

-- 2. Realtime
ALTER TABLE public.user_notifications REPLICA IDENTITY FULL;
DO $$ BEGIN
  PERFORM 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='user_notifications';
  IF NOT FOUND THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.user_notifications';
  END IF;
END $$;

-- 3. Fan-out helper: create one notification per authorized user in clinic
CREATE OR REPLACE FUNCTION public.notify_clinic_users(
  _clinic_id uuid,
  _roles app_role[],
  _title text,
  _message text,
  _type text,
  _module text,
  _entity_type text,
  _entity_id uuid,
  _link text,
  _extra_user_ids uuid[] DEFAULT '{}'::uuid[]
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_notifications (user_id, clinic_id, title, message, type, link, module, entity_type, entity_id)
  SELECT DISTINCT ur.user_id, _clinic_id, _title, _message, _type, _link, _module, _entity_type, _entity_id
  FROM public.user_roles ur
  WHERE ur.clinic_id = _clinic_id
    AND ur.role = ANY(_roles)
  UNION
  SELECT DISTINCT uid, _clinic_id, _title, _message, _type, _link, _module, _entity_type, _entity_id
  FROM unnest(_extra_user_ids) AS uid
  WHERE uid IS NOT NULL;
END;
$$;

-- 4. Trigger on new online appointments
CREATE OR REPLACE FUNCTION public.tg_notify_online_appointment()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_patient_name text;
  v_prof_user_id uuid;
  v_msg text;
  v_when text;
BEGIN
  IF NEW.booking_source IS DISTINCT FROM 'public_booking' THEN
    RETURN NEW;
  END IF;

  SELECT full_name INTO v_patient_name FROM public.patients WHERE id = NEW.patient_id;
  SELECT user_id INTO v_prof_user_id FROM public.professionals WHERE id = NEW.professional_id;

  v_when := to_char(NEW.scheduled_date, 'DD/MM/YYYY') || ' às ' || to_char(NEW.start_time, 'HH24:MI');
  v_msg := COALESCE(v_patient_name, 'Paciente') || ' agendou para ' || v_when || '.';

  PERFORM public.notify_clinic_users(
    NEW.clinic_id,
    ARRAY['owner','admin','recepcionista']::app_role[],
    'Novo agendamento online',
    v_msg,
    'success',
    'agenda',
    'appointment',
    NEW.id,
    '/app/agenda',
    CASE WHEN v_prof_user_id IS NOT NULL THEN ARRAY[v_prof_user_id] ELSE '{}'::uuid[] END
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_online_appointment ON public.appointments;
CREATE TRIGGER trg_notify_online_appointment
AFTER INSERT ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.tg_notify_online_appointment();
