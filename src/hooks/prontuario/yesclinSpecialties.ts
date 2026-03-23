/**
 * YESCLIN SUPPORTED SPECIALTIES
 * 
 * This is the controlled list of specialties that Yesclin actually supports
 * with implemented clinical modules. This list should NOT be confused with
 * the global specialties catalog used for clinic configuration.
 * 
 * The prontuário specialty selector MUST use this list to ensure:
 * 1. Only specialties with real implementations are shown
 * 2. No empty or unimplemented screens are displayed
 * 3. The system appears specialized, not generic
 */

import type { SpecialtyKey } from './useActiveSpecialty';

/**
 * Clinical Block Keys - the ONLY valid block identifiers in Yesclin
 */
export type ClinicalBlockKey = 
  | 'resumo'
  | 'anamnese'
  | 'exame_fisico'
  | 'evolucao'
  | 'diagnostico'
  | 'prescricoes'
  | 'conduta'
  | 'documentos_clinicos'      // Receituário e Atestado
  | 'exames'
  | 'timeline'
  | 'alertas'
  | 'historico'
  | 'procedimentos_realizados'
  | 'produtos_utilizados'
  | 'before_after_photos'
  | 'termos_consentimentos'
  | 'facial_map'
  | 'odontograma'
  | 'instrumentos' // Instrumentos / Testes Psicológicos
  // Nutrition-specific blocks (10 blocos - ordem fixa)
  | 'avaliacao_nutricional'    // Avaliação Nutricional Inicial
  | 'avaliacao_clinica'        // Avaliação Antropométrica
  | 'diagnostico_nutricional'  // Diagnóstico Nutricional
  | 'plano_alimentar'          // Plano Alimentar
  // Fisioterapia-specific blocks
  | 'avaliacao_funcional'      // Avaliação Funcional (força, ADM, postura)
  | 'avaliacao_dor'            // Avaliação de Dor (EVA, localização)
  | 'exercicios_prescritos'    // Exercícios Prescritos (programa domiciliar)
  // Pediatria-specific blocks
  | 'anamnese_pediatrica'      // Anamnese Pediátrica (histórico neonatal, Apgar)
  | 'crescimento_desenvolvimento' // Crescimento e Desenvolvimento (percentis, marcos)
  | 'avaliacao_clinica_pediatrica' // Avaliação Clínica Pediátrica (sinais vitais, exame físico)
  | 'diagnostico_pediatrico'   // Diagnóstico Pediátrico (CID-10)
  | 'prescricoes_pediatricas'  // Prescrições Pediátricas (dose por peso)
  | 'vacinacao';               // Registro de Vacinação (calendário PNI)

export interface YesclinSpecialty {
  key: SpecialtyKey;
  name: string;
  description: string;
  /** Clinical blocks enabled for this specialty */
  enabledBlocks: ClinicalBlockKey[];
  /** Icon name from lucide-react (optional) */
  icon?: string;
}

/**
 * The definitive list of specialties supported by Yesclin's prontuário.
 * 
 * IMPORTANT: This list represents the actual functional scope of the system.
 * Do NOT add specialties here unless their clinical modules are fully implemented.
 */
/**
 * CLÍNICA GERAL - Blocos clínicos exclusivos (10 blocos)
 * 
 * Prontuário focado em atendimento médico ambulatorial com:
 * 1. Visão Geral - resumo do paciente
 * 2. Anamnese - histórico clínico com versionamento
 * 3. Evoluções - registros de consultas
 * 4. Exame Físico - sinais vitais e medidas
 * 5. Hipóteses Diagnósticas - CID-10
 * 6. Plano / Conduta - orientações terapêuticas
 * 7. Prescrições - receitas médicas
 * 8. Exames / Documentos - arquivos e resultados
 * 9. Alertas Clínicos - alergias, medicamentos, condições
 * 10. Histórico / Linha do Tempo - cronologia de atendimentos
 * 
 * NÃO inclui: Odontograma, Mapa Facial, Fotos Antes/Depois, 
 * Instrumentos Psicológicos, Procedimentos estéticos
 */
