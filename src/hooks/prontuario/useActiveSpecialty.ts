import { useEffect, useMemo } from 'react';
import { useActiveAppointment } from './useActiveAppointment';
import { 
  YESCLIN_SUPPORTED_SPECIALTIES, 
  resolveSpecialtyKey,
  type YesclinSpecialty 
} from './yesclinSpecialties';
import { useGlobalSpecialty } from '@/hooks/useGlobalSpecialty';
import { useClinicData } from '@/hooks/useClinicData';

export type SpecialtyKey =
  | 'geral'
  | 'odontologia'
  | 'psicologia'
  | 'nutricao'
  | 'estetica'
  | 'dermatologia'
  | 'fisioterapia'
  | 'pilates'
  | 'pediatria';

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
 */
export function useActiveSpecialty(patientId: string | null | undefined) {
  const { data: activeAppointment, isLoading: appointmentLoading } = useActiveAppointment(patientId);
  const { clinic, isLoading: clinicLoading } = useClinicData();
  
  const { 
    enabledSpecialties: globalEnabledSpecialties,
    isLoading: globalSpecialtiesLoading,
    isSingleSpecialty,
    selectedSpecialtyId,
    setSelectedSpecialtyId,
  } = useGlobalSpecialty();

  // Map enabled DB specialties to Yesclin SpecialtyOptions using the DB slug/key first.
  // This keeps the display name coming from the real clinic specialty while reusing
  // the canonical Yesclin capability map.
  const specialties = useMemo((): SpecialtyOption[] => {
    return globalEnabledSpecialties
      .map((dbSpec): SpecialtyOption | null => {
        const slugKey = dbSpec.slug as SpecialtyKey;
        const yesclinSpec = YESCLIN_SUPPORTED_SPECIALTIES.find(
          (ys: YesclinSpecialty) => ys.key === slugKey
        ) || YESCLIN_SUPPORTED_SPECIALTIES.find(
          (ys: YesclinSpecialty) => ys.key === resolveSpecialtyKey(dbSpec.name)
        );

        if (!yesclinSpec) return null;

        return {
          id: dbSpec.id,
          name: dbSpec.name,
          key: yesclinSpec.key,
          description: dbSpec.description || yesclinSpec.description,
          icon: yesclinSpec.icon,
        };
      })
      .filter((s): s is SpecialtyOption => s !== null);
  }, [globalEnabledSpecialties]);

  const defaultSpecialty = useMemo((): SpecialtyOption | null => {
    if (specialties.length === 0) return null;
    return specialties[0] || null;
  }, [specialties]);

  const isFromAppointment = !!(activeAppointment?.resolved_specialty_id);

  const activeSpecialty = useMemo((): SpecialtyOption | null => {
    // Priority 1: appointment specialty by real specialty id
    if (activeAppointment?.resolved_specialty_id) {
      const appointmentSpecialty = specialties.find(
        (specialty) => specialty.id === activeAppointment.resolved_specialty_id
      );
      if (appointmentSpecialty) return appointmentSpecialty;
    }

    // Priority 1b: appointment specialty by resolved name/key
    if (activeAppointment?.resolved_specialty_name) {
      const appointmentKey = resolveSpecialtyKey(activeAppointment.resolved_specialty_name);
      const specialtyFromEnabledList = specialties.find(
        (specialty) => specialty.key === appointmentKey
      );
      if (specialtyFromEnabledList) return specialtyFromEnabledList;

      const supportedSpecialty = YESCLIN_SUPPORTED_SPECIALTIES.find(
        (specialty) => specialty.key === appointmentKey
      );
      if (supportedSpecialty) {
        return {
          id: activeAppointment.resolved_specialty_id || `appointment-${supportedSpecialty.key}`,
          name: activeAppointment.resolved_specialty_name,
          key: supportedSpecialty.key,
          description: supportedSpecialty.description,
          icon: supportedSpecialty.icon,
        };
      }
    }

    // Priority 2: user manual selection
    if (selectedSpecialtyId) {
      const manuallySelectedSpecialty = specialties.find(
        (specialty) => specialty.id === selectedSpecialtyId
      );
      if (manuallySelectedSpecialty) return manuallySelectedSpecialty;
    }

    // Priority 3: resolved default specialty from clinic
    return defaultSpecialty;
  }, [
    activeAppointment?.resolved_specialty_id,
    activeAppointment?.resolved_specialty_name,
    selectedSpecialtyId,
    specialties,
    defaultSpecialty,
  ]);

  const activeSpecialtyId = useMemo(() => {
    if (activeAppointment?.resolved_specialty_id) {
      return activeAppointment.resolved_specialty_id;
    }

    if (selectedSpecialtyId && specialties.some((specialty) => specialty.id === selectedSpecialtyId)) {
      return selectedSpecialtyId;
    }

    return defaultSpecialty?.id || activeSpecialty?.id || null;
  }, [activeAppointment?.resolved_specialty_id, selectedSpecialtyId, specialties, defaultSpecialty?.id, activeSpecialty?.id]);

  const activeSpecialtyName = useMemo(() => {
    if (activeAppointment?.resolved_specialty_name) {
      return activeAppointment.resolved_specialty_name;
    }

    if (activeSpecialtyId) {
      return specialties.find((specialty) => specialty.id === activeSpecialtyId)?.name || activeSpecialty?.name || null;
    }

    return defaultSpecialty?.name || activeSpecialty?.name || null;
  }, [activeAppointment?.resolved_specialty_name, activeSpecialtyId, specialties, defaultSpecialty?.name, activeSpecialty?.name]);

  const activeSpecialtyKey = useMemo((): SpecialtyKey => {
    if (activeSpecialty) return activeSpecialty.key;
    if (defaultSpecialty) return defaultSpecialty.key;
    if (specialties.length > 0) return specialties[0].key;
    return 'geral';
  }, [activeSpecialty, defaultSpecialty, specialties]);

  useEffect(() => {
    console.log('[YesClin][ActiveSpecialty] clinic.activeSpecialties', globalEnabledSpecialties);
    console.log('[YesClin][ActiveSpecialty] clinic.primary_specialty_id', clinic?.primary_specialty_id ?? null);
    console.log('[YesClin][ActiveSpecialty] selectedSpecialtyId', selectedSpecialtyId);
    console.log('[YesClin][ActiveSpecialty] activeAppointment.resolved_specialty_id', activeAppointment?.resolved_specialty_id ?? null);
    console.log('[YesClin][ActiveSpecialty] activeAppointment.resolved_specialty_name', activeAppointment?.resolved_specialty_name ?? null);
    console.log('[YesClin][ActiveSpecialty] final.activeSpecialtyId', activeSpecialtyId);
    console.log('[YesClin][ActiveSpecialty] final.activeSpecialtyName', activeSpecialtyName ?? null);
    console.log('[YesClin][ActiveSpecialty] final.activeSpecialtyKey', activeSpecialtyKey);
  }, [
    globalEnabledSpecialties,
    clinic?.primary_specialty_id,
    selectedSpecialtyId,
    activeAppointment?.resolved_specialty_id,
    activeAppointment?.resolved_specialty_name,
    activeSpecialtyId,
    activeSpecialtyName,
    activeSpecialtyKey,
  ]);

  return {
    activeSpecialtyId,
    activeSpecialty,
    activeSpecialtyName,
    activeSpecialtyKey,
    specialties,
    isFromAppointment,
    isSpecialtyLocked: isFromAppointment,
    isSingleSpecialty,
    selectionBlockedReason: isFromAppointment
      ? `Especialidade bloqueada: ${activeSpecialtyName || ''} (atendimento em andamento)`
      : null,
    setActiveSpecialty: (id: string | null) => {
      if (!isFromAppointment) {
        setSelectedSpecialtyId(id);
      }
    },
    loading: appointmentLoading || globalSpecialtiesLoading || clinicLoading,
    activeAppointment,
  };
}
