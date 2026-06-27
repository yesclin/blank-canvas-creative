
-- Seed 5 default medical record templates for other_specialty on activation

CREATE OR REPLACE FUNCTION public.provision_other_specialty_medical_record_templates(
  _clinic_id uuid,
  _specialty_id uuid
) RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _created integer := 0;
  _tpl_id uuid;
  _seed jsonb := jsonb_build_array(
    jsonb_build_object(
      'name','Anamnese Geral',
      'type','anamnese',
      'description','Modelo para primeira consulta ou avaliação inicial.',
      'tab_key','anamnese',
      'fields', jsonb_build_array(
        jsonb_build_object('key','identificacao','label','Identificação do paciente','type','textarea'),
        jsonb_build_object('key','queixa_principal','label','Queixa principal','type','textarea','required',true),
        jsonb_build_object('key','hda','label','História da doença atual (HDA)','type','textarea'),
        jsonb_build_object('key','antecedentes_pessoais','label','Antecedentes pessoais','type','textarea'),
        jsonb_build_object('key','antecedentes_familiares','label','Antecedentes familiares','type','textarea'),
        jsonb_build_object('key','alergias','label','Alergias','type','textarea'),
        jsonb_build_object('key','medicamentos_uso','label','Medicamentos em uso','type','textarea'),
        jsonb_build_object('key','habitos_vida','label','Hábitos de vida','type','textarea'),
        jsonb_build_object('key','revisao_sistemas','label','Revisão de sistemas','type','textarea'),
        jsonb_build_object('key','exame_fisico','label','Exame físico','type','textarea'),
        jsonb_build_object('key','hipotese_diagnostica','label','Hipótese diagnóstica','type','textarea'),
        jsonb_build_object('key','plano_terapeutico','label','Plano terapêutico','type','textarea'),
        jsonb_build_object('key','observacoes','label','Observações','type','textarea')
      )
    ),
    jsonb_build_object(
      'name','Evolução Clínica (SOAP)',
      'type','evolution',
      'description','Modelo para acompanhamento do tratamento.',
      'tab_key','evolucoes',
      'fields', jsonb_build_array(
        jsonb_build_object('key','data','label','Data','type','date'),
        jsonb_build_object('key','hora','label','Hora','type','time'),
        jsonb_build_object('key','subjetivo','label','Subjetivo (S)','type','textarea'),
        jsonb_build_object('key','objetivo','label','Objetivo (O)','type','textarea'),
        jsonb_build_object('key','avaliacao','label','Avaliação (A)','type','textarea'),
        jsonb_build_object('key','plano','label','Plano (P)','type','textarea'),
        jsonb_build_object('key','conduta','label','Conduta','type','textarea'),
        jsonb_build_object('key','orientacoes','label','Orientações','type','textarea'),
        jsonb_build_object('key','proximo_retorno','label','Próximo retorno','type','text')
      )
    ),
    jsonb_build_object(
      'name','Registro de Procedimento',
      'type','procedure',
      'description','Registro de qualquer procedimento realizado.',
      'tab_key','conduta',
      'fields', jsonb_build_array(
        jsonb_build_object('key','procedimento','label','Procedimento realizado','type','text','required',true),
        jsonb_build_object('key','regiao','label','Região / Área','type','text'),
        jsonb_build_object('key','tecnica','label','Técnica utilizada','type','textarea'),
        jsonb_build_object('key','materiais','label','Materiais utilizados','type','textarea'),
        jsonb_build_object('key','medicamentos','label','Medicamentos utilizados','type','textarea'),
        jsonb_build_object('key','intercorrencias','label','Intercorrências','type','textarea'),
        jsonb_build_object('key','resultado_imediato','label','Resultado imediato','type','textarea'),
        jsonb_build_object('key','recomendacoes_pos','label','Recomendações pós-procedimento','type','textarea'),
        jsonb_build_object('key','observacoes','label','Observações','type','textarea')
      )
    ),
    jsonb_build_object(
      'name','Retorno / Reavaliação',
      'type','evolution',
      'description','Modelo para consultas de retorno.',
      'tab_key','evolucoes',
      'fields', jsonb_build_array(
        jsonb_build_object('key','motivo_retorno','label','Motivo do retorno','type','textarea','required',true),
        jsonb_build_object('key','evolucao_quadro','label','Evolução do quadro','type','textarea'),
        jsonb_build_object('key','melhoras','label','Melhoras','type','textarea'),
        jsonb_build_object('key','piora','label','Piora','type','textarea'),
        jsonb_build_object('key','exames_apresentados','label','Exames apresentados','type','textarea'),
        jsonb_build_object('key','alteracoes_tratamento','label','Alterações no tratamento','type','textarea'),
        jsonb_build_object('key','nova_conduta','label','Nova conduta','type','textarea'),
        jsonb_build_object('key','proximo_retorno','label','Próximo retorno','type','text'),
        jsonb_build_object('key','observacoes','label','Observações','type','textarea')
      )
    ),
    jsonb_build_object(
      'name','Evolução Livre',
      'type','evolution',
      'description','Modelo livre para qualquer registro clínico.',
      'tab_key','evolucoes',
      'fields', jsonb_build_array(
        jsonb_build_object('key','data','label','Data','type','date'),
        jsonb_build_object('key','hora','label','Hora','type','time'),
        jsonb_build_object('key','registro_clinico','label','Registro clínico','type','textarea','required',true),
        jsonb_build_object('key','conduta','label','Conduta','type','textarea'),
        jsonb_build_object('key','orientacoes','label','Orientações','type','textarea'),
        jsonb_build_object('key','observacoes','label','Observações','type','textarea'),
        jsonb_build_object('key','anexos','label','Anexos','type','file')
      )
    )
  );
  _item jsonb;
  _field jsonb;
  _idx integer;
