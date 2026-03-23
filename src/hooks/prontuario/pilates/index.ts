/**
 * Hooks especializados para o prontuário de Pilates
 */

export { 
  useAvaliacaoFuncionalPilatesData,
  getEmptyAvaliacaoFormPilates,
  MOBILIDADE_OPTIONS,
  FORCA_FUNCIONAL_OPTIONS,
  EQUILIBRIO_PILATES_OPTIONS,
  CORE_CONTROL_OPTIONS,
  RESPIRACAO_OPTIONS,
  REGIOES_MOBILIDADE,
  TESTES_FUNCIONAIS_PILATES,
  type AvaliacaoFuncionalPilatesData,
  type AvaliacaoFuncionalPilatesFormData,
} from './useAvaliacaoFuncionalPilatesData';

export {
  useVisaoGeralPilatesData,
  STATUS_ACOMPANHAMENTO_PILATES,
  OBJETIVOS_PILATES,
  type PilatesPatientData,
  type PilatesSummaryData,
  type PilatesAlert,
} from './useVisaoGeralPilatesData';

export {
  useAnamneseFuncionalPilatesData,
  getEmptyAnamneseFuncionalPilatesForm,
  NIVEL_ATIVIDADE_OPTIONS,
  OBJETIVOS_PILATES_OPTIONS,
  type AnamneseFuncionalPilatesData,
  type AnamneseFuncionalPilatesFormData,
} from './useAnamneseFuncionalPilatesData';

export {
  useAvaliacaoPosturalPilatesData,
  getEmptyAvaliacaoPosturalForm,
  ALINHAMENTO_OPTIONS,
  REGIOES_POSTURAIS,
  DESVIOS_POSTURAIS_OPTIONS,
  ENCURTAMENTOS_OPTIONS,
  type AvaliacaoPosturalPilatesData,
  type AvaliacaoPosturalPilatesFormData,
  type ImagemPostural,
} from './useAvaliacaoPosturalPilatesData';

export {
  usePlanoExerciciosPilatesData,
  getEmptyPlanoExerciciosForm,
  createEmptyExercicio,
  APARELHOS_PILATES,
  FOCOS_TREINO,
  EXERCICIOS_PILATES,
  type PlanoExerciciosPilatesData,
  type PlanoExerciciosPilatesFormData,
  type ExercicioPrescrito,
} from './usePlanoExerciciosPilatesData';

export {
  useSessoesPilatesData,
  getEmptySessaoForm,
  createEmptyExercicioRealizado,
  RESPOSTA_ALUNO_OPTIONS,
  AJUSTES_COMUNS,
  type SessaoPilatesData,
  type SessaoPilatesFormData,
  type ExercicioRealizado,
} from './useSessoesPilatesData';

export {
  useExamesDocumentosPilatesData,
  getEmptyUploadForm,
  formatFileSize,
  CATEGORIA_DOCUMENTO_OPTIONS,
  type DocumentoPilates,
  type UploadDocumentoFormData,
} from './useExamesDocumentosPilatesData';

export {
  useAlertasFuncionaisPilatesData,
  getEmptyAlertaForm,
  alertaToFormData,
  TIPO_ALERTA_OPTIONS,
  SEVERIDADE_OPTIONS,
  type AlertaFuncionalPilates,
  type AlertaFuncionalFormData,
} from './useAlertasFuncionaisPilatesData';

export {
  useHistoricoPilatesData,
  TIMELINE_TYPES,
  type TimelineItem,
  type TimelineType,
} from './useHistoricoPilatesData';
