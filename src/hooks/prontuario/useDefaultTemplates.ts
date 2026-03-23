import { useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useClinicData } from '@/hooks/useClinicData';
import { toast } from 'sonner';
import type { TemplateType } from './useTemplates';
import type { FieldType } from './useFields';
import type { Json } from '@/integrations/supabase/types';

interface DefaultField {
  label: string;
  field_type: FieldType;
  placeholder?: string;
  options?: string[];
  is_required: boolean;
}

interface DefaultTemplate {
  name: string;
  type: TemplateType;
  description: string;
  fields: DefaultField[];
}

// Campos padrão para Clínica Médica Geral
const GENERAL_MEDICINE_TEMPLATES: DefaultTemplate[] = [
  {
    name: 'Anamnese Clínica Geral',
    type: 'anamnese',
    description: 'Modelo padrão de anamnese para clínica médica geral',
    fields: [
      { label: 'Queixa Principal', field_type: 'textarea', placeholder: 'Descreva a queixa principal do paciente', is_required: true },
      { label: 'História da Doença Atual', field_type: 'textarea', placeholder: 'Descreva a evolução da doença atual', is_required: true },
      { label: 'Antecedentes Pessoais', field_type: 'textarea', placeholder: 'Doenças prévias, cirurgias, internações', is_required: false },
      { label: 'Antecedentes Familiares', field_type: 'textarea', placeholder: 'Doenças na família (pais, irmãos, avós)', is_required: false },
      { label: 'Medicamentos em Uso', field_type: 'textarea', placeholder: 'Liste os medicamentos em uso atual', is_required: false },
      { label: 'Alergias', field_type: 'textarea', placeholder: 'Alergias conhecidas (medicamentos, alimentos, etc)', is_required: false },
    ],
  },
  {
    name: 'Sinais Vitais',
    type: 'vital_signs',
    description: 'Registro de sinais vitais do paciente',
    fields: [
      { label: 'Pressão Arterial Sistólica (mmHg)', field_type: 'number', placeholder: 'Ex: 120', is_required: true },
      { label: 'Pressão Arterial Diastólica (mmHg)', field_type: 'number', placeholder: 'Ex: 80', is_required: true },
      { label: 'Frequência Cardíaca (bpm)', field_type: 'number', placeholder: 'Ex: 72', is_required: true },
      { label: 'Temperatura (°C)', field_type: 'number', placeholder: 'Ex: 36.5', is_required: false },
      { label: 'Saturação O2 (%)', field_type: 'number', placeholder: 'Ex: 98', is_required: false },
      { label: 'Frequência Respiratória (irpm)', field_type: 'number', placeholder: 'Ex: 16', is_required: false },
      { label: 'Peso (kg)', field_type: 'number', placeholder: 'Ex: 70', is_required: false },
      { label: 'Altura (cm)', field_type: 'number', placeholder: 'Ex: 170', is_required: false },
    ],
  },
  {
    name: 'Diagnóstico',
    type: 'diagnosis',
    description: 'Registro de hipótese diagnóstica e diagnóstico CID',
    fields: [
      { label: 'Hipótese Diagnóstica', field_type: 'textarea', placeholder: 'Descreva a hipótese diagnóstica', is_required: true },
      { label: 'Código CID-10', field_type: 'text', placeholder: 'Ex: J06.9', is_required: false },
      { label: 'Descrição do Diagnóstico', field_type: 'textarea', placeholder: 'Descrição detalhada do diagnóstico', is_required: false },
      { label: 'Diagnósticos Secundários', field_type: 'textarea', placeholder: 'Outros diagnósticos relacionados', is_required: false },
    ],
  },
  {
    name: 'Conduta / Plano',
    type: 'conduct',
    description: 'Plano terapêutico e orientações ao paciente',
    fields: [
      { label: 'Conduta', field_type: 'textarea', placeholder: 'Descreva a conduta médica', is_required: true },
      { label: 'Prescrições', field_type: 'textarea', placeholder: 'Medicamentos prescritos', is_required: false },
      { label: 'Exames Solicitados', field_type: 'textarea', placeholder: 'Exames laboratoriais/imagem solicitados', is_required: false },
      { label: 'Orientações ao Paciente', field_type: 'textarea', placeholder: 'Orientações gerais para o paciente', is_required: false },
      { label: 'Retorno', field_type: 'text', placeholder: 'Prazo para retorno (ex: 7 dias)', is_required: false },
    ],
  },
];

