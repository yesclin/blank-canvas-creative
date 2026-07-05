import type { LucideIcon } from "lucide-react";
import type { TabKey } from "@/hooks/prontuario/useMedicalRecordPermissions";
import type { SpecialtyKey } from "./useActiveSpecialty";

export interface ClinicProntuarioResource {
  id?: string | null;
  clinic_id?: string | null;
  resource_key: string;
  resource_type: string | null;
  specialty_id: string | null;
  specialty_slug: string | null;
  enabled: boolean;
  effective_at?: string | null;
  expires_at?: string | null;
  title?: string | null;
}

export interface EnabledProntuarioTab {
  id: string;
  label: string;
  icon: LucideIcon;
}

export const PRONTUARIO_SPECIALTY_SLUG_ALIASES: Record<string, SpecialtyKey> = {
  aesthetics: "estetica",
  aesthetic: "estetica",
  estetica: "estetica",
  estética: "estetica",
  psychology: "psicologia",
  psicologia: "psicologia",
  dentistry: "odontologia",
  dental: "odontologia",
  odontologia: "odontologia",
  nutrition: "nutricao",
  nutricao: "nutricao",
  nutrição: "nutricao",
  physiotherapy: "fisioterapia",
  fisioterapia: "fisioterapia",
  pediatrics: "pediatria",
  pediatria: "pediatria",
  dermatology: "dermatologia",
  dermatologia: "dermatologia",
  pilates: "pilates",
  medical_general: "geral",
  general: "geral",
  geral: "geral",
  other_specialty: "other_specialty",
  outras_especialidades: "other_specialty",
  atendimento_geral: "other_specialty",
  custom: "other_specialty",
};

export const PRONTUARIO_FEATURE_TAB_ALIASES: Record<string, string> = {
  "global.alertas": "alertas",
  clinical_alerts: "alertas",
  alerts: "alertas",
  alertas: "alertas",

  "global.anexos": "exames",
  clinical_attachments: "exames",
  attachments: "exames",
  anexos: "exames",
  exams: "exames",
  exames: "exames",

  "global.consentimentos": "termos_consentimentos",
  clinical_consent_terms: "termos_consentimentos",
  consent_terms: "termos_consentimentos",
  consentimentos: "termos_consentimentos",

  "global.documentos": "documentos_clinicos",
  clinical_documents: "documentos_clinicos",
  documentos_clinicos: "documentos_clinicos",
  documents: "documentos_clinicos",

  "global.timeline": "timeline",
  clinical_timeline: "timeline",
  timeline: "timeline",
  linha_tempo: "timeline",

  "global.evolucao": "evolucao",
  clinical_evolution: "evolucao",
  evolution: "evolucao",
  evolucao: "evolucao",

  "global.prescricao": "prescricoes",
  prescription: "prescricoes",
  prescriptions: "prescricoes",
  prescricoes: "prescricoes",

  "estetica.before_after": "before_after_photos",
  before_after: "before_after_photos",
  before_after_photos: "before_after_photos",

  "estetica.facial_map": "facial_map",
  interactive_map: "facial_map",
  facial_map: "facial_map",

  "estetica.products_used": "produtos_utilizados",
  used_products: "produtos_utilizados",
  products_used: "produtos_utilizados",
  produtos_utilizados: "produtos_utilizados",

  "odontologia.odontogram": "odontograma",
  odontogram: "odontograma",
  odontograma: "odontograma",

  "pediatria.grafico_oms": "crescimento_desenvolvimento",
  growth_charts: "crescimento_desenvolvimento",
  growth_chart: "crescimento_desenvolvimento",
  graficos_oms: "crescimento_desenvolvimento",
  grafico_oms: "crescimento_desenvolvimento",

  "psicologia.escalas": "instrumentos",
  psychological_scales: "instrumentos",
  clinical_scales: "instrumentos",
  escalas_psicologicas: "instrumentos",
  instrumentos: "instrumentos",

  "psicologia.plano_crise": "plano_acao_crise",
  crisis_action_plan: "plano_acao_crise",
  plano_acao_crise: "plano_acao_crise",

  "psicologia.plano_terapeutico": "plano_terapeutico",
  therapeutic_plan: "plano_terapeutico",
  plano_terapeutico: "plano_terapeutico",

  procedures: "procedimentos_realizados",
  procedures_module: "procedimentos_realizados",
  procedimentos: "procedimentos_realizados",
  procedimentos_realizados: "procedimentos_realizados",

  history: "historico",
  historico: "historico",
  histórico: "historico",

  "medical_records.treatment_sessions": "tratamentos",
  treatment_sessions: "tratamentos",
  recurring_sessions: "tratamentos",
};

export const PRONTUARIO_TAB_LABELS: Record<string, string> = {
  tratamentos: "Tratamentos/Sessões",
  alertas: "Alertas Clínicos",
  exames: "Anexos / Exames",
  termos_consentimentos: "Consentimentos",
  documentos_clinicos: "Documentos Clínicos",
  timeline: "Linha do Tempo",
  historico: "Histórico",
  prescricoes: "Prescrição",
  before_after_photos: "Antes e Depois",
  facial_map: "Mapa Facial",
  produtos_utilizados: "Produtos Utilizados",
  odontograma: "Odontograma",
  crescimento_desenvolvimento: "Gráficos OMS",
  instrumentos: "Escalas Psicológicas",
  plano_acao_crise: "Plano de Ação em Crise",
  plano_terapeutico: "Plano Terapêutico",
  procedimentos_realizados: "Procedimentos",
};

