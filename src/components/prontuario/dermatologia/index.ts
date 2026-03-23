/**
 * DERMATOLOGIA - Módulo do Prontuário
 * 
 * Componentes específicos para a especialidade de Dermatologia.
 * Foco em diagnóstico dermatológico, acompanhamento clínico e prescrição médica.
 */

export { VisaoGeralDermatoBlock } from './VisaoGeralDermatoBlock';
export type { 
  DermatoPatientData,
  DermatoClinicalData,
  DermatoAlertItem,
  DermatoLastAppointment 
} from './VisaoGeralDermatoBlock';

export { AnamneseDermatoBlock } from './AnamneseDermatoBlock';
export type { 
  AnamneseDermatoData,
  DermatoSymptoms 
} from './AnamneseDermatoBlock';

export { AnamneseDermatologiaBlock } from './AnamneseDermatologiaBlock';

export { ExameDermatoBlock } from './ExameDermatoBlock';
export type { 
  ExameDermatoData,
  LesionDescription 
} from './ExameDermatoBlock';
export { 
  LESION_TYPES,
  BODY_LOCATIONS,
  LESION_COLORS,
  LESION_SHAPES,
  LESION_BORDERS,
  LESION_SURFACES,
  DISTRIBUTION_PATTERNS 
} from './ExameDermatoBlock';

export { DiagnosticoDermatoBlock } from './DiagnosticoDermatoBlock';
export type { DiagnosticoDermatoData } from './DiagnosticoDermatoBlock';
export { DiagnosticoDermatoWrapper } from './DiagnosticoDermatoWrapper';

export { PrescricoesDermatoBlock } from './PrescricoesDermatoBlock';
export type { 
  PrescricaoDermatoData,
  PrescriptionItem 
} from './PrescricoesDermatoBlock';
export { 
  PHARMACEUTICAL_FORMS,
  FREQUENCY_OPTIONS,
  DURATION_OPTIONS 
} from './PrescricoesDermatoBlock';

export { ProcedimentosDermatoBlock } from './ProcedimentosDermatoBlock';
export type { ProcedimentoDermatoItem } from './ProcedimentosDermatoBlock';
export { 
  DERMATOLOGY_PROCEDURE_TYPES,
  DERMATOLOGY_TECHNIQUES 
} from './ProcedimentosDermatoBlock';

export { EvolucoesDermatoBlock } from './EvolucoesDermatoBlock';
export type { EvolucaoDermatoItem } from './EvolucoesDermatoBlock';
export { 
  EVOLUTION_STATUS,
  COMMON_ADVERSE_EFFECTS 
} from './EvolucoesDermatoBlock';

export { ImagensDermatoBlock } from './ImagensDermatoBlock';
export type { 
  ImagemDermatoItem,
  BeforeAfterPair 
} from './ImagensDermatoBlock';
export { IMAGE_TYPES } from './ImagensDermatoBlock';

export { AlertasDermatoBlock } from './AlertasDermatoBlock';
export type { 
  AlertaDermatoItem,
  DermatoAlertType,
  DermatoAlertSeverity 
} from './AlertasDermatoBlock';
export { 
  DERMATO_ALERT_TYPES,
  DERMATO_ALERT_SEVERITY 
} from './AlertasDermatoBlock';

export { LinhaDoTempoDermatoBlock } from './LinhaDoTempoDermatoBlock';
export type { TimelineItem, TimelineRecordType } from './LinhaDoTempoDermatoBlock';
export { TIMELINE_RECORD_TYPES } from './LinhaDoTempoDermatoBlock';

export { PlanoCondutaDermatoBlock } from './PlanoCondutaDermatoBlock';
export type { PlanoCondutaDermatoData } from './PlanoCondutaDermatoBlock';
