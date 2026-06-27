/**
 * Mapeamento conselho profissional ⇄ especialidade.
 * Usado pelo cadastro de profissionais para sugerir o conselho,
 * controlar obrigatoriedade do número de registro e exibição de RQE.
 */

import { OFFICIAL_SPECIALTIES, getSpecialtySlug } from "./officialSpecialties";

export type CouncilCode =
  | "CRM"
  | "CRP"
  | "CRO"
  | "CREFITO"
  | "CRN"
  | "CREF"
  | "COREN"
  | "CRBM"
  | "CRF"
  | "OUTRO"
  | "NAO_SE_APLICA";

export interface CouncilOption {
  value: CouncilCode;
  label: string;
}

const ALL_COUNCILS: Record<CouncilCode, CouncilOption> = {
  CRM: { value: "CRM", label: "CRM — Conselho Regional de Medicina" },
  CRP: { value: "CRP", label: "CRP — Conselho Regional de Psicologia" },
  CRO: { value: "CRO", label: "CRO — Conselho Regional de Odontologia" },
  CREFITO: { value: "CREFITO", label: "CREFITO — Fisioterapia e Terapia Ocupacional" },
  CRN: { value: "CRN", label: "CRN — Conselho Regional de Nutricionistas" },
  CREF: { value: "CREF", label: "CREF — Conselho Regional de Educação Física" },
  COREN: { value: "COREN", label: "COREN — Conselho Regional de Enfermagem" },
  CRBM: { value: "CRBM", label: "CRBM — Conselho Regional de Biomedicina" },
  CRF: { value: "CRF", label: "CRF — Conselho Regional de Farmácia" },
  OUTRO: { value: "OUTRO", label: "Outro conselho" },
  NAO_SE_APLICA: { value: "NAO_SE_APLICA", label: "Não se aplica" },
};

export interface SpecialtyCouncilRule {
  slug: string;
  suggested: CouncilCode;
  required: boolean;
  rqe: "no" | "optional";
  allowed: CouncilCode[];
}

const RULES: Record<string, SpecialtyCouncilRule> = {
  geral:        { slug: "geral",        suggested: "CRM",     required: true,  rqe: "optional", allowed: ["CRM", "OUTRO"] },
  pediatria:    { slug: "pediatria",    suggested: "CRM",     required: true,  rqe: "optional", allowed: ["CRM", "OUTRO"] },
  dermatologia: { slug: "dermatologia", suggested: "CRM",     required: true,  rqe: "optional", allowed: ["CRM", "OUTRO"] },
  psicologia:   { slug: "psicologia",   suggested: "CRP",     required: true,  rqe: "no",       allowed: ["CRP", "OUTRO", "NAO_SE_APLICA"] },
  fisioterapia: { slug: "fisioterapia", suggested: "CREFITO", required: true,  rqe: "no",       allowed: ["CREFITO", "OUTRO"] },
  pilates:      { slug: "pilates",      suggested: "CREFITO", required: false, rqe: "no",       allowed: ["CREFITO", "CREF", "OUTRO", "NAO_SE_APLICA"] },
  odontologia:  { slug: "odontologia",  suggested: "CRO",     required: true,  rqe: "no",       allowed: ["CRO", "OUTRO"] },
  nutricao:     { slug: "nutricao",     suggested: "CRN",     required: true,  rqe: "no",       allowed: ["CRN", "OUTRO"] },
  estetica:     { slug: "estetica",     suggested: "NAO_SE_APLICA", required: false, rqe: "no", allowed: ["COREN", "CRBM", "CREFITO", "CRF", "CRO", "CRM", "OUTRO", "NAO_SE_APLICA"] },
  other_specialty: { slug: "other_specialty", suggested: "OUTRO", required: false, rqe: "no", allowed: Object.keys(ALL_COUNCILS) as CouncilCode[] },
};

export const FALLBACK_RULE: SpecialtyCouncilRule = {
  slug: "outro",
  suggested: "OUTRO",
  required: false,
  rqe: "no",
  allowed: Object.keys(ALL_COUNCILS) as CouncilCode[],
};

export function getCouncilRuleBySpecialtyName(name?: string | null): SpecialtyCouncilRule {
  if (!name) return FALLBACK_RULE;
  const slug = getSpecialtySlug(name);
  return (slug && RULES[slug]) || FALLBACK_RULE;
}

export function getCouncilRuleBySpecialtySlug(slug?: string | null): SpecialtyCouncilRule {
  if (!slug) return FALLBACK_RULE;
  return RULES[slug] || FALLBACK_RULE;
}

export function getCouncilOptions(rule: SpecialtyCouncilRule): CouncilOption[] {
  return rule.allowed.map((c) => ALL_COUNCILS[c]);
}

export function getCouncilLabel(code?: string | null): string {
  if (!code) return "";
  return ALL_COUNCILS[code as CouncilCode]?.label ?? code;
}

export const BRAZIL_STATES = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG",
  "PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
] as const;

export const SPECIALTY_COUNCIL_RULES = RULES;
export { OFFICIAL_SPECIALTIES };
