
-- MODEL 7: Anamnese de Crescimento
INSERT INTO anamnesis_templates (id,clinic_id,name,description,specialty,specialty_id,is_active,is_default,is_system,version,campos,fields)
VALUES (gen_random_uuid(),(SELECT clinic_id FROM anamnesis_templates LIMIT 1),
'Anamnese de Crescimento','Modelo focado em ganho ponderoestatural, percentis, perímetro cefálico e preocupações com crescimento.',
'pediatria','96d3c2cd-1d41-401b-9e53-21e2425f1929',true,false,true,1,'[]'::jsonb,
jsonb_build_array(
  jsonb_build_object('title','Identificação','fields',jsonb_build_array(
    jsonb_build_object('name','data_avaliacao','label','Data da avaliação','type','date','required',true),
    jsonb_build_object('name','profissional_responsavel','label','Profissional responsável','type','text','required',true),
    jsonb_build_object('name','responsavel_presente','label','Responsável presente','type','select','required',true,'options',jsonb_build_array('Mãe','Pai','Avó/Avô','Tutor legal','Outro')),
    jsonb_build_object('name','tipo_consulta','label','Tipo de consulta','type','select','required',false,'options',jsonb_build_array('Primeira consulta','Retorno','Puericultura')),
    jsonb_build_object('name','observacoes_iniciais','label','Observações iniciais','type','textarea','required',false)
  )),
  jsonb_build_object('title','Queixa Principal','fields',jsonb_build_array(
    jsonb_build_object('name','preocupacao_peso','label','Preocupação com peso','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','preocupacao_altura','label','Preocupação com altura','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','baixo_ganho_peso','label','Baixo ganho de peso','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','crescimento_acelerado','label','Crescimento acelerado','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','obs_responsavel','label','Observações do responsável','type','textarea','required',false)
  )),
  jsonb_build_object('title','Histórico de Crescimento','fields',jsonb_build_array(
    jsonb_build_object('name','peso_adequado','label','Peso percebido adequado','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','altura_adequada','label','Altura percebida adequada','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','mudanca_padrao','label','Mudança recente no padrão','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','acompanhamento_previo','label','Acompanhamento prévio','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','exames_previos','label','Exames prévios','type','textarea','required',false),
    jsonb_build_object('name','obs_crescimento','label','Observações do crescimento','type','textarea','required',false)
  )),
  jsonb_build_object('title','Alimentação e Hábitos','fields',jsonb_build_array(
    jsonb_build_object('name','aleitamento','label','Aleitamento','type','select','required',false,'options',jsonb_build_array('Exclusivo','Predominante','Misto','Não amamenta','Desmamado')),
    jsonb_build_object('name','alimentacao_atual','label','Alimentação atual','type','select','required',false,'options',jsonb_build_array('Adequada','Seletiva','Dificuldade alimentar','Em avaliação')),
    jsonb_build_object('name','seletividade','label','Seletividade','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','ingesta_hidrica','label','Ingesta hídrica','type','text','required',false),
    jsonb_build_object('name','sono','label','Sono','type','select','required',false,'options',jsonb_build_array('Adequado','Irregular','Despertares frequentes','Dificuldade para dormir')),
    jsonb_build_object('name','atividade_fisica','label','Atividade física','type','textarea','required',false),
    jsonb_build_object('name','obs_habitos','label','Observações dos hábitos','type','textarea','required',false)
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
SELECT id,1,1,fields,fields FROM anamnesis_templates WHERE name='Anamnese de Crescimento' AND specialty='pediatria';

-- MODEL 8: Anamnese Nutricional Pediátrica
INSERT INTO anamnesis_templates (id,clinic_id,name,description,specialty,specialty_id,is_active,is_default,is_system,version,campos,fields)
VALUES (gen_random_uuid(),(SELECT clinic_id FROM anamnesis_templates LIMIT 1),
'Anamnese Nutricional Pediátrica','Modelo focado em alimentação, seletividade, ganho de peso, rotina alimentar, ingestão hídrica e hábitos.',
'pediatria','96d3c2cd-1d41-401b-9e53-21e2425f1929',true,false,true,1,'[]'::jsonb,
jsonb_build_array(
  jsonb_build_object('title','Identificação','fields',jsonb_build_array(
    jsonb_build_object('name','data_avaliacao','label','Data da avaliação','type','date','required',true),
    jsonb_build_object('name','profissional_responsavel','label','Profissional responsável','type','text','required',true),
    jsonb_build_object('name','responsavel_presente','label','Responsável presente','type','select','required',true,'options',jsonb_build_array('Mãe','Pai','Avó/Avô','Tutor legal','Outro')),
    jsonb_build_object('name','tipo_consulta','label','Tipo de consulta','type','select','required',false,'options',jsonb_build_array('Primeira consulta','Retorno','Puericultura')),
    jsonb_build_object('name','observacoes_iniciais','label','Observações iniciais','type','textarea','required',false)
  )),
  jsonb_build_object('title','Queixa Nutricional Principal','fields',jsonb_build_array(
    jsonb_build_object('name','queixa_principal','label','Queixa principal','type','textarea','required',false),
    jsonb_build_object('name','dificuldade_alimentar','label','Dificuldade alimentar','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','seletividade','label','Seletividade','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','recusa_alimentar','label','Recusa alimentar','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','baixo_apetite','label','Baixo apetite','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','excesso_alimentar','label','Excesso alimentar','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','objetivo_responsavel','label','Objetivo do responsável','type','textarea','required',false)
  )),
  jsonb_build_object('title','Rotina Alimentar','fields',jsonb_build_array(
    jsonb_build_object('name','cafe_manha','label','Café da manhã','type','textarea','required',false),
    jsonb_build_object('name','almoco','label','Almoço','type','textarea','required',false),
    jsonb_build_object('name','jantar','label','Jantar','type','textarea','required',false),
    jsonb_build_object('name','lanches','label','Lanches','type','textarea','required',false),
    jsonb_build_object('name','ingesta_hidrica','label','Ingesta hídrica','type','text','required',false),
    jsonb_build_object('name','ultraprocessados','label','Consumo de ultraprocessados','type','select','required',false,'options',jsonb_build_array('Ausente','Ocasional','Frequente','Diário')),
    jsonb_build_object('name','frutas_vegetais','label','Consumo de frutas e vegetais','type','select','required',false,'options',jsonb_build_array('Adequado','Insuficiente','Ausente')),
    jsonb_build_object('name','obs_rotina','label','Observações da rotina alimentar','type','textarea','required',false)
  )),
  jsonb_build_object('title','Sintomas e Impacto','fields',jsonb_build_array(
    jsonb_build_object('name','constipacao','label','Constipação','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','diarreia','label','Diarreia','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','dor_abdominal','label','Dor abdominal','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','vomitos','label','Vômitos','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','distensao','label','Distensão','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','baixo_ganho_peso','label','Baixo ganho de peso','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','excesso_peso','label','Excesso de peso','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','obs_clinicas','label','Observações clínicas','type','textarea','required',false)
  )),
  jsonb_build_object('title','Plano Inicial','fields',jsonb_build_array(
    jsonb_build_object('name','conduta_inicial','label','Conduta inicial','type','textarea','required',false),
    jsonb_build_object('name','exames_complementares','label','Exames complementares','type','textarea','required',false),
    jsonb_build_object('name','orientacoes_alimentares','label','Orientações alimentares','type','textarea','required',false),
    jsonb_build_object('name','necessidade_retorno','label','Necessidade de retorno','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','obs_finais','label','Observações finais','type','textarea','required',false)
  ))
));

INSERT INTO anamnesis_template_versions (template_id,version,version_number,structure,fields)
SELECT id,1,1,fields,fields FROM anamnesis_templates WHERE name='Anamnese Nutricional Pediátrica' AND specialty='pediatria';

-- MODEL 9: Anamnese Escolar
INSERT INTO anamnesis_templates (id,clinic_id,name,description,specialty,specialty_id,is_active,is_default,is_system,version,campos,fields)
VALUES (gen_random_uuid(),(SELECT clinic_id FROM anamnesis_templates LIMIT 1),
'Anamnese Escolar','Modelo focado em desempenho escolar, comportamento, socialização, atenção, rotina e integração com desenvolvimento infantil.',
'pediatria','96d3c2cd-1d41-401b-9e53-21e2425f1929',true,false,true,1,'[]'::jsonb,
jsonb_build_array(
  jsonb_build_object('title','Identificação','fields',jsonb_build_array(
    jsonb_build_object('name','data_avaliacao','label','Data da avaliação','type','date','required',true),
    jsonb_build_object('name','profissional_responsavel','label','Profissional responsável','type','text','required',true),
    jsonb_build_object('name','responsavel_presente','label','Responsável presente','type','select','required',true,'options',jsonb_build_array('Mãe','Pai','Avó/Avô','Tutor legal','Outro')),
    jsonb_build_object('name','faixa_escolar','label','Faixa escolar','type','select','required',false,'options',jsonb_build_array('Creche','Pré-escola','Ensino Fundamental I','Ensino Fundamental II','Ensino Médio')),
    jsonb_build_object('name','observacoes_iniciais','label','Observações iniciais','type','textarea','required',false)
  )),
  jsonb_build_object('title','Queixa Principal Escolar','fields',jsonb_build_array(
    jsonb_build_object('name','dificuldade_escolar','label','Dificuldade escolar','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','queixa_comportamental','label','Queixa comportamental','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','queixa_atencao','label','Queixa de atenção','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','dificuldade_aprendizagem','label','Dificuldade de aprendizagem','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','dificuldade_socializacao','label','Dificuldade de socialização','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','objetivo_responsavel','label','Objetivo do responsável','type','textarea','required',false)
  )),
  jsonb_build_object('title','Histórico Escolar','fields',jsonb_build_array(
    jsonb_build_object('name','frequenta_escola','label','Frequenta escola ou creche','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','adaptacao_escolar','label','Adaptação escolar','type','select','required',false,'options',jsonb_build_array('Boa','Regular','Difícil')),
    jsonb_build_object('name','faltas_frequentes','label','Faltas frequentes','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','repetencia','label','Repetência','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','queixa_professores','label','Queixa de professores','type','textarea','required',false),
    jsonb_build_object('name','apoio_escolar','label','Apoio escolar prévio','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','obs_escolares','label','Observações escolares','type','textarea','required',false)
  )),
  jsonb_build_object('title','Desenvolvimento e Comportamento','fields',jsonb_build_array(
    jsonb_build_object('name','linguagem_adequada','label','Linguagem adequada','type','radio','required',false,'options',jsonb_build_array('Sim','Não','Em avaliação')),
    jsonb_build_object('name','interacao_social','label','Interação social','type','select','required',false,'options',jsonb_build_array('Adequada','Atenção','Dificuldade')),
    jsonb_build_object('name','atencao','label','Atenção','type','select','required',false,'options',jsonb_build_array('Adequada','Déficit leve','Déficit moderado','Déficit grave')),
    jsonb_build_object('name','hiperatividade','label','Hiperatividade','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','sono','label','Sono','type','select','required',false,'options',jsonb_build_array('Adequado','Irregular','Despertares frequentes','Dificuldade para dormir')),
    jsonb_build_object('name','tempo_tela','label','Tempo de tela','type','text','required',false),
    jsonb_build_object('name','rotina_diaria','label','Rotina diária','type','textarea','required',false),
    jsonb_build_object('name','obs_comportamentais','label','Observações comportamentais','type','textarea','required',false)
  )),
  jsonb_build_object('title','Plano Inicial','fields',jsonb_build_array(
    jsonb_build_object('name','conduta_inicial','label','Conduta inicial','type','textarea','required',false),
    jsonb_build_object('name','avaliacao_complementar','label','Necessidade de avaliação complementar','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','orientacoes_responsavel','label','Orientações ao responsável','type','textarea','required',false),
    jsonb_build_object('name','necessidade_retorno','label','Necessidade de retorno','type','radio','required',false,'options',jsonb_build_array('Sim','Não')),
    jsonb_build_object('name','obs_finais','label','Observações finais','type','textarea','required',false)
  ))
));

INSERT INTO anamnesis_template_versions (template_id,version,version_number,structure,fields)
SELECT id,1,1,fields,fields FROM anamnesis_templates WHERE name='Anamnese Escolar' AND specialty='pediatria';
