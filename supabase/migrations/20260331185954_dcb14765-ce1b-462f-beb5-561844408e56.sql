
-- MODEL 4: Anamnese de Queixa Aguda
INSERT INTO anamnesis_templates (id, clinic_id, name, description, specialty, specialty_id, is_active, is_default, is_system, version, campos, fields)
VALUES (gen_random_uuid(), (SELECT clinic_id FROM anamnesis_templates LIMIT 1),
'Anamnese de Queixa Aguda',
'Modelo focado em intercorrências agudas pediátricas, com atenção para duração dos sintomas, sinais de alarme, hidratação, febre, dor e risco clínico.',
'pediatria','96d3c2cd-1d41-401b-9e53-21e2425f1929',true,false,true,1,'[]'::jsonb,
jsonb_build_array(
  jsonb_build_object('title','Identificação','fields',jsonb_build_array(
    jsonb_build_object('name','data_avaliacao','label','Data da avaliação','type','date','required',true),
    jsonb_build_object('name','profissional_responsavel','label','Profissional responsável','type','text','required',true),
    jsonb_build_object('name','responsavel_presente','label','Responsável presente','type','select','required',true,'options',jsonb_build_array('Mãe','Pai','Avó/Avô','Tutor legal','Outro')),
    jsonb_build_object('name','tipo_consulta','label','Tipo de consulta','type','select','required',false,'options',jsonb_build_array('Intercorrência','Retorno','Urgência')),
    jsonb_build_object('name','observacoes_iniciais','label','Observações iniciais','type','textarea','required',false)
  )),
  jsonb_build_object('title','Queixa Principal Aguda','fields',jsonb_build_array(
    jsonb_build_object('name','queixa_principal','label','Queixa principal','type','textarea','required',true),
    jsonb_build_object('name','inicio_quadro','label','Início do quadro','type','select','required',false,'options',jsonb_build_array('Súbito','Gradual','Recorrente','Desconhecido')),
    jsonb_build_object('name','tempo_evolucao','label','Tempo de evolução','type','text','required',false),
    jsonb_build_object('name','febre','label','Febre','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','tosse','label','Tosse','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','vomitos','label','Vômitos','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','diarreia','label','Diarreia','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','dor','label','Dor','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','localizacao_queixa','label','Localização principal da queixa','type','text','required',false),
    jsonb_build_object('name','objetivo_responsavel','label','Objetivo do responsável','type','textarea','required',false)
  )),
  jsonb_build_object('title','História do Quadro Agudo','fields',jsonb_build_array(
    jsonb_build_object('name','evolucao_sintomas','label','Evolução dos sintomas','type','textarea','required',false),
    jsonb_build_object('name','piora_recente','label','Piora recente','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','uso_medicacao_previa','label','Uso de medicação prévia','type','textarea','required',false),
    jsonb_build_object('name','atendimento_previo','label','Atendimento prévio','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','contato_doentes','label','Contato com pessoas doentes','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','internacao_recente','label','Internação recente','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','obs_quadro','label','Observações do quadro','type','textarea','required',false)
  )),
  jsonb_build_object('title','Estado Geral e Sinais de Alerta','fields',jsonb_build_array(
    jsonb_build_object('name','prostracao','label','Prostração','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','recusa_alimentar','label','Recusa alimentar','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','reducao_diurese','label','Redução da diurese','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','sonolencia','label','Sonolência','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','irritabilidade','label','Irritabilidade','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','dificuldade_respiratoria','label','Dificuldade respiratória','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','convulsao','label','Convulsão','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','exantema','label','Exantema','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','obs_risco','label','Observações de risco','type','textarea','required',false)
  )),
  jsonb_build_object('title','Plano Inicial','fields',jsonb_build_array(
    jsonb_build_object('name','conduta_inicial','label','Conduta inicial','type','textarea','required',false),
    jsonb_build_object('name','exames_complementares','label','Exames complementares','type','textarea','required',false),
    jsonb_build_object('name','prescricao_orientada','label','Prescrição orientada','type','textarea','required',false),
    jsonb_build_object('name','sinais_alarme','label','Sinais de alarme orientados','type','textarea','required',false),
    jsonb_build_object('name','necessidade_observacao','label','Necessidade de observação','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','necessidade_retorno','label','Necessidade de retorno','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','obs_finais','label','Observações finais','type','textarea','required',false)
  ))
));

