
-- Backend validation: prevent creating appointments in the past
CREATE OR REPLACE FUNCTION public.validate_appointment_not_in_past()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  appointment_datetime timestamptz;
BEGIN
  -- Build the full appointment datetime
  appointment_datetime := (NEW.scheduled_date || ' ' || NEW.start_time)::timestamptz;
  
  -- Block if the appointment datetime is in the past
  IF appointment_datetime < now() THEN
    RAISE EXCEPTION 'Não é possível agendar em data ou horário já passado.';
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Only apply on INSERT (new appointments)
DROP TRIGGER IF EXISTS trg_validate_appointment_not_in_past ON public.appointments;
CREATE TRIGGER trg_validate_appointment_not_in_past
  BEFORE INSERT ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_appointment_not_in_past();
