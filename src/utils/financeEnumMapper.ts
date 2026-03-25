// =============================================
// CENTRALIZED FINANCE ENUM MAPPING
// =============================================
// DB enum: "receita" | "despesa"
// UI concept: "entrada" | "saida"  (display-only)
// This module is the SINGLE SOURCE OF TRUTH for mapping between them.

/** The actual DB enum values for transaction_type */
export type DbTransactionType = "receita" | "despesa";

/** UI-friendly labels used in the frontend */
export type UiTransactionType = "entrada" | "saida";

// Maps UI concept → DB enum
const uiToDb: Record<UiTransactionType, DbTransactionType> = {
  entrada: "receita",
  saida: "despesa",
};

// Maps DB enum → UI concept
const dbToUi: Record<DbTransactionType, UiTransactionType> = {
  receita: "entrada",
  despesa: "saida",
};

/** Convert UI type to DB enum for inserts/updates/filters */
export function toDbType(uiType: UiTransactionType): DbTransactionType {
  return uiToDb[uiType];
}

/** Convert DB enum to UI type for display */
export function toUiType(dbType: string): UiTransactionType {
  if (dbType in dbToUi) return dbToUi[dbType as DbTransactionType];
  // Fallback: if somehow the DB already has entrada/saida, pass through
  if (dbType === "entrada" || dbType === "saida") return dbType;
  return "entrada"; // safe fallback
}

/** Check if a DB type represents revenue */
export function isRevenue(dbType: string): boolean {
  return dbType === "receita" || dbType === "entrada";
}

/** Check if a DB type represents expense */
export function isExpense(dbType: string): boolean {
  return dbType === "despesa" || dbType === "saida";
}

/** Labels for display in the UI */
export const transactionTypeDisplayLabels: Record<UiTransactionType, string> = {
  entrada: "Entrada",
  saida: "Saída",
};

/** Get display label from any type (DB or UI) */
export function getTypeLabel(type: string): string {
  const uiType = toUiType(type);
  return transactionTypeDisplayLabels[uiType] || type;
}
