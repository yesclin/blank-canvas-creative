/**
 * PSICOLOGIA - Hooks do Prontuário
 * 
 * Hooks específicos para a especialidade Psicologia.
 */

export { useVisaoGeralPsicologiaData } from './useVisaoGeralPsicologiaData';
export type { 
  PsicologiaPatientData, 
  PsicologiaClinicalAlert, 
  PsicologiaSummaryData,
  StatusAcompanhamento,
} from './useVisaoGeralPsicologiaData';

export { useAnamnesePsicologiaData } from './useAnamnesePsicologiaData';
export type { 
  AnamnesePsicologiaData,
  AnamnesePsicologiaFormData,
} from './useAnamnesePsicologiaData';

export { useDynamicAnamnesisRecords } from './useDynamicAnamnesisRecords';
export type { DynamicAnamnesisRecord } from './useDynamicAnamnesisRecords';

export { useSessoesPsicologiaData, INTERVENCOES_OPTIONS, ENCAMINHAMENTOS_OPTIONS, statusSessaoConfig } from './useSessoesPsicologiaData';
export type { 
  SessaoPsicologia,
  SessaoFormData,
  StatusSessao,
} from './useSessoesPsicologiaData';

export { usePlanoTerapeuticoData } from './usePlanoTerapeuticoData';
export type { 
  PlanoTerapeuticoData,
  PlanoTerapeuticoFormData,
} from './usePlanoTerapeuticoData';

export { useMetasTerapeuticasData } from './useMetasTerapeuticasData';
export type {
  TherapeuticGoal,
  GoalUpdate,
  GoalFormData,
} from './useMetasTerapeuticasData';

export { useInstrumentosPsicologicosData } from './useInstrumentosPsicologicosData';
export type { 
  InstrumentoPsicologico,
  InstrumentoFormData,
} from './useInstrumentosPsicologicosData';

export { useAlertasPsicologiaData } from './useAlertasPsicologiaData';

export { useRelatorioPsicologicoData } from './useRelatorioPsicologicoData';
export type { ReportSection, RelatorioPsicologicoAggregated } from './useRelatorioPsicologicoData';