BEGIN
  FOR _item IN SELECT * FROM jsonb_array_elements(_seed) LOOP
    SELECT id INTO _tpl_id
    FROM public.medical_record_templates
    WHERE clinic_id = _clinic_id
      AND specialty_id = _specialty_id
      AND name = (_item->>'name')
    LIMIT 1;

    IF _tpl_id IS NULL THEN
      INSERT INTO public.medical_record_templates (
        clinic_id, specialty_id, name, type, description,
        scope, is_default, is_active, is_system, config
      ) VALUES (
        _clinic_id, _specialty_id,
        _item->>'name', _item->>'type', _item->>'description',
        'specialty', true, true, true,
        jsonb_build_object('tab_key', _item->>'tab_key', 'source','other_specialty_seed')
      ) RETURNING id INTO _tpl_id;

      _idx := 0;
      FOR _field IN SELECT * FROM jsonb_array_elements(_item->'fields') LOOP
        INSERT INTO public.medical_record_fields (
          clinic_id, template_id, tab_key, field_key, label,
          field_type, field_order, is_required
        ) VALUES (
          _clinic_id, _tpl_id,
          _item->>'tab_key',
          _field->>'key',
          _field->>'label',
          COALESCE(_field->>'type','text'),
          _idx,
          COALESCE((_field->>'required')::boolean, false)
        );
        _idx := _idx + 1;
      END LOOP;

      _created := _created + 1;
    END IF;
  END LOOP;

  RETURN _created;
END;
$$;

-- Hook into existing defaults provisioner
CREATE OR REPLACE FUNCTION public.provision_other_specialty_defaults(
  _clinic_id uuid,
  _specialty_id uuid
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _type record;
BEGIN
  PERFORM public.provision_other_specialty_anamnesis_templates(_clinic_id, _specialty_id);
  PERFORM public.provision_other_specialty_medical_record_templates(_clinic_id, _specialty_id);

  FOR _type IN SELECT * FROM (VALUES
    ('consulta-atendimento-inicial','Consulta / Atendimento Inicial',60,'#2563eb',1),
    ('retorno','Retorno',30,'#16a34a',2),
    ('sessao','Sessão',50,'#7c3aed',3),
    ('procedimento','Procedimento',60,'#ea580c',4),
    ('avaliacao','Avaliação',60,'#0891b2',5),
    ('acompanhamento','Acompanhamento',45,'#64748b',6)
  ) AS t(slug, name, duration, color, ord) LOOP
    INSERT INTO public.appointment_types (clinic_id, specialty_id, name, default_duration_minutes, color, display_order, is_active)
    SELECT _clinic_id, _specialty_id, _type.name, _type.duration, _type.color, _type.ord, true
    WHERE NOT EXISTS (
      SELECT 1 FROM public.appointment_types
      WHERE clinic_id = _clinic_id AND specialty_id = _specialty_id AND name = _type.name
    );
  END LOOP;
END;
$$;

-- Backfill: provision templates for clinics that already activated other_specialty
DO $$
DECLARE
  _row record;
BEGIN
  FOR _row IN
    SELECT clinic_id, id AS specialty_id
    FROM public.specialties
    WHERE slug = 'other_specialty' AND is_active = true
  LOOP
    PERFORM public.provision_other_specialty_medical_record_templates(_row.clinic_id, _row.specialty_id);
  END LOOP;
END $$;
