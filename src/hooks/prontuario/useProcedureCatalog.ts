/**
 * useProcedureCatalog
 *
 * Single source of truth for procedure selectors across clinical screens.
 * Loads ACTIVE procedures from the official `procedures` table, filtered by:
 *  - clinic_id (mandatory)
 *  - specialty_id (when provided) — and gracefully falls back to procedures
 *    without a specialty so that legacy registers remain selectable.
 *
 * This hook MUST be used by every "Registrar Procedimento"-style selector to
 * avoid hardcoded/mocked lists.
 */
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ProcedureCatalogItem {
  id: string;
  name: string;
  specialty_id: string | null;
  duration_minutes: number;
  price: number | null;
}

interface Options {
  clinicId: string | null | undefined;
  specialtyId?: string | null;
  /** When true, skips the specialty filter and returns every active procedure of the clinic. */
  includeAllSpecialties?: boolean;
}

export function useProcedureCatalog({ clinicId, specialtyId, includeAllSpecialties }: Options) {
  const query = useQuery({
    queryKey: ['procedure-catalog', clinicId, specialtyId ?? 'any', includeAllSpecialties ?? false],
    enabled: !!clinicId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('procedures')
        .select('id, name, specialty_id, duration_minutes, price, is_active')
        .eq('clinic_id', clinicId!)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return (data ?? []) as ProcedureCatalogItem[];
    },
  });

  const filtered = useMemo<ProcedureCatalogItem[]>(() => {
    const list = query.data ?? [];
    if (includeAllSpecialties || !specialtyId) return list;
    // Keep procedures matching the active specialty AND legacy ones without specialty.
    return list.filter(p => p.specialty_id === specialtyId || p.specialty_id === null);
  }, [query.data, specialtyId, includeAllSpecialties]);

  return {
    procedures: filtered,
    allProcedures: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