const CLINICA_GERAL_BLOCKS: ClinicalBlockKey[] = [
  'resumo',           // 1. Visão Geral
  'anamnese',         // 2. Anamnese
  'evolucao',         // 3. Evoluções
  'exame_fisico',     // 4. Exame Físico
  'diagnostico',      // 5. Hipóteses Diagnósticas (CID-10)
  'conduta',          // 6. Plano / Conduta
  'documentos_clinicos', // 7. Documentos Clínicos (Receituário / Atestado)
  'prescricoes',      // 8. Prescrições
  'exames',           // 9. Exames / Documentos
  'alertas',          // 10. Alertas Clínicos
  'timeline',         // 11. Histórico / Linha do Tempo
];

export const YESCLIN_SUPPORTED_SPECIALTIES: YesclinSpecialty[] = [
  {
    key: 'geral',
    name: 'Clínica Geral',
    description: 'Atendimento médico ambulatorial com evoluções, conduta e acompanhamento clínico',
    enabledBlocks: CLINICA_GERAL_BLOCKS,
    icon: 'Stethoscope',
  },
  /**
   * PSICOLOGIA - Blocos clínicos específicos
   * 
   * Prontuário focado em acompanhamento terapêutico com:
   * - Visão geral do paciente
   * - Anamnese psicológica (história pessoal, familiar, queixa principal)
   * - Registro de sessões (evoluções)
   * - Hipóteses diagnósticas (CID-10/DSM-5)
   * - Plano terapêutico e conduta
   * - Linha do tempo das sessões
   * - Alertas clínicos (medicamentos em uso, condições relevantes)
   * - Histórico completo de atendimentos
   * - Termos de consentimento (LGPD, sigilo terapêutico)
   * 
   * NÃO inclui: Exame físico, Prescrições médicas, Odontograma, 
   * Mapa Facial, procedimentos estéticos
   */
  {
    key: 'psicologia',
    name: 'Psicologia',
    description: 'Acompanhamento terapêutico com registro de sessões, plano terapêutico e hipóteses diagnósticas',
    enabledBlocks: [
      'resumo',           // Visão Geral do paciente
      'anamnese',         // Anamnese Psicológica (história, queixa, contexto)
      'evolucao',         // Registro de Sessões
      'diagnostico',      // Hipóteses Diagnósticas (CID-10/DSM-5)
      'conduta',          // Plano Terapêutico
      'instrumentos',     // Instrumentos / Testes Psicológicos
      'timeline',         // Linha do Tempo das sessões
      'alertas',          // Alertas clínicos (medicamentos, condições)
      'historico',        // Histórico de atendimentos
      'termos_consentimentos', // Termos de consentimento
    ],
    icon: 'Brain',
  },
  /**
   * NUTRIÇÃO - Blocos clínicos específicos
   * 
   * Prontuário focado em avaliação e acompanhamento nutricional com:
   * - Visão geral do paciente (peso atual, IMC, objetivo)
   * - Avaliação nutricional (antropometria, bioimpedância, dobras cutâneas)
   * - Recordatório alimentar (inquérito dietético 24h/habitual)
   * - Plano alimentar (macros, refeições, orientações)
   * - Metas e acompanhamento (objetivos, evolução de peso)
   * - Evoluções clínicas
   * - Exames laboratoriais (lipidograma, glicemia, vitaminas)
   * - Linha do tempo
   * - Histórico completo
   * 
   * NÃO inclui: Odontograma, Mapa Facial, Prescrições Médicas,
   * Instrumentos Psicológicos, Alertas de Risco
   */
  /**
   * NUTRIÇÃO - Blocos clínicos exclusivos (11 blocos)
   * 
   * Prontuário focado em avaliação e acompanhamento nutricional:
   * 1. Visão Geral - resumo do paciente (peso, IMC, objetivo)
   * 2. Anamnese Nutricional - histórico alimentar e hábitos
   * 3. Avaliação Antropométrica - medidas corporais e bioimpedância
   * 4. Avaliação Clínica / Bioquímica - exames laboratoriais
   * 5. Diagnóstico Nutricional - classificação do estado nutricional
   * 6. Plano Alimentar - prescrição dietética com macros
   * 7. Evoluções Nutricionais - registros de consultas
   * 8. Evolução Corporal - gráficos de peso e medidas
   * 9. Exames / Documentos - arquivos e resultados
   * 10. Alertas Nutricionais - alergias, restrições, intolerâncias
   * 11. Histórico / Linha do Tempo - cronologia de atendimentos
   * 
   * NÃO inclui: Prescrições médicas, Odontograma, Mapa Facial,
   * Instrumentos Psicológicos
   */
  {
    key: 'nutricao',
    name: 'Nutrição',
    description: 'Avaliação nutricional completa, plano alimentar e acompanhamento de metas',
    enabledBlocks: [
      'resumo',                   // 1. Visão Geral
      'anamnese',                 // 2. Anamnese Nutricional
      'avaliacao_nutricional',    // 3. Avaliação Nutricional Inicial
      'avaliacao_clinica',        // 4. Avaliação Antropométrica
      'diagnostico_nutricional',  // 5. Diagnóstico Nutricional
      'plano_alimentar',          // 6. Plano Alimentar
      'evolucao',                 // 7. Evoluções Nutricionais
      'exames',                   // 8. Exames / Documentos
      'timeline',                 // 9. Linha do Tempo
      'alertas',                  // 10. Alertas Nutricionais
    ],
    icon: 'Apple',
  },
  /**
   * FISIOTERAPIA - Blocos clínicos exclusivos (10 blocos)
   * 
   * Prontuário focado em reabilitação e cinesioterapia:
   * 1. Visão Geral - resumo do paciente (alertas, plano ativo)
   * 2. Anamnese - história clínica e queixa principal
   * 3. Avaliação Funcional - força, amplitude, postura
   * 4. Avaliação de Dor - escala EVA, localização
   * 5. Diagnóstico Funcional - CIF, hipóteses
   * 6. Plano Terapêutico - objetivos e técnicas
   * 7. Sessões - registro de atendimentos
   * 8. Exercícios Prescritos - programa domiciliar
   * 9. Exames / Documentos - laudos e imagens
   * 10. Alertas Funcionais - restrições, contraindicações
   * 11. Histórico / Linha do Tempo - cronologia
   * 
   * NÃO inclui: Prescrições médicas, Medicamentos, Procedimentos invasivos,
   * Mapa Facial, Odontograma, Instrumentos Psicológicos
   */
  {
    key: 'fisioterapia',
    name: 'Fisioterapia',
    description: 'Avaliação funcional, diagnóstico fisioterapêutico e acompanhamento de sessões',
    enabledBlocks: [
      'resumo',              // 1. Visão Geral
      'anamnese',            // 2. Anamnese
      'avaliacao_funcional', // 3. Avaliação Funcional (força, ADM, postura)
      'avaliacao_dor',       // 4. Avaliação de Dor (EVA, localização)
      'diagnostico',         // 5. Diagnóstico Funcional
      'conduta',             // 6. Plano Terapêutico
      'evolucao',            // 7. Sessões de Fisioterapia
      'exercicios_prescritos', // 8. Exercícios Prescritos
      'exames',              // 9. Exames / Documentos
      'alertas',             // 10. Alertas Funcionais
      'timeline',            // 11. Histórico / Linha do Tempo
    ],
    icon: 'Activity',
  },
  /**
   * PILATES - Blocos clínicos independentes (9 blocos)
   * 
   * Prontuário focado em avaliação funcional, postural e sessões de Pilates:
   * 1. Visão Geral - resumo do aluno
   * 2. Anamnese - histórico e objetivos
   * 3. Avaliação Funcional Pilates - mobilidade, força, core, respiração, testes
   * 4. Plano de Exercícios - programa personalizado
   * 5. Sessões - registro de aulas
   * 6. Exames / Documentos - arquivos e atestados
   * 7. Alertas - restrições e cuidados
   * 8. Linha do Tempo - histórico de acompanhamento
   * 
   * NÃO inclui: Prescrições médicas, Odontograma, Mapa Facial
   */
  {
    key: 'pilates',
    name: 'Pilates',
    description: 'Avaliação funcional/postural e acompanhamento de sessões',
    enabledBlocks: [
      'resumo',              // 1. Visão Geral
      'anamnese',            // 2. Anamnese
      'avaliacao_funcional', // 3. Avaliação Funcional Pilates
      'conduta',             // 4. Plano de Exercícios
      'evolucao',            // 5. Sessões de Pilates
      'exames',              // 6. Exames / Documentos
      'alertas',             // 7. Alertas
      'timeline',            // 8. Linha do Tempo
    ],
    icon: 'Dumbbell',
  },
  /**
   * ESTÉTICA / HARMONIZAÇÃO FACIAL - Blocos clínicos exclusivos (11 blocos)
   * 
   * Prontuário focado em procedimentos estéticos e harmonização:
   * 1. Visão Geral - resumo do paciente e alertas
   * 2. Anamnese Estética - histórico e expectativas
   * 3. Avaliação Estética - análise facial e corporal
   * 4. Evoluções - registros de procedimentos
   * 5. Procedimentos Realizados - procedimentos executados
   * 6. Produtos Utilizados - insumos e rastreabilidade
   * 7. Fotos Antes / Depois - comparação visual
   * 8. Termos de Consentimento - aceite digital
   * 9. Mapa Facial - pontos de aplicação interativos
   * 10. Alertas Clínicos - alergias, contraindicações, riscos
   * 11. Linha do Tempo - histórico cronológico consolidado
   * 
   * NÃO inclui: Prescrição médica tradicional, Diagnóstico médico formal,
   * CID obrigatório, Odontograma, Plano alimentar, Sessões fisioterapêuticas
   */
  {
    key: 'estetica',
    name: 'Estética / Harmonização Facial',
    description: 'Mapa facial interativo, procedimentos estéticos e termos de consentimento',
    enabledBlocks: [
      'resumo',                   // 1. Visão Geral
      'anamnese',                 // 2. Anamnese Estética
      'exame_fisico',             // 3. Avaliação Estética
      'evolucao',                 // 4. Evoluções
      'procedimentos_realizados', // 5. Procedimentos
      'produtos_utilizados',      // 6. Produtos Utilizados
      'before_after_photos',      // 7. Fotos Antes / Depois
      'termos_consentimentos',    // 8. Termos
      'facial_map',               // 9. Mapa Facial
      'alertas',                  // 10. Alertas Clínicos
      'timeline',                 // 11. Linha do Tempo
    ],
    icon: 'Sparkles',
  },
  /**
   * ODONTOLOGIA - Blocos clínicos exclusivos (14 blocos)
   * 
   * Prontuário focado em saúde bucal:
   * 1. Visão Geral - resumo do paciente
   * 2. Anamnese Odontológica - histórico e queixa
   * 3. Avaliação Clínica - exame clínico bucal
   * 4. Odontograma Digital - mapeamento dental FDI
   * 5. Diagnóstico Odontológico - hipóteses e CID
   * 6. Plano de Tratamento - procedimentos planejados
   * 7. Evoluções Odontológicas - registros de sessões
   * 8. Procedimentos Realizados - tratamentos executados
   * 9. Materiais Utilizados - rastreabilidade de insumos
   * 10. Exames / Documentos - radiografias, tomografias
   * 11. Fotos Antes / Depois - documentação visual
   * 12. Alertas - alergias e contraindicações
   * 13. Histórico / Linha do Tempo
   * 
   * NÃO inclui: Mapa Facial Estético, Plano Alimentar, Sessões Fisioterapêuticas,
   * Avaliações Nutricionais, Instrumentos Psicológicos
   */
  {
    key: 'odontologia',
    name: 'Odontologia',
    description: 'Odontograma digital, procedimentos por dente e rastreabilidade de materiais',
    enabledBlocks: [
      'resumo',                   // 1. Visão Geral
      'anamnese',                 // 2. Anamnese Odontológica
      'exame_fisico',             // 3. Avaliação Clínica
      'odontograma',              // 4. Odontograma Digital
      'diagnostico',              // 5. Diagnóstico Odontológico
      'conduta',                  // 6. Plano de Tratamento
      'evolucao',                 // 7. Evoluções Odontológicas
      'procedimentos_realizados', // 8. Procedimentos Realizados
      'produtos_utilizados',      // 9. Materiais Utilizados
      'exames',                   // 10. Exames / Documentos
      'before_after_photos',      // 11. Fotos Antes / Depois
      'alertas',                  // 12. Alertas
      'timeline',                 // 13. Histórico / Linha do Tempo
    ],
    icon: 'Smile',
  },
  /**
   * DERMATOLOGIA - Blocos clínicos exclusivos (11 blocos)
   * 
   * Prontuário focado em diagnóstico e acompanhamento dermatológico:
   * 1. Visão Geral - resumo do paciente e alertas
   * 2. Anamnese Dermatológica - histórico, queixas cutâneas, fototipo
   * 3. Exame Dermatológico - inspeção da pele, lesões, dermatoscopia
   * 4. Diagnóstico Dermatológico - hipóteses diagnósticas (CID-10)
   * 5. Prescrições - medicações tópicas e sistêmicas
   * 6. Plano / Conduta - orientações terapêuticas
   * 7. Evoluções - registros de retornos e acompanhamento
   * 8. Exames / Documentos - biópsias, dermatoscopia, laudos
   * 9. Fotos Clínicas - documentação fotográfica de lesões
   * 10. Alertas Clínicos - alergias, fotossensibilidade, medicamentos
   * 11. Histórico / Linha do Tempo - cronologia de atendimentos
   * 
   * NÃO inclui: Odontograma, Mapa Facial Estético, Plano Alimentar,
   * Instrumentos Psicológicos, Procedimentos Estéticos (harmonização)
   */
  {
    key: 'dermatologia',
    name: 'Dermatologia',
    description: 'Diagnóstico dermatológico, acompanhamento clínico e prescrição médica',
    enabledBlocks: [
      'resumo',           // 1. Visão Geral
      'anamnese',         // 2. Anamnese Dermatológica
      'exame_fisico',     // 3. Exame Dermatológico
      'diagnostico',      // 4. Diagnóstico Dermatológico (CID-10)
      'prescricoes',      // 5. Prescrições
      'conduta',          // 6. Plano / Conduta
      'evolucao',         // 7. Evoluções
      'exames',           // 8. Exames / Documentos
      'before_after_photos', // 9. Fotos Clínicas
      'alertas',          // 10. Alertas Clínicos
      'timeline',         // 11. Histórico / Linha do Tempo
    ],
    icon: 'Scan',
  },
  /**
   * PEDIATRIA - Blocos clínicos exclusivos (12 blocos)
   * 
   * Prontuário focado no acompanhamento pediátrico:
   * 1. Visão Geral - resumo do paciente pediátrico
   * 2. Anamnese Pediátrica - histórico neonatal, Apgar, amamentação
   * 3. Crescimento e Desenvolvimento - peso, altura, PC, IMC, marcos DNPM
   * 4. Avaliação Clínica - sinais vitais pediátricos, exame físico
   * 5. Diagnóstico Pediátrico - hipóteses diagnósticas (CID-10)
   * 6. Prescrições Pediátricas - dosagem por peso, receitas
   * 7. Vacinação - calendário PNI, doses aplicadas
   * 8. Evoluções - registros de consultas
   * 9. Exames / Documentos - laudos e arquivos
   * 10. Alertas Pediátricos - alergias, condições crônicas
   * 11. Linha do Tempo - cronologia de atendimentos
   * 
   * NÃO inclui: Odontograma, Mapa Facial, Instrumentos Psicológicos,
   * Procedimentos Estéticos
   */
  {
    key: 'pediatria',
    name: 'Pediatria',
    description: 'Acompanhamento pediátrico com crescimento, vacinação e desenvolvimento',
    enabledBlocks: [
      'resumo',                       // 1. Visão Geral
      'anamnese_pediatrica',          // 2. Anamnese Pediátrica
      'crescimento_desenvolvimento',  // 3. Crescimento e Desenvolvimento
      'avaliacao_clinica_pediatrica', // 4. Avaliação Clínica
      'diagnostico_pediatrico',       // 5. Diagnóstico Pediátrico
      'prescricoes_pediatricas',      // 6. Prescrições Pediátricas
      'vacinacao',                    // 7. Vacinação
      'evolucao',                     // 8. Evoluções
      'exames',                       // 9. Exames / Documentos
      'alertas',                      // 10. Alertas Pediátricos
      'timeline',                     // 11. Linha do Tempo
    ],
    icon: 'Baby',
  },
];

