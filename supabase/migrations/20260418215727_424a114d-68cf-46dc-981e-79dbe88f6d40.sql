
-- 1. Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Função utilitária de renderização de variáveis
CREATE OR REPLACE FUNCTION public.render_appointment_message(
  p_template text,
  p_patient_name text,
  p_scheduled_date date,
  p_start_time time,
  p_clinic_name text,
  p_professional_name text
) RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  result text := COALESCE(p_template, '');
BEGIN
  result := replace(result, '{{paciente}}', COALESCE(p_patient_name, ''));
  result := replace(result, '{{data}}', to_char(p_scheduled_date, 'DD/MM/YYYY'));
  result := replace(result, '{{hora}}', to_char(p_start_time, 'HH24:MI'));
  result := replace(result, '{{clinica}}', COALESCE(p_clinic_name, ''));
  result := replace(result, '{{profissional}}', COALESCE(p_professional_name, ''));
  -- link_agenda ainda não implementado: remove placeholder
  result := replace(result, '{{link_agenda}}', '');
  result := replace(result, '{{link_confirmacao}}', '');
  RETURN result;
END;
$$;

-- 3. Função de trigger para enfileirar automações ao criar appointment
CREATE OR REPLACE FUNCTION public.trg_enqueue_appointment_automations()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rule RECORD;
  v_patient_name text;
  v_patient_phone text;
  v_clinic_name text;
  v_professional_name text;
  v_template_content text;
  v_rendered text;
  v_status text;
  v_error text;
  v_integration_active boolean;
BEGIN
  -- Carregar dados base
  SELECT full_name, phone INTO v_patient_name, v_patient_phone
    FROM patients WHERE id = NEW.patient_id;

  SELECT name INTO v_clinic_name FROM clinics WHERE id = NEW.clinic_id;

  SELECT full_name INTO v_professional_name
    FROM professionals WHERE id = NEW.professional_id;

  -- Verificar integração WhatsApp ativa
  SELECT EXISTS(
    SELECT 1 FROM clinic_channel_integrations
    WHERE clinic_id = NEW.clinic_id
      AND channel = 'whatsapp'
      AND status = 'active'
      AND is_active = true
  ) INTO v_integration_active;

  -- Iterar sobre regras ativas
  FOR rule IN
    SELECT ar.*, mt.content AS template_content
    FROM automation_rules ar
    LEFT JOIN message_templates mt ON mt.id = ar.template_id
    WHERE ar.clinic_id = NEW.clinic_id
      AND ar.is_active = true
      AND ar.trigger_event = 'appointment_created'
  LOOP
    v_status := 'pending';
    v_error := NULL;
    v_template_content := rule.template_content;

    -- Validações
    IF rule.template_id IS NULL OR v_template_content IS NULL THEN
      v_status := 'failed';
      v_error := 'Template da automação não configurado';
      v_template_content := '';
    ELSIF v_patient_phone IS NULL OR length(trim(v_patient_phone)) < 8 THEN
      v_status := 'failed';
      v_error := 'Paciente sem telefone válido';
    ELSIF NOT v_integration_active THEN
      v_status := 'failed';
      v_error := 'Integração WhatsApp da clínica não está ativa';
    END IF;

    v_rendered := render_appointment_message(
      v_template_content,
      v_patient_name,
      NEW.scheduled_date,
      NEW.start_time,
      v_clinic_name,
      v_professional_name
    );

    INSERT INTO message_queue (
      clinic_id, patient_id, appointment_id, automation_rule_id,
      template_id, channel, phone, message_body, rendered_message,
      scheduled_for, status, origin, error_message
    ) VALUES (
      NEW.clinic_id,
      NEW.patient_id,
      NEW.id,
      rule.id,
      rule.template_id,
      COALESCE(rule.channel, 'whatsapp'),
      COALESCE(v_patient_phone, ''),
      COALESCE(v_template_content, ''),
      v_rendered,
      now(),
      v_status,
      'automation',
      v_error
    );
  END LOOP;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Não bloquear criação do agendamento se a automação falhar
  RAISE WARNING 'Erro em trg_enqueue_appointment_automations: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- 4. Criar trigger
DROP TRIGGER IF EXISTS appointments_enqueue_automations ON appointments;
CREATE TRIGGER appointments_enqueue_automations
AFTER INSERT ON appointments
FOR EACH ROW
EXECUTE FUNCTION trg_enqueue_appointment_automations();

-- 5. Agendar queue-worker a cada minuto via pg_cron
DO $$
BEGIN
  PERFORM cron.unschedule('queue-worker-every-minute');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'queue-worker-every-minute',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://yfljqgmbnplkdjfhvunq.supabase.co/functions/v1/queue-worker',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-worker-secret', COALESCE(current_setting('app.queue_worker_secret', true), '')
    ),
    body := '{}'::jsonb
  );
  $$
);
