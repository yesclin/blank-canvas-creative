/**
 * DEPRECATED: Use useEnabledSpecialties instead.
 * This file re-exports the canonical hook for backward compatibility.
 * All screens MUST use useEnabledSpecialties as the single source of truth.
 */

export {
  useEnabledSpecialties as useSpecialties,
  type EnabledSpecialty as Specialty,
  type SpecialtyType,
} from "./useEnabledSpecialties";