/**
 * Display labels for specialty keys (used for UI when no specific specialty is selected)
 */
export const YESCLIN_SPECIALTY_LABELS: Record<SpecialtyKey, string> = {
  geral: 'Clínica Geral',
  odontologia: 'Odontologia',
  psicologia: 'Psicologia',
  psiquiatria: 'Psiquiatria',
  nutricao: 'Nutrição',
  estetica: 'Estética',
  dermatologia: 'Dermatologia',
  fisioterapia: 'Fisioterapia',
  pilates: 'Pilates',
  pediatria: 'Pediatria',
  ginecologia: 'Ginecologia',
  oftalmologia: 'Oftalmologia',
  custom: 'Personalizado',
};

/**
 * Get enabled clinical blocks for a specialty key
 */
export function getEnabledBlocksForSpecialty(key: SpecialtyKey): ClinicalBlockKey[] {
  const specialty = YESCLIN_SUPPORTED_SPECIALTIES.find(s => s.key === key);
  return specialty?.enabledBlocks || YESCLIN_SUPPORTED_SPECIALTIES[0].enabledBlocks;
}

/**
 * Check if a clinical block is enabled for a given specialty
 */
export function isBlockEnabledForSpecialty(blockKey: ClinicalBlockKey, specialtyKey: SpecialtyKey): boolean {
  const blocks = getEnabledBlocksForSpecialty(specialtyKey);
  return blocks.includes(blockKey);
}

