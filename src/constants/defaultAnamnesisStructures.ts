/**
 * Default anamnesis template structures for each specialty.
 * These are used when auto-provisioning templates on specialty activation.
 * 
 * Structure format: Array of sections, each with fields.
 * Compatible with anamnesis_template_versions.structure JSON column.
 */

export interface DefaultFieldDef {
  id: string;
  type: string;
  label: string;
  required: boolean;
  placeholder?: string;
  options?: string[];
  description?: string;
}

export interface DefaultSectionDef {
  id: string;
  type: 'section';
  title: string;
  fields: DefaultFieldDef[];
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CLÍNICA GERAL — Modelo Premium Consultório Privado
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const CLINICA_GERAL_STRUCTURE: DefaultSectionDef[] = [
  // BLOCO 1 — Queixa Principal
  {
    id: 'section_queixa_principal', type: 'section', title: 'Queixa Principal',
    fields: [
      { id: 'f_queixa_principal', type: 'textarea', label: 'Queixa principal', required: true, placeholder: 'Descreva a queixa principal do paciente nas palavras dele...' },
    ],
  },
  // BLOCO 2 — História da Doença Atual (HDA)
  {
    id: 'section_hda', type: 'section', title: 'História da Doença Atual (HDA)',
    fields: [
      { id: 'f_hda_inicio', type: 'text', label: 'Início dos sintomas', required: false, placeholder: 'Ex: Há 3 dias, após esforço físico' },
      { id: 'f_hda_evolucao', type: 'textarea', label: 'Evolução', required: false, placeholder: 'Progressiva, estável, intermitente...' },
      { id: 'f_hda_localizacao_irradiacao', type: 'text', label: 'Localização / Irradiação', required: false, placeholder: 'Ex: Precordial, irradiando para braço esquerdo' },
      { id: 'f_hda_intensidade', type: 'select', label: 'Intensidade (0-10)', required: false, options: ['0','1','2','3','4','5','6','7','8','9','10'] },
      { id: 'f_hda_sintomas_associados', type: 'textarea', label: 'Sintomas associados', required: false, placeholder: 'Náusea, febre, dispneia, sudorese...' },
      { id: 'f_hda_piora_melhora', type: 'textarea', label: 'Fatores de piora / melhora', required: false, placeholder: 'O que piora e o que alivia os sintomas...' },
      { id: 'f_hda_tratamentos_previos', type: 'textarea', label: 'Tratamentos prévios', required: false, placeholder: 'Medicamentos, procedimentos já realizados...' },
    ],
  },
  // BLOCO 3 — Revisão de Sistemas
  {
    id: 'section_revisao_sistemas', type: 'section', title: 'Revisão de Sistemas',
    fields: [
      { id: 'f_rs_febre', type: 'select', label: 'Febre', required: false, options: ['Não','Sim'] },
      { id: 'f_rs_febre_obs', type: 'text', label: 'Febre — observação', required: false, placeholder: 'Detalhes...' },
      { id: 'f_rs_perda_peso', type: 'select', label: 'Perda de peso', required: false, options: ['Não','Sim'] },
      { id: 'f_rs_perda_peso_obs', type: 'text', label: 'Perda de peso — observação', required: false, placeholder: 'Quanto, em quanto tempo...' },
      { id: 'f_rs_dispneia', type: 'select', label: 'Dispneia', required: false, options: ['Não','Sim'] },
      { id: 'f_rs_dispneia_obs', type: 'text', label: 'Dispneia — observação', required: false, placeholder: 'Aos esforços, em repouso...' },
      { id: 'f_rs_dor_toracica', type: 'select', label: 'Dor torácica', required: false, options: ['Não','Sim'] },
      { id: 'f_rs_dor_toracica_obs', type: 'text', label: 'Dor torácica — observação', required: false, placeholder: 'Tipo, duração...' },
      { id: 'f_rs_nauseas_vomitos', type: 'select', label: 'Náuseas / Vômitos', required: false, options: ['Não','Sim'] },
      { id: 'f_rs_nauseas_obs', type: 'text', label: 'Náuseas — observação', required: false, placeholder: 'Frequência, gatilhos...' },
      { id: 'f_rs_intestinal', type: 'select', label: 'Alterações intestinais', required: false, options: ['Não','Sim'] },
      { id: 'f_rs_intestinal_obs', type: 'text', label: 'Intestinal — observação', required: false, placeholder: 'Constipação, diarreia...' },
      { id: 'f_rs_urinario', type: 'select', label: 'Alterações urinárias', required: false, options: ['Não','Sim'] },
      { id: 'f_rs_urinario_obs', type: 'text', label: 'Urinário — observação', required: false, placeholder: 'Disúria, polaciúria...' },
      { id: 'f_rs_cefaleia_tontura', type: 'select', label: 'Cefaleia / Tontura', required: false, options: ['Não','Sim'] },
      { id: 'f_rs_cefaleia_obs', type: 'text', label: 'Cefaleia — observação', required: false, placeholder: 'Tipo, frequência...' },
      { id: 'f_rs_edema', type: 'select', label: 'Edema', required: false, options: ['Não','Sim'] },
      { id: 'f_rs_edema_obs', type: 'text', label: 'Edema — observação', required: false, placeholder: 'Localização, intensidade...' },
      { id: 'f_rs_outros', type: 'textarea', label: 'Outros achados na revisão', required: false, placeholder: 'Outros sintomas relevantes...' },
    ],
  },
  // BLOCO 4 — Antecedentes Pessoais
  {
    id: 'section_antecedentes_pessoais', type: 'section', title: 'Antecedentes Pessoais',
    fields: [
      { id: 'f_ap_doencas_preexistentes', type: 'textarea', label: 'Doenças pré-existentes', required: false, placeholder: 'HAS, DM, Asma, Cardiopatia...' },
      { id: 'f_ap_internacoes_previas', type: 'textarea', label: 'Internações prévias', required: false, placeholder: 'Motivo, data, duração...' },
      { id: 'f_ap_cirurgias_previas', type: 'textarea', label: 'Cirurgias prévias', required: false, placeholder: 'Tipo, ano, complicações...' },
      { id: 'f_ap_alergias', type: 'textarea', label: 'Alergias', required: false, placeholder: 'Medicamentos, alimentos, contrastes, látex...' },
      { id: 'f_ap_imunizacoes', type: 'text', label: 'Imunizações', required: false, placeholder: 'Em dia, pendências...' },
      { id: 'f_ap_gineco_obstetrico', type: 'textarea', label: 'Ginecológico / Obstétrico (se aplicável)', required: false, placeholder: 'G_P_A_, DUM, contraceptivos...' },
    ],
  },
  // BLOCO 5 — Medicamentos / Tratamentos
  {
    id: 'section_medicamentos', type: 'section', title: 'Medicamentos / Tratamentos',
    fields: [
      { id: 'f_med_em_uso', type: 'textarea', label: 'Medicamentos em uso', required: false, placeholder: 'Nome, dose, posologia...' },
      { id: 'f_med_aderencia', type: 'select', label: 'Aderência ao tratamento', required: false, options: ['Boa','Irregular','Baixa'] },
      { id: 'f_med_aderencia_obs', type: 'text', label: 'Observação sobre aderência', required: false, placeholder: 'Detalhes...' },
      { id: 'f_med_suplementos', type: 'textarea', label: 'Suplementos / Fitoterápicos', required: false, placeholder: 'Suplementos em uso...' },
    ],
  },
  // BLOCO 6 — Antecedentes Familiares
  {
    id: 'section_antecedentes_familiares', type: 'section', title: 'Antecedentes Familiares',
    fields: [
      { id: 'f_af_historico', type: 'textarea', label: 'Histórico familiar', required: false, placeholder: 'Pai IAM aos 55a, mãe DM2, irmão HAS...' },
    ],
  },
  // BLOCO 7 — Hábitos de Vida
  {
    id: 'section_habitos_vida', type: 'section', title: 'Hábitos de Vida',
    fields: [
      { id: 'f_hv_tabagismo', type: 'select', label: 'Tabagismo', required: false, options: ['Nunca fumou','Ex-fumante','Fumante ativo'] },
      { id: 'f_hv_tabagismo_macos', type: 'text', label: 'Maços/ano (se aplicável)', required: false, placeholder: 'Ex: 20 maços/ano' },
      { id: 'f_hv_etilismo', type: 'select', label: 'Etilismo', required: false, options: ['Não','Ocasional','Frequente'] },
      { id: 'f_hv_etilismo_qtd', type: 'text', label: 'Quantidade (se aplicável)', required: false, placeholder: 'Ex: 2 cervejas/semana' },
      { id: 'f_hv_drogas', type: 'select', label: 'Uso de drogas ilícitas', required: false, options: ['Não','Sim'] },
      { id: 'f_hv_drogas_quais', type: 'text', label: 'Quais drogas (se aplicável)', required: false, placeholder: 'Especificar...' },
      { id: 'f_hv_atividade_fisica', type: 'text', label: 'Atividade física', required: false, placeholder: 'Ex: Caminhada 3x/semana, 30min' },
      { id: 'f_hv_alimentacao', type: 'textarea', label: 'Padrão alimentar', required: false, placeholder: 'Descreva resumidamente...' },
      { id: 'f_hv_sono', type: 'text', label: 'Sono', required: false, placeholder: 'Ex: 7h/noite, fragmentado' },
      { id: 'f_hv_estresse_trabalho', type: 'textarea', label: 'Estresse / Trabalho', required: false, placeholder: 'Nível de estresse, carga de trabalho...' },
    ],
  },
  // BLOCO 8 — Exame Físico
  {
    id: 'section_exame_fisico', type: 'section', title: 'Exame Físico',
    fields: [
      { id: 'f_ef_estado_geral', type: 'text', label: 'Estado geral', required: false, placeholder: 'BEG, lúcido, orientado, corado, hidratado...' },
      { id: 'f_ef_pa', type: 'text', label: 'PA (mmHg)', required: false, placeholder: 'Ex: 120x80' },
      { id: 'f_ef_fc', type: 'text', label: 'FC (bpm)', required: false, placeholder: 'Ex: 72' },
      { id: 'f_ef_fr', type: 'text', label: 'FR (irpm)', required: false, placeholder: 'Ex: 16' },
      { id: 'f_ef_temp', type: 'text', label: 'Temperatura (°C)', required: false, placeholder: 'Ex: 36.5' },
      { id: 'f_ef_spo2', type: 'text', label: 'SpO₂ (%)', required: false, placeholder: 'Ex: 98' },
      { id: 'f_ef_cabeca_pescoco', type: 'textarea', label: 'Cabeça e Pescoço', required: false, placeholder: 'Oroscopia, otoscopia, linfonodos...' },
      { id: 'f_ef_cardio', type: 'textarea', label: 'Cardiovascular', required: false, placeholder: 'RCR 2T, BNF, sem sopros...' },
      { id: 'f_ef_respiratorio', type: 'textarea', label: 'Respiratório', required: false, placeholder: 'MV presente bilateralmente, sem RA...' },
      { id: 'f_ef_abdome', type: 'textarea', label: 'Abdome', required: false, placeholder: 'Plano, flácido, indolor à palpação, RHA+...' },
      { id: 'f_ef_neurologico', type: 'textarea', label: 'Neurológico', required: false, placeholder: 'Glasgow 15, pupilas isocóricas, sem déficits...' },
      { id: 'f_ef_pele_extremidades', type: 'textarea', label: 'Pele e Extremidades', required: false, placeholder: 'Sem lesões, pulsos presentes, sem edema...' },
    ],
  },
  // BLOCO 9 — Hipóteses Diagnósticas
  {
    id: 'section_hipoteses', type: 'section', title: 'Hipóteses Diagnósticas',
    fields: [
      { id: 'f_hd_principais', type: 'textarea', label: 'Hipóteses principais', required: false, placeholder: 'CID-10 e descrição...' },
      { id: 'f_hd_diferenciais', type: 'textarea', label: 'Diagnósticos diferenciais', required: false, placeholder: 'Liste as hipóteses diferenciais...' },
    ],
  },
  // BLOCO 10 — Plano / Conduta
  {
    id: 'section_conduta', type: 'section', title: 'Plano / Conduta',
    fields: [
      { id: 'f_pc_exames', type: 'textarea', label: 'Exames solicitados', required: false, placeholder: 'Hemograma, glicemia, ECG...' },
      { id: 'f_pc_prescricao_orientacoes', type: 'textarea', label: 'Prescrição e Orientações', required: false, placeholder: 'Prescrições, orientações gerais...' },
      { id: 'f_pc_encaminhamentos', type: 'textarea', label: 'Encaminhamentos', required: false, placeholder: 'Especialidades, exames de imagem...' },
      { id: 'f_pc_retorno', type: 'text', label: 'Retorno', required: false, placeholder: 'Ex: em 15 dias, em 1 mês' },
      { id: 'f_pc_sinais_alarme', type: 'textarea', label: 'Sinais de alarme', required: false, placeholder: 'Orientar o paciente a retornar se...' },
    ],
  },
];

/**
 * Map of specialty slugs to their default structures.
 * Add new specialties here as needed.
 */
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// NUTRIÇÃO — Modelo Premium Consultório Privado
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const NUTRICAO_STRUCTURE: DefaultSectionDef[] = [
  {
    id: 'objetivo_queixa',
    type: 'section',
    title: 'Objetivo / Queixa Principal',
    fields: [
      { id: 'queixa_principal', type: 'textarea', label: 'Queixa Principal / Objetivo', required: true, placeholder: 'Descreva o objetivo principal da consulta nutricional...' },
    ],
  },
  {
    id: 'historia_alimentar',
    type: 'section',
    title: 'História Alimentar',
    fields: [
      { id: 'rotina_alimentar', type: 'textarea', label: 'Rotina Alimentar', required: false, placeholder: 'Descreva a rotina alimentar detalhada...' },
      { id: 'refeicoes_por_dia', type: 'text', label: 'Nº de Refeições/dia', required: false, placeholder: 'Ex: 5' },
      { id: 'consumo_agua_litros', type: 'text', label: 'Consumo de Água (L/dia)', required: false, placeholder: 'Ex: 2.0' },
      { id: 'consumo_acucar', type: 'select', label: 'Consumo de Açúcar', required: false, options: ['Nenhum', 'Baixo', 'Moderado', 'Alto'] },
      { id: 'consumo_ultraprocessados', type: 'select', label: 'Consumo de Ultraprocessados', required: false, options: ['Nenhum', 'Baixo', 'Moderado', 'Alto'] },
      { id: 'consumo_alcool', type: 'select', label: 'Consumo de Álcool', required: false, options: ['Nenhum', 'Social', 'Moderado', 'Frequente'] },
    ],
  },
  {
    id: 'historico_clinico',
    type: 'section',
    title: 'Histórico Clínico Nutricional',
    fields: [
      { id: 'doencas_associadas', type: 'textarea', label: 'Doenças Associadas', required: false, placeholder: 'Diabetes, hipertensão, dislipidemia...' },
      { id: 'uso_medicamentos', type: 'textarea', label: 'Uso de Medicamentos', required: false, placeholder: 'Medicamentos em uso contínuo...' },
      { id: 'suplementacao', type: 'textarea', label: 'Suplementação', required: false, placeholder: 'Suplementos em uso, dosagem...' },
    ],
  },
  {
    id: 'avaliacao_antropometrica',
    type: 'section',
    title: 'Avaliação Antropométrica',
    fields: [
      { id: 'peso_kg', type: 'text', label: 'Peso (kg)', required: false, placeholder: '70.5' },
      { id: 'altura_cm', type: 'text', label: 'Altura (cm)', required: false, placeholder: '170' },
      { id: 'imc', type: 'text', label: 'IMC (calculado)', required: false, description: 'Calculado automaticamente' },
      { id: 'circunferencia_abdominal_cm', type: 'text', label: 'Circunferência Abdominal (cm)', required: false, placeholder: '85' },
      { id: 'percentual_gordura', type: 'text', label: '% Gordura Corporal', required: false, placeholder: '25' },
      { id: 'massa_magra_kg', type: 'text', label: 'Massa Magra (kg)', required: false, placeholder: '52' },
    ],
  },
  {
    id: 'comportamento_estilo',
    type: 'section',
    title: 'Comportamento e Estilo de Vida',
    fields: [
      { id: 'qualidade_sono', type: 'select', label: 'Qualidade do Sono', required: false, options: ['Ótima', 'Boa', 'Regular', 'Ruim', 'Insônia'] },
      { id: 'nivel_estresse', type: 'select', label: 'Nível de Estresse', required: false, options: ['Baixo', 'Moderado', 'Alto', 'Muito Alto'] },
      { id: 'atividade_fisica', type: 'select', label: 'Atividade Física', required: false, options: ['Sedentário', 'Leve (1-2x/sem)', 'Moderado (3-4x/sem)', 'Intenso (5+x/sem)', 'Atleta'] },
      { id: 'compulsao_alimentar', type: 'textarea', label: 'Compulsão Alimentar', required: false, placeholder: 'Relatos de episódios compulsivos, gatilhos...' },
      { id: 'relacao_emocional_comida', type: 'textarea', label: 'Relação Emocional com a Comida', required: false, placeholder: 'Como o paciente se relaciona emocionalmente com a alimentação...' },
    ],
  },
  {
    id: 'diagnostico_nutricional',
    type: 'section',
    title: 'Diagnóstico Nutricional',
    fields: [
      { id: 'diagnostico_nutricional', type: 'textarea', label: 'Diagnóstico Nutricional', required: false, placeholder: 'Diagnóstico nutricional estruturado...' },
    ],
  },
  {
    id: 'plano_conduta',
    type: 'section',
    title: 'Plano Alimentar / Conduta',
    fields: [
      { id: 'estrategia_nutricional', type: 'textarea', label: 'Estratégia Nutricional', required: false, placeholder: 'Estratégia nutricional adotada...' },
      { id: 'meta_calorica', type: 'text', label: 'Meta Calórica', required: false, placeholder: 'Ex: 1800 kcal/dia' },
      { id: 'distribuicao_macronutrientes', type: 'text', label: 'Distribuição de Macronutrientes', required: false, placeholder: 'Ex: 50% CHO, 25% PTN, 25% LIP' },
      { id: 'orientacoes_gerais', type: 'textarea', label: 'Orientações Gerais', required: false, placeholder: 'Orientações gerais ao paciente...' },
      { id: 'proxima_reavaliacao', type: 'text', label: 'Próxima Reavaliação', required: false, placeholder: 'Data da próxima reavaliação' },
    ],
  },
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PSICOLOGIA — Modelo Padrão Consultório Privado
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const PSICOLOGIA_STRUCTURE: DefaultSectionDef[] = [
  // 1. Demanda Inicial
  {
    id: 'section_demanda_inicial', type: 'section', title: 'Demanda Inicial',
    fields: [
      { id: 'f_motivo_procura', type: 'textarea', label: 'Motivo da procura', required: true, placeholder: 'Descreva o motivo da procura pelo atendimento psicológico...' },
      { id: 'f_expectativa_terapia', type: 'textarea', label: 'Expectativa em relação à terapia', required: false, placeholder: 'O que o paciente espera do processo terapêutico...' },
      { id: 'f_encaminhamento', type: 'text', label: 'Encaminhamento', required: false, placeholder: 'Quem encaminhou (médico, escola, espontâneo)...' },
      { id: 'f_quem_sugeriu', type: 'text', label: 'Quem sugeriu a terapia', required: false, placeholder: 'Familiar, amigo, profissional de saúde...' },
    ],
  },
  // 2. História do Problema Atual
  {
    id: 'section_historia_problema', type: 'section', title: 'História do Problema Atual',
    fields: [
      { id: 'f_quando_comecou', type: 'text', label: 'Quando começou', required: false, placeholder: 'Quando os sintomas/queixas começaram...' },
      { id: 'f_situacoes_associadas', type: 'textarea', label: 'Situações associadas', required: false, placeholder: 'Eventos ou contextos relacionados ao início ou agravamento...' },
      { id: 'f_frequencia', type: 'text', label: 'Frequência', required: false, placeholder: 'Com que frequência ocorrem os sintomas...' },
      { id: 'f_intensidade_subjetiva', type: 'select', label: 'Intensidade subjetiva', required: false, options: ['Leve', 'Moderada', 'Intensa'] },
      { id: 'f_impacto_pessoal', type: 'textarea', label: 'Impacto na vida pessoal', required: false, placeholder: 'Como afeta relacionamentos, rotina, bem-estar...' },
      { id: 'f_impacto_profissional', type: 'textarea', label: 'Impacto profissional/acadêmico', required: false, placeholder: 'Como afeta trabalho, estudos, produtividade...' },
      { id: 'f_estrategias_tentadas', type: 'textarea', label: 'Estratégias já tentadas', required: false, placeholder: 'O que o paciente já tentou para lidar com o problema...' },
    ],
  },
  // 3. Histórico Psicológico / Psiquiátrico
  {
    id: 'section_historico_psicologico', type: 'section', title: 'Histórico Psicológico / Psiquiátrico',
    fields: [
      { id: 'f_terapia_anterior', type: 'select', label: 'Já realizou terapia anteriormente', required: false, options: ['Sim', 'Não'] },
      { id: 'f_terapia_anterior_obs', type: 'textarea', label: 'Observação sobre terapias anteriores', required: false, placeholder: 'Duração, abordagem, motivo de interrupção, resultados...' },
      { id: 'f_uso_medicacao', type: 'select', label: 'Uso atual de medicação', required: false, options: ['Sim', 'Não'] },
      { id: 'f_qual_medicacao', type: 'text', label: 'Qual medicação', required: false, placeholder: 'Nome, dosagem, prescritor...' },
      { id: 'f_diagnostico_previo', type: 'text', label: 'Diagnóstico prévio', required: false, placeholder: 'Diagnósticos anteriores (CID/DSM)...' },
      { id: 'f_internacoes', type: 'select', label: 'Internações psiquiátricas', required: false, options: ['Sim', 'Não'] },
      { id: 'f_acompanhamento_psiq', type: 'select', label: 'Acompanhamento psiquiátrico atual', required: false, options: ['Sim', 'Não'] },
    ],
  },
  // 4. Histórico Familiar
  {
    id: 'section_historico_familiar', type: 'section', title: 'Histórico Familiar',
    fields: [
      { id: 'f_relacao_pais', type: 'textarea', label: 'Relação com pais/cuidadores', required: false, placeholder: 'Qualidade dos vínculos, dinâmica familiar na infância e atualmente...' },
      { id: 'f_eventos_infancia', type: 'textarea', label: 'Eventos marcantes na infância', required: false, placeholder: 'Traumas, perdas, mudanças significativas...' },
      { id: 'f_transtornos_familia', type: 'textarea', label: 'Histórico de transtornos na família', required: false, placeholder: 'Transtornos mentais, dependência química na família...' },
      { id: 'f_conflitos_familiares', type: 'textarea', label: 'Conflitos familiares atuais', required: false, placeholder: 'Conflitos, tensões ou dificuldades familiares presentes...' },
    ],
  },
  // 5. Contexto Atual
  {
    id: 'section_contexto_atual', type: 'section', title: 'Contexto Atual',
    fields: [
      { id: 'f_situacao_familiar', type: 'textarea', label: 'Situação familiar', required: false, placeholder: 'Composição familiar atual, dinâmica...' },
      { id: 'f_relacionamento_afetivo', type: 'textarea', label: 'Relacionamento afetivo', required: false, placeholder: 'Status, qualidade do relacionamento...' },
      { id: 'f_vida_social', type: 'textarea', label: 'Vida social', required: false, placeholder: 'Amizades, atividades sociais, isolamento...' },
      { id: 'f_trabalho_estudos', type: 'textarea', label: 'Trabalho / Estudos', required: false, placeholder: 'Ocupação, satisfação, estresse laboral...' },
      { id: 'f_rede_apoio', type: 'textarea', label: 'Rede de apoio', required: false, placeholder: 'Pessoas de confiança, suporte emocional...' },
      { id: 'f_rotina_diaria', type: 'textarea', label: 'Rotina diária', required: false, placeholder: 'Estrutura do dia, organização, autocuidado...' },
      { id: 'f_sono', type: 'text', label: 'Sono', required: false, placeholder: 'Qualidade, horas, insônia, pesadelos...' },
      { id: 'f_alimentacao', type: 'text', label: 'Alimentação', required: false, placeholder: 'Padrão alimentar, alterações recentes...' },
      { id: 'f_atividade_fisica', type: 'text', label: 'Atividade física', required: false, placeholder: 'Tipo, frequência...' },
    ],
  },
  // 6. Funcionamento Psíquico Atual
  {
    id: 'section_funcionamento_psiquico', type: 'section', title: 'Funcionamento Psíquico Atual',
    fields: [
      { id: 'f_humor_predominante', type: 'text', label: 'Humor predominante', required: false, placeholder: 'Triste, ansioso, irritável, estável...' },
      { id: 'f_ansiedade', type: 'select', label: 'Ansiedade', required: false, options: ['Ausente', 'Leve', 'Moderada', 'Intensa'] },
      { id: 'f_irritabilidade', type: 'select', label: 'Irritabilidade', required: false, options: ['Ausente', 'Leve', 'Moderada', 'Intensa'] },
      { id: 'f_concentracao', type: 'select', label: 'Concentração', required: false, options: ['Preservada', 'Prejudicada'] },
      { id: 'f_autoestima', type: 'select', label: 'Autoestima', required: false, options: ['Baixa', 'Moderada', 'Alta'] },
      { id: 'f_pensamentos_recorrentes', type: 'textarea', label: 'Pensamentos recorrentes', required: false, placeholder: 'Pensamentos intrusivos, ruminações, preocupações constantes...' },
      { id: 'f_ideacao_suicida', type: 'select', label: 'Ideação suicida', required: false, options: ['Sim', 'Não'], description: 'Se "Sim", gerar alerta interno no prontuário (não exportável em PDF)' },
      { id: 'f_comportamentos_risco', type: 'textarea', label: 'Comportamentos de risco', required: false, placeholder: 'Autolesão, uso de substâncias, comportamentos impulsivos...' },
    ],
  },
  // 7. Observação Clínica do Psicólogo
  {
    id: 'section_observacao_clinica', type: 'section', title: 'Observação Clínica do Psicólogo',
    fields: [
      { id: 'f_observacao_tecnica', type: 'textarea', label: 'Observação técnica do profissional', required: false, placeholder: 'Impressões clínicas, apresentação, afeto, discurso, comportamento... (pode ser ocultado no relatório exportável)', description: 'Campo técnico — opção de ocultar no relatório exportável' },
    ],
  },
  // 8. Objetivos Terapêuticos
  {
    id: 'section_objetivos', type: 'section', title: 'Objetivos Terapêuticos',
    fields: [
      { id: 'f_objetivo_1', type: 'text', label: 'Objetivo 1', required: false, placeholder: 'Primeiro objetivo terapêutico...' },
      { id: 'f_objetivo_2', type: 'text', label: 'Objetivo 2', required: false, placeholder: 'Segundo objetivo terapêutico...' },
      { id: 'f_objetivo_3', type: 'text', label: 'Objetivo 3', required: false, placeholder: 'Terceiro objetivo terapêutico...' },
      { id: 'f_objetivos_obs', type: 'textarea', label: 'Observações adicionais', required: false, placeholder: 'Informações complementares sobre os objetivos...' },
    ],
  },
  // 9. Plano Terapêutico Inicial
  {
    id: 'section_plano_terapeutico', type: 'section', title: 'Plano Terapêutico Inicial',
    fields: [
      { id: 'f_abordagem', type: 'text', label: 'Abordagem terapêutica', required: false, placeholder: 'TCC, Psicanálise, Humanista, Sistêmica...' },
      { id: 'f_frequencia_sessoes', type: 'select', label: 'Frequência das sessões', required: false, options: ['Semanal', 'Quinzenal', 'Mensal'] },
      { id: 'f_intervencoes_previstas', type: 'textarea', label: 'Intervenções previstas', required: false, placeholder: 'Técnicas e estratégias terapêuticas planejadas...' },
      { id: 'f_encaminhamentos', type: 'textarea', label: 'Encaminhamentos', required: false, placeholder: 'Psiquiatria, neurologia, assistência social...' },
    ],
  },
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FISIOTERAPIA — Modelo Padrão Clínico
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const FISIOTERAPIA_STRUCTURE: DefaultSectionDef[] = [
  {
    id: 'section_queixa_principal', type: 'section', title: 'Queixa Principal',
    fields: [
      { id: 'f_queixa_principal', type: 'textarea', label: 'Queixa principal', required: true, placeholder: 'Motivo da consulta, nas palavras do paciente...' },
      { id: 'f_encaminhamento', type: 'text', label: 'Encaminhado por', required: false, placeholder: 'Médico, ortopedista, auto-referência...' },
    ],
  },
  {
    id: 'section_hda', type: 'section', title: 'História da Disfunção Atual',
    fields: [
      { id: 'f_inicio_sintomas', type: 'text', label: 'Início dos sintomas', required: false, placeholder: 'Quando começou? Há quanto tempo?' },
      { id: 'f_mecanismo_lesao', type: 'textarea', label: 'Mecanismo da lesão', required: false, placeholder: 'Como ocorreu? Trauma, sobrecarga, espontâneo...' },
      { id: 'f_evolucao', type: 'textarea', label: 'Evolução do quadro', required: false, placeholder: 'Progressiva, estável, com melhoras/pioras...' },
      { id: 'f_localizacao', type: 'text', label: 'Localização da dor/disfunção', required: false, placeholder: 'Região anatômica acometida...' },
      { id: 'f_intensidade_dor', type: 'select', label: 'Intensidade da dor (EVA 0-10)', required: false, options: ['0','1','2','3','4','5','6','7','8','9','10'] },
      { id: 'f_tipo_dor', type: 'select', label: 'Tipo de dor', required: false, options: ['Aguda', 'Crônica', 'Pontada', 'Queimação', 'Latejante', 'Difusa', 'Outro'] },
      { id: 'f_fatores_piora', type: 'textarea', label: 'Fatores de piora', required: false, placeholder: 'Movimentos, posições, atividades que agravam...' },
      { id: 'f_fatores_alivio', type: 'textarea', label: 'Fatores de alívio', required: false, placeholder: 'Repouso, medicação, gelo, calor...' },
    ],
  },
  {
    id: 'section_limitacoes', type: 'section', title: 'Limitações Funcionais',
    fields: [
      { id: 'f_avds', type: 'textarea', label: 'Atividades de Vida Diária (AVDs)', required: false, placeholder: 'Quais atividades cotidianas estão comprometidas?' },
      { id: 'f_atividade_laboral', type: 'textarea', label: 'Atividade laboral', required: false, placeholder: 'Profissão, demandas físicas, afastamento...' },
      { id: 'f_atividade_esportiva', type: 'textarea', label: 'Atividade esportiva', required: false, placeholder: 'Pratica esporte? Qual? Frequência? Impacto...' },
      { id: 'f_independencia', type: 'select', label: 'Nível de independência funcional', required: false, options: ['Independente', 'Parcialmente dependente', 'Dependente', 'Acamado'] },
    ],
  },
  {
    id: 'section_antecedentes', type: 'section', title: 'Antecedentes e Histórico Clínico',
    fields: [
      { id: 'f_patologias', type: 'textarea', label: 'Patologias prévias', required: false, placeholder: 'Doenças crônicas, cirurgias, internações...' },
      { id: 'f_cirurgias', type: 'textarea', label: 'Cirurgias ortopédicas/anteriores', required: false, placeholder: 'Tipo, data, local...' },
      { id: 'f_fraturas', type: 'textarea', label: 'Fraturas / lesões prévias', required: false, placeholder: 'Fraturas, entorses, luxações anteriores...' },
      { id: 'f_medicamentos', type: 'textarea', label: 'Medicamentos em uso', required: false, placeholder: 'Medicamentos, dosagem, frequência...' },
      { id: 'f_exames', type: 'textarea', label: 'Exames complementares', required: false, placeholder: 'RX, RM, TC, exames laboratoriais relevantes...' },
    ],
  },
  {
    id: 'section_tratamentos_previos', type: 'section', title: 'Tratamentos Anteriores',
    fields: [
      { id: 'f_fisio_previa', type: 'checkbox', label: 'Já fez fisioterapia antes?', required: false },
      { id: 'f_fisio_previa_obs', type: 'textarea', label: 'Detalhes do tratamento anterior', required: false, placeholder: 'Quando, onde, técnicas, resultados...' },
      { id: 'f_outros_tratamentos', type: 'textarea', label: 'Outros tratamentos realizados', required: false, placeholder: 'Acupuntura, pilates, RPG, infiltração...' },
    ],
  },
  {
    id: 'section_habitos', type: 'section', title: 'Hábitos de Vida',
    fields: [
      { id: 'f_sono', type: 'textarea', label: 'Qualidade do sono', required: false, placeholder: 'Horas de sono, qualidade, posição ao dormir...' },
      { id: 'f_tabagismo', type: 'select', label: 'Tabagismo', required: false, options: ['Não', 'Sim', 'Ex-fumante'] },
      { id: 'f_etilismo', type: 'select', label: 'Etilismo', required: false, options: ['Não', 'Social', 'Frequente'] },
      { id: 'f_nivel_atividade', type: 'select', label: 'Nível de atividade física', required: false, options: ['Sedentário', 'Levemente ativo', 'Moderadamente ativo', 'Muito ativo'] },
    ],
  },
  {
    id: 'section_objetivos', type: 'section', title: 'Objetivos do Paciente',
    fields: [
      { id: 'f_objetivo_paciente', type: 'textarea', label: 'Expectativas e objetivos', required: false, placeholder: 'O que o paciente espera alcançar com o tratamento?' },
      { id: 'f_objetivo_funcional', type: 'textarea', label: 'Objetivo funcional principal', required: false, placeholder: 'Meta funcional prioritária (ex: voltar a correr, trabalhar sem dor...)' },
    ],
  },
  {
    id: 'section_observacoes', type: 'section', title: 'Observações do Fisioterapeuta',
    fields: [
      { id: 'f_impressao_inicial', type: 'textarea', label: 'Impressão clínica inicial', required: false, placeholder: 'Observações iniciais do profissional...' },
      { id: 'f_observacoes', type: 'textarea', label: 'Observações adicionais', required: false, placeholder: 'Outras informações relevantes...' },
    ],
  },
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PSICOLOGIA — Evolução (Sessão Recorrente)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const PSICOLOGIA_EVOLUCAO_STRUCTURE: DefaultSectionDef[] = [
  // 1. Identificação da Sessão
  {
    id: 'section_identificacao_sessao', type: 'section', title: 'Identificação da Sessão',
    fields: [
      { id: 'f_numero_sessao', type: 'number', label: 'Número da sessão', required: false, description: 'Preenchimento automático incremental' },
      { id: 'f_modalidade', type: 'select', label: 'Modalidade', required: false, options: ['Presencial', 'Online'] },
      { id: 'f_duracao_sessao', type: 'text', label: 'Duração da sessão', required: false, placeholder: 'Ex: 50 min' },
    ],
  },
  // 2. Tema Central da Sessão
  {
    id: 'section_tema_central', type: 'section', title: 'Tema Central da Sessão',
    fields: [
      { id: 'f_tema_principal', type: 'text', label: 'Tema principal abordado', required: true, placeholder: 'Tema central discutido na sessão...' },
      { id: 'f_resumo_sessao', type: 'textarea', label: 'Resumo da sessão', required: false, placeholder: 'Resumo geral do que foi trabalhado...' },
    ],
  },
  // 3. Relato do Paciente
  {
    id: 'section_relato_paciente', type: 'section', title: 'Relato do Paciente',
    fields: [
      { id: 'f_principais_falas', type: 'textarea', label: 'Principais falas / acontecimentos', required: false, placeholder: 'Relatos mais relevantes trazidos pelo paciente...' },
      { id: 'f_mudancas_percebidas', type: 'textarea', label: 'Mudanças percebidas desde última sessão', required: false, placeholder: 'Progressos, retrocessos, novidades...' },
      { id: 'f_emocoes_predominantes', type: 'multiselect', label: 'Emoções predominantes', required: false, options: ['Ansiedade', 'Tristeza', 'Raiva', 'Culpa', 'Medo', 'Alegria', 'Frustração', 'Apatia'] },
    ],
  },
  // 4. Intervenções do Psicólogo
  {
    id: 'section_intervencoes', type: 'section', title: 'Intervenções do Psicólogo',
    fields: [
      { id: 'f_tecnicas_utilizadas', type: 'multiselect', label: 'Técnicas utilizadas', required: false, options: ['Escuta ativa', 'Reestruturação cognitiva', 'Psicoeducação', 'Técnica de respiração', 'Técnica comportamental', 'Técnica de exposição', 'Outro'] },
      { id: 'f_observacoes_tecnicas', type: 'textarea', label: 'Observações técnicas', required: false, placeholder: 'Notas clínicas sobre as intervenções realizadas...' },
    ],
  },
  // 5. Avaliação Clínica
  {
    id: 'section_avaliacao_clinica', type: 'section', title: 'Avaliação Clínica',
    fields: [
      { id: 'f_evolucao_caso', type: 'select', label: 'Evolução do caso', required: false, options: ['Melhorando', 'Estável', 'Piorando'] },
      { id: 'f_adesao_processo', type: 'select', label: 'Adesão ao processo terapêutico', required: false, options: ['Boa', 'Parcial', 'Baixa'] },
      { id: 'f_risco_atual', type: 'select', label: 'Risco atual', required: false, options: ['Ausente', 'Baixo', 'Moderado', 'Alto'], description: 'Se risco = Alto, gerar alerta interno no prontuário' },
    ],
  },
  // 6. Encaminhamentos e Tarefas
  {
    id: 'section_encaminhamentos_tarefas', type: 'section', title: 'Encaminhamentos e Tarefas',
    fields: [
      { id: 'f_tarefa_casa', type: 'textarea', label: 'Tarefa para casa', required: false, placeholder: 'Atividades ou reflexões propostas ao paciente...' },
      { id: 'f_encaminhamento', type: 'text', label: 'Encaminhamento (se houver)', required: false, placeholder: 'Psiquiatria, neurologia, assistência social...' },
      { id: 'f_proximo_foco', type: 'text', label: 'Próximo foco terapêutico', required: false, placeholder: 'Tema ou objetivo para a próxima sessão...' },
    ],
  },
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PSICOLOGIA — Terapia Familiar
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const PSICOLOGIA_FAMILIAR_STRUCTURE: DefaultSectionDef[] = [
  // 1. Identificação da Família
  {
    id: 'section_identificacao_familia', type: 'section', title: 'Identificação da Família',
    fields: [
      { id: 'f_nome_grupo_familiar', type: 'text', label: 'Nome do grupo familiar', required: true, placeholder: 'Ex: Família Silva' },
      { id: 'f_membros_presentes', type: 'textarea', label: 'Membros presentes na sessão', required: true, placeholder: 'Liste os membros presentes e seu papel na família...' },
      { id: 'f_grau_parentesco', type: 'textarea', label: 'Grau de parentesco entre os membros', required: false, placeholder: 'Descreva as relações: mãe, pai, filho(a), avó...' },
      { id: 'f_quem_solicitou', type: 'text', label: 'Quem solicitou a terapia', required: true, placeholder: 'Nome e papel na família' },
      { id: 'f_membro_ausente', type: 'select', label: 'Há membro ausente relevante?', required: false, options: ['Não', 'Sim'] },
      { id: 'f_membro_ausente_descricao', type: 'textarea', label: 'Descrição do membro ausente', required: false, placeholder: 'Quem está ausente e por qual motivo...' },
    ],
  },
  // 2. Estrutura Familiar
  {
    id: 'section_estrutura_familiar', type: 'section', title: 'Estrutura Familiar',
    fields: [
      { id: 'f_tipo_estrutura', type: 'select', label: 'Tipo de estrutura familiar', required: true, options: ['Nuclear', 'Monoparental', 'Reconstituída', 'Extensa', 'Homoparental', 'Adotiva', 'Outra'] },
      { id: 'f_quem_mora_com_quem', type: 'textarea', label: 'Quem mora com quem', required: false, placeholder: 'Descreva a composição domiciliar...' },
      { id: 'f_autoridade_clara', type: 'select', label: 'Figura de autoridade clara?', required: false, options: ['Sim', 'Não', 'Parcialmente'] },
      { id: 'f_triangulacoes', type: 'select', label: 'Triangulações percebidas?', required: false, options: ['Não', 'Sim'] },
      { id: 'f_aliancas_familiares', type: 'textarea', label: 'Alianças familiares', required: false, placeholder: 'Descreva alianças, subgrupos ou coalizões observadas...' },
    ],
  },
  // 3. Papéis Familiares
  {
    id: 'section_papeis_familiares', type: 'section', title: 'Papéis Familiares',
    fields: [
      { id: 'f_papel_cada_membro', type: 'textarea', label: 'Papel de cada membro', required: true, placeholder: 'Descreva o papel que cada membro exerce na dinâmica familiar...' },
      { id: 'f_inversao_papeis', type: 'select', label: 'Inversão de papéis?', required: false, options: ['Não', 'Sim'] },
      { id: 'f_sobrecarga_emocional', type: 'textarea', label: 'Sobrecarga emocional', required: false, placeholder: 'Algum membro apresenta sobrecarga? Descreva...' },
    ],
  },
  // 4. Conflitos Recorrentes
  {
    id: 'section_conflitos_recorrentes', type: 'section', title: 'Conflitos Recorrentes',
    fields: [
      { id: 'f_principais_conflitos', type: 'textarea', label: 'Principais conflitos', required: true, placeholder: 'Descreva os conflitos mais frequentes na família...' },
      { id: 'f_entre_quais_membros', type: 'textarea', label: 'Entre quais membros', required: false, placeholder: 'Identifique os membros envolvidos nos conflitos...' },
      { id: 'f_frequencia_conflitos', type: 'select', label: 'Frequência', required: false, options: ['Diário', 'Semanal', 'Quinzenal', 'Mensal', 'Esporádico'] },
      { id: 'f_intensidade_conflitos', type: 'select', label: 'Intensidade', required: false, options: ['Leve', 'Moderada', 'Alta', 'Muito alta'] },
      { id: 'f_agressividade_verbal', type: 'select', label: 'Agressividade verbal?', required: false, options: ['Não', 'Sim'] },
      { id: 'f_agressividade_fisica', type: 'select', label: 'Agressividade física?', required: false, options: ['Não', 'Sim'] },
      { id: 'f_tentativas_resolucao', type: 'textarea', label: 'Tentativas anteriores de resolução', required: false, placeholder: 'Descreva tentativas prévias de resolver os conflitos...' },
    ],
  },
  // 5. Dinâmica Relacional
  {
    id: 'section_dinamica_relacional', type: 'section', title: 'Dinâmica Relacional',
    fields: [
      { id: 'f_comunicacao_predominante', type: 'select', label: 'Comunicação predominante', required: false, options: ['Assertiva', 'Passiva', 'Agressiva', 'Passivo-agressiva', 'Evitativa'] },
      { id: 'f_coalizoes', type: 'textarea', label: 'Coalizões', required: false, placeholder: 'Descreva coalizões entre membros...' },
      { id: 'f_exclusoes', type: 'textarea', label: 'Exclusões', required: false, placeholder: 'Algum membro é excluído ou marginalizado?' },
      { id: 'f_nivel_coesao', type: 'select', label: 'Nível de coesão familiar', required: false, options: ['Desligada', 'Separada', 'Conectada', 'Emaranhada'] },
      { id: 'f_tipo_limites', type: 'select', label: 'Tipo de limites', required: false, options: ['Rígidos', 'Claros', 'Difusos', 'Inexistentes'] },
    ],
  },
  // 6. Eventos Críticos
  {
    id: 'section_eventos_criticos', type: 'section', title: 'Eventos Críticos',
    fields: [
      { id: 'f_separacoes', type: 'select', label: 'Separações', required: false, options: ['Não', 'Sim'] },
      { id: 'f_luto', type: 'select', label: 'Luto', required: false, options: ['Não', 'Sim'] },
      { id: 'f_mudanca_cidade', type: 'select', label: 'Mudança de cidade', required: false, options: ['Não', 'Sim'] },
      { id: 'f_doenca_grave', type: 'select', label: 'Doença grave', required: false, options: ['Não', 'Sim'] },
      { id: 'f_violencia', type: 'select', label: 'Violência', required: false, options: ['Não', 'Sim'] },
      { id: 'f_processo_judicial', type: 'select', label: 'Processo judicial', required: false, options: ['Não', 'Sim'] },
      { id: 'f_outro_evento', type: 'textarea', label: 'Outro evento relevante', required: false, placeholder: 'Descreva outro evento relevante...' },
      { id: 'f_impacto_percebido', type: 'textarea', label: 'Impacto percebido', required: false, placeholder: 'Como esses eventos impactaram a dinâmica familiar...' },
    ],
  },
  // 7. Histórico de Intervenções
  {
    id: 'section_historico_intervencoes', type: 'section', title: 'Histórico de Intervenções',
    fields: [
      { id: 'f_terapia_previa', type: 'select', label: 'Terapia prévia (individual ou familiar)?', required: false, options: ['Não', 'Sim'] },
      { id: 'f_conselho_tutelar', type: 'select', label: 'Conselho tutelar?', required: false, options: ['Não', 'Sim'] },
      { id: 'f_caps', type: 'select', label: 'CAPS?', required: false, options: ['Não', 'Sim'] },
      { id: 'f_medicacao_membro', type: 'textarea', label: 'Medicação em membro da família', required: false, placeholder: 'Algum membro faz uso de medicação psiquiátrica? Descreva...' },
    ],
  },
  // 8. Objetivos da Terapia
  {
    id: 'section_objetivos_terapia', type: 'section', title: 'Objetivos da Terapia',
    fields: [
      { id: 'f_objetivos_individuais', type: 'textarea', label: 'Objetivos individuais', required: false, placeholder: 'O que cada membro espera da terapia...' },
      { id: 'f_objetivos_familiares', type: 'textarea', label: 'Objetivos familiares', required: true, placeholder: 'O que a família como grupo deseja alcançar...' },
      { id: 'f_expectativas_familia', type: 'textarea', label: 'Expectativas da família', required: false, placeholder: 'Expectativas gerais sobre o processo terapêutico...' },
      { id: 'f_resistencias_identificadas', type: 'textarea', label: 'Resistências identificadas', required: false, placeholder: 'Resistências ao processo terapêutico observadas...' },
    ],
  },
  // 9. Avaliação Sistêmica Inicial
  {
    id: 'section_avaliacao_sistemica', type: 'section', title: 'Avaliação Sistêmica Inicial',
    fields: [
      { id: 'f_padrao_relacional', type: 'textarea', label: 'Padrão relacional predominante', required: false, placeholder: 'Descreva o padrão predominante nas relações familiares...' },
      { id: 'f_hipotese_sistemica', type: 'textarea', label: 'Hipótese sistêmica inicial', required: true, placeholder: 'Formule a hipótese sistêmica inicial com base na avaliação...' },
      { id: 'f_motivacao_grupo', type: 'select', label: 'Motivação do grupo', required: false, options: ['Alta', 'Moderada', 'Baixa', 'Ambivalente'] },
      { id: 'f_risco_estrutural', type: 'select', label: 'Risco estrutural', required: false, options: ['Baixo', 'Moderado', 'Alto', 'Crítico'] },
      { id: 'f_plano_terapeutico', type: 'textarea', label: 'Plano terapêutico inicial', required: true, placeholder: 'Descreva o plano terapêutico inicial, frequência e abordagem...' },
    ],
  },
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PSICOLOGIA – PSICODIAGNÓSTICO (Avaliação Psicológica)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const PSICOLOGIA_PSICODIAGNOSTICO_STRUCTURE: DefaultSectionDef[] = [
  // 1. Identificação da Avaliação
  {
    id: 'section_identificacao_avaliacao', type: 'section', title: 'Identificação da Avaliação',
    fields: [
      { id: 'pd_escolaridade', type: 'text', label: 'Escolaridade', required: false, placeholder: 'Ex: Ensino Médio completo' },
      { id: 'pd_profissao', type: 'text', label: 'Profissão', required: false, placeholder: 'Ex: Estudante, Engenheiro...' },
      { id: 'pd_responsavel_legal', type: 'text', label: 'Responsável legal', required: false, placeholder: 'Nome do responsável (se menor ou interditado)' },
      { id: 'pd_finalidade_avaliacao', type: 'select', label: 'Finalidade da avaliação', required: true, options: ['Clínica', 'Escolar', 'Judicial/Forense', 'Organizacional', 'Trânsito', 'Porte de arma', 'Cirurgia bariátrica', 'Outra'] },
      { id: 'pd_num_sessoes_previstas', type: 'text', label: 'Número de sessões previstas', required: false, placeholder: 'Ex: 4 a 6 sessões' },
    ],
  },
  // 2. Demanda Formal
  {
    id: 'section_demanda_formal', type: 'section', title: 'Demanda Formal',
    fields: [
      { id: 'pd_solicitante', type: 'text', label: 'Solicitante da avaliação', required: false, placeholder: 'Nome e instituição/relação' },
      { id: 'pd_motivo_encaminhamento', type: 'textarea', label: 'Motivo do encaminhamento', required: true, placeholder: 'Descreva o motivo que levou ao encaminhamento para avaliação psicológica...' },
      { id: 'pd_pergunta_avaliativa', type: 'textarea', label: 'Pergunta avaliativa principal', required: false, placeholder: 'Qual a questão central que a avaliação deve responder?' },
      { id: 'pd_contexto_solicitacao', type: 'textarea', label: 'Contexto da solicitação', required: false, placeholder: 'Circunstâncias em que a avaliação foi solicitada...' },
    ],
  },
  // 3. Histórico Relevante
  {
    id: 'section_historico_relevante', type: 'section', title: 'Histórico Relevante',
    fields: [
      { id: 'pd_historico_clinico', type: 'textarea', label: 'Histórico clínico', required: false, placeholder: 'Doenças, internações, tratamentos anteriores...' },
      { id: 'pd_historico_escolar_profissional', type: 'textarea', label: 'Histórico escolar/profissional', required: false, placeholder: 'Desempenho escolar, trajetória profissional, dificuldades...' },
      { id: 'pd_uso_medicacao', type: 'textarea', label: 'Uso de medicação', required: false, placeholder: 'Medicações atuais e anteriores relevantes...' },
      { id: 'pd_diagnosticos_previos', type: 'textarea', label: 'Diagnósticos prévios', required: false, placeholder: 'Diagnósticos anteriores (psicológicos, psiquiátricos, neurológicos)...' },
    ],
  },
  // 4. Observações Comportamentais
  {
    id: 'section_observacoes_comportamentais', type: 'section', title: 'Observações Comportamentais',
    fields: [
      { id: 'pd_postura', type: 'textarea', label: 'Postura', required: false, placeholder: 'Postura corporal, apresentação geral durante a avaliação...' },
      { id: 'pd_comunicacao', type: 'textarea', label: 'Comunicação', required: false, placeholder: 'Fluência verbal, coerência, articulação...' },
      { id: 'pd_organizacao_pensamento', type: 'textarea', label: 'Organização do pensamento', required: false, placeholder: 'Lógica, sequência, coerência do raciocínio...' },
      { id: 'pd_cooperacao', type: 'textarea', label: 'Cooperação', required: false, placeholder: 'Nível de colaboração, resistência, engajamento nas tarefas...' },
      { id: 'pd_expressao_emocional', type: 'textarea', label: 'Expressão emocional', required: false, placeholder: 'Afeto observado, congruência, variações emocionais...' },
    ],
  },
  // 5. Instrumentos Psicológicos Aplicados
  {
    id: 'section_instrumentos_aplicados', type: 'section', title: 'Instrumentos Psicológicos Aplicados',
    fields: [
      { id: 'pd_instrumento_1_nome', type: 'text', label: 'Instrumento 1 – Nome', required: false, placeholder: 'Ex: WISC-V, HTP, Palográfico...' },
      { id: 'pd_instrumento_1_codigo', type: 'text', label: 'Instrumento 1 – Código/Registro', required: false, placeholder: 'Código SATEPSI (opcional)' },
      { id: 'pd_instrumento_1_data', type: 'text', label: 'Instrumento 1 – Data de aplicação', required: false, placeholder: 'DD/MM/AAAA' },
      { id: 'pd_instrumento_1_tipo', type: 'select', label: 'Instrumento 1 – Tipo', required: false, options: ['Cognitivo', 'Projetivo', 'Personalidade', 'Neuropsicológico', 'Escala/Inventário'] },
      { id: 'pd_instrumento_1_resultado', type: 'textarea', label: 'Instrumento 1 – Resultado resumido', required: false, placeholder: 'Descreva os resultados obtidos...' },
      { id: 'pd_instrumento_1_interpretacao', type: 'textarea', label: 'Instrumento 1 – Interpretação técnica', required: false, placeholder: 'Interpretação clínica dos resultados...' },
      { id: 'pd_instrumento_1_referencia', type: 'text', label: 'Instrumento 1 – Referência normativa', required: false, placeholder: 'Tabela normativa utilizada' },
      { id: 'pd_instrumento_2_nome', type: 'text', label: 'Instrumento 2 – Nome', required: false, placeholder: 'Ex: BFP, R-1, Rorschach...' },
      { id: 'pd_instrumento_2_codigo', type: 'text', label: 'Instrumento 2 – Código/Registro', required: false },
      { id: 'pd_instrumento_2_data', type: 'text', label: 'Instrumento 2 – Data de aplicação', required: false },
      { id: 'pd_instrumento_2_tipo', type: 'select', label: 'Instrumento 2 – Tipo', required: false, options: ['Cognitivo', 'Projetivo', 'Personalidade', 'Neuropsicológico', 'Escala/Inventário'] },
      { id: 'pd_instrumento_2_resultado', type: 'textarea', label: 'Instrumento 2 – Resultado resumido', required: false },
      { id: 'pd_instrumento_2_interpretacao', type: 'textarea', label: 'Instrumento 2 – Interpretação técnica', required: false },
      { id: 'pd_instrumento_2_referencia', type: 'text', label: 'Instrumento 2 – Referência normativa', required: false },
      { id: 'pd_instrumento_3_nome', type: 'text', label: 'Instrumento 3 – Nome', required: false },
      { id: 'pd_instrumento_3_codigo', type: 'text', label: 'Instrumento 3 – Código/Registro', required: false },
      { id: 'pd_instrumento_3_data', type: 'text', label: 'Instrumento 3 – Data de aplicação', required: false },
      { id: 'pd_instrumento_3_tipo', type: 'select', label: 'Instrumento 3 – Tipo', required: false, options: ['Cognitivo', 'Projetivo', 'Personalidade', 'Neuropsicológico', 'Escala/Inventário'] },
      { id: 'pd_instrumento_3_resultado', type: 'textarea', label: 'Instrumento 3 – Resultado resumido', required: false },
      { id: 'pd_instrumento_3_interpretacao', type: 'textarea', label: 'Instrumento 3 – Interpretação técnica', required: false },
      { id: 'pd_instrumento_3_referencia', type: 'text', label: 'Instrumento 3 – Referência normativa', required: false },
      { id: 'pd_instrumento_4_nome', type: 'text', label: 'Instrumento 4 – Nome', required: false },
      { id: 'pd_instrumento_4_tipo', type: 'select', label: 'Instrumento 4 – Tipo', required: false, options: ['Cognitivo', 'Projetivo', 'Personalidade', 'Neuropsicológico', 'Escala/Inventário'] },
      { id: 'pd_instrumento_4_resultado', type: 'textarea', label: 'Instrumento 4 – Resultado resumido', required: false },
      { id: 'pd_instrumento_4_interpretacao', type: 'textarea', label: 'Instrumento 4 – Interpretação técnica', required: false },
      { id: 'pd_instrumento_5_nome', type: 'text', label: 'Instrumento 5 – Nome', required: false },
      { id: 'pd_instrumento_5_tipo', type: 'select', label: 'Instrumento 5 – Tipo', required: false, options: ['Cognitivo', 'Projetivo', 'Personalidade', 'Neuropsicológico', 'Escala/Inventário'] },
      { id: 'pd_instrumento_5_resultado', type: 'textarea', label: 'Instrumento 5 – Resultado resumido', required: false },
      { id: 'pd_instrumento_5_interpretacao', type: 'textarea', label: 'Instrumento 5 – Interpretação técnica', required: false },
    ],
  },
  // 6. Hipóteses Diagnósticas
  {
    id: 'section_hipoteses_diagnosticas', type: 'section', title: 'Hipóteses Diagnósticas',
    fields: [
      { id: 'pd_hipotese_principal', type: 'textarea', label: 'Hipótese principal', required: false, placeholder: 'Hipótese diagnóstica principal fundamentada nos dados coletados...' },
      { id: 'pd_hipoteses_secundarias', type: 'textarea', label: 'Hipóteses secundárias', required: false, placeholder: 'Hipóteses alternativas ou comorbidades consideradas...' },
      { id: 'pd_investigacao_complementar', type: 'select', label: 'Necessidade de investigação complementar?', required: false, options: ['Não', 'Sim'] },
      { id: 'pd_nivel_consistencia', type: 'select', label: 'Nível de consistência dos dados', required: false, options: ['Alta consistência', 'Moderada', 'Baixa – dados insuficientes', 'Inconclusivo'] },
    ],
  },
  // 7. Fundamentação Técnica
  {
    id: 'section_fundamentacao_tecnica', type: 'section', title: 'Fundamentação Técnica',
    fields: [
      { id: 'pd_referencial_teorico', type: 'textarea', label: 'Referencial teórico utilizado', required: false, placeholder: 'Abordagem teórica que fundamenta a interpretação dos resultados...' },
      { id: 'pd_fundamentacao_instrumentos', type: 'textarea', label: 'Fundamentação nos instrumentos', required: false, placeholder: 'Como os resultados dos instrumentos se articulam com a hipótese...' },
      { id: 'pd_limitacoes_processo', type: 'textarea', label: 'Limitações do processo avaliativo', required: false, placeholder: 'Limitações metodológicas, contextuais ou de adesão do avaliando...' },
    ],
  },
  // 8. Conclusão Parcial
  {
    id: 'section_conclusao_parcial', type: 'section', title: 'Conclusão Parcial',
    fields: [
      { id: 'pd_conclusao', type: 'textarea', label: 'Conclusão parcial da avaliação', required: false, placeholder: 'Síntese dos achados, impressões clínicas e próximos passos...' },
    ],
  },
  // 9. Encaminhamentos
  {
    id: 'section_encaminhamentos', type: 'section', title: 'Encaminhamentos',
    fields: [
      { id: 'pd_encaminhamento_medico', type: 'select', label: 'Encaminhamento médico?', required: false, options: ['Não', 'Sim'] },
      { id: 'pd_encaminhamento_psicopedagogico', type: 'select', label: 'Encaminhamento psicopedagógico?', required: false, options: ['Não', 'Sim'] },
      { id: 'pd_encaminhamento_psiquiatrico', type: 'select', label: 'Encaminhamento psiquiátrico?', required: false, options: ['Não', 'Sim'] },
      { id: 'pd_orientacoes_gerais', type: 'textarea', label: 'Orientações gerais', required: false, placeholder: 'Orientações ao paciente, família ou instituição solicitante...' },
    ],
  },
];

export const DEFAULT_ANAMNESIS_STRUCTURES: Record<string, DefaultSectionDef[]> = {
  'clinica-geral': CLINICA_GERAL_STRUCTURE,
  'geral': CLINICA_GERAL_STRUCTURE,
  'nutricao': NUTRICAO_STRUCTURE,
  'psicologia': PSICOLOGIA_STRUCTURE,
  'psicologia-familiar': PSICOLOGIA_FAMILIAR_STRUCTURE,
  'psicologia-psicodiagnostico': PSICOLOGIA_PSICODIAGNOSTICO_STRUCTURE,
  'fisioterapia': FISIOTERAPIA_STRUCTURE,
};

/** Evolution/session structures (separate from initial anamnesis) */
export const DEFAULT_EVOLUTION_STRUCTURES: Record<string, DefaultSectionDef[]> = {
  'psicologia': PSICOLOGIA_EVOLUCAO_STRUCTURE,
};

/**
 * Get the default structure for a specialty slug.
 * Returns empty array if no default exists.
 */
export function getDefaultAnamnesisStructure(slug: string): DefaultSectionDef[] {
  return DEFAULT_ANAMNESIS_STRUCTURES[slug] || [];
}

/**
 * Get the default evolution/session structure for a specialty slug.
 * Returns empty array if no default exists.
 */
export function getDefaultEvolutionStructure(slug: string): DefaultSectionDef[] {
  return DEFAULT_EVOLUTION_STRUCTURES[slug] || [];
}
