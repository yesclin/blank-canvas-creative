/**
 * CLÍNICA GERAL - Componentes do Prontuário
 * 
 * Módulos específicos para a especialidade Clínica Geral.
 * Cada componente é exclusivo desta especialidade e não deve
 * ser reutilizado por outras especialidades.
 */

export { VisaoGeralBlock } from './VisaoGeralBlock';
export type { 
  PatientBasicData, 
  ClinicalSummaryData, 
  ClinicalAlertItem,
  LastAppointmentData 
} from './VisaoGeralBlock';

export { AnamneseBlock } from './AnamneseBlock';
export type { AnamneseData } from './AnamneseBlock';

export { EvolucoesBlock } from './EvolucoesBlock';
export type { 
  EvolucaoClinica, 
  TipoAtendimento, 
  StatusEvolucao 
} from './EvolucoesBlock';

export { ExameFisicoBlock } from './ExameFisicoBlock';
export type { ExameFisico } from './ExameFisicoBlock';

export { CondutaBlock } from './CondutaBlock';
export type { Conduta } from './CondutaBlock';

export { DocumentosBlock } from './DocumentosBlock';
export type { Documento, CategoriaDocumento } from './DocumentosBlock';

export { AlertasBlock, AlertasBanner } from './AlertasBlock';
export type { AlertaClinico, TipoAlerta, SeveridadeAlerta } from './AlertasBlock';

export { LinhaTempoBlock } from './LinhaTempoBlock';
export type { EventoTimeline, TipoEventoTimeline } from './LinhaTempoBlock';

export { DiagnosticosBlock } from './DiagnosticosBlock';
export type { Diagnostico, TipoDiagnostico, StatusDiagnostico } from './DiagnosticosBlock';

export { PrescricoesBlock } from './PrescricoesBlock';
export type { Prescricao, TipoReceita, StatusPrescricao, ViaAdministracao } from './PrescricoesBlock';

export { DocumentosClinicosBlock } from './DocumentosClinicosBlock';
