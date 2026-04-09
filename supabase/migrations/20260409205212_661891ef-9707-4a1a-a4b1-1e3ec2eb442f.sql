
CREATE OR REPLACE FUNCTION public.check_clinical_record_edit_window()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _clinic_id UUID;
  _edit_minutes INT;
  _lock_after_sig BOOLEAN;
  _sig_blocks_immediately BOOLEAN;
  _is_signed BOOLEAN;
  _created TIMESTAMPTZ;
  _editable_until TIMESTAMPTZ;
  _content_changed BOOLEAN := false;
BEGIN
  _clinic_id := NEW.clinic_id;
  _created := OLD.created_at;

  -- Detect if clinical content actually changed (not just metadata)
  -- For anamnesis_records: data, responses
  -- For clinical_evolutions: content, notes
  -- For clinical_documents: content
  IF TG_TABLE_NAME = 'anamnesis_records' THEN
    _content_changed := (
      OLD.data IS DISTINCT FROM NEW.data OR
      OLD.responses IS DISTINCT FROM NEW.responses
    );
  ELSIF TG_TABLE_NAME = 'clinical_evolutions' THEN
    _content_changed := (
      OLD.content IS DISTINCT FROM NEW.content OR
      OLD.notes IS DISTINCT FROM NEW.notes
    );
  ELSIF TG_TABLE_NAME = 'clinical_documents' THEN
    _content_changed := (
      OLD.content IS DISTINCT FROM NEW.content
    );
  ELSE
    _content_changed := true;
  END IF;

  -- If only metadata changed (status, saved_at, locked_at, signed_at, etc.), allow it
  IF NOT _content_changed THEN
    RETURN NEW;
  END IF;

  -- Check if record is signed
  SELECT EXISTS (
    SELECT 1 FROM public.medical_record_signatures
    WHERE record_id = OLD.id
  ) INTO _is_signed;

  -- Also check inline signed_at
  IF NOT _is_signed AND OLD.signed_at IS NOT NULL THEN
    _is_signed := true;
  END IF;

  -- Get config
  SELECT
    COALESCE(allow_evolution_edit_minutes, 60),
    COALESCE(lock_after_signature, true),
    COALESCE(signature_blocks_immediately, true)
  INTO _edit_minutes, _lock_after_sig, _sig_blocks_immediately
  FROM public.medical_record_security_config
  WHERE clinic_id = _clinic_id
  LIMIT 1;

  IF _edit_minutes IS NULL THEN
    _edit_minutes := 60;
    _lock_after_sig := true;
    _sig_blocks_immediately := true;
  END IF;

  -- Rule 1: Signed → block content changes
  IF _is_signed AND (_lock_after_sig OR _sig_blocks_immediately) THEN
    RAISE EXCEPTION 'RECORD_LOCKED_SIGNED: Este registro está assinado e não pode ser alterado.';
  END IF;

  -- Rule 2: Time window expired → block content changes
  _editable_until := _created + (_edit_minutes * INTERVAL '1 minute');
  IF now() > _editable_until THEN
    RAISE EXCEPTION 'RECORD_LOCKED_TIME: Este registro está fora da janela de edição (% minutos). Utilize adendo para complementos.', _edit_minutes;
  END IF;

  RETURN NEW;
END;
$$;
