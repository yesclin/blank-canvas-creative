import type { TabKey } from "@/hooks/prontuario";

// Tab key mapping to standard keys
export const TAB_KEY_MAP: Record<string, TabKey> = {
  resumo: 'resumo',
  tratamentos: 'resumo',
  anamnese: 'anamnese',
  sinais_vitais: 'anamnese', // Map vital signs to anamnese for permissions
  odontograma: 'anamnese', // Map odontogram to anamnese for permissions
  tooth_procedures: 'procedimentos', // Map tooth procedures to procedimentos
  fotos_intraorais: 'documentos', // Map intraoral photos to documentos
  evolucao: 'evolucao',
  diagnostico: 'diagnostico',
  exames_solicitacao: 'exames', // Map exam requests to exames
  conduta: 'evolucao', // Map conduct to evolucao for permissions
  procedimentos: 'procedimentos',
  documentos_clinicos: 'prescricoes', // Map documentos clínicos to prescricoes for permissions
  prescricoes: 'prescricoes',
  exames: 'exames',
  documentos: 'documentos',
  consentimentos: 'consentimentos',
  auditoria: 'auditoria',
  alertas: 'resumo', // Map alertas to resumo for permission check
  historico: 'auditoria', // Map historico to auditoria
  imagens: 'documentos', // Map imagens to documentos
  timeline: 'auditoria', // Map timeline to auditoria for permission check
  // Psychology tabs - map to evolucao for permissions
  session_record: 'evolucao',
  therapeutic_goals: 'evolucao',
  therapeutic_plan: 'evolucao',
  plano_terapeutico: 'evolucao',
  plano_acao_crise: 'evolucao',
  // Psychiatry tabs - map to appropriate permissions
  diagnosis_dsm: 'diagnostico',
  psychiatric_prescription: 'prescricoes',
  symptom_evolution: 'evolucao',
  medication_history: 'prescricoes',
  // Nutrition tabs - map to appropriate permissions
  nutritional_assessment: 'anamnese',
  body_measurements: 'anamnese',
  meal_plan: 'evolucao',
  nutritional_evolution: 'evolucao',
  // Aesthetics tabs - map to appropriate permissions
  aesthetic_assessment: 'anamnese',
  aesthetic_procedure: 'procedimentos',
  products_used: 'procedimentos',
  produtos_utilizados: 'procedimentos',
  before_after_photos: 'documentos',
  consent_form: 'consentimentos',
  facial_map: 'procedimentos', // Map facial map to procedimentos
  aesthetic_consent: 'consentimentos', // Map aesthetic consent to consentimentos
  // Physiotherapy tabs - map to appropriate permissions
  functional_assessment: 'anamnese',
  avaliacao_funcional: 'anamnese',
  avaliacao_dor: 'anamnese',
  exercicios_prescritos: 'procedimentos',
  chief_complaint: 'anamnese',
  pain_scale: 'anamnese',
  range_of_motion: 'anamnese',
  physio_therapeutic_plan: 'evolucao',
  applied_exercises: 'procedimentos',
  session_evolution: 'evolucao',
  // Pediatrics tabs - map to appropriate permissions
  anamnese_pediatrica: 'anamnese',
  crescimento_desenvolvimento: 'anamnese',
  avaliacao_clinica_pediatrica: 'anamnese',
  diagnostico_pediatrico: 'diagnostico',
  prescricoes_pediatricas: 'prescricoes',
  vacinacao: 'anamnese',
  pediatric_anamnesis: 'anamnese',
  gestational_history: 'anamnese',
  growth_data: 'anamnese',
  growth_curve: 'anamnese',
  neuropsychomotor_development: 'anamnese',
  vaccines: 'anamnese',
  pediatric_diagnosis: 'diagnostico',
  pediatric_conduct: 'evolucao',
  pediatric_evolution: 'evolucao',
  // Gynecology tabs - map to appropriate permissions
  gyneco_anamnesis: 'anamnese',
  gyneco_data: 'anamnese',
  obstetric_history: 'anamnese',
  gyneco_exam: 'anamnese',
  gyneco_exams_results: 'exames',
  gyneco_diagnosis: 'diagnostico',
  gyneco_conduct: 'evolucao',
  gyneco_evolution: 'evolucao',
  // Ophthalmology tabs - map to appropriate permissions
  ophthalmo_anamnesis: 'anamnese',
  visual_acuity: 'anamnese',
  ophthalmo_exam: 'anamnese',
  intraocular_pressure: 'anamnese',
  ophthalmo_diagnosis: 'diagnostico',
  ophthalmo_complementary_exams: 'exames',
  ophthalmo_conduct: 'evolucao',
  ophthalmo_evolution: 'evolucao',
};
