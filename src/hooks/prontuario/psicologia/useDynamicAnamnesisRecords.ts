import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useClinicData } from '@/hooks/useClinicData';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

export interface DynamicAnamnesisRecord {
  id: string;
  patient_id: string;
  clinic_id: string;
  template_id: string;
  template_version_id: string;
  specialty_id: string | null;
  procedure_id: string | null;
  appointment_id: string | null;
  responses: Record<string, unknown>;
  structure_snapshot: unknown;
  created_at: string;
  created_by: string | null;
  created_by_name?: string;
  template_name?: string;
  /** Partner patients linked to this record */
  linked_patients?: { patient_id: string; role: string; full_name?: string }[];
}

export function useDynamicAnamnesisRecords(patientId: string | null) {
  const { clinic } = useClinicData();
  const [records, setRecords] = useState<DynamicAnamnesisRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchRecords = useCallback(async () => {
    if (!patientId || !clinic?.id) {
      setRecords([]);
      return;
    }
    setLoading(true);
    try {
      // Fetch records where this patient is the primary patient
      const { data: directRecords, error } = await supabase
        .from('anamnesis_records')
        .select('*, anamnesis_templates(name)')
        .eq('patient_id', patientId)
        .eq('clinic_id', clinic.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Also fetch records where this patient is a linked partner
      const { data: linkedRows } = await supabase
        .from('anamnesis_record_patients' as any)
        .select('record_id')
        .eq('patient_id', patientId);

      const linkedRecordIds = (linkedRows || [])
        .map((r: any) => r.record_id)
        .filter(Boolean);

      let partnerRecords: any[] = [];
      if (linkedRecordIds.length > 0) {
        const directIds = (directRecords || []).map(r => r.id);
        const extraIds = linkedRecordIds.filter((id: string) => !directIds.includes(id));
        if (extraIds.length > 0) {
          const { data: extra } = await supabase
            .from('anamnesis_records')
            .select('*, anamnesis_templates(name)')
            .in('id', extraIds)
            .eq('clinic_id', clinic.id)
            .order('created_at', { ascending: false });
          partnerRecords = extra || [];
        }
      }

      const allRecords = [...(directRecords || []), ...partnerRecords];

      // Get creator names
      const creatorIds = [...new Set(allRecords.map(r => r.created_by).filter(Boolean))] as string[];
      let creatorsMap: Record<string, string> = {};
      if (creatorIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name')
          .in('user_id', creatorIds);
        if (profiles) {
          creatorsMap = profiles.reduce((acc, p) => {
            if (p.user_id && p.full_name) acc[p.user_id] = p.full_name;
            return acc;
          }, {} as Record<string, string>);
        }
      }

      // Fetch linked patients for all records
      const allRecordIds = allRecords.map(r => r.id);
      let linkedPatientsMap: Record<string, { patient_id: string; role: string; full_name?: string }[]> = {};
      if (allRecordIds.length > 0) {
        const { data: links } = await supabase
          .from('anamnesis_record_patients' as any)
          .select('record_id, patient_id, role')
          .in('record_id', allRecordIds);

        if (links && links.length > 0) {
          const patientIds = [...new Set((links as any[]).map(l => l.patient_id))];
          const { data: patients } = await supabase
            .from('patients')
            .select('id, full_name')
            .in('id', patientIds);
          const nameMap: Record<string, string> = {};
          (patients || []).forEach(p => { nameMap[p.id] = p.full_name; });

          for (const link of links as any[]) {
            if (!linkedPatientsMap[link.record_id]) linkedPatientsMap[link.record_id] = [];
            linkedPatientsMap[link.record_id].push({
              patient_id: link.patient_id,
              role: link.role,
              full_name: nameMap[link.patient_id],
            });
          }
        }
      }

      const mapped: DynamicAnamnesisRecord[] = allRecords.map((r: any) => ({
        id: r.id,
        patient_id: r.patient_id,
        clinic_id: r.clinic_id,
        template_id: r.template_id,
        template_version_id: r.template_version_id,
        specialty_id: r.specialty_id,
        procedure_id: r.procedure_id,
        appointment_id: r.appointment_id,
        responses: (r.responses as Record<string, unknown>) || {},
        structure_snapshot: r.structure_snapshot,
        created_at: r.created_at,
        created_by: r.created_by,
        created_by_name: r.created_by ? creatorsMap[r.created_by] : undefined,
        template_name: r.anamnesis_templates?.name || undefined,
        linked_patients: linkedPatientsMap[r.id] || [],
      }));

      // Sort by date descending
      mapped.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setRecords(mapped);
    } catch (err) {
      console.error('Error fetching dynamic anamnesis records:', err);
    } finally {
      setLoading(false);
    }
  }, [patientId, clinic?.id]);

  const saveRecord = useCallback(async (params: {
    templateId: string;
    templateVersionId: string;
    specialtyId?: string | null;
    procedureId?: string | null;
    appointmentId?: string | null;
    responses: Record<string, unknown>;
    structureSnapshot: unknown;
    /** Optional partner patient for couple therapy */
    partnerPatientId?: string | null;
  }): Promise<string | null> => {
    if (!patientId || !clinic?.id) {
      toast.error('Paciente ou clínica não identificados');
      return null;
    }
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('anamnesis_records')
        .insert({
          patient_id: patientId,
          clinic_id: clinic.id,
          template_id: params.templateId,
          template_version_id: params.templateVersionId,
          specialty_id: params.specialtyId || null,
          procedure_id: params.procedureId || null,
          appointment_id: params.appointmentId || null,
          responses: params.responses as unknown as Json,
          structure_snapshot: params.structureSnapshot as unknown as Json,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Create link records for multi-patient (couple therapy)
      if (params.partnerPatientId) {
        // Link titular
        await supabase
          .from('anamnesis_record_patients' as any)
          .insert({
            record_id: data.id,
            patient_id: patientId,
            role: 'titular',
          });

        // Link partner
        await supabase
          .from('anamnesis_record_patients' as any)
          .insert({
            record_id: data.id,
            patient_id: params.partnerPatientId,
            role: 'parceiro',
          });
      }

      toast.success('Anamnese salva com sucesso');
      await fetchRecords();
      return data.id;
    } catch (err) {
      console.error('Error saving dynamic anamnesis:', err);
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar anamnese');
      return null;
    } finally {
      setSaving(false);
    }
  }, [patientId, clinic?.id, fetchRecords]);

  const updateRecord = useCallback(async (
    id: string,
    responses: Record<string, unknown>
  ): Promise<boolean> => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('anamnesis_records')
        .update({ responses: responses as unknown as Json })
        .eq('id', id);

      if (error) throw error;

      toast.success('Anamnese atualizada');
      await fetchRecords();
      return true;
    } catch (err) {
      console.error('Error updating dynamic anamnesis:', err);
      toast.error('Erro ao atualizar anamnese');
      return false;
    } finally {
      setSaving(false);
    }
  }, [fetchRecords]);

  return {
    records,
    loading,
    saving,
    fetchRecords,
    saveRecord,
    updateRecord,
  };
}
