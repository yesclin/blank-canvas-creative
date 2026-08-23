/**
 * Cores dos profissionais na Agenda.
 *
 * A cor é persistida em `professionals.color` (por profissional, por clínica).
 * Quando a clínica ainda não escolheu uma cor, usamos um fallback determinístico
 * (derivado do id do profissional) para que a mesma pessoa tenha sempre a mesma
 * cor em todas as visões — e para reduzir a chance de dois profissionais
 * receberem automaticamente a mesma cor.
 */

export interface AgendaColorOption {
  label: string;
  value: string;
}

export const AGENDA_COLOR_PALETTE: AgendaColorOption[] = [
  { label: "Verde", value: "#10B981" },
  { label: "Roxo", value: "#8B5CF6" },
  { label: "Azul", value: "#3B82F6" },
  { label: "Rosa", value: "#EC4899" },
  { label: "Laranja", value: "#F97316" },
  { label: "Ciano", value: "#06B6D4" },
  { label: "Vermelho", value: "#EF4444" },
  { label: "Âmbar", value: "#D97706" },
  { label: "Índigo", value: "#6366F1" },
  { label: "Esmeralda", value: "#059669" },
  { label: "Violeta", value: "#7C3AED" },
  { label: "Grafite", value: "#475569" },
];

export const DEFAULT_AGENDA_COLOR = "#6366F1";

const HEX_RE = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

export function isValidHexColor(value?: string | null): boolean {
  return !!value && HEX_RE.test(value.trim());
}

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/** Cor automática estável para um profissional sem cor configurada. */
export function getFallbackProfessionalColor(professionalId?: string | null): string {
  if (!professionalId) return DEFAULT_AGENDA_COLOR;
  const index = hashString(professionalId) % AGENDA_COLOR_PALETTE.length;
  return AGENDA_COLOR_PALETTE[index].value;
}

/** Cor efetiva: a escolhida pela clínica ou o fallback automático. */
export function resolveProfessionalColor(
  color?: string | null,
  professionalId?: string | null,
): string {
  if (isValidHexColor(color)) return (color as string).trim();
  return getFallbackProfessionalColor(professionalId);
}

/**
 * Sugere uma cor da paleta ainda não utilizada na clínica (evita repetição).
 */
export function suggestUnusedAgendaColor(usedColors: (string | null | undefined)[]): string {
  const used = new Set(
    usedColors.filter(isValidHexColor).map((c) => (c as string).trim().toLowerCase()),
  );
  const free = AGENDA_COLOR_PALETTE.find((c) => !used.has(c.value.toLowerCase()));
  return (free || AGENDA_COLOR_PALETTE[0]).value;
}

/** Retorna preto ou branco conforme o contraste com a cor de fundo. */
export function getReadableTextColor(hex: string): string {
  const normalized = hex.replace("#", "");
  const full =
    normalized.length === 3
      ? normalized.split("").map((c) => c + c).join("")
      : normalized;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  if ([r, g, b].some((v) => Number.isNaN(v))) return "#FFFFFF";
  // Luminância relativa (WCAG simplificada)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#111827" : "#FFFFFF";
}

export function getAgendaColorLabel(hex?: string | null): string | undefined {
  if (!hex) return undefined;
  return AGENDA_COLOR_PALETTE.find(
    (c) => c.value.toLowerCase() === hex.trim().toLowerCase(),
  )?.label;
}
