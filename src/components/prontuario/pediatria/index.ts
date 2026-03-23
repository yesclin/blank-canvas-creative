// Pediatria - Prontuário Blocks

// Visão Geral
export { 
  VisaoGeralPediatriaBlock,
  type PediatricPatientInfo,
  type PediatricGuardian,
  type PediatricAlert,
  type PediatricDiagnosis,
  type LastAppointmentInfo,
} from './VisaoGeralPediatriaBlock';

// Crescimento e Desenvolvimento
export { 
  CrescimentoDesenvolvimentoBlock,
  MILESTONE_CATEGORIES,
  MILESTONE_STATUS_CONFIG,
  DEFAULT_MILESTONES,
  type GrowthMeasurement,
  type DevelopmentMilestone,
  type MilestoneCategory,
  type GrowthFormData,
} from './CrescimentoDesenvolvimentoBlock';

// Anamnese Pediátrica
export {
  AnamnesePediatriaBlock,
  DELIVERY_TYPES,
  FEEDING_TYPES,
  type AnamnesePediatriaData,
  type AnamnesePediatriaRecord,
  type MedicationItem,
} from './AnamnesePediatriaBlock';

// Avaliação Clínica
export {
  AvaliacaoClinicaPediatriaBlock,
  GENERAL_STATE_OPTIONS,
  CONSCIOUSNESS_OPTIONS,
  HYDRATION_OPTIONS,
  SKIN_COLOR_OPTIONS,
  SKIN_TURGOR_OPTIONS,
  FONTANELLE_OPTIONS,
  type AvaliacaoClinicaPediatriaData,
  type AvaliacaoClinicaRecord,
} from './AvaliacaoClinicaPediatriaBlock';

// Diagnóstico Pediátrico
export {
  DiagnosticoPediatriaBlock,
  COMMON_PEDIATRIC_CID,
  type DiagnosticoItem,
  type DiagnosticoPediatriaData,
  type DiagnosticoPediatriaRecord,
} from './DiagnosticoPediatriaBlock';

// Prescrições Pediátricas
export {
  PrescricoesPediatriaBlock,
  FREQUENCY_OPTIONS,
  ROUTE_OPTIONS,
  COMMON_PEDIATRIC_MEDICATIONS,
  type PrescricaoItem,
  type PrescricaoPediatriaData,
  type PrescricaoPediatriaRecord,
} from './PrescricoesPediatriaBlock';

// Vacinação
export {
  VacinacaoPediatriaBlock,
  PEDIATRIC_VACCINE_CALENDAR,
  APPLICATION_SITES,
  calculateVaccineStatus,
  type VacinaAplicada,
  type VacinacaoPediatriaData,
  type VacinacaoPediatriaRecord,
  type VaccineStatusSummary,
  type VaccineDefinition,
} from './VacinacaoPediatriaBlock';

// Evoluções Clínicas
export {
  EvolucoesPediatriaBlock,
  RESPOSTA_TRATAMENTO_OPTIONS,
  type EvolucaoItem,
  type EvolucoesPediatriaData,
  type EvolucoesPediatriaRecord,
  type RespostaTratamento,
} from './EvolucoesPediatriaBlock';

// Alertas Pediátricos
export {
  AlertasPediatriaBlock,
  AlertasPediatriaBanner,
  TIPO_ALERTA_CONFIG,
  SEVERIDADE_CONFIG,
  COMMON_ALLERGIES,
  COMMON_CHRONIC_DISEASES,
  calculateAlertasSummary,
  type AlertaPediatrico,
  type AlertasPediatriaData,
  type AlertasPediatriaRecord,
  type AlertasSummary,
  type TipoAlertaPediatrico,
  type SeveridadeAlerta,
} from './AlertasPediatriaBlock';

// Linha do Tempo
export {
  LinhaDoTempoPediatriaBlock,
  type TimelineEvent,
  type TimelineData,
  type TimelineEventType,
} from './LinhaDoTempoPediatriaBlock';