INSERT INTO anamnesis_template_versions (template_id, version, version_number, structure, fields)
SELECT id, 1, 1, fields, fields FROM anamnesis_templates WHERE name = 'Anamnese de Queixa Aguda' AND specialty = 'pediatria';

-- MODEL 5: Anamnese Respiratória Pediátrica
INSERT INTO anamnesis_templates (id, clinic_id, name, description, specialty, specialty_id, is_active, is_default, is_system, version, campos, fields)
VALUES (gen_random_uuid(), (SELECT clinic_id FROM anamnesis_templates LIMIT 1),
'Anamnese Respiratória Pediátrica',
'Modelo focado em tosse, coriza, dispneia, chiado, febre e história respiratória pediátrica.',
'pediatria','96d3c2cd-1d41-401b-9e53-21e2425f1929',true,false,true,1,'[]'::jsonb,
jsonb_build_array(
  jsonb_build_object('title','Identificação','fields',jsonb_build_array(
    jsonb_build_object('name','data_avaliacao','label','Data da avaliação','type','date','required',true),
    jsonb_build_object('name','profissional_responsavel','label','Profissional responsável','type','text','required',true),
    jsonb_build_object('name','responsavel_presente','label','Responsável presente','type','select','required',true,'options',jsonb_build_array('Mãe','Pai','Avó/Avô','Tutor legal','Outro')),
    jsonb_build_object('name','tipo_consulta','label','Tipo de consulta','type','select','required',false,'options',jsonb_build_array('Primeira consulta','Retorno','Intercorrência')),
    jsonb_build_object('name','observacoes_iniciais','label','Observações iniciais','type','textarea','required',false)
  )),
  jsonb_build_object('title','Queixa Respiratória Principal','fields',jsonb_build_array(
    jsonb_build_object('name','tosse','label','Tosse','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','coriza','label','Coriza','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','febre','label','Febre','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','chiado','label','Chiado','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','falta_ar','label','Falta de ar','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','dor_garganta','label','Dor de garganta','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','tempo_evolucao','label','Tempo de evolução','type','text','required',false),
    jsonb_build_object('name','objetivo_responsavel','label','Objetivo do responsável','type','textarea','required',false)
  )),
  jsonb_build_object('title','História Respiratória','fields',jsonb_build_array(
    jsonb_build_object('name','episodios_previos','label','Episódios prévios','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','asma_previa','label','Asma prévia','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','bronquiolite_previa','label','Bronquiolite prévia','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','pneumonia_previa','label','Pneumonia prévia','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','internacao_previa','label','Internação prévia','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','uso_nebulizacao','label','Uso de nebulização','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','antibiotico_recente','label','Uso de antibiótico recente','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','obs_respiratorias','label','Observações respiratórias','type','textarea','required',false)
  )),
  jsonb_build_object('title','Sinais de Gravidade','fields',jsonb_build_array(
    jsonb_build_object('name','tiragem','label','Tiragem','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','batimento_asa_nasal','label','Batimento de asa nasal','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','gemencia','label','Gemência','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','cianose','label','Cianose','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','prostracao','label','Prostração','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','recusa_alimentar','label','Recusa alimentar','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','desidratacao','label','Desidratação','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','obs_clinicas','label','Observações clínicas','type','textarea','required',false)
  )),
  jsonb_build_object('title','Plano Inicial','fields',jsonb_build_array(
    jsonb_build_object('name','conduta_inicial','label','Conduta inicial','type','textarea','required',false),
    jsonb_build_object('name','exames_complementares','label','Exames complementares','type','textarea','required',false),
    jsonb_build_object('name','prescricao_orientada','label','Prescrição orientada','type','textarea','required',false),
    jsonb_build_object('name','sinais_alarme','label','Sinais de alarme orientados','type','textarea','required',false),
    jsonb_build_object('name','necessidade_retorno','label','Necessidade de retorno','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','obs_finais','label','Observações finais','type','textarea','required',false)
  ))
));

INSERT INTO anamnesis_template_versions (template_id, version, version_number, structure, fields)
SELECT id, 1, 1, fields, fields FROM anamnesis_templates WHERE name = 'Anamnese Respiratória Pediátrica' AND specialty = 'pediatria';