// Campos padrão para Odontologia
const DENTISTRY_TEMPLATES: DefaultTemplate[] = [
  {
    name: 'Odontograma',
    type: 'odontogram',
    description: 'Registro visual do estado de cada dente',
    fields: [
      { label: 'Odontograma', field_type: 'odontogram', placeholder: 'Clique para editar o odontograma', is_required: true },
      { label: 'Histórico Odontológico', field_type: 'textarea', placeholder: 'Tratamentos anteriores, extrações, próteses', is_required: false },
      { label: 'Observações Gerais', field_type: 'textarea', placeholder: 'Notas sobre a arcada dentária', is_required: false },
    ],
  },
  {
    name: 'Procedimento por Dente',
    type: 'tooth_procedure',
    description: 'Registro de procedimentos realizados por dente/região',
    fields: [
      { label: 'Dente / Região', field_type: 'tooth_select', placeholder: 'Selecione o dente ou região', is_required: true },
      { label: 'Procedimento Realizado', field_type: 'textarea', placeholder: 'Descreva o procedimento (ex: restauração, extração)', is_required: true },
      { label: 'Material Utilizado', field_type: 'text', placeholder: 'Ex: Resina composta, amálgama', is_required: false },
      { label: 'Dor (0-10)', field_type: 'select', options: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'], is_required: false },
      { label: 'Observações Clínicas', field_type: 'textarea', placeholder: 'Anotações adicionais', is_required: false },
    ],
  },
  {
    name: 'Sessão Odontológica',
    type: 'dental_session',
    description: 'Evolução por sessão de atendimento odontológico',
    fields: [
      { label: 'Queixa do Paciente', field_type: 'textarea', placeholder: 'O que o paciente relatou nesta sessão', is_required: false },
      { label: 'Procedimentos Realizados', field_type: 'textarea', placeholder: 'Liste os procedimentos desta sessão', is_required: true },
      { label: 'Dentes Tratados', field_type: 'tooth_select', placeholder: 'Selecione os dentes trabalhados', is_required: false },
      { label: 'Anestesia Utilizada', field_type: 'text', placeholder: 'Tipo e quantidade de anestésico', is_required: false },
      { label: 'Evolução / Resposta ao Tratamento', field_type: 'textarea', placeholder: 'Como o paciente respondeu ao tratamento', is_required: false },
      { label: 'Próximos Passos', field_type: 'textarea', placeholder: 'O que será feito na próxima sessão', is_required: false },
      { label: 'Observações Clínicas', field_type: 'textarea', placeholder: 'Anotações adicionais', is_required: false },
    ],
  },
];

// Campos padrão para Psicologia
const PSYCHOLOGY_TEMPLATES: DefaultTemplate[] = [
  {
    name: 'Registro de Sessão',
    type: 'session_record',
    description: 'Documentação de sessão de psicoterapia',
    fields: [
      { label: 'Tipo de Sessão', field_type: 'select', options: ['Individual', 'Casal', 'Família', 'Grupo', 'Online', 'Primeira consulta', 'Retorno'], is_required: true },
      { label: 'Relato do Paciente', field_type: 'textarea', placeholder: 'Transcreva os principais relatos e narrativas do paciente', is_required: true },
      { label: 'Observações do Profissional', field_type: 'textarea', placeholder: 'Suas observações clínicas sobre a sessão', is_required: true },
      { label: 'Emoções Predominantes', field_type: 'multiselect', options: ['Ansiedade', 'Tristeza', 'Raiva', 'Medo', 'Alegria', 'Culpa', 'Vergonha', 'Frustração', 'Esperança', 'Confusão', 'Alívio', 'Indiferença'], is_required: false },
      { label: 'Temas Abordados', field_type: 'textarea', placeholder: 'Principais temas discutidos na sessão', is_required: false },
      { label: 'Técnicas Utilizadas', field_type: 'textarea', placeholder: 'Técnicas ou intervenções aplicadas', is_required: false },
    ],
  },
  {
    name: 'Objetivos Terapêuticos',
    type: 'therapeutic_goals',
    description: 'Definição e acompanhamento de objetivos do tratamento',
    fields: [
      { label: 'Objetivo Principal', field_type: 'textarea', placeholder: 'Descreva o objetivo principal do tratamento', is_required: true },
      { label: 'Objetivos Secundários', field_type: 'textarea', placeholder: 'Outros objetivos a serem alcançados', is_required: false },
      { label: 'Indicadores de Progresso', field_type: 'textarea', placeholder: 'Como será medido o progresso', is_required: false },
      { label: 'Prazo Estimado', field_type: 'text', placeholder: 'Ex: 3 meses, 10 sessões', is_required: false },
      { label: 'Status do Objetivo', field_type: 'select', options: ['Em andamento', 'Parcialmente atingido', 'Atingido', 'Reavaliando', 'Suspenso'], is_required: false },
    ],
  },
  {
    name: 'Plano Terapêutico',
    type: 'therapeutic_plan',
    description: 'Planejamento do tratamento psicológico',
    fields: [
      { label: 'Diagnóstico / Hipótese Clínica', field_type: 'textarea', placeholder: 'Impressão diagnóstica ou hipótese clínica', is_required: true },
      { label: 'Abordagem Terapêutica', field_type: 'select', options: ['Terapia Cognitivo-Comportamental', 'Psicanálise', 'Humanista', 'Sistêmica', 'Gestalt', 'EMDR', 'Terapia Breve', 'Outra'], is_required: true },
      { label: 'Plano de Tratamento', field_type: 'textarea', placeholder: 'Descreva o plano terapêutico proposto', is_required: true },
      { label: 'Frequência das Sessões', field_type: 'select', options: ['Semanal', 'Quinzenal', 'Mensal', 'Sob demanda'], is_required: false },
      { label: 'Evolução Clínica', field_type: 'textarea', placeholder: 'Resumo da evolução do paciente', is_required: false },
      { label: 'Encaminhamentos', field_type: 'textarea', placeholder: 'Encaminhamentos para outros profissionais, se necessário', is_required: false },
    ],
  },
];

// Campos padrão para Psiquiatria
const PSYCHIATRY_TEMPLATES: DefaultTemplate[] = [
  {
    name: 'Diagnóstico (CID/DSM)',
    type: 'diagnosis_dsm',
    description: 'Registro de diagnóstico psiquiátrico com CID e DSM',
    fields: [
      { label: 'Diagnóstico Principal (CID-10)', field_type: 'text', placeholder: 'Ex: F32.1 - Episódio depressivo moderado', is_required: true },
      { label: 'Diagnóstico (DSM-5)', field_type: 'text', placeholder: 'Ex: Transtorno Depressivo Maior', is_required: false },
      { label: 'Diagnósticos Secundários', field_type: 'textarea', placeholder: 'Comorbidades e diagnósticos associados', is_required: false },
      { label: 'Sintomas Atuais', field_type: 'textarea', placeholder: 'Descreva os sintomas apresentados', is_required: true },
      { label: 'Escalas Psiquiátricas Aplicadas', field_type: 'textarea', placeholder: 'Ex: HAM-D: 18, BAI: 25', is_required: false },
      { label: 'Gravidade do Quadro', field_type: 'select', options: ['Leve', 'Moderado', 'Grave', 'Grave com sintomas psicóticos', 'Em remissão'], is_required: false },
    ],
  },
  {
    name: 'Prescrição Medicamentosa',
    type: 'psychiatric_prescription',
    description: 'Registro de medicação psiquiátrica prescrita',
    fields: [
      { label: 'Medicação Prescrita', field_type: 'text', placeholder: 'Nome do medicamento', is_required: true },
      { label: 'Dosagem', field_type: 'text', placeholder: 'Ex: 50mg', is_required: true },
      { label: 'Posologia', field_type: 'text', placeholder: 'Ex: 1x ao dia, pela manhã', is_required: true },
      { label: 'Classe do Medicamento', field_type: 'select', options: ['Antidepressivo', 'Ansiolítico', 'Antipsicótico', 'Estabilizador de Humor', 'Hipnótico', 'Psicoestimulante', 'Outro'], is_required: false },
      { label: 'Duração do Tratamento', field_type: 'text', placeholder: 'Ex: 30 dias, uso contínuo', is_required: false },
      { label: 'Orientações ao Paciente', field_type: 'textarea', placeholder: 'Instruções especiais sobre o uso', is_required: false },
    ],
  },
  {
    name: 'Evolução de Sintomas',
    type: 'symptom_evolution',
    description: 'Acompanhamento da evolução dos sintomas psiquiátricos',
    fields: [
      { label: 'Sintomas Relatados', field_type: 'textarea', placeholder: 'Sintomas referidos pelo paciente', is_required: true },
      { label: 'Sintomas Observados', field_type: 'textarea', placeholder: 'Sintomas observados durante a consulta', is_required: false },
      { label: 'Comparação com Consulta Anterior', field_type: 'select', options: ['Melhora significativa', 'Melhora parcial', 'Estável', 'Piora parcial', 'Piora significativa'], is_required: false },
      { label: 'Efeitos Colaterais', field_type: 'textarea', placeholder: 'Efeitos adversos relatados', is_required: false },
      { label: 'Adesão ao Tratamento', field_type: 'select', options: ['Boa', 'Regular', 'Irregular', 'Abandonou'], is_required: false },
      { label: 'Evolução do Quadro', field_type: 'textarea', placeholder: 'Resumo da evolução clínica', is_required: true },
    ],
  },
  {
    name: 'Histórico de Medicamentos',
    type: 'medication_history',
    description: 'Registro do histórico de medicações utilizadas',
    fields: [
      { label: 'Medicamento', field_type: 'text', placeholder: 'Nome do medicamento', is_required: true },
      { label: 'Período de Uso', field_type: 'text', placeholder: 'Ex: Jan/2023 a Jun/2023', is_required: false },
      { label: 'Dose Máxima Utilizada', field_type: 'text', placeholder: 'Ex: 100mg/dia', is_required: false },
      { label: 'Motivo da Suspensão', field_type: 'select', options: ['Melhora clínica', 'Ineficácia', 'Efeitos colaterais', 'Decisão do paciente', 'Troca de medicação', 'Outro'], is_required: false },
      { label: 'Efeitos Colaterais Apresentados', field_type: 'textarea', placeholder: 'Descreva os efeitos adversos', is_required: false },
      { label: 'Resposta ao Tratamento', field_type: 'select', options: ['Excelente', 'Boa', 'Parcial', 'Sem resposta', 'Piora'], is_required: false },
    ],
  },
];

// Campos padrão para Nutrição
const NUTRITION_TEMPLATES: DefaultTemplate[] = [
  {
    name: 'Avaliação Nutricional',
    type: 'nutritional_assessment',
    description: 'Avaliação nutricional completa do paciente',
    fields: [
      { label: 'Peso (kg)', field_type: 'number', placeholder: 'Ex: 70.5', is_required: true },
      { label: 'Altura (cm)', field_type: 'number', placeholder: 'Ex: 170', is_required: true },
      { label: 'IMC (calculado)', field_type: 'text', placeholder: 'Será calculado automaticamente', is_required: false },
      { label: 'Classificação do IMC', field_type: 'select', options: ['Baixo peso', 'Eutrófico', 'Sobrepeso', 'Obesidade Grau I', 'Obesidade Grau II', 'Obesidade Grau III'], is_required: false },
      { label: 'Objetivo Nutricional', field_type: 'select', options: ['Emagrecimento', 'Ganho de massa muscular', 'Manutenção de peso', 'Reeducação alimentar', 'Controle de patologia', 'Performance esportiva', 'Outro'], is_required: true },
      { label: 'Histórico Alimentar', field_type: 'textarea', placeholder: 'Descreva os hábitos alimentares do paciente', is_required: false },
      { label: 'Restrições Alimentares', field_type: 'textarea', placeholder: 'Alergias, intolerâncias, preferências', is_required: false },
      { label: 'Patologias Relacionadas', field_type: 'textarea', placeholder: 'Diabetes, hipertensão, dislipidemia, etc.', is_required: false },
    ],
  },
  {
    name: 'Medidas Antropométricas',
    type: 'body_measurements',
    description: 'Registro de circunferências e composição corporal',
    fields: [
      { label: 'Peso (kg)', field_type: 'number', placeholder: 'Ex: 70.5', is_required: true },
      { label: 'Circunferência do Braço (cm)', field_type: 'number', placeholder: 'Ex: 30', is_required: false },
      { label: 'Circunferência do Tórax (cm)', field_type: 'number', placeholder: 'Ex: 95', is_required: false },
      { label: 'Circunferência da Cintura (cm)', field_type: 'number', placeholder: 'Ex: 80', is_required: true },
      { label: 'Circunferência do Quadril (cm)', field_type: 'number', placeholder: 'Ex: 100', is_required: true },
      { label: 'Circunferência da Coxa (cm)', field_type: 'number', placeholder: 'Ex: 55', is_required: false },
      { label: 'Circunferência da Panturrilha (cm)', field_type: 'number', placeholder: 'Ex: 36', is_required: false },
      { label: 'Percentual de Gordura (%)', field_type: 'number', placeholder: 'Ex: 25', is_required: false },
      { label: 'Massa Magra (kg)', field_type: 'number', placeholder: 'Ex: 52', is_required: false },
      { label: 'Método de Avaliação', field_type: 'select', options: ['Bioimpedância', 'Adipômetro', 'DEXA', 'Circunferências', 'Outro'], is_required: false },
    ],
  },
  {
    name: 'Plano Alimentar',
    type: 'meal_plan',
    description: 'Prescrição do plano alimentar e substituições',
    fields: [
      { label: 'Valor Energético Total (kcal)', field_type: 'number', placeholder: 'Ex: 1800', is_required: true },
      { label: 'Distribuição de Macronutrientes', field_type: 'textarea', placeholder: 'Carboidratos: 50%, Proteínas: 25%, Lipídios: 25%', is_required: false },
      { label: 'Café da Manhã', field_type: 'textarea', placeholder: 'Descreva as opções para o café da manhã', is_required: true },
      { label: 'Lanche da Manhã', field_type: 'textarea', placeholder: 'Descreva as opções para o lanche', is_required: false },
      { label: 'Almoço', field_type: 'textarea', placeholder: 'Descreva as opções para o almoço', is_required: true },
      { label: 'Lanche da Tarde', field_type: 'textarea', placeholder: 'Descreva as opções para o lanche', is_required: false },
      { label: 'Jantar', field_type: 'textarea', placeholder: 'Descreva as opções para o jantar', is_required: true },
      { label: 'Ceia', field_type: 'textarea', placeholder: 'Descreva as opções para a ceia', is_required: false },
      { label: 'Lista de Substituições', field_type: 'textarea', placeholder: 'Equivalências e substituições permitidas', is_required: false },
      { label: 'Suplementação', field_type: 'textarea', placeholder: 'Suplementos prescritos, se houver', is_required: false },
      { label: 'Orientações Gerais', field_type: 'textarea', placeholder: 'Recomendações adicionais para o paciente', is_required: false },
    ],
  },
  {
    name: 'Evolução Nutricional',
    type: 'nutritional_evolution',
    description: 'Acompanhamento da evolução do paciente',
    fields: [
      { label: 'Peso Atual (kg)', field_type: 'number', placeholder: 'Ex: 68', is_required: true },
      { label: 'Variação de Peso', field_type: 'text', placeholder: 'Ex: -2.5 kg', is_required: false },
      { label: 'Adesão ao Plano', field_type: 'select', options: ['Excelente', 'Boa', 'Regular', 'Baixa', 'Não seguiu'], is_required: true },
      { label: 'Dificuldades Relatadas', field_type: 'textarea', placeholder: 'Obstáculos enfrentados pelo paciente', is_required: false },
      { label: 'Sintomas Gastrointestinais', field_type: 'multiselect', options: ['Nenhum', 'Constipação', 'Diarreia', 'Distensão', 'Gases', 'Náusea', 'Azia', 'Outro'], is_required: false },
      { label: 'Nível de Energia', field_type: 'select', options: ['Muito melhor', 'Melhor', 'Igual', 'Pior', 'Muito pior'], is_required: false },
      { label: 'Qualidade do Sono', field_type: 'select', options: ['Excelente', 'Boa', 'Regular', 'Ruim', 'Muito ruim'], is_required: false },
      { label: 'Evolução Clínica', field_type: 'textarea', placeholder: 'Resumo da evolução do paciente', is_required: true },
      { label: 'Ajustes no Plano', field_type: 'textarea', placeholder: 'Modificações realizadas no plano alimentar', is_required: false },
      { label: 'Próximos Objetivos', field_type: 'textarea', placeholder: 'Metas para o próximo período', is_required: false },
    ],
  },
];

// Campos padrão para Estética / Harmonização
const AESTHETICS_TEMPLATES: DefaultTemplate[] = [
  {
    name: 'Avaliação Estética',
    type: 'aesthetic_assessment',
    description: 'Avaliação inicial para procedimentos estéticos',
    fields: [
      { label: 'Queixa Principal', field_type: 'textarea', placeholder: 'O que incomoda o paciente', is_required: true },
      { label: 'Expectativas do Paciente', field_type: 'textarea', placeholder: 'Qual resultado o paciente espera', is_required: true },
      { label: 'Tipo de Pele', field_type: 'select', options: ['I - Muito clara', 'II - Clara', 'III - Morena clara', 'IV - Morena', 'V - Morena escura', 'VI - Negra'], is_required: false },
      { label: 'Condições da Pele', field_type: 'multiselect', options: ['Normal', 'Oleosa', 'Seca', 'Mista', 'Sensível', 'Acneica', 'Envelhecida', 'Manchada', 'Flácida'], is_required: false },
      { label: 'Tratamentos Anteriores', field_type: 'textarea', placeholder: 'Procedimentos estéticos já realizados', is_required: false },
      { label: 'Uso de Medicamentos', field_type: 'textarea', placeholder: 'Medicamentos em uso (isotretinoína, anticoagulantes, etc.)', is_required: false },
      { label: 'Alergias Conhecidas', field_type: 'textarea', placeholder: 'Alergias a anestésicos, produtos, etc.', is_required: false },
      { label: 'Contraindicações Identificadas', field_type: 'textarea', placeholder: 'Gravidez, doenças autoimunes, etc.', is_required: false },
    ],
  },
  {
    name: 'Procedimento Estético',
    type: 'aesthetic_procedure',
    description: 'Registro detalhado do procedimento realizado',
    fields: [
      { label: 'Região Tratada', field_type: 'text', placeholder: 'Ex: Lábios, sulco nasogeniano, testa', is_required: true },
      { label: 'Procedimento Realizado', field_type: 'select', options: ['Toxina Botulínica', 'Preenchimento com Ácido Hialurônico', 'Bioestimulador de Colágeno', 'Fios de PDO', 'Peeling Químico', 'Microagulhamento', 'Laser', 'Luz Pulsada', 'Criolipólise', 'Radiofrequência', 'Skinbooster', 'Outro'], is_required: true },
      { label: 'Técnica Utilizada', field_type: 'text', placeholder: 'Descreva a técnica aplicada', is_required: false },
      { label: 'Anestesia Utilizada', field_type: 'text', placeholder: 'Tipo de anestesia (tópica, infiltrativa)', is_required: false },
      { label: 'Observações do Procedimento', field_type: 'textarea', placeholder: 'Detalhes técnicos e intercorrências', is_required: false },
    ],
  },
  {
    name: 'Produtos Utilizados',
    type: 'products_used',
    description: 'Registro dos produtos aplicados com rastreabilidade',
    fields: [
      { label: 'Produto Utilizado', field_type: 'text', placeholder: 'Nome comercial do produto', is_required: true },
      { label: 'Fabricante', field_type: 'text', placeholder: 'Laboratório fabricante', is_required: false },
      { label: 'Lote do Produto', field_type: 'text', placeholder: 'Número do lote', is_required: true },
      { label: 'Validade', field_type: 'date', placeholder: 'Data de validade', is_required: false },
      { label: 'Quantidade Aplicada', field_type: 'text', placeholder: 'Ex: 1ml, 50U', is_required: true },
      { label: 'Pontos de Aplicação', field_type: 'textarea', placeholder: 'Descreva os pontos onde foi aplicado', is_required: false },
      { label: 'Intercorrências', field_type: 'textarea', placeholder: 'Sangramento, hematoma, dor excessiva, etc.', is_required: false },
    ],
  },
  {
    name: 'Fotos Antes/Depois',
    type: 'before_after_photos',
    description: 'Documentação fotográfica do tratamento',
    fields: [
      { label: 'Tipo de Registro', field_type: 'select', options: ['Antes do procedimento', 'Imediatamente após', 'Retorno 7 dias', 'Retorno 15 dias', 'Retorno 30 dias', 'Retorno 90 dias', 'Resultado final'], is_required: true },
      { label: 'Região Fotografada', field_type: 'text', placeholder: 'Ex: Face frontal, perfil direito', is_required: true },
      { label: 'Observações da Imagem', field_type: 'textarea', placeholder: 'Notas sobre o registro fotográfico', is_required: false },
      { label: 'Consentimento para Uso de Imagem', field_type: 'select', options: ['Sim, autorizado', 'Não autorizado', 'Apenas para prontuário'], is_required: true },
    ],
  },
  {
    name: 'Termo de Consentimento',
    type: 'consent_form',
    description: 'Registro de termos de consentimento assinados',
    fields: [
      { label: 'Tipo de Termo', field_type: 'select', options: ['Consentimento para procedimento', 'Autorização de uso de imagem', 'Termo de ciência de riscos', 'Termo de responsabilidade', 'Outro'], is_required: true },
      { label: 'Procedimento Relacionado', field_type: 'text', placeholder: 'Qual procedimento o termo autoriza', is_required: true },
      { label: 'Riscos Informados', field_type: 'textarea', placeholder: 'Riscos explicados ao paciente', is_required: false },
      { label: 'Paciente Leu e Compreendeu', field_type: 'select', options: ['Sim', 'Não'], is_required: true },
      { label: 'Data da Assinatura', field_type: 'date', placeholder: 'Data em que o termo foi assinado', is_required: true },
      { label: 'Observações', field_type: 'textarea', placeholder: 'Anotações adicionais', is_required: false },
    ],
  },
];

// Campos padrão para Pediatria
const PEDIATRICS_TEMPLATES: DefaultTemplate[] = [
  {
    name: 'Anamnese Pediátrica',
    type: 'pediatric_anamnesis',
    description: 'Anamnese completa para atendimento pediátrico',
    fields: [
      { label: 'Queixa Principal (Responsável)', field_type: 'textarea', placeholder: 'O que o responsável relata', is_required: true },
      { label: 'História da Doença Atual', field_type: 'textarea', placeholder: 'Evolução dos sintomas', is_required: true },
      { label: 'Antecedentes Patológicos', field_type: 'textarea', placeholder: 'Internações, cirurgias, doenças prévias', is_required: false },
      { label: 'Antecedentes Familiares', field_type: 'textarea', placeholder: 'Doenças na família', is_required: false },
      { label: 'Alergias', field_type: 'textarea', placeholder: 'Alergias alimentares, medicamentosas, etc.', is_required: false },
      { label: 'Medicamentos em Uso', field_type: 'textarea', placeholder: 'Medicamentos atuais', is_required: false },
      { label: 'Alimentação', field_type: 'textarea', placeholder: 'Tipo de alimentação (aleitamento, fórmula, alimentação complementar)', is_required: false },
    ],
  },
  {
    name: 'História Gestacional',
    type: 'gestational_history',
    description: 'Registro de dados da gestação e parto',
    fields: [
      { label: 'Idade Gestacional ao Nascer', field_type: 'text', placeholder: 'Ex: 38 semanas', is_required: true },
      { label: 'Tipo de Parto', field_type: 'select', options: ['Normal', 'Cesárea eletiva', 'Cesárea de urgência', 'Fórceps', 'Vácuo'], is_required: true },
      { label: 'Peso ao Nascer (g)', field_type: 'number', placeholder: 'Ex: 3250', is_required: true },
      { label: 'Comprimento ao Nascer (cm)', field_type: 'number', placeholder: 'Ex: 49', is_required: false },
      { label: 'Perímetro Cefálico ao Nascer (cm)', field_type: 'number', placeholder: 'Ex: 34', is_required: false },
      { label: 'Apgar 1º/5º Minuto', field_type: 'text', placeholder: 'Ex: 8/9', is_required: false },
      { label: 'Intercorrências no Parto', field_type: 'textarea', placeholder: 'Complicações durante o parto', is_required: false },
      { label: 'Intercorrências Neonatais', field_type: 'textarea', placeholder: 'Icterícia, internação UTI, etc.', is_required: false },
      { label: 'Pré-Natal', field_type: 'select', options: ['Adequado (≥6 consultas)', 'Inadequado (<6 consultas)', 'Não realizou', 'Não sabe informar'], is_required: false },
    ],
  },
  {
    name: 'Dados de Crescimento',
    type: 'growth_data',
    description: 'Registro de peso, altura e perímetros',
    fields: [
      { label: 'Peso (kg)', field_type: 'number', placeholder: 'Ex: 12.5', is_required: true },
      { label: 'Altura/Comprimento (cm)', field_type: 'number', placeholder: 'Ex: 85', is_required: true },
      { label: 'Perímetro Cefálico (cm)', field_type: 'number', placeholder: 'Ex: 47', is_required: false },
      { label: 'Perímetro Torácico (cm)', field_type: 'number', placeholder: 'Ex: 50', is_required: false },
      { label: 'IMC (calculado)', field_type: 'text', placeholder: 'Será calculado automaticamente', is_required: false },
      { label: 'Classificação Nutricional', field_type: 'select', options: ['Magreza acentuada', 'Magreza', 'Eutrofia', 'Risco de sobrepeso', 'Sobrepeso', 'Obesidade'], is_required: false },
    ],
  },
  {
    name: 'Curva de Crescimento',
    type: 'growth_curve',
    description: 'Acompanhamento em percentis/z-score',
    fields: [
      { label: 'Idade na Avaliação', field_type: 'text', placeholder: 'Ex: 2 anos e 3 meses', is_required: true },
      { label: 'Peso/Idade (Percentil)', field_type: 'select', options: ['< P3', 'P3-P10', 'P10-P25', 'P25-P50', 'P50-P75', 'P75-P90', 'P90-P97', '> P97'], is_required: false },
      { label: 'Altura/Idade (Percentil)', field_type: 'select', options: ['< P3', 'P3-P10', 'P10-P25', 'P25-P50', 'P50-P75', 'P75-P90', 'P90-P97', '> P97'], is_required: false },
      { label: 'IMC/Idade (Percentil)', field_type: 'select', options: ['< P3', 'P3-P10', 'P10-P25', 'P25-P50', 'P50-P75', 'P75-P85', 'P85-P97', '> P97'], is_required: false },
      { label: 'PC/Idade (Percentil)', field_type: 'select', options: ['< P3', 'P3-P10', 'P10-P50', 'P50-P90', 'P90-P97', '> P97'], is_required: false },
      { label: 'Interpretação', field_type: 'textarea', placeholder: 'Análise da curva de crescimento', is_required: false },
    ],
  },
  {
    name: 'Desenvolvimento Neuropsicomotor',
    type: 'neuropsychomotor_development',
    description: 'Avaliação do DNPM por faixa etária',
    fields: [
      { label: 'Idade na Avaliação', field_type: 'text', placeholder: 'Ex: 6 meses', is_required: true },
      { label: 'Motor Grosso', field_type: 'textarea', placeholder: 'Sustenta cabeça, senta, anda...', is_required: true },
      { label: 'Motor Fino', field_type: 'textarea', placeholder: 'Preensão, pinça, manipulação...', is_required: false },
      { label: 'Linguagem', field_type: 'textarea', placeholder: 'Balbucios, palavras, frases...', is_required: true },
      { label: 'Social/Adaptativo', field_type: 'textarea', placeholder: 'Sorriso social, interação, brincadeiras...', is_required: false },
      { label: 'Classificação do DNPM', field_type: 'select', options: ['Adequado para idade', 'Alerta para atraso', 'Provável atraso', 'Atraso confirmado'], is_required: true },
      { label: 'Observações', field_type: 'textarea', placeholder: 'Notas adicionais sobre o desenvolvimento', is_required: false },
    ],
  },
  {
    name: 'Controle de Vacinas',
    type: 'vaccines',
    description: 'Registro e acompanhamento vacinal',
    fields: [
      { label: 'Vacina Aplicada', field_type: 'text', placeholder: 'Nome da vacina', is_required: true },
      { label: 'Dose', field_type: 'select', options: ['1ª dose', '2ª dose', '3ª dose', 'Reforço', 'Dose única', 'Dose anual'], is_required: true },
      { label: 'Data de Aplicação', field_type: 'date', placeholder: 'Data da vacinação', is_required: true },
      { label: 'Lote', field_type: 'text', placeholder: 'Número do lote', is_required: false },
      { label: 'Local de Aplicação', field_type: 'text', placeholder: 'Ex: UBS, clínica particular', is_required: false },
      { label: 'Reações Adversas', field_type: 'textarea', placeholder: 'Febre, dor local, etc.', is_required: false },
      { label: 'Calendário Vacinal', field_type: 'select', options: ['Em dia', 'Atrasado', 'Incompleto', 'Não vacinado'], is_required: false },
    ],
  },
  {
    name: 'Evolução Pediátrica',
    type: 'pediatric_evolution',
    description: 'Registro de evolução e orientações',
    fields: [
      { label: 'Queixa dos Responsáveis', field_type: 'textarea', placeholder: 'O que os pais/responsáveis relatam nesta consulta', is_required: true },
      { label: 'Exame Físico', field_type: 'textarea', placeholder: 'Achados do exame físico', is_required: true },
      { label: 'Hipótese Diagnóstica', field_type: 'textarea', placeholder: 'Diagnóstico ou hipótese', is_required: false },
      { label: 'Conduta', field_type: 'textarea', placeholder: 'Tratamento prescrito', is_required: true },
      { label: 'Orientações aos Responsáveis', field_type: 'textarea', placeholder: 'Orientações sobre cuidados, alimentação, sinais de alerta', is_required: true },
      { label: 'Retorno', field_type: 'text', placeholder: 'Prazo para retorno', is_required: false },
    ],
  },
];

// Campos padrão para Cardiologia
const CARDIOLOGY_TEMPLATES: DefaultTemplate[] = [
  {
    name: 'Anamnese Cardiológica',
    type: 'cardio_anamnesis',
    description: 'Anamnese direcionada para avaliação cardiovascular',
    fields: [
      { label: 'Queixa Principal', field_type: 'textarea', placeholder: 'Dor torácica, dispneia, palpitações...', is_required: true },
      { label: 'História da Doença Atual', field_type: 'textarea', placeholder: 'Descreva a evolução dos sintomas', is_required: true },
      { label: 'Histórico Cardiovascular', field_type: 'textarea', placeholder: 'IAM prévio, AVC, revascularização, angioplastia...', is_required: false },
      { label: 'Antecedentes Familiares Cardiovasculares', field_type: 'textarea', placeholder: 'Doença coronariana, morte súbita, AVC em familiares', is_required: false },
      { label: 'Medicamentos em Uso', field_type: 'textarea', placeholder: 'Anti-hipertensivos, anticoagulantes, estatinas...', is_required: false },
      { label: 'Alergias', field_type: 'textarea', placeholder: 'Alergias a medicamentos, contrastes...', is_required: false },
    ],
  },
  {
    name: 'Sinais Vitais Cardiológicos',
    type: 'cardio_vital_signs',
    description: 'Registro de PA, FC e parâmetros cardiovasculares',
    fields: [
      { label: 'Pressão Arterial Sistólica (mmHg)', field_type: 'number', placeholder: 'Ex: 120', is_required: true },
      { label: 'Pressão Arterial Diastólica (mmHg)', field_type: 'number', placeholder: 'Ex: 80', is_required: true },
      { label: 'Frequência Cardíaca (bpm)', field_type: 'number', placeholder: 'Ex: 72', is_required: true },
      { label: 'Ritmo Cardíaco', field_type: 'select', options: ['Regular', 'Irregular', 'Fibrilação atrial', 'Flutter atrial', 'Arritmia sinusal', 'Outro'], is_required: false },
      { label: 'Saturação O2 (%)', field_type: 'number', placeholder: 'Ex: 98', is_required: false },
      { label: 'Peso (kg)', field_type: 'number', placeholder: 'Ex: 75', is_required: false },
      { label: 'Circunferência Abdominal (cm)', field_type: 'number', placeholder: 'Ex: 92', is_required: false },
      { label: 'Ausculta Cardíaca', field_type: 'textarea', placeholder: 'Bulhas, sopros, ritmo...', is_required: false },
      { label: 'Edema', field_type: 'select', options: ['Ausente', '+/4+', '++/4+', '+++/4+', '++++/4+'], is_required: false },
    ],
  },
  {
    name: 'Fatores de Risco Cardiovascular',
    type: 'cardio_risk_factors',
    description: 'Avaliação de fatores de risco para doença cardiovascular',
    fields: [
      { label: 'Hipertensão Arterial', field_type: 'select', options: ['Não', 'Sim - controlada', 'Sim - não controlada', 'Pré-hipertensão'], is_required: true },
      { label: 'Diabetes Mellitus', field_type: 'select', options: ['Não', 'Sim - Tipo 1', 'Sim - Tipo 2', 'Pré-diabetes'], is_required: true },
      { label: 'Dislipidemia', field_type: 'select', options: ['Não', 'Sim - em tratamento', 'Sim - sem tratamento'], is_required: true },
      { label: 'Tabagismo', field_type: 'select', options: ['Nunca fumou', 'Ex-tabagista', 'Tabagista ativo'], is_required: true },
      { label: 'Carga Tabágica (maços/ano)', field_type: 'number', placeholder: 'Ex: 20', is_required: false },
      { label: 'Obesidade', field_type: 'select', options: ['Não', 'Sobrepeso', 'Obesidade Grau I', 'Obesidade Grau II', 'Obesidade Grau III'], is_required: false },
      { label: 'Sedentarismo', field_type: 'select', options: ['Não', 'Sim'], is_required: false },
      { label: 'Estresse/Fatores Psicossociais', field_type: 'select', options: ['Ausente', 'Leve', 'Moderado', 'Intenso'], is_required: false },
      { label: 'Escore de Risco', field_type: 'text', placeholder: 'Ex: Framingham, SCORE, etc.', is_required: false },
      { label: 'Classificação de Risco', field_type: 'select', options: ['Baixo', 'Intermediário', 'Alto', 'Muito alto'], is_required: false },
    ],
  },
  {
    name: 'Exames Cardiológicos',
    type: 'cardio_exams',
    description: 'Registro e interpretação de exames cardiovasculares',
    fields: [
      { label: 'Tipo de Exame', field_type: 'select', options: ['ECG de repouso', 'Teste ergométrico', 'Holter 24h', 'MAPA 24h', 'Ecocardiograma', 'Cintilografia miocárdica', 'Angiotomografia coronariana', 'Cateterismo cardíaco', 'Ressonância cardíaca', 'Outro'], is_required: true },
      { label: 'Data do Exame', field_type: 'date', placeholder: 'Data de realização', is_required: true },
      { label: 'Resultado/Laudo', field_type: 'textarea', placeholder: 'Descrição dos achados', is_required: true },
      { label: 'Fração de Ejeção (%)', field_type: 'number', placeholder: 'Ex: 60', is_required: false },
      { label: 'Alterações Encontradas', field_type: 'textarea', placeholder: 'Alterações relevantes identificadas', is_required: false },
      { label: 'Conclusão', field_type: 'textarea', placeholder: 'Interpretação clínica', is_required: false },
    ],
  },
  {
    name: 'Diagnóstico Cardiológico',
    type: 'cardio_diagnosis',
    description: 'Registro de diagnósticos cardiovasculares',
    fields: [
      { label: 'Diagnóstico Principal', field_type: 'textarea', placeholder: 'Diagnóstico cardiológico principal', is_required: true },
      { label: 'Código CID-10', field_type: 'text', placeholder: 'Ex: I25.1', is_required: false },
      { label: 'Diagnósticos Secundários', field_type: 'textarea', placeholder: 'Comorbidades cardiovasculares', is_required: false },
      { label: 'Classificação Funcional (NYHA)', field_type: 'select', options: ['Classe I', 'Classe II', 'Classe III', 'Classe IV'], is_required: false },
      { label: 'Estadiamento (ACC/AHA)', field_type: 'select', options: ['Estágio A', 'Estágio B', 'Estágio C', 'Estágio D'], is_required: false },
      { label: 'Observações', field_type: 'textarea', placeholder: 'Notas adicionais sobre o diagnóstico', is_required: false },
    ],
  },
  {
    name: 'Conduta Cardiológica',
    type: 'cardio_conduct',
    description: 'Plano terapêutico e orientações cardiológicas',
    fields: [
      { label: 'Conduta Farmacológica', field_type: 'textarea', placeholder: 'Medicamentos prescritos', is_required: true },
      { label: 'Orientações de Estilo de Vida', field_type: 'textarea', placeholder: 'Dieta, exercício, cessação tabágica...', is_required: false },
      { label: 'Exames Solicitados', field_type: 'textarea', placeholder: 'Exames complementares solicitados', is_required: false },
      { label: 'Encaminhamentos', field_type: 'textarea', placeholder: 'Outros especialistas, reabilitação cardíaca...', is_required: false },
      { label: 'Metas Terapêuticas', field_type: 'textarea', placeholder: 'Alvos de PA, FC, LDL, HbA1c...', is_required: false },
      { label: 'Retorno', field_type: 'text', placeholder: 'Prazo para retorno', is_required: false },
    ],
  },
  {
    name: 'Evolução Cardiológica',
    type: 'cardio_evolution',
    description: 'Acompanhamento da evolução cardiovascular',
    fields: [
      { label: 'Sintomas Atuais', field_type: 'textarea', placeholder: 'Sintomas cardiovasculares presentes', is_required: true },
      { label: 'Comparação com Consulta Anterior', field_type: 'select', options: ['Melhora significativa', 'Melhora parcial', 'Estável', 'Piora parcial', 'Piora significativa'], is_required: false },
      { label: 'Adesão ao Tratamento', field_type: 'select', options: ['Excelente', 'Boa', 'Regular', 'Baixa', 'Não aderente'], is_required: false },
      { label: 'Efeitos Colaterais', field_type: 'textarea', placeholder: 'Reações adversas aos medicamentos', is_required: false },
      { label: 'PA Domiciliar (média)', field_type: 'text', placeholder: 'Ex: 130x85 mmHg', is_required: false },
      { label: 'Evolução Clínica', field_type: 'textarea', placeholder: 'Resumo da evolução do paciente', is_required: true },
      { label: 'Ajustes no Tratamento', field_type: 'textarea', placeholder: 'Modificações realizadas', is_required: false },
    ],
  },
];

// Campos padrão para Fisioterapia
const PHYSIOTHERAPY_TEMPLATES: DefaultTemplate[] = [
  {
    name: 'Avaliação Funcional',
    type: 'functional_assessment',
    description: 'Avaliação fisioterapêutica inicial',
    fields: [
      { label: 'Diagnóstico Clínico', field_type: 'text', placeholder: 'Diagnóstico médico de encaminhamento', is_required: true },
      { label: 'Diagnóstico Fisioterapêutico', field_type: 'textarea', placeholder: 'Diagnóstico cinético-funcional', is_required: true },
      { label: 'Histórico da Lesão/Patologia', field_type: 'textarea', placeholder: 'Como ocorreu, tempo de evolução', is_required: false },
      { label: 'Tratamentos Anteriores', field_type: 'textarea', placeholder: 'Fisioterapia prévia, cirurgias', is_required: false },
      { label: 'Medicamentos em Uso', field_type: 'textarea', placeholder: 'Analgésicos, anti-inflamatórios', is_required: false },
      { label: 'Exames de Imagem', field_type: 'textarea', placeholder: 'RX, RNM, TC - achados relevantes', is_required: false },
      { label: 'Avaliação Postural', field_type: 'textarea', placeholder: 'Alterações posturais observadas', is_required: false },
      { label: 'Palpação', field_type: 'textarea', placeholder: 'Pontos dolorosos, tensões, contraturas', is_required: false },
      { label: 'Testes Especiais', field_type: 'textarea', placeholder: 'Testes ortopédicos realizados e resultados', is_required: false },
    ],
  },
  {
    name: 'Queixa Principal',
    type: 'chief_complaint',
    description: 'Registro da queixa e expectativas do paciente',
    fields: [
      { label: 'Queixa Principal', field_type: 'textarea', placeholder: 'O que o paciente relata como principal problema', is_required: true },
      { label: 'Localização', field_type: 'text', placeholder: 'Região anatômica afetada', is_required: true },
      { label: 'Fatores de Piora', field_type: 'textarea', placeholder: 'O que agrava os sintomas', is_required: false },
      { label: 'Fatores de Melhora', field_type: 'textarea', placeholder: 'O que alivia os sintomas', is_required: false },
      { label: 'Impacto nas AVDs', field_type: 'textarea', placeholder: 'Como afeta as atividades diárias', is_required: false },
      { label: 'Objetivos do Paciente', field_type: 'textarea', placeholder: 'O que o paciente espera do tratamento', is_required: false },
    ],
  },
  {
    name: 'Escala de Dor',
    type: 'pain_scale',
    description: 'Avaliação da dor do paciente',
    fields: [
      { label: 'Intensidade da Dor (EVA 0-10)', field_type: 'select', options: ['0 - Sem dor', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10 - Dor máxima'], is_required: true },
      { label: 'Tipo de Dor', field_type: 'multiselect', options: ['Aguda', 'Crônica', 'Pontada', 'Queimação', 'Latejante', 'Pressão', 'Irradiada', 'Localizada', 'Constante', 'Intermitente'], is_required: false },
      { label: 'Localização da Dor', field_type: 'text', placeholder: 'Região anatômica', is_required: true },
      { label: 'Irradiação', field_type: 'text', placeholder: 'Para onde a dor irradia', is_required: false },
      { label: 'Frequência', field_type: 'select', options: ['Constante', 'Várias vezes ao dia', 'Uma vez ao dia', 'Alguns dias da semana', 'Esporádica'], is_required: false },
      { label: 'Dor Noturna', field_type: 'select', options: ['Não', 'Às vezes', 'Frequente', 'Sempre'], is_required: false },
      { label: 'Observações', field_type: 'textarea', placeholder: 'Notas adicionais sobre a dor', is_required: false },
    ],
  },
  {
    name: 'Amplitude de Movimento',
    type: 'range_of_motion',
    description: 'Registro de goniometria e ADM',
    fields: [
      { label: 'Articulação Avaliada', field_type: 'text', placeholder: 'Ex: Ombro direito, Joelho esquerdo', is_required: true },
      { label: 'Movimento', field_type: 'text', placeholder: 'Ex: Flexão, Extensão, Abdução', is_required: true },
      { label: 'ADM Ativa (graus)', field_type: 'text', placeholder: 'Ex: 120°', is_required: true },
      { label: 'ADM Passiva (graus)', field_type: 'text', placeholder: 'Ex: 140°', is_required: false },
      { label: 'ADM Normal Esperada', field_type: 'text', placeholder: 'Ex: 180°', is_required: false },
      { label: 'Limitação (%)', field_type: 'text', placeholder: 'Percentual de limitação', is_required: false },
      { label: 'Sensação Final', field_type: 'select', options: ['Firme (normal)', 'Macia', 'Dura', 'Vazia', 'Espasmo'], is_required: false },
      { label: 'Dor Durante Movimento', field_type: 'select', options: ['Ausente', 'No início', 'No meio', 'No final', 'Durante todo arco'], is_required: false },
    ],
  },
  {
    name: 'Plano Fisioterapêutico',
    type: 'physio_therapeutic_plan',
    description: 'Planejamento do tratamento fisioterapêutico',
    fields: [
      { label: 'Objetivos de Curto Prazo', field_type: 'textarea', placeholder: 'Metas para as primeiras sessões', is_required: true },
      { label: 'Objetivos de Longo Prazo', field_type: 'textarea', placeholder: 'Metas finais do tratamento', is_required: true },
      { label: 'Recursos Terapêuticos', field_type: 'multiselect', options: ['Cinesioterapia', 'Eletroterapia', 'Termoterapia', 'Crioterapia', 'Terapia manual', 'Hidroterapia', 'Laserterapia', 'Ultrassom', 'TENS', 'Corrente russa', 'Bandagem', 'Dry needling'], is_required: true },
      { label: 'Frequência das Sessões', field_type: 'select', options: ['1x por semana', '2x por semana', '3x por semana', '4x por semana', '5x por semana', 'Diário'], is_required: false },
      { label: 'Duração Estimada', field_type: 'text', placeholder: 'Ex: 10 sessões, 2 meses', is_required: false },
      { label: 'Orientações Domiciliares', field_type: 'textarea', placeholder: 'Exercícios e cuidados para casa', is_required: false },
      { label: 'Precauções e Contraindicações', field_type: 'textarea', placeholder: 'Cuidados especiais durante o tratamento', is_required: false },
    ],
  },
  {
    name: 'Exercícios Aplicados',
    type: 'applied_exercises',
    description: 'Registro de exercícios realizados na sessão',
    fields: [
      { label: 'Exercício', field_type: 'text', placeholder: 'Nome do exercício', is_required: true },
      { label: 'Objetivo do Exercício', field_type: 'text', placeholder: 'Fortalecimento, alongamento, propriocepção...', is_required: false },
      { label: 'Séries', field_type: 'number', placeholder: 'Ex: 3', is_required: false },
      { label: 'Repetições', field_type: 'number', placeholder: 'Ex: 10', is_required: false },
      { label: 'Tempo/Sustentação', field_type: 'text', placeholder: 'Ex: 30 segundos', is_required: false },
      { label: 'Carga/Resistência', field_type: 'text', placeholder: 'Ex: 2kg, theraband amarela', is_required: false },
      { label: 'Resposta do Paciente', field_type: 'select', options: ['Realizou sem dificuldade', 'Realizou com dificuldade leve', 'Realizou com dificuldade moderada', 'Realizou com muita dificuldade', 'Não conseguiu realizar'], is_required: false },
      { label: 'Observações', field_type: 'textarea', placeholder: 'Compensações, ajustes necessários', is_required: false },
    ],
  },
  {
    name: 'Evolução por Sessão',
    type: 'session_evolution',
    description: 'Registro de evolução de cada atendimento',
    fields: [
      { label: 'Número da Sessão', field_type: 'number', placeholder: 'Ex: 5', is_required: true },
      { label: 'Queixa do Dia', field_type: 'textarea', placeholder: 'O que o paciente relata hoje', is_required: true },
      { label: 'Dor (EVA 0-10)', field_type: 'select', options: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'], is_required: true },
      { label: 'Condutas Realizadas', field_type: 'textarea', placeholder: 'Recursos e exercícios aplicados', is_required: true },
      { label: 'Resposta ao Tratamento', field_type: 'select', options: ['Melhora significativa', 'Melhora parcial', 'Sem alteração', 'Piora parcial', 'Piora significativa'], is_required: true },
      { label: 'Evolução Funcional', field_type: 'textarea', placeholder: 'Ganhos observados', is_required: false },
      { label: 'Intercorrências', field_type: 'textarea', placeholder: 'Eventos adversos, se houver', is_required: false },
      { label: 'Plano para Próxima Sessão', field_type: 'textarea', placeholder: 'Próximos passos do tratamento', is_required: false },
    ],
  },
];

// Campos padrão para Oftalmologia
const OPHTHALMOLOGY_TEMPLATES: DefaultTemplate[] = [
  {
    name: 'Anamnese Oftalmológica',
    type: 'ophthalmo_anamnesis',
    description: 'Anamnese direcionada para avaliação oftalmológica',
    fields: [
      { label: 'Queixa Principal', field_type: 'textarea', placeholder: 'Baixa visão, dor, vermelhidão...', is_required: true },
      { label: 'História da Doença Atual', field_type: 'textarea', placeholder: 'Evolução dos sintomas', is_required: true },
      { label: 'Antecedentes Oftalmológicos', field_type: 'textarea', placeholder: 'Cirurgias, trauma, doenças oculares prévias', is_required: false },
      { label: 'Uso de Óculos/Lentes', field_type: 'select', options: ['Não usa', 'Óculos para longe', 'Óculos para perto', 'Óculos multifocal', 'Lentes de contato', 'Óculos + lentes'], is_required: false },
      { label: 'Última Refração', field_type: 'text', placeholder: 'Data da última refração', is_required: false },
      { label: 'Doenças Sistêmicas', field_type: 'textarea', placeholder: 'Diabetes, hipertensão, doenças reumatológicas', is_required: false },
      { label: 'Medicamentos em Uso', field_type: 'textarea', placeholder: 'Colírios, medicamentos sistêmicos', is_required: false },
      { label: 'Alergias', field_type: 'textarea', placeholder: 'Alergias a colírios, medicamentos', is_required: false },
    ],
  },
  {
    name: 'Acuidade Visual',
    type: 'visual_acuity',
    description: 'Registro de acuidade visual OD e OE',
    fields: [
      { label: 'AV OD (sem correção)', field_type: 'text', placeholder: 'Ex: 20/40', is_required: true },
      { label: 'AV OE (sem correção)', field_type: 'text', placeholder: 'Ex: 20/30', is_required: true },
      { label: 'AV OD (com correção)', field_type: 'text', placeholder: 'Ex: 20/20', is_required: false },
      { label: 'AV OE (com correção)', field_type: 'text', placeholder: 'Ex: 20/20', is_required: false },
      { label: 'Refração OD', field_type: 'text', placeholder: 'Ex: -2.00 -0.50 x 180', is_required: false },
      { label: 'Refração OE', field_type: 'text', placeholder: 'Ex: -1.75 -0.75 x 175', is_required: false },
      { label: 'Adição (Perto)', field_type: 'text', placeholder: 'Ex: +2.00', is_required: false },
      { label: 'Tabela Utilizada', field_type: 'select', options: ['Snellen', 'LogMAR', 'ETDRS', 'Figuras', 'E de Snellen'], is_required: false },
    ],
  },
  {
    name: 'Pressão Intraocular',
    type: 'intraocular_pressure',
    description: 'Registro de PIO e tonometria',
    fields: [
      { label: 'PIO OD (mmHg)', field_type: 'number', placeholder: 'Ex: 14', is_required: true },
      { label: 'PIO OE (mmHg)', field_type: 'number', placeholder: 'Ex: 15', is_required: true },
      { label: 'Horário da Medida', field_type: 'text', placeholder: 'Ex: 10:30', is_required: false },
      { label: 'Método de Tonometria', field_type: 'select', options: ['Aplanação (Goldmann)', 'Tonômetro de sopro', 'Tono-Pen', 'iCare', 'Palpação', 'Outro'], is_required: false },
      { label: 'Paquimetria OD (µm)', field_type: 'number', placeholder: 'Ex: 545', is_required: false },
      { label: 'Paquimetria OE (µm)', field_type: 'number', placeholder: 'Ex: 540', is_required: false },
      { label: 'PIO Corrigida OD', field_type: 'number', placeholder: 'PIO ajustada pela paquimetria', is_required: false },
      { label: 'PIO Corrigida OE', field_type: 'number', placeholder: 'PIO ajustada pela paquimetria', is_required: false },
    ],
  },
  {
    name: 'Exame Oftalmológico',
    type: 'ophthalmo_exam',
    description: 'Biomicroscopia e fundoscopia',
    fields: [
      { label: 'Biomicroscopia OD', field_type: 'textarea', placeholder: 'Córnea, câmara anterior, íris, cristalino', is_required: true },
      { label: 'Biomicroscopia OE', field_type: 'textarea', placeholder: 'Córnea, câmara anterior, íris, cristalino', is_required: true },
      { label: 'Gonioscopia OD', field_type: 'text', placeholder: 'Classificação do ângulo', is_required: false },
      { label: 'Gonioscopia OE', field_type: 'text', placeholder: 'Classificação do ângulo', is_required: false },
      { label: 'Fundoscopia OD', field_type: 'textarea', placeholder: 'Disco óptico, mácula, vasos, retina', is_required: true },
      { label: 'Fundoscopia OE', field_type: 'textarea', placeholder: 'Disco óptico, mácula, vasos, retina', is_required: true },
      { label: 'Relação E/D OD', field_type: 'text', placeholder: 'Ex: 0.3', is_required: false },
      { label: 'Relação E/D OE', field_type: 'text', placeholder: 'Ex: 0.3', is_required: false },
      { label: 'Motilidade Ocular', field_type: 'select', options: ['Normal', 'Alterada - estrabismo', 'Alterada - paralisia', 'Alterada - nistagmo'], is_required: false },
      { label: 'Reflexos Pupilares', field_type: 'select', options: ['Normais', 'DPAR positivo', 'Midríase', 'Miose', 'Anisocoria'], is_required: false },
    ],
  },
  {
    name: 'Diagnóstico Oftalmológico',
    type: 'ophthalmo_diagnosis',
    description: 'Diagnóstico separado por olho',
    fields: [
      { label: 'Diagnóstico OD', field_type: 'textarea', placeholder: 'Diagnóstico do olho direito', is_required: true },
      { label: 'CID-10 OD', field_type: 'text', placeholder: 'Ex: H40.1', is_required: false },
      { label: 'Diagnóstico OE', field_type: 'textarea', placeholder: 'Diagnóstico do olho esquerdo', is_required: true },
      { label: 'CID-10 OE', field_type: 'text', placeholder: 'Ex: H26.0', is_required: false },
      { label: 'Diagnóstico AO (Ambos os olhos)', field_type: 'textarea', placeholder: 'Diagnósticos que afetam ambos os olhos', is_required: false },
      { label: 'Estadiamento/Gravidade', field_type: 'select', options: ['Inicial/Leve', 'Moderado', 'Avançado/Grave', 'Em acompanhamento'], is_required: false },
    ],
  },
  {
    name: 'Exames Complementares',
    type: 'ophthalmo_complementary_exams',
    description: 'Registro de exames oftalmológicos complementares',
    fields: [
      { label: 'Tipo de Exame', field_type: 'select', options: ['OCT Mácula', 'OCT Nervo Óptico', 'Campo Visual', 'Retinografia', 'Angiofluoresceinografia', 'Topografia de Córnea', 'Biometria', 'Microscopia Especular', 'Paquimetria', 'UBM', 'Ecografia ocular', 'Outro'], is_required: true },
      { label: 'Data do Exame', field_type: 'date', placeholder: 'Data de realização', is_required: true },
      { label: 'Resultado OD', field_type: 'textarea', placeholder: 'Achados do olho direito', is_required: false },
      { label: 'Resultado OE', field_type: 'textarea', placeholder: 'Achados do olho esquerdo', is_required: false },
      { label: 'Conclusão', field_type: 'textarea', placeholder: 'Interpretação clínica', is_required: false },
    ],
  },
  {
    name: 'Conduta Oftalmológica',
    type: 'ophthalmo_conduct',
    description: 'Prescrição e plano terapêutico',
    fields: [
      { label: 'Prescrição de Óculos', field_type: 'textarea', placeholder: 'Refração para óculos, se indicado', is_required: false },
      { label: 'Prescrição de Colírios', field_type: 'textarea', placeholder: 'Colírios prescritos e posologia', is_required: false },
      { label: 'Medicamentos Sistêmicos', field_type: 'textarea', placeholder: 'Se necessário', is_required: false },
      { label: 'Indicação Cirúrgica', field_type: 'select', options: ['Não indicada', 'Catarata', 'Glaucoma', 'Retina/Vítreo', 'Córnea', 'Plástica ocular', 'Refrativa', 'Outra'], is_required: false },
      { label: 'Exames Solicitados', field_type: 'textarea', placeholder: 'Exames complementares solicitados', is_required: false },
      { label: 'Orientações ao Paciente', field_type: 'textarea', placeholder: 'Cuidados, sinais de alerta', is_required: false },
      { label: 'Retorno', field_type: 'text', placeholder: 'Prazo para retorno', is_required: false },
    ],
  },
  {
    name: 'Evolução Oftalmológica',
    type: 'ophthalmo_evolution',
    description: 'Acompanhamento da evolução ocular',
    fields: [
      { label: 'Sintomas Atuais', field_type: 'textarea', placeholder: 'Queixas visuais atuais', is_required: true },
      { label: 'AV OD Atual', field_type: 'text', placeholder: 'Ex: 20/25', is_required: false },
      { label: 'AV OE Atual', field_type: 'text', placeholder: 'Ex: 20/30', is_required: false },
      { label: 'PIO OD Atual', field_type: 'number', placeholder: 'mmHg', is_required: false },
      { label: 'PIO OE Atual', field_type: 'number', placeholder: 'mmHg', is_required: false },
      { label: 'Comparação com Consulta Anterior', field_type: 'select', options: ['Melhora', 'Estável', 'Piora', 'Primeira consulta'], is_required: false },
      { label: 'Adesão ao Tratamento', field_type: 'select', options: ['Boa', 'Regular', 'Irregular', 'Não aderente'], is_required: false },
      { label: 'Evolução Clínica', field_type: 'textarea', placeholder: 'Resumo da evolução', is_required: true },
      { label: 'Ajustes no Tratamento', field_type: 'textarea', placeholder: 'Modificações realizadas', is_required: false },
    ],
  },
];

// Campos padrão para Templates Personalizados
const CUSTOM_TEMPLATES: DefaultTemplate[] = [
  {
    name: 'Bloco Personalizado',
    type: 'custom_block',
    description: 'Bloco genérico para registros personalizados da clínica',
    fields: [
      { label: 'Título', field_type: 'text', placeholder: 'Título do registro', is_required: true },
      { label: 'Descrição', field_type: 'textarea', placeholder: 'Descrição detalhada', is_required: false },
      { label: 'Observações', field_type: 'textarea', placeholder: 'Observações adicionais', is_required: false },
      { label: 'Data de Referência', field_type: 'date', placeholder: 'Data relacionada', is_required: false },
    ],
  },
  {
    name: 'Formulário Personalizado',
    type: 'custom_form',
    description: 'Formulário flexível para coleta de dados específicos',
    fields: [
      { label: 'Campo 1', field_type: 'text', placeholder: 'Preencha conforme necessário', is_required: false },
      { label: 'Campo 2', field_type: 'text', placeholder: 'Preencha conforme necessário', is_required: false },
      { label: 'Campo 3', field_type: 'textarea', placeholder: 'Descrição ou texto longo', is_required: false },
      { label: 'Opção', field_type: 'select', options: ['Opção 1', 'Opção 2', 'Opção 3', 'Outro'], is_required: false },
      { label: 'Notas', field_type: 'textarea', placeholder: 'Notas adicionais', is_required: false },
    ],
  },
  {
    name: 'Checklist Personalizado',
    type: 'custom_checklist',
    description: 'Lista de verificação para procedimentos ou rotinas',
    fields: [
      { label: 'Nome do Checklist', field_type: 'text', placeholder: 'Identificação da lista', is_required: true },
      { label: 'Item 1', field_type: 'select', options: ['Não verificado', 'OK', 'Pendente', 'N/A'], is_required: false },
      { label: 'Item 2', field_type: 'select', options: ['Não verificado', 'OK', 'Pendente', 'N/A'], is_required: false },
      { label: 'Item 3', field_type: 'select', options: ['Não verificado', 'OK', 'Pendente', 'N/A'], is_required: false },
      { label: 'Item 4', field_type: 'select', options: ['Não verificado', 'OK', 'Pendente', 'N/A'], is_required: false },
      { label: 'Item 5', field_type: 'select', options: ['Não verificado', 'OK', 'Pendente', 'N/A'], is_required: false },
      { label: 'Observações', field_type: 'textarea', placeholder: 'Comentários sobre os itens', is_required: false },
      { label: 'Responsável', field_type: 'text', placeholder: 'Quem preencheu', is_required: false },
    ],
  },
  {
    name: 'Anotações Personalizadas',
    type: 'custom_notes',
    description: 'Anotações livres para registros diversos',
    fields: [
      { label: 'Assunto', field_type: 'text', placeholder: 'Tema da anotação', is_required: true },
      { label: 'Categoria', field_type: 'select', options: ['Observação clínica', 'Lembrete', 'Acompanhamento', 'Comunicação', 'Administrativo', 'Outro'], is_required: false },
      { label: 'Prioridade', field_type: 'select', options: ['Baixa', 'Normal', 'Alta', 'Urgente'], is_required: false },
      { label: 'Conteúdo', field_type: 'textarea', placeholder: 'Escreva sua anotação aqui', is_required: true },
      { label: 'Ação Necessária', field_type: 'textarea', placeholder: 'O que precisa ser feito', is_required: false },
      { label: 'Prazo', field_type: 'date', placeholder: 'Data limite, se aplicável', is_required: false },
    ],
  },
];

// Combina todos os templates padrão
const ALL_DEFAULT_TEMPLATES: DefaultTemplate[] = [
  ...GENERAL_MEDICINE_TEMPLATES,
  ...DENTISTRY_TEMPLATES,
  ...PSYCHOLOGY_TEMPLATES,
  ...PSYCHIATRY_TEMPLATES,
  ...NUTRITION_TEMPLATES,
  ...AESTHETICS_TEMPLATES,
  ...PEDIATRICS_TEMPLATES,
  ...CARDIOLOGY_TEMPLATES,
  ...PHYSIOTHERAPY_TEMPLATES,
  ...OPHTHALMOLOGY_TEMPLATES,
  ...CUSTOM_TEMPLATES,
];

export function useDefaultTemplates() {
  const { clinic } = useClinicData();
  const [importing, setImporting] = useState(false);

  const importDefaultTemplates = useCallback(async (): Promise<boolean> => {
    if (!clinic?.id) {
      toast.error('Clínica não encontrada');
      return false;
    }

    setImporting(true);
    let successCount = 0;

    try {
      for (const template of ALL_DEFAULT_TEMPLATES) {
        // Check if template with same name and type already exists
        const { data: existing } = await supabase
          .from('medical_record_templates')
          .select('id')
          .eq('clinic_id', clinic.id)
          .eq('type', template.type)
          .eq('name', template.name)
          .maybeSingle();

        if (existing) {
          // Template already exists, skip
          continue;
        }

        // Create template
        const { data: newTemplate, error: templateError } = await supabase
          .from('medical_record_templates')
          .insert({
            clinic_id: clinic.id,
            name: template.name,
            type: template.type,
            description: template.description,
            scope: 'system',
            is_default: true,
            is_active: true,
            is_system: false,
          })
          .select()
          .single();

        if (templateError) {
          console.error('Error creating template:', templateError);
          continue;
        }

        // Create fields
        const fieldsToInsert = template.fields.map((field, index) => ({
          template_id: newTemplate.id,
          label: field.label,
          field_type: field.field_type,
          placeholder: field.placeholder || null,
          options: field.options ? (field.options as unknown as Json) : null,
          is_required: field.is_required,
          field_order: index + 1,
        }));

        const { error: fieldsError } = await supabase
          .from('medical_record_fields')
          .insert(fieldsToInsert);

        if (fieldsError) {
          console.error('Error creating fields:', fieldsError);
          // Rollback template
          await supabase.from('medical_record_templates').delete().eq('id', newTemplate.id);
          continue;
        }

        successCount++;
      }

      if (successCount > 0) {
        toast.success(`${successCount} modelo(s) importado(s) com sucesso!`);
        return true;
      } else {
        toast.info('Todos os modelos já existem ou nenhum foi importado.');
        return false;
      }
    } catch (err) {
      console.error('Error importing templates:', err);
      toast.error('Erro ao importar modelos padrão');
      return false;
    } finally {
      setImporting(false);
    }
  }, [clinic?.id]);

  const getAvailableTemplateCount = useCallback(async (): Promise<number> => {
    if (!clinic?.id) return 0;

    let count = 0;
    for (const template of ALL_DEFAULT_TEMPLATES) {
      const { data: existing } = await supabase
        .from('medical_record_templates')
        .select('id')
        .eq('clinic_id', clinic.id)
        .eq('type', template.type)
        .eq('name', template.name)
        .maybeSingle();

      if (!existing) count++;
    }
    return count;
  }, [clinic?.id]);

  return {
    importing,
    importDefaultTemplates,
    getAvailableTemplateCount,
    totalDefaultTemplates: ALL_DEFAULT_TEMPLATES.length,
  };
}
