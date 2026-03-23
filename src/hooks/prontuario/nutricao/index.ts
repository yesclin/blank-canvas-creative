/**
 * NUTRIÇÃO - Hooks do Prontuário
 * 
 * Hooks específicos para a especialidade Nutrição.
 * Exporta todos os hooks e tipos necessários para o prontuário nutricional.
 */

// Visão Geral
export { useVisaoGeralNutricaoData, OBJETIVO_NUTRICIONAL_LABELS, STATUS_ACOMPANHAMENTO_LABELS } from './useVisaoGeralNutricaoData';
export type { 
  NutricaoPatientData,
  NutricaoSummaryData,
  NutricaoAlert,
  LastMeasurement,
  ObjetivoNutricional,
  StatusAcompanhamento,
} from './useVisaoGeralNutricaoData';

// Avaliação Nutricional
export { useAvaliacaoNutricionalData, calculateWaistHipRatio } from './useAvaliacaoNutricionalData';
export type { 
  AvaliacaoNutricional,
  AvaliacaoNutricionalFormData,
} from './useAvaliacaoNutricionalData';

// Recordatório Alimentar
export { 
  useRecordatorioAlimentarData,
  TIPO_REFEICAO_LABELS,
  FREQUENCIA_LABELS,
} from './useRecordatorioAlimentarData';
export type { 
  RecordatorioAlimentar,
  RecordatorioFormData,
  Refeicao,
  TipoRecordatorio,
} from './useRecordatorioAlimentarData';

// Plano Alimentar
export { 
  usePlanoAlimentarData,
  DEFAULT_REFEICOES,
} from './usePlanoAlimentarData';
export type { 
  PlanoAlimentar,
  PlanoAlimentarFormData,
  RefeicaoPlano,
  OpcaoRefeicao,
  MacrosPlano,
  StatusPlano,
} from './usePlanoAlimentarData';

// Metas Nutricionais
export { 
  useMetasNutricionaisData,
  TIPO_META_LABELS,
  STATUS_META_LABELS,
  PRIORIDADE_META_LABELS,
} from './useMetasNutricionaisData';
export type { 
  MetaNutricional,
  MetaFormData,
  AcompanhamentoMeta,
  StatusMeta,
  TipoMeta,
  PrioridadeMeta,
} from './useMetasNutricionaisData';

// Evoluções Nutricionais (legacy)
export { 
  useEvolucoesNutricaoData,
  TIPO_CONSULTA_LABELS,
  SINTOMAS_GI_OPTIONS,
} from './useEvolucoesNutricaoData';
export type { 
  EvolucaoNutricao,
  EvolucaoNutricaoFormData,
  StatusEvolucao,
  TipoConsulta,
} from './useEvolucoesNutricaoData';

// Evolução / Retorno (novo módulo otimizado para uso diário)
export {
  useEvolucaoRetornoData,
  NIVEL_ADESAO_LABELS,
  NIVEL_ADESAO_COLORS,
} from './useEvolucaoRetornoData';
export type {
  EvolucaoRetorno,
  EvolucaoRetornoFormData,
  MedidasEvolucao,
  NivelAdesao,
  ComparativoEvolucao,
} from './useEvolucaoRetornoData';

// Templates de Evolução Nutricional
export {
  EVOLUCAO_TEMPLATES,
  TIPO_EVOLUCAO_LABELS,
  getTemplateById,
} from './evolucaoTemplates';
export type {
  TipoEvolucaoNutricao,
  CampoTemplate,
  EvolucaoTemplate,
} from './evolucaoTemplates';

// Anamnese Nutricional
export { 
  useAnamneseNutricionalData,
  INITIAL_NUTRICAO_FORM,
  calcularIMC,
  classificarIMC,
} from './useAnamneseNutricionalData';
export type { 
  AnamneseNutricional,
  AnamneseNutricionalFormData,
} from './useAnamneseNutricionalData';

// Avaliação Nutricional Inicial (novo módulo)
export {
  useAvaliacaoNutricionalInicialData,
  OBJETIVOS_NUTRICIONAIS_OPTIONS,
  RESTRICOES_OPTIONS,
  ALERGIAS_OPTIONS,
  INTOLERANCIAS_OPTIONS as AVALIACAO_INTOLERANCIAS_OPTIONS,
  SUPLEMENTOS_OPTIONS,
} from './useAvaliacaoNutricionalInicialData';
export type {
  AvaliacaoNutricionalInicial,
  AvaliacaoNutricionalInicialFormData,
} from './useAvaliacaoNutricionalInicialData';

// Avaliação Clínica / Bioquímica
export { 
  useAvaliacaoClinicaData,
  SINAIS_SINTOMAS_NUTRICAO,
  EXAMES_COMUNS_NUTRICAO,
} from './useAvaliacaoClinicaData';
export type { 
  AvaliacaoClinica,
  AvaliacaoClinicaFormData,
  ExameLaboratorial,
} from './useAvaliacaoClinicaData';

// Diagnóstico Nutricional
export { 
  useDiagnosticoNutricionalData,
  DIAGNOSTICOS_NUTRICIONAIS_COMUNS,
  STATUS_DIAGNOSTICO_LABELS,
} from './useDiagnosticoNutricionalData';
export type { 
  DiagnosticoNutricional,
  DiagnosticoFormData,
  StatusDiagnostico,
} from './useDiagnosticoNutricionalData';

// Alertas Nutricionais
export { 
  useAlertasNutricaoData,
  TIPO_ALERTA_NUTRICAO_LABELS,
  ALERGIAS_ALIMENTARES_COMUNS,
  RESTRICOES_COMUNS,
} from './useAlertasNutricaoData';
export type { 
  AlertaNutricional,
  AlertaNutricionalFormData,
  TipoAlertaNutricao,
  SeveridadeAlerta,
} from './useAlertasNutricaoData';

// Linha do Tempo / Histórico
export { 
  useLinhaTempoNutricaoData,
  TIPO_EVENTO_NUTRICAO_CONFIG,
} from './useLinhaTempoNutricaoData';
export type { 
  EventoTimelineNutricao,
  TipoEventoNutricao,
} from './useLinhaTempoNutricaoData';

// Reutiliza o hook de Documentos da Clínica Geral (mesma estrutura e bucket)
export { useDocumentosData as useDocumentosNutricaoData } from '@/hooks/prontuario/clinica-geral/useDocumentosData';
