/**
 * useActiveSpecialty — Prontuário-level specialty resolution
 * 
 * Combines the global resolved specialty with appointment-level override.
 * This is what the prontuário page and its children use.
 * 
 * Resolution priority:
 * 1. Active appointment specialty (locked)
 * 2. Global resolved specialty (manual selection or first enabled)
 * 
 * RULES:
 * - activeSpecialtyKey is NEVER hardcoded to 'geral'
 * - All fields come from the SAME resolved object
 * - Returns null values when no specialty is configured
 */

import { useMemo } from 'react';
import { useActiveAppointment } from './useActiveAppointment';
import { useGlobalSpecialty } from '@/hooks/useGlobalSpecialty';
import { resolveOfficialSlug, type ResolvedSpecialty } from '@/hooks/useResolvedSpecialty';
import {
  YESCLIN_SUPPORTED_SPECIALTIES,
  type YesclinSpecialty,
} from './yesclinSpecialties';

// Re-export for backward compat
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

function toSpecialtyOption(resolved: ResolvedSpecialty): SpecialtyOption | null {
  const yesclinDef = YESCLIN_SUPPORTED_SPECIALTIES.find(s => s.key === resolved.key);
  if (!yesclinDef) return null;
  return {
    id: resolved.id,
    name: resolved.name,
    key: yesclinDef.key,
    slug: yesclinDef.key,
    description: yesclinDef.description,
    icon: yesclinDef.icon,
  };
}

export function useActiveSpecialty(patientId: string | null | undefined) {
  const { data: activeAppointment, isLoading: appointmentLoading } = useActiveAppointment(patientId);

  const {
    enabledSpecialties: globalEnabledSpecialties,
    isLoading: globalSpecialtiesLoading,
    isSingleSpecialty,
    selectedSpecialtyId,
    setSelectedSpecialtyId,
    resolvedSpecialty: globalResolved,
  } = useGlobalSpecialty();

  // Build SpecialtyOption[] from enabled specialties
  const specialties = useMemo((): SpecialtyOption[] => {
    return globalEnabledSpecialties
      .map((dbSpec): SpecialtyOption | null => {
        const slug = resolveOfficialSlug(dbSpec.slug) ?? resolveOfficialSlug(dbSpec.name);
        if (!slug) return null;
        const yesclinDef = YESCLIN_SUPPORTED_SPECIALTIES.find(s => s.key === slug);
        if (!yesclinDef) return null;
        return {
          id: dbSpec.id,
          name: dbSpec.name,
          key: yesclinDef.key,
          slug: yesclinDef.key,
          description: dbSpec.description || yesclinDef.description,
          icon: yesclinDef.icon,
        };
      })
      .filter((s): s is SpecialtyOption => s !== null);
  }, [globalEnabledSpecialties]);

  // Global default from provider (already resolved)
  const defaultSpecialty = useMemo((): SpecialtyOption | null => {
    if (!globalResolved) return null;
    return toSpecialtyOption(globalResolved);
  }, [globalResolved]);

  // Appointment override
  const appointmentSpecialty = useMemo((): SpecialtyOption | null => {
    if (!activeAppointment) return null;

    // Try by ID first
    if (activeAppointment.resolved_specialty_id) {
      const match = specialties.find(s => s.id === activeAppointment.resolved_specialty_id);
      if (match) return match;
    }

    // Try by name
    const slug = resolveOfficialSlug(activeAppointment.resolved_specialty_name);
    if (!slug) return null;

    const matchByKey = specialties.find(s => s.key === slug);
    if (matchByKey) return matchByKey;

    // Build from appointment data if not in enabled list
    const yesclinDef = YESCLIN_SUPPORTED_SPECIALTIES.find(s => s.key === slug);
    if (!yesclinDef || !activeAppointment.resolved_specialty_name) return null;

    return {
      id: activeAppointment.resolved_specialty_id || `appointment-${slug}`,
      name: activeAppointment.resolved_specialty_name,
      key: yesclinDef.key,
      slug: yesclinDef.key,
      description: yesclinDef.description,
      icon: yesclinDef.icon,
    };
  }, [activeAppointment, specialties]);

  // Final resolved specialty — THE single object
  const activeSpecialty = useMemo(
    (): SpecialtyOption | null => appointmentSpecialty ?? defaultSpecialty,
    [appointmentSpecialty, defaultSpecialty]
  );

  const loading = appointmentLoading || globalSpecialtiesLoading;
  const hasEnabledSpecialties = specialties.length > 0;
  const isResolved = !loading && (!!activeSpecialty || !hasEnabledSpecialties);
  const noSpecialtyConfigured = isResolved && !activeSpecialty && !hasEnabledSpecialties;
  const isFromAppointment = !!appointmentSpecialty;

  // ALL fields derived from the SAME activeSpecialty object — no separate calculations
  const activeSpecialtyId = activeSpecialty?.id ?? null;
  const activeSpecialtyName = activeSpecialty?.name ?? null;
  const activeSpecialtyKey = (activeSpecialty?.key ?? null) as SpecialtyKey | null;
  const activeSpecialtySlug = activeSpecialty?.slug ?? null;

  return {
    activeSpecialtyId,
    activeSpecialty,
    activeSpecialtyName,
    activeSpecialtyKey: activeSpecialtyKey as SpecialtyKey,
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
      if (!isFromAppointment && (id === null || specialties.some(s => s.id === id))) {
        setSelectedSpecialtyId(id);
      }
    },
    loading,
    activeAppointment,
  };
}

/** @deprecated Use resolveOfficialSlug from useResolvedSpecialty.ts */
export function mapSpecialtyNameToKey(name: string): SpecialtyKey {
  return (resolveOfficialSlug(name) as SpecialtyKey) ?? 'geral';
}
