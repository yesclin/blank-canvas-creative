import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useClinicData } from '@/hooks/useClinicData';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

/**
 * Unified medical record entry — normalized from clinical_evolutions + anamnesis_records.
 */
export interface MedicalRecordEntry {
  id: string;
  clinic_id: string;
  patient_id: string;
  professional_id: string;
  specialty_id: string | null;
  appointment_id: string | null;
  template_id: string | null;
  entry_type: 'evolution' | 'anamnesis';
  status: 'rascunho' | 'assinado';
  content: Record<string, unknown>;
  notes: string | null;
  next_steps: string | null;
  signed_at: string | null;
  signed_by: string | null;
  validation_code: string | null;
  created_at: string;
  updated_at: string;
  // Source tracking
  _source: 'clinical_evolutions' | 'anamnesis_records';
}

export interface EntryInput {
  patient_id: string;
  professional_id: string;
  template_id?: string | null;
  appointment_id?: string | null;
  entry_type: string;
  content: Record<string, unknown>;
  notes?: string;
  next_steps?: string;
  specialty_id?: string | null;
  procedure_id?: string | null;
  template_version_id?: string | null;
  structure_snapshot?: unknown;
}

export function useMedicalRecordEntries() {
  const { clinic } = useClinicData();
  const [entries, setEntries] = useState<MedicalRecordEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchEntriesForPatient = useCallback(async (patientId: string, specialtyId?: string | null) => {
    if (!clinic?.id || !patientId) return;
    setLoading(true);
    try {
      const evolutionsQuery = supabase
        .from('clinical_evolutions')
        .select('*')
        .eq('clinic_id', clinic.id)
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      const anamnesesQuery = supabase
        .from('anamnesis_records')
        .select('*')
        .eq('clinic_id', clinic.id)
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      // Fetch both sources in parallel
      const [evolResult, anamResult] = await Promise.all([
        specialtyId ? evolutionsQuery.eq('specialty_id', specialtyId) : evolutionsQuery,
        specialtyId ? anamnesesQuery.eq('specialty_id', specialtyId) : anamnesesQuery,
      ]);

      if (evolResult.error) throw evolResult.error;
      if (anamResult.error) throw anamResult.error;

      const evolutions: MedicalRecordEntry[] = (evolResult.data || []).map((e) => ({
        id: e.id,
        clinic_id: e.clinic_id,
        patient_id: e.patient_id,
        professional_id: e.professional_id,
        specialty_id: e.specialty_id,
        appointment_id: e.appointment_id,
        template_id: null,
        entry_type: 'evolution' as const,
        status: e.status as 'rascunho' | 'assinado',
        content: (e.content as Record<string, unknown>) || {},
        notes: e.notes,
        next_steps: null,
        signed_at: e.signed_at,
        signed_by: e.signed_by,
        validation_code: null,
        created_at: e.created_at,
        updated_at: e.updated_at,
        _source: 'clinical_evolutions' as const,
      }));

      const anamneses: MedicalRecordEntry[] = (anamResult.data || []).map((a) => ({
        id: a.id,
        clinic_id: a.clinic_id,
        patient_id: a.patient_id,
        professional_id: a.professional_id,
        specialty_id: a.specialty_id,
        appointment_id: null,
        template_id: a.template_id,
        entry_type: 'anamnesis' as const,
        status: a.status as 'rascunho' | 'assinado',
        content: (a.data as Record<string, unknown>) || {},
        notes: null,
        next_steps: null,
        signed_at: a.signed_at,
        signed_by: a.signed_by,
        validation_code: a.validation_code,
        created_at: a.created_at,
        updated_at: a.updated_at,
        _source: 'anamnesis_records' as const,
      }));

      // Merge and sort by created_at descending
      const merged = [...evolutions, ...anamneses].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setEntries(merged);
    } catch (err) {
      console.error('Error fetching entries:', err);
      toast.error('Erro ao carregar registros');
    } finally {
      setLoading(false);
    }
  }, [clinic?.id]);

  const createEntry = async (input: EntryInput): Promise<string | null> => {
    if (!clinic?.id) return null;
    setSaving(true);
    try {
      const isAnamnesis = input.entry_type === 'anamnesis';

      if (isAnamnesis) {
        const { getEditWindowFields } = await import('@/hooks/prontuario/anamnesisEditWindowUtils');
        const editWindowFields = getEditWindowFields();
        const { data, error } = await supabase
          .from('anamnesis_records')
          .insert({
            clinic_id: clinic.id,
            patient_id: input.patient_id,
            professional_id: input.professional_id,
            template_id: input.template_id || null,
            specialty_id: input.specialty_id || null,
            data: input.content as unknown as Json,
            status: 'rascunho',
            ...editWindowFields,
          })
          .select()
          .single();

        if (error) throw error;
        toast.success('Anamnese criada');
        await fetchEntriesForPatient(input.patient_id, input.specialty_id);
        return data.id;
      } else {
        const { data, error } = await supabase
          .from('clinical_evolutions')
          .insert({
            clinic_id: clinic.id,
            patient_id: input.patient_id,
            professional_id: input.professional_id,
            appointment_id: input.appointment_id || null,
            specialty_id: input.specialty_id || null,
            content: input.content as unknown as Json,
            notes: input.notes || null,
            status: 'rascunho',
          })
          .select()
          .single();

        if (error) throw error;
        toast.success('Evolução criada');
        await fetchEntriesForPatient(input.patient_id, input.specialty_id);
        return data.id;
      }
    } catch (err) {
      console.error('Error creating entry:', err);
      toast.error('Erro ao criar registro');
      return null;
    } finally {
      setSaving(false);
    }
  };

  const updateEntry = async (id: string, patientId: string, updates: Partial<EntryInput>): Promise<boolean> => {
    setSaving(true);
    try {
      // Determine source from current entries
      const entry = entries.find((e) => e.id === id);
      if (!entry) {
        toast.error('Registro não encontrado');
        return false;
      }

      if (entry._source === 'anamnesis_records') {
        const { error } = await supabase
          .from('anamnesis_records')
          .update({
            data: updates.content ? (updates.content as unknown as Json) : undefined,
          })
          .eq('id', id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('clinical_evolutions')
          .update({
            content: updates.content ? (updates.content as unknown as Json) : undefined,
            notes: updates.notes,
          })
          .eq('id', id);

        if (error) throw error;
      }

      toast.success('Registro atualizado');
      await fetchEntriesForPatient(patientId, entry.specialty_id);
      return true;
    } catch (err) {
      console.error('Error updating entry:', err);
      toast.error('Erro ao atualizar registro');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const signEntry = async (id: string, patientId: string): Promise<boolean> => {
    setSaving(true);
    try {
      const entry = entries.find((e) => e.id === id);
      if (!entry) {
        toast.error('Registro não encontrado');
        return false;
      }

      const table = entry._source;
      const { error } = await supabase
        .from(table)
        .update({ status: 'assinado' })
        .eq('id', id);

      if (error) throw error;

      toast.success('Registro assinado');
      await fetchEntriesForPatient(patientId, entry.specialty_id);
      return true;
    } catch (err) {
      console.error('Error signing entry:', err);
      toast.error('Erro ao assinar registro');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const deleteEntry = async (id: string, patientId: string): Promise<boolean> => {
    setSaving(true);
    try {
      const entry = entries.find((e) => e.id === id);
      if (!entry) {
        toast.error('Registro não encontrado');
        return false;
      }
      if (entry.status !== 'rascunho') {
        toast.error('Apenas rascunhos podem ser excluídos');
        return false;
      }

      // Only clinical_evolutions supports delete; anamnesis_records does not have delete policy
      if (entry._source === 'clinical_evolutions') {
        toast.error('Evoluções não podem ser excluídas');
        return false;
      }

      toast.error('Registros assinados ou finalizados não podem ser excluídos');
      return false;
    } catch (err) {
      console.error('Error deleting entry:', err);
      toast.error('Erro ao excluir registro');
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Filter entries by type
  const getEntriesByType = useCallback(
    (type: string) => entries.filter((e) => e.entry_type === type),
    [entries]
  );

  const getSignedEntries = useCallback(
    () => entries.filter((e) => e.status === 'assinado'),
    [entries]
  );

  const getDraftEntries = useCallback(
    () => entries.filter((e) => e.status === 'rascunho'),
    [entries]
  );

  return {
    entries,
    loading,
    saving,
    fetchEntriesForPatient,
    createEntry,
    updateEntry,
    signEntry,
    deleteEntry,
    getEntriesByType,
    getSignedEntries,
    getDraftEntries,
  };
}
