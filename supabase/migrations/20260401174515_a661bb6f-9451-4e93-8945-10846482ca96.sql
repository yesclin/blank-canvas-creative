CREATE OR REPLACE FUNCTION public.get_booked_slots(_clinic_id uuid, _professional_id uuid, _date_start date, _date_end date)
 RETURNS TABLE(scheduled_date date, start_time time without time zone, end_time time without time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT a.scheduled_date::date, a.start_time::time, a.end_time::time
  FROM public.appointments a
  WHERE a.clinic_id = _clinic_id
  AND a.professional_id = _professional_id
  AND a.scheduled_date >= _date_start
  AND a.scheduled_date <= _date_end
  AND a.status NOT IN ('cancelado', 'faltou', 'finalizado')
$function$;