/**
 * Maps specialty name patterns to Yesclin specialty keys.
 * Used to resolve database specialty names to system keys.
 */
export const SPECIALTY_NAME_TO_KEY_MAP: Record<string, SpecialtyKey> = {
  'clínica geral': 'geral',
  'clinica geral': 'geral',
  'clínica médica': 'geral',
  'clinica medica': 'geral',
  'medicina geral': 'geral',
  'odontologia': 'odontologia',
  'dentista': 'odontologia',
  'psicologia': 'psicologia',
  'psicólogo': 'psicologia',
  'psicologo': 'psicologia',
  'nutrição': 'nutricao',
  'nutricao': 'nutricao',
  'nutricionista': 'nutricao',
  'estética': 'estetica',
  'estetica': 'estetica',
  'harmonização facial': 'estetica',
  'harmonizacao facial': 'estetica',
  'dermatologia': 'dermatologia',
  'dermatologista': 'dermatologia',
  'dermato': 'dermatologia',
  'fisioterapia': 'fisioterapia',
  'fisioterapeuta': 'fisioterapia',
  'pilates': 'pilates',
  'studio pilates': 'pilates',
  'pilates clínico': 'pilates',
  'pediatria': 'pediatria',
  'pediatra': 'pediatria',
};

/**
 * Resolves a specialty name (from database) to a Yesclin specialty key.
 * Returns 'geral' if no match is found.
 */
export function resolveSpecialtyKey(name: string): SpecialtyKey {
  const normalized = name.toLowerCase().trim();
  
  // Check exact match first
  if (SPECIALTY_NAME_TO_KEY_MAP[normalized]) {
    return SPECIALTY_NAME_TO_KEY_MAP[normalized];
  }
  
  // Check if name contains known pattern
  for (const [pattern, key] of Object.entries(SPECIALTY_NAME_TO_KEY_MAP)) {
    if (normalized.includes(pattern) || pattern.includes(normalized)) {
      return key;
    }
  }
  
  // Default to general
  return 'geral';
}
