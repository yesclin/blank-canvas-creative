CREATE OR REPLACE FUNCTION public.trg_audit_commission()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_clinic uuid;
BEGIN
  v_clinic := COALESCE(NEW.clinic_id, OLD.clinic_id);
  INSERT INTO public.finance_audit_logs(
    clinic_id, transaction_id, action, actor_id, before_data, after_data, reason
  )
  VALUES (
    v_clinic,
    CASE WHEN TG_TABLE_NAME = 'commission_entries'
         THEN COALESCE(NEW.transaction_id, OLD.transaction_id)
         ELSE NULL END,
    TG_TABLE_NAME || ':' || CASE TG_OP
      WHEN 'INSERT' THEN 'commission.created'
      WHEN 'UPDATE' THEN 'commission.updated'
      WHEN 'DELETE' THEN 'commission.deleted' END,
    auth.uid(),
    CASE WHEN TG_OP <> 'INSERT' THEN to_jsonb(OLD) END,
    CASE WHEN TG_OP <> 'DELETE' THEN to_jsonb(NEW) END,
    CASE WHEN TG_TABLE_NAME = 'commission_entries' AND TG_OP <> 'INSERT'
         THEN NEW.cancel_reason ELSE NULL END
  );
  RETURN COALESCE(NEW, OLD);
END; $function$;