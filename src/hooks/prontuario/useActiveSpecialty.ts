import { useMemo } from 'react';
import { useActiveAppointment } from './useActiveAppointment';
import { 
  YESCLIN_SUPPORTED_SPECIALTIES, 
  type YesclinSpecialty 
} from './yesclinSpecialties';
import { useGlobalSpecialty } from '@/hooks/useGlobalSpecialty';
import { OFFICIAL_SPECIALTIES } from '@/constants/officialSpecialties';

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
  slug: SpecialtyKey;
  description?: string;
  icon?: string;
}

function normalizeSpecialtyValue(value: string) {
  return value.trim().toLowerCase();
}

function resolveOfficialSpecialtyKey(value: string | null | undefined): SpecialtyKey | null {
  if (!value) return null;

  const normalized = normalizeSpecialtyValue(value);
  const match = OFFICIAL_SPECIALTIES.find((specialty) => {
    const officialName = normalizeSpecialtyValue(specialty.name);
    return officialName === normalized || specialty.slug === normalized;
  });

  return (match?.slug as SpecialtyKey | undefined) ?? null;
}

function getSupportedSpecialtyDefinition(key: SpecialtyKey | null) {
  if (!key) return null;
  return YESCLIN_SUPPORTED_SPECIALTIES.find(
    (specialty: YesclinSpecialty) => specialty.key === key
  ) ?? null;
}

/** @deprecated Use resolveSpecialtyKey from yesclinSpecialties.ts */
export function mapSpecialtyNameToKey(name: string): SpecialtyKey {
  return resolveOfficialSpecialtyKey(name) ?? 'geral';
}

/**
 * Specialty resolution priority:
 * 1. Active appointment specialty (locked)
 * 2. User's manual selection (from global context)
 * 3. First enabled specialty
 */
export function useActiveSpecialty(patientId: string | null | undefined) {
  const { data: activeAppointment, isLoading: appointmentLoading } = useActiveAppointment(patientId);
  
  const { 
    enabledSpecialties: globalEnabledSpecialties,
    isLoading: globalSpecialtiesLoading,
    isSingleSpecialty,
    selectedSpecialtyId,
    setSelectedSpecialtyId,
  } = useGlobalSpecialty();

  const specialties = useMemo((): SpecialtyOption[] => {
    return globalEnabledSpecialties
      .map((dbSpec): SpecialtyOption | null => {
        const specialtyKey = resolveOfficialSpecialtyKey(dbSpec.slug) ?? resolveOfficialSpecialtyKey(dbSpec.name);
        const yesclinSpec = getSupportedSpecialtyDefinition(specialtyKey);

        if (!yesclinSpec) return null;

        return {
          id: dbSpec.id,
          name: dbSpec.name,
          key: yesclinSpec.key,
          slug: yesclinSpec.key,
          description: dbSpec.description || yesclinSpec.description,
          icon: yesclinSpec.icon,
        };
      })
      .filter((s): s is SpecialtyOption => s !== null);
  }, [globalEnabledSpecialties]);

  const defaultSpecialty = useMemo(() => specialties[0] ?? null, [specialties]);

  const appointmentSpecialty = useMemo((): SpecialtyOption | null => {
    if (!activeAppointment) return null;

    if (activeAppointment.resolved_specialty_id) {
      const specialtyById = specialties.find(
        (specialty) => specialty.id === activeAppointment.resolved_specialty_id
      );
      if (specialtyById) return specialtyById;
    }

    const appointmentKey = resolveOfficialSpecialtyKey(activeAppointment.resolved_specialty_name);
    if (!appointmentKey) return null;

    const specialtyFromClinic = specialties.find((specialty) => specialty.key === appointmentKey);
    if (specialtyFromClinic) return specialtyFromClinic;

    const supportedSpecialty = getSupportedSpecialtyDefinition(appointmentKey);
    if (!supportedSpecialty || !activeAppointment.resolved_specialty_name) return null;

    return {
      id: activeAppointment.resolved_specialty_id || `appointment-${supportedSpecialty.key}`,
      name: activeAppointment.resolved_specialty_name,
      key: supportedSpecialty.key,
      slug: supportedSpecialty.key,
      description: supportedSpecialty.description,
      icon: supportedSpecialty.icon,
    };
  }, [activeAppointment, specialties]);

  const selectedSpecialty = useMemo(
    () => specialties.find((specialty) => specialty.id === selectedSpecialtyId) ?? null,
    [selectedSpecialtyId, specialties]
  );

  const activeSpecialty = useMemo(
    (): SpecialtyOption | null => appointmentSpecialty ?? selectedSpecialty ?? defaultSpecialty,
    [appointmentSpecialty, selectedSpecialty, defaultSpecialty]
  );

  const loading = appointmentLoading || globalSpecialtiesLoading;
  const hasEnabledSpecialties = specialties.length > 0;
  const isResolved = !loading && (!!activeSpecialty || !hasEnabledSpecialties);
  const noSpecialtyConfigured = isResolved && !activeSpecialty && !hasEnabledSpecialties;
  const isFromAppointment = !!appointmentSpecialty;
  const activeSpecialtyId = activeSpecialty?.id ?? null;
  const activeSpecialtyName = activeSpecialty?.name ?? null;
  const activeSpecialtyKey = activeSpecialty?.key ?? 'geral';
  const activeSpecialtySlug = activeSpecialty?.slug ?? null;

  return {
    activeSpecialtyId,
    activeSpecialty,
    activeSpecialtyName,
    activeSpecialtyKey,
    activeSpecialtySlug,
    specialties,
    isFromAppointment,
    isSpecialtyLocked: isFromAppointment,
    isSingleSpecialty,
    hasEnabledSpecialties,
    isResolved,
    noSpecialtyConfigured,
    selectionBlockedReason: isFromAppointment
      ? `Especialidade bloqueada: ${activeSpecialtyName || ''} (atendimento em andamento)`
      : null,
    setActiveSpecialty: (id: string | null) => {
      if (!isFromAppointment && (id === null || specialties.some((specialty) => specialty.id === id))) {
        setSelectedSpecialtyId(id);
      }
    },
    loading,
    activeAppointment,
  };
}
