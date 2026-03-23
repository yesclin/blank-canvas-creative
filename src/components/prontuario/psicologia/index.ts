/**
 * PSICOLOGIA - Componentes do Prontuário
 * 
 * Módulos específicos para a especialidade Psicologia.
 * Cada componente é exclusivo desta especialidade e não deve
 * ser reutilizado por outras especialidades.
 */

export { VisaoGeralPsicologiaBlock } from './VisaoGeralPsicologiaBlock';
export { AnamnesePsicologiaBlock } from './AnamnesePsicologiaBlock';
export { RelatorioPsicologicoBlock } from './RelatorioPsicologicoBlock';
export { RelatorioEscolarBlock } from './RelatorioEscolarBlock';
export { RelatorioJudicialBlock } from './RelatorioJudicialBlock';
export { SessoesPsicologiaBlock } from './SessoesPsicologiaBlock';
export { EvolucaoCasalBlock } from './EvolucaoCasalBlock';
export { PlanoTerapeuticoBlock } from './PlanoTerapeuticoBlock';
export { MetasTerapeuticasBlock } from './MetasTerapeuticasBlock';
export { InstrumentosPsicologicosBlock } from './InstrumentosPsicologicosBlock';
export { TermosConsentimentosPsicologiaBlock } from './TermosConsentimentosPsicologiaBlock';
export { AlertasPsicologiaBlock } from './AlertasPsicologiaBlock';
export { AlertasBannerPsicologia } from './AlertasBannerPsicologia';
export { LaudoPsicologicoBlock } from './LaudoPsicologicoBlock';
export { HistoricoPsicologiaBlock } from './HistoricoPsicologiaBlock';
export { GraficosEvolucaoPsicologia } from './GraficosEvolucaoPsicologia';
export { AnaliseTendenciaPsicologia } from './AnaliseTendenciaPsicologia';

export type { 
  PsicologiaPatientData, 
  PsicologiaClinicalAlert, 
  PsicologiaSummaryData,
  StatusAcompanhamento,
  AnamnesePsicologiaData,
  AnamnesePsicologiaFormData,
  SessaoPsicologia,
  SessaoFormData,
  StatusSessao,
  PlanoTerapeuticoData,
  PlanoTerapeuticoFormData,
  InstrumentoPsicologico,
  InstrumentoFormData,
} from '@/hooks/prontuario/psicologia';

export type {
  AlertaPsicologia,
  TipoAlertaPsicologia,
  SeveridadeAlerta,
} from './AlertasPsicologiaBlock';