-- MODEL 6: Anamnese Gastrointestinal Pediátrica
INSERT INTO anamnesis_templates (id, clinic_id, name, description, specialty, specialty_id, is_active, is_default, is_system, version, campos, fields)
VALUES (gen_random_uuid(), (SELECT clinic_id FROM anamnesis_templates LIMIT 1),
'Anamnese Gastrointestinal Pediátrica',
'Modelo focado em dor abdominal, vômitos, diarreia, constipação, distensão, alimentação e hidratação.',
'pediatria','96d3c2cd-1d41-401b-9e53-21e2425f1929',true,false,true,1,'[]'::jsonb,
jsonb_build_array(
  jsonb_build_object('title','Identificação','fields',jsonb_build_array(
    jsonb_build_object('name','data_avaliacao','label','Data da avaliação','type','date','required',true),
    jsonb_build_object('name','profissional_responsavel','label','Profissional responsável','type','text','required',true),
    jsonb_build_object('name','responsavel_presente','label','Responsável presente','type','select','required',true,'options',jsonb_build_array('Mãe','Pai','Avó/Avô','Tutor legal','Outro')),
    jsonb_build_object('name','tipo_consulta','label','Tipo de consulta','type','select','required',false,'options',jsonb_build_array('Primeira consulta','Retorno','Intercorrência')),
    jsonb_build_object('name','observacoes_iniciais','label','Observações iniciais','type','textarea','required',false)
  )),
  jsonb_build_object('title','Queixa Gastrointestinal Principal','fields',jsonb_build_array(
    jsonb_build_object('name','dor_abdominal','label','Dor abdominal','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','vomitos','label','Vômitos','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','diarreia','label','Diarreia','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','constipacao','label','Constipação','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','distensao_abdominal','label','Distensão abdominal','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','sangue_fezes','label','Sangue nas fezes','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','tempo_evolucao','label','Tempo de evolução','type','text','required',false),
    jsonb_build_object('name','objetivo_responsavel','label','Objetivo do responsável','type','textarea','required',false)
  )),
  jsonb_build_object('title','História do Quadro','fields',jsonb_build_array(
    jsonb_build_object('name','frequencia_sintomas','label','Frequência dos sintomas','type','textarea','required',false),
    jsonb_build_object('name','relacao_alimentacao','label','Relação com alimentação','type','textarea','required',false),
    jsonb_build_object('name','piora_recente','label','Piora recente','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','febre_associada','label','Febre associada','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','uso_medicacao','label','Uso de medicação','type','textarea','required',false),
    jsonb_build_object('name','atendimento_previo','label','Atendimento prévio','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','obs_gi','label','Observações gastrointestinais','type','textarea','required',false)
  )),
  jsonb_build_object('title','Hidratação e Eliminação','fields',jsonb_build_array(
    jsonb_build_object('name','aceitacao_liquidos','label','Aceitação de líquidos','type','select','required',false,'options',jsonb_build_array('Boa','Regular','Ruim')),
    jsonb_build_object('name','diurese','label','Diurese','type','select','required',false,'options',jsonb_build_array('Normal','Reduzida','Ausente')),
    jsonb_build_object('name','sinais_desidratacao','label','Sinais de desidratação','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','evacuacao','label','Evacuação','type','select','required',false,'options',jsonb_build_array('Normal','Constipação','Diarreia','Irregular')),
    jsonb_build_object('name','dor_evacuar','label','Dor ao evacuar','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','obs_hidratacao','label','Observações de hidratação','type','textarea','required',false)
  )),
  jsonb_build_object('title','Plano Inicial','fields',jsonb_build_array(
    jsonb_build_object('name','conduta_inicial','label','Conduta inicial','type','textarea','required',false),
    jsonb_build_object('name','exames_complementares','label','Exames complementares','type','textarea','required',false),
    jsonb_build_object('name','prescricao_orientada','label','Prescrição orientada','type','textarea','required',false),
    jsonb_build_object('name','sinais_alarme','label','Sinais de alarme orientados','type','textarea','required',false),
    jsonb_build_object('name','necessidade_retorno','label','Necessidade de retorno','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','obs_finais','label','Observações finais','type','textarea','required',false)
  ))
));

INSERT INTO anamnesis_template_versions (template_id, version, version_number, structure, fields)
SELECT id, 1, 1, fields, fields FROM anamnesis_templates WHERE name = 'Anamnese Gastrointestinal Pediátrica' AND specialty = 'pediatria';
