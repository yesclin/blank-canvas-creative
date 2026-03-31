
-- MODEL 10: Anamnese de Febre
INSERT INTO anamnesis_templates (id,clinic_id,name,description,specialty,specialty_id,is_active,is_default,is_system,version,campos,fields)
VALUES (gen_random_uuid(),(SELECT clinic_id FROM anamnesis_templates LIMIT 1),
'Anamnese de Febre','Modelo focado em febre pediátrica, duração, pico febril, sinais associados e sinais de alarme.',
'pediatria','96d3c2cd-1d41-401b-9e53-21e2425f1929',true,false,true,1,'[]'::jsonb,
jsonb_build_array(
  jsonb_build_object('title','Identificação','fields',jsonb_build_array(
    jsonb_build_object('name','data_avaliacao','label','Data da avaliação','type','date','required',true),
    jsonb_build_object('name','profissional_responsavel','label','Profissional responsável','type','text','required',true),
    jsonb_build_object('name','responsavel_presente','label','Responsável presente','type','select','required',true,'options',jsonb_build_array('Mãe','Pai','Avó/Avô','Tutor legal','Outro')),
    jsonb_build_object('name','tipo_consulta','label','Tipo de consulta','type','select','required',false,'options',jsonb_build_array('Intercorrência','Retorno','Urgência')),
    jsonb_build_object('name','observacoes_iniciais','label','Observações iniciais','type','textarea','required',false)
  )),
  jsonb_build_object('title','Queixa Principal Febril','fields',jsonb_build_array(
    jsonb_build_object('name','febre','label','Febre','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','tempo_febre','label','Tempo de febre','type','text','required',false),
    jsonb_build_object('name','pico_maximo','label','Pico máximo informado','type','text','required',false),
    jsonb_build_object('name','frequencia_episodios','label','Frequência dos episódios','type','select','required',false,'options',jsonb_build_array('Contínua','Intermitente','Esporádica')),
    jsonb_build_object('name','resposta_antitermico','label','Resposta ao antitérmico','type','select','required',false,'options',jsonb_build_array('Boa','Parcial','Sem resposta')),
    jsonb_build_object('name','objetivo_responsavel','label','Objetivo do responsável','type','textarea','required',false)
  )),
  jsonb_build_object('title','Sintomas Associados','fields',jsonb_build_array(
    jsonb_build_object('name','tosse','label','Tosse','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','coriza','label','Coriza','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','vomitos','label','Vômitos','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','diarreia','label','Diarreia','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','dor_abdominal','label','Dor abdominal','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','dor_urinar','label','Dor ao urinar','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','exantema','label','Exantema','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','prostracao','label','Prostração','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','convulsao_febril','label','Convulsão febril','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','obs_associados','label','Observações associadas','type','textarea','required',false)
  )),
  jsonb_build_object('title','Sinais de Alarme','fields',jsonb_build_array(
    jsonb_build_object('name','recusa_alimentar','label','Recusa alimentar','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','reducao_diurese','label','Redução da diurese','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','sonolencia','label','Sonolência','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','irritabilidade_intensa','label','Irritabilidade intensa','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','dificuldade_respiratoria','label','Dificuldade respiratória','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','rigidez','label','Rigidez','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','petequias','label','Petequias','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','obs_risco','label','Observações de risco','type','textarea','required',false)
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

INSERT INTO anamnesis_template_versions (template_id,version,version_number,structure,fields)
SELECT id,1,1,fields,fields FROM anamnesis_templates WHERE name='Anamnese de Febre' AND specialty='pediatria';

-- MODEL 11: Anamnese de Alergias / Dermato
INSERT INTO anamnesis_templates (id,clinic_id,name,description,specialty,specialty_id,is_active,is_default,is_system,version,campos,fields)
VALUES (gen_random_uuid(),(SELECT clinic_id FROM anamnesis_templates LIMIT 1),
'Anamnese de Alergias / Dermato','Modelo focado em alergias pediátricas, dermatites, prurido, exantemas e gatilhos associados.',
'pediatria','96d3c2cd-1d41-401b-9e53-21e2425f1929',true,false,true,1,'[]'::jsonb,
jsonb_build_array(
  jsonb_build_object('title','Identificação','fields',jsonb_build_array(
    jsonb_build_object('name','data_avaliacao','label','Data da avaliação','type','date','required',true),
    jsonb_build_object('name','profissional_responsavel','label','Profissional responsável','type','text','required',true),
    jsonb_build_object('name','responsavel_presente','label','Responsável presente','type','select','required',true,'options',jsonb_build_array('Mãe','Pai','Avó/Avô','Tutor legal','Outro')),
    jsonb_build_object('name','tipo_consulta','label','Tipo de consulta','type','select','required',false,'options',jsonb_build_array('Primeira consulta','Retorno','Intercorrência')),
    jsonb_build_object('name','observacoes_iniciais','label','Observações iniciais','type','textarea','required',false)
  )),
  jsonb_build_object('title','Queixa Principal','fields',jsonb_build_array(
    jsonb_build_object('name','lesao_pele','label','Lesão de pele','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','prurido','label','Prurido','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','vermelhidao','label','Vermelhidão','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','exantema','label','Exantema','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','inicio_quadro','label','Início do quadro','type','select','required',false,'options',jsonb_build_array('Súbito','Gradual','Recorrente','Desconhecido')),
    jsonb_build_object('name','tempo_evolucao','label','Tempo de evolução','type','text','required',false),
    jsonb_build_object('name','objetivo_responsavel','label','Objetivo do responsável','type','textarea','required',false)
  )),
  jsonb_build_object('title','História do Quadro','fields',jsonb_build_array(
    jsonb_build_object('name','recorrencia','label','Recorrência','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','relacao_alimento','label','Relação com alimento','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','relacao_calor','label','Relação com calor','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','relacao_suor','label','Relação com suor','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','relacao_cosmetico','label','Relação com cosmético','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','relacao_medicamento','label','Relação com medicamento','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','tratamentos_previos','label','Tratamentos prévios','type','textarea','required',false),
    jsonb_build_object('name','resposta_tratamento','label','Resposta ao tratamento','type','textarea','required',false),
    jsonb_build_object('name','obs_dermatologicas','label','Observações dermatológicas','type','textarea','required',false)
  )),
  jsonb_build_object('title','Histórico Alérgico','fields',jsonb_build_array(
    jsonb_build_object('name','alergia_alimentar','label','Alergia alimentar','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','dermatite_atopica','label','Dermatite atópica','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','asma','label','Asma','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','rinite','label','Rinite','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','historico_familiar_alergico','label','Histórico familiar alérgico','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','obs_historico','label','Observações do histórico','type','textarea','required',false)
  )),
  jsonb_build_object('title','Plano Inicial','fields',jsonb_build_array(
    jsonb_build_object('name','conduta_inicial','label','Conduta inicial','type','textarea','required',false),
    jsonb_build_object('name','exames_complementares','label','Exames complementares','type','textarea','required',false),
    jsonb_build_object('name','orientacoes_responsavel','label','Orientações ao responsável','type','textarea','required',false),
    jsonb_build_object('name','necessidade_retorno','label','Necessidade de retorno','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','obs_finais','label','Observações finais','type','textarea','required',false)
  ))
));

INSERT INTO anamnesis_template_versions (template_id,version,version_number,structure,fields)
SELECT id,1,1,fields,fields FROM anamnesis_templates WHERE name='Anamnese de Alergias / Dermato' AND specialty='pediatria';

-- MODEL 12: Anamnese de Acompanhamento do Bebê
INSERT INTO anamnesis_templates (id,clinic_id,name,description,specialty,specialty_id,is_active,is_default,is_system,version,campos,fields)
VALUES (gen_random_uuid(),(SELECT clinic_id FROM anamnesis_templates LIMIT 1),
'Anamnese de Acompanhamento do Bebê','Modelo focado em seguimento de lactentes, rotina, sono, aleitamento, eliminação, ganho de peso e sinais de alerta.',
'pediatria','96d3c2cd-1d41-401b-9e53-21e2425f1929',true,false,true,1,'[]'::jsonb,
jsonb_build_array(
  jsonb_build_object('title','Identificação','fields',jsonb_build_array(
    jsonb_build_object('name','data_avaliacao','label','Data da avaliação','type','date','required',true),
    jsonb_build_object('name','profissional_responsavel','label','Profissional responsável','type','text','required',true),
    jsonb_build_object('name','responsavel_presente','label','Responsável presente','type','select','required',true,'options',jsonb_build_array('Mãe','Pai','Avó/Avô','Tutor legal','Outro')),
    jsonb_build_object('name','idade_bebe','label','Idade atual do bebê','type','text','required',false),
    jsonb_build_object('name','tipo_consulta','label','Tipo de consulta','type','select','required',false,'options',jsonb_build_array('Puericultura','Retorno','Intercorrência')),
    jsonb_build_object('name','observacoes_iniciais','label','Observações iniciais','type','textarea','required',false)
  )),
  jsonb_build_object('title','Evolução desde a Última Consulta','fields',jsonb_build_array(
    jsonb_build_object('name','intercorrencias_recentes','label','Intercorrências recentes','type','textarea','required',false),
    jsonb_build_object('name','internacao_recente','label','Internação desde a última consulta','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','uso_medicacao','label','Uso de medicação','type','textarea','required',false),
    jsonb_build_object('name','duvidas_responsavel','label','Dúvidas do responsável','type','textarea','required',false),
    jsonb_build_object('name','objetivo_acompanhamento','label','Objetivo do acompanhamento','type','textarea','required',false)
  )),
  jsonb_build_object('title','Alimentação e Sono','fields',jsonb_build_array(
    jsonb_build_object('name','aleitamento_atual','label','Aleitamento atual','type','select','required',false,'options',jsonb_build_array('Exclusivo','Predominante','Misto','Não amamenta')),
    jsonb_build_object('name','formula_complementar','label','Fórmula complementar','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','frequencia_mamadas','label','Frequência das mamadas','type','text','required',false),
    jsonb_build_object('name','regurgitacao','label','Regurgitação','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','vomitos','label','Vômitos','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','sono','label','Sono','type','select','required',false,'options',jsonb_build_array('Adequado','Irregular','Excessivo')),
    jsonb_build_object('name','despertares_noturnos','label','Despertares noturnos','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','obs_rotina','label','Observações da rotina','type','textarea','required',false)
  )),
  jsonb_build_object('title','Eliminações e Comportamento','fields',jsonb_build_array(
    jsonb_build_object('name','diurese','label','Diurese','type','select','required',false,'options',jsonb_build_array('Normal','Reduzida','Aumentada')),
    jsonb_build_object('name','evacuacao','label','Evacuação','type','select','required',false,'options',jsonb_build_array('Normal','Constipação','Diarreia')),
    jsonb_build_object('name','choro_excessivo','label','Choro excessivo','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','irritabilidade','label','Irritabilidade','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','consolabilidade','label','Consolabilidade','type','select','required',false,'options',jsonb_build_array('Fácil','Difícil','Inconsolável')),
    jsonb_build_object('name','obs_comportamentais','label','Observações comportamentais','type','textarea','required',false)
  )),
  jsonb_build_object('title','Desenvolvimento Inicial','fields',jsonb_build_array(
    jsonb_build_object('name','contato_visual','label','Contato visual','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','sorriso_social','label','Sorriso social','type','radio','required',false,'options',jsonb_build_array('Sim','Não','Não se aplica')),
    jsonb_build_object('name','sustentacao_cefalica','label','Sustentação cefálica','type','radio','required',false,'options',jsonb_build_array('Sim','Não','Não se aplica')),
    jsonb_build_object('name','marcos_adequados','label','Marcos adequados para idade','type','radio','required',false,'options',jsonb_build_array('Sim','Não','Em avaliação')),
    jsonb_build_object('name','obs_desenvolvimento','label','Observações do desenvolvimento','type','textarea','required',false)
  )),
  jsonb_build_object('title','Plano Inicial','fields',jsonb_build_array(
    jsonb_build_object('name','conduta_inicial','label','Conduta inicial','type','textarea','required',false),
    jsonb_build_object('name','orientacoes_responsavel','label','Orientações ao responsável','type','textarea','required',false),
    jsonb_build_object('name','necessidade_retorno','label','Necessidade de retorno','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','sinais_alarme','label','Sinais de alarme orientados','type','textarea','required',false),
    jsonb_build_object('name','obs_finais','label','Observações finais','type','textarea','required',false)
  ))
));

INSERT INTO anamnesis_template_versions (template_id,version,version_number,structure,fields)
SELECT id,1,1,fields,fields FROM anamnesis_templates WHERE name='Anamnese de Acompanhamento do Bebê' AND specialty='pediatria';
