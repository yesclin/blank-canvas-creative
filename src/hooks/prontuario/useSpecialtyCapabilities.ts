/**
 * useSpecialtyCapabilities
 * 
 * Convenience hook that resolves the capabilities for the active specialty
 * in the prontuário context. Combines useActiveSpecialty with specialtyCapabilities.
 */

import { useMemo } from 'react';
import { useActiveSpecialty } from './useActiveSpecialty';
import { 
  getCapabilities, 
  isBlockEnabled, 
  getAnamnesisSlug,
  type SpecialtyCapability 
} from './specialtyCapabilities';
import type { ClinicalBlockKey } from './yesclinSpecialties';
import type { ClinicalModuleKey } from '@/types/clinical-modules';

export interface SpecialtyCapabilitiesResult {
  /** Full capability definition for the active specialty */
  capabilities: SpecialtyCapability;
  /** Active specialty key */
  specialtyKey: string;
  /** Whether a block is visible for the active specialty */
  isBlockVisible: (blockKey: ClinicalBlockKey) => boolean;
  /** Whether a module is in the default set for the active specialty */
  isDefaultModule: (moduleKey: ClinicalModuleKey) => boolean;
  /** Slug to filter anamnesis templates by active specialty */
  anamnesisSlug: string;
  /** Enabled clinical blocks for the active specialty */
  enabledBlocks: ClinicalBlockKey[];
  /** Default modules for the active specialty */
  defaultModules: ClinicalModuleKey[];
  /** Whether specialty is locked from appointment */
  isFromAppointment: boolean;
  /** Loading state */
  loading: boolean;
}

export function useSpecialtyCapabilities(
  patientId: string | null | undefined
): SpecialtyCapabilitiesResult {
  const {
    activeSpecialtyKey,
    isFromAppointment,
    loading,
  } = useActiveSpecialty(patientId);

  const capabilities = useMemo(
    () => getCapabilities(activeSpecialtyKey),
    [activeSpecialtyKey]
  );

  const isBlockVisible = useMemo(
    () => (blockKey: ClinicalBlockKey) => isBlockEnabled(blockKey, activeSpecialtyKey),
    [activeSpecialtyKey]
  );

  const isDefaultModule = useMemo(
    () => (moduleKey: ClinicalModuleKey) => capabilities.defaultModules.includes(moduleKey),
    [capabilities]
  );

  const anamnesisSlug = useMemo(
    () => getAnamnesisSlug(activeSpecialtyKey),
    [activeSpecialtyKey]
  );

  return {
    capabilities,
    specialtyKey: activeSpecialtyKey,
    isBlockVisible,
    isDefaultModule,
    anamnesisSlug,
    enabledBlocks: capabilities.enabledBlocks,
    defaultModules: capabilities.defaultModules,
    isFromAppointment,
    loading,
  };
}
