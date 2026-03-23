import { useMemo } from 'react';
import { useActiveAppointment } from './useActiveAppointment';
import { 
  YESCLIN_SUPPORTED_SPECIALTIES, 
  resolveSpecialtyKey,
  type YesclinSpecialty 
} from './yesclinSpecialties';
import { useGlobalSpecialty } from '@/hooks/useGlobalSpecialty';

export type SpecialtyKey =
  | 'geral'
  | 'odontologia'
  | 'psicologia'
  | 'psiquiatria'
  | 'nutricao'
  | 'estetica'
  | 'dermatologia'
  | 'fisioterapia'
  | 'pilates'
  | 'pediatria'
  | 'ginecologia'
  | 'oftalmologia'
  | 'custom';

export interface SpecialtyOption {
  id: string;
  name: string;
  key: SpecialtyKey;
  description?: string;
  icon?: string;
}

/** @deprecated Use resolveSpecialtyKey from yesclinSpecialties.ts */
export function mapSpecialtyNameToKey(name: string): SpecialtyKey {
  return resolveSpecialtyKey(name);
}

/**
 * Specialty resolution priority:
 * 1. Active appointment specialty (locked)
 * 2. User's manual selection (from global context)
 * 3. First enabled specialty
 * 4. Default: 'geral'
 */
export function useActiveSpecialty(patientId: string | null | undefined) {
  const { data: activeAppointment, isLoading: appointmentLoading } = useActiveAppointment(patientId);
  
  const { 
    enabledSpecialties: globalEnabledSpecialties,
    isSingleSpecialty,
    selectedSpecialtyId,
    setSelectedSpecialtyId,
  } = useGlobalSpecialty();

  // Map enabled DB specialties to Yesclin SpecialtyOptions
  const specialties = useMemo((): SpecialtyOption[] => {
    const enabledNames = new Set(
      globalEnabledSpecialties.map(s => s.name.toLowerCase().trim())
    );
    
    return YESCLIN_SUPPORTED_SPECIALTIES
      .filter((spec: YesclinSpecialty) => enabledNames.has(spec.name.toLowerCase().trim()))
      .map((spec: YesclinSpecialty) => {
        const dbSpecialty = globalEnabledSpecialties.find(
          es => es.name.toLowerCase().trim() === spec.name.toLowerCase().trim()
        );
        return {
          id: dbSpecialty?.id || `yesclin-${spec.key}`,
          name: spec.name,
          key: spec.key,
          description: spec.description,
          icon: spec.icon,
        };
      });
  }, [globalEnabledSpecialties]);

  const isFromAppointment = !!(activeAppointment?.resolved_specialty_id);

  const activeSpecialtyKey = useMemo((): SpecialtyKey => {
    // Priority 1: appointment specialty (locked)
    if (activeAppointment?.resolved_specialty_name) {
      const key = resolveSpecialtyKey(activeAppointment.resolved_specialty_name);
      if (specialties.some(s => s.key === key)) return key;
    }
    
    // Priority 2: user manual selection
    if (selectedSpecialtyId) {
      const selected = specialties.find(s => s.id === selectedSpecialtyId);
      if (selected) return selected.key;
    }
    
    // Priority 3: first enabled specialty
    if (specialties.length > 0) {
      return specialties[0].key;
    }
    
    return 'geral';
  }, [activeAppointment?.resolved_specialty_name, selectedSpecialtyId, specialties]);

  const activeSpecialty = useMemo((): SpecialtyOption | null => {
    return specialties.find(s => s.key === activeSpecialtyKey) || null;
  }, [activeSpecialtyKey, specialties]);

  const activeSpecialtyId = activeSpecialty?.id || null;

  return {
    activeSpecialtyId,
    activeSpecialty,
    activeSpecialtyKey,
    specialties,
    isFromAppointment,
    isSpecialtyLocked: isFromAppointment,
    isSingleSpecialty,
    selectionBlockedReason: isFromAppointment
      ? `Especialidade bloqueada: ${activeAppointment?.resolved_specialty_name || activeSpecialty?.name || ''} (atendimento em andamento)`
      : null,
    setActiveSpecialty: (id: string | null) => {
      if (!isFromAppointment) {
        setSelectedSpecialtyId(id);
      }
    },
    loading: appointmentLoading,
    activeAppointment,
  };
}