export const PRONTUARIO_TAB_ORDER: Record<string, number> = {
  resumo: 10,
  tratamentos: 15,
  anamnese: 20,
  evolucao: 30,
  exame_fisico: 35,
  avaliacao_funcional: 36,
  avaliacao_dor: 37,
  diagnostico: 40,
  conduta: 45,
  plano_alimentar: 46,
  plano_terapeutico: 47,
  prescricoes: 50,
  prescricoes_pediatricas: 51,
  documentos_clinicos: 55,
  termos_consentimentos: 60,
  exames: 65,
  procedimentos_realizados: 70,
  produtos_utilizados: 75,
  before_after_photos: 80,
  facial_map: 85,
  odontograma: 90,
  crescimento_desenvolvimento: 95,
  instrumentos: 100,
  plano_acao_crise: 105,
  alertas: 110,
  timeline: 120,
  historico: 130,
};

export function normalizeProntuarioSpecialtySlug(value: string | null | undefined): SpecialtyKey | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return PRONTUARIO_SPECIALTY_SLUG_ALIASES[normalized] ?? null;
}

export function normalizeProntuarioFeatureTab(value: string | null | undefined): string | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase().replace(/[\s-]+/g, "_");
  return PRONTUARIO_FEATURE_TAB_ALIASES[normalized] ?? PRONTUARIO_FEATURE_TAB_ALIASES[value] ?? null;
}

export function isProntuarioResourceActive(resource: ClinicProntuarioResource, now = new Date()): boolean {
  if (!resource.enabled) return false;
  if (resource.effective_at && new Date(resource.effective_at) > now) return false;
  if (resource.expires_at && new Date(resource.expires_at) <= now) return false;
  return true;
}

export function doesResourceApplyToSpecialty(
  resource: ClinicProntuarioResource,
  specialtyId: string | null | undefined,
  specialtyKey: SpecialtyKey,
  clinicSpecialtyKeys: Set<string>,
): boolean {
  const resourceSpecialtyKey = normalizeProntuarioSpecialtySlug(resource.specialty_slug);

  if (!resource.specialty_id && !resourceSpecialtyKey) return true;
  if (resourceSpecialtyKey === specialtyKey) return true;
  if (resource.specialty_id && specialtyId && resource.specialty_id === specialtyId) return true;

  // Legacy compatibility: older Super Admin rows used English catalog slugs
  // (psychology/aesthetics/dentistry) even when the clinic did not have that
  // exact specialty record. Do not hide an enabled clinic resource solely
  // because its catalog specialty is absent from this clinic.
  if (resourceSpecialtyKey && !clinicSpecialtyKeys.has(resourceSpecialtyKey)) {
    return true;
  }

  return false;
}

export function getProntuarioResourceTab(resource: ClinicProntuarioResource): string | null {
  return normalizeProntuarioFeatureTab(resource.resource_key);
}

export function getEnabledProntuarioTabs({
  clinicId,
  specialtyId,
  specialtyKey,
  baseTabs,
  resources,
  clinicSpecialtyKeys,
  canViewTab,
  getStandardTabKey,
  getLabel,
  getIcon,
}: {
  clinicId: string | null | undefined;
  specialtyId: string | null | undefined;
  specialtyKey: SpecialtyKey;
  baseTabs: string[];
  resources: ClinicProntuarioResource[];
  clinicSpecialtyKeys: Set<string>;
  canViewTab: (tabKey: TabKey) => boolean;
  getStandardTabKey: (tabId: string) => TabKey;
  getLabel: (tabId: string) => string;
  getIcon: (tabId: string) => LucideIcon;
}): EnabledProntuarioTab[] {
  if (!clinicId) return [];

  const applicableResources = resources.filter((resource) =>
    doesResourceApplyToSpecialty(resource, specialtyId, specialtyKey, clinicSpecialtyKeys),
  );

  const disabledTabs = new Set(
    applicableResources
      .filter((resource) => !isProntuarioResourceActive(resource))
      .map(getProntuarioResourceTab)
      .filter((tabId): tabId is string => Boolean(tabId)),
  );

  const enabledResourceTabs = applicableResources
    .filter((resource) => isProntuarioResourceActive(resource))
    .map(getProntuarioResourceTab)
    .filter((tabId): tabId is string => Boolean(tabId));

  const seen = new Set<string>();
  const merged = [...baseTabs, ...enabledResourceTabs]
    .filter((tabId) => !disabledTabs.has(tabId))
    .filter((tabId) => {
      if (seen.has(tabId)) return false;
      seen.add(tabId);
      return canViewTab(getStandardTabKey(tabId));
    });

  return merged
    .map((tabId, index) => ({
      id: tabId,
      label: PRONTUARIO_TAB_LABELS[tabId] ?? getLabel(tabId),
      icon: getIcon(tabId),
      order: PRONTUARIO_TAB_ORDER[tabId] ?? 1_000 + index,
      originalIndex: index,
    }))
    .sort((a, b) => a.order - b.order || a.originalIndex - b.originalIndex)
    .map(({ order: _order, originalIndex: _originalIndex, ...item }) => item);
}