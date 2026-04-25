/**
 * Helper centralizado para tradução de tipos e gravidades de alertas clínicos.
 *
 * Regra: o banco continua armazenando os valores internos em inglês.
 * Toda renderização (badges, cards, listas, resumos) DEVE usar este helper
 * para exibir o rótulo em português.
 */

const ALERT_TYPE_LABELS: Record<string, string> = {
  medication: "Medicação",
  allergy: "Alergia",
  disease: "Condição / Doença",
  condition: "Condição / Doença",
  contraindication: "Contraindicação",
  procedure_risk: "Risco de Procedimento",
  clinical_restriction: "Restrição Clínica",
  observation: "Observação",
  other: "Observação / Outro",
  info: "Informativo",
  // Tipos legados ainda presentes em registros antigos
  exam: "Exame Pendente",
  return: "Retorno em Atraso",
};

const SEVERITY_LABELS: Record<string, string> = {
  info: "Informativo",
  warning: "Atenção",
  critical: "Crítico",
  low: "Baixa",
  medium: "Média",
  high: "Alta",
};

/**
 * Capitaliza um valor desconhecido de forma amigável
 * (ex: "procedure_risk" -> "Procedure Risk")
 */
function humanize(raw: string): string {
  return raw
    .replace(/[_-]+/g, " ")
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Traduz o `alert_type` (valor interno do banco) para o rótulo em português.
 * Para valores desconhecidos, retorna uma versão capitalizada amigável.
 */
export function getAlertTypeLabel(alertType: string | null | undefined): string {
  if (!alertType) return "—";
  const key = alertType.toLowerCase().trim();
  return ALERT_TYPE_LABELS[key] ?? humanize(alertType);
}

/**
 * Traduz o `severity` (valor interno do banco) para o rótulo em português.
 */
export function getSeverityLabel(severity: string | null | undefined): string {
  if (!severity) return "—";
  const key = severity.toLowerCase().trim();
  return SEVERITY_LABELS[key] ?? humanize(severity);
}

/**
 * Mapas completos exportados para uso em selects (mantêm a ordem desejada).
 */
export const ALERT_TYPE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "medication", label: "Medicação" },
  { value: "allergy", label: "Alergia" },
  { value: "disease", label: "Condição / Doença" },
  { value: "contraindication", label: "Contraindicação" },
  { value: "procedure_risk", label: "Risco de Procedimento" },
  { value: "clinical_restriction", label: "Restrição Clínica" },
  { value: "observation", label: "Observação" },
  { value: "other", label: "Observação / Outro" },
  { value: "info", label: "Informativo" },
];

export const SEVERITY_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "critical", label: "Crítico" },
  { value: "warning", label: "Atenção" },
  { value: "info", label: "Informativo" },
];
