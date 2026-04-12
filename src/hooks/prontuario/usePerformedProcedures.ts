/**
 * Hook for clinical_performed_procedures CRUD
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PerformedProcedure {
  id: string;
  clinic_id: string;
  patient_id: string;
  professional_id: string | null;
  appointment_id: string | null;
  specialty_id: string | null;
  procedure_id: string | null;
  evolution_id: string | null;
  facial_map_id: string | null;
  procedure_name: string;
  region: string | null;
  technique: string | null;
  notes: string | null;
  status: string;
  performed_at: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  // Joined
  professional_name?: string;
  procedure_catalog_name?: string;
}

export interface CreatePerformedProcedureInput {
  clinic_id: string;
  patient_id: string;
  professional_id?: string | null;
  appointment_id?: string | null;
  specialty_id?: string | null;
  procedure_id?: string | null;
  evolution_id?: string | null;
  facial_map_id?: string | null;
  procedure_name: string;
  region?: string | null;
  technique?: string | null;
  notes?: string | null;
  status?: string;
  performed_at?: string;
  created_by?: string | null;
}

function queryKey(patientId: string, appointmentId?: string | null) {
  return ['performed-procedures', patientId, appointmentId ?? 'all'];
}

export function usePerformedProcedures(
  patientId: string | null | undefined,
  clinicId: string | null | undefined,
  appointmentId?: string | null,
  specialtyId?: string | null,
) {
  return useQuery({
    queryKey: queryKey(patientId ?? '', appointmentId),
    enabled: !!patientId && !!clinicId,
    queryFn: async () => {
      let q = supabase
        .from('clinical_performed_procedures')
        .select('*, professionals(full_name), procedures(name)')
        .eq('clinic_id', clinicId!)
        .eq('patient_id', patientId!)
        .order('performed_at', { ascending: false });

      if (appointmentId) {
        q = q.eq('appointment_id', appointmentId);
      }
      if (specialtyId) {
        q = q.eq('specialty_id', specialtyId);
      }

      const { data, error } = await q;
      if (error) throw error;

      return (data ?? []).map((row: any) => ({
        ...row,
        professional_name: row.professionals?.full_name ?? null,
        procedure_catalog_name: row.procedures?.name ?? null,
      })) as PerformedProcedure[];
    },
  });
}

export function useCreatePerformedProcedure(patientId: string, appointmentId?: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreatePerformedProcedureInput) => {
      const { data, error } = await supabase
        .from('clinical_performed_procedures')
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKey(patientId, appointmentId) });
      qc.invalidateQueries({ queryKey: ['estetica-summary'] });
      toast.success('Procedimento registrado com sucesso');
    },
    onError: () => {
      toast.error('Erro ao registrar procedimento');
    },
  });
}

export function useDeletePerformedProcedure(patientId: string, appointmentId?: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('clinical_performed_procedures')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKey(patientId, appointmentId) });
      qc.invalidateQueries({ queryKey: ['estetica-summary'] });
      toast.success('Procedimento removido');
    },
    onError: () => {
      toast.error('Erro ao remover procedimento');
    },
  });
}
