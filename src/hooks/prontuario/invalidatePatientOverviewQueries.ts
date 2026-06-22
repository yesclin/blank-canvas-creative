import type { QueryClient } from '@tanstack/react-query';

export function invalidatePatientOverviewQueries(
  queryClient: QueryClient,
  patientId?: string | null,
  clinicId?: string | null,
) {
  queryClient.invalidateQueries({ queryKey: ['prontuario-overview', patientId ?? null, clinicId ?? null] });
  queryClient.invalidateQueries({ queryKey: ['patient-overview', patientId ?? null, clinicId ?? null] });
  queryClient.invalidateQueries({ queryKey: ['clinical-summary', patientId ?? null, clinicId ?? null] });

  queryClient.invalidateQueries({ queryKey: ['estetica-summary', patientId ?? null, clinicId ?? null] });
  queryClient.invalidateQueries({ queryKey: ['estetica-summary', patientId ?? null] });
  queryClient.invalidateQueries({ queryKey: ['estetica-summary'] });

  queryClient.invalidateQueries({
    predicate: (query) => {
      const key = query.queryKey;
      return (
        Array.isArray(key) &&
        ['prontuario-overview', 'patient-overview', 'clinical-summary'].includes(String(key[0])) &&
        (!patientId || key[1] === patientId)
      );
    },
  });
}