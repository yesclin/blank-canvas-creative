/**
 * CLÍNICA GERAL - Hooks do Prontuário
 * 
 * Hooks específicos para a especialidade Clínica Geral.
 */

export { useVisaoGeralData } from './useVisaoGeralData';
export { useAnamneseData } from './useAnamneseData';
export { useEvolucoesData } from './useEvolucoesData';
export { useExameFisicoData } from './useExameFisicoData';
export { useCondutaData } from './useCondutaData';
export { useDocumentosData } from './useDocumentosData';
export { useAlertasData } from './useAlertasData';
export { useLinhaTempoData } from './useLinhaTempoData';
export { useDiagnosticosData } from './useDiagnosticosData';
export { usePrescricoesData } from './usePrescricoesData';

// Re-export types for convenience
export type { 
  Diagnostico, 
  TipoDiagnostico, 
  StatusDiagnostico 
} from './useDiagnosticosData';

export type {
  Prescricao,
  PrescricaoItem,
  TipoReceita,
  StatusPrescricao,
  ViaAdministracao,
} from './usePrescricoesData';
