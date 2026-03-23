import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useClinicData } from '@/hooks/useClinicData';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

export interface MedicalRecordEntry {
  id: string;
  clinic_id: string;
  patient_id: string;
  professional_id: string;
  template_id: string | null;
  appointment_id: string | null;
  entry_type: string;
  status: 'draft' | 'signed' | 'amended';
  content: Record<string, unknown>;
  notes: string | null;
  next_steps: string | null;
  signed_at: string | null;
  signed_by: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  // Joined fields
  professional_name?: string;
  template_name?: string;
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
  // Immutable context (saved once, never overwritten)
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

  const fetchEntriesForPatient = useCallback(async (patientId: string) => {
    if (!clinic?.id || !patientId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('medical_record_entries')
        .select('*')
        .eq('clinic_id', clinic.id)
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const parsed = (data || []).map((e) => ({
        ...e,
        content: (e.content as Record<string, unknown>) || {},
        professional_name: 'Profissional',
        template_name: null,
      })) as MedicalRecordEntry[];

      setEntries(parsed);
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
      const { data: userData } = await supabase.auth.getUser();

      const insertData: Record<string, unknown> = {
        clinic_id: clinic.id,
        patient_id: input.patient_id,
        professional_id: input.professional_id,
        template_id: input.template_id || null,
        appointment_id: input.appointment_id || null,
        entry_type: input.entry_type,
        status: 'draft',
        content: input.content as unknown as Json,
        notes: input.notes || null,
        next_steps: input.next_steps || null,
        created_by: userData?.user?.id || null,
      };

      // Persist immutable context
      if (input.specialty_id) insertData.specialty_id = input.specialty_id;
      if (input.procedure_id) insertData.procedure_id = input.procedure_id;
      if (input.template_version_id) insertData.template_version_id = input.template_version_id;
      if (input.structure_snapshot) insertData.structure_snapshot = input.structure_snapshot as unknown as Json;

      const { data, error } = await supabase
        .from('medical_record_entries')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .insert(insertData as any)
        .select()
        .single();

      if (error) throw error;

      toast.success('Registro criado');
      await fetchEntriesForPatient(input.patient_id);
      return data.id;
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
      const { error } = await supabase
        .from('medical_record_entries')
        .update({
          content: updates.content ? (updates.content as unknown as Json) : undefined,
          notes: updates.notes,
          next_steps: updates.next_steps,
        })
        .eq('id', id);

      if (error) throw error;

      toast.success('Registro atualizado');
      await fetchEntriesForPatient(patientId);
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
      const { data: userData } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('medical_record_entries')
        .update({
          status: 'signed',
          signed_at: new Date().toISOString(),
          signed_by: userData?.user?.id || null,
        })
        .eq('id', id);

      if (error) throw error;

      toast.success('Registro assinado');
      await fetchEntriesForPatient(patientId);
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
      // Only allow deleting drafts
      const entry = entries.find((e) => e.id === id);
      if (entry?.status !== 'draft') {
        toast.error('Apenas rascunhos podem ser excluídos');
        return false;
      }

      const { error } = await supabase.from('medical_record_entries').delete().eq('id', id);

      if (error) throw error;

      toast.success('Registro excluído');
      await fetchEntriesForPatient(patientId);
      return true;
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

  // Get signed entries only
  const getSignedEntries = useCallback(
    () => entries.filter((e) => e.status === 'signed'),
    [entries]
  );

  // Get draft entries
  const getDraftEntries = useCallback(
    () => entries.filter((e) => e.status === 'draft'),
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
