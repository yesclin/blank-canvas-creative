/**
 * Hook for managing dynamic aesthetics anamnesis records.
 * Uses anamnesis_records table with template_id/responses pattern.
 * NO autosave — only manual save via explicit user action.
 */

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useClinicData } from '@/hooks/useClinicData';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';
import { ADVANCED_TEMPLATE_MAP } from '@/hooks/prontuario/estetica/esteticaAdvancedTemplates';
import type { DynamicField, DynamicFormValues } from '@/components/prontuario/aesthetics/anamnese-fields/types';

export interface DynamicAnamneseRecord {
  id: string;
  template_id: string;
  template_version_id: string | null;
  responses: DynamicFormValues;
  structure_snapshot: DynamicField[] | null;
  status: string;
  signed_at: string | null;
  signed_by: string | null;
  saved_at: string | null;
  edit_window_until: string | null;
  locked_at: string | null;
  created_at: string;
  updated_at: string;
}

interface UseDynamicAnamneseParams {
  patientId: string | null;
  appointmentId?: string | null;
  templateId: string | null;
  templateVersionId: string | null;
  templateType: string | null;
  specialtyId: string | null;
  /**
   * When true, skips fetching the most recent record for this template
   * and starts with an empty draft. Used by the "Nova Anamnese" flow to
   * prevent reopening an existing/signed record when the user wants to
   * create a fresh one.
   */
  skipFetch?: boolean;
}

export function useDynamicAnamneseEstetica({
  patientId,
  appointmentId,
  templateId,
  templateVersionId,
  templateType,
  specialtyId,
  skipFetch = false,
}: UseDynamicAnamneseParams) {
  const { clinic } = useClinicData();
  const [record, setRecord] = useState<DynamicAnamneseRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Get the fields structure from the template type
  const fields: DynamicField[] = templateType ? (ADVANCED_TEMPLATE_MAP[templateType] || []) : [];

  const fetchRecord = useCallback(async () => {
    if (!patientId || !clinic?.id || !templateId || skipFetch) {
      setRecord(null);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('anamnesis_records')
        .select('*')
        .eq('patient_id', patientId)
        .eq('clinic_id', clinic.id)
        .eq('template_id', templateId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setRecord({
          id: data.id,
          template_id: data.template_id || '',
          template_version_id: data.template_version_id,
          responses: (data.responses as DynamicFormValues) || {},
          structure_snapshot: data.structure_snapshot as DynamicField[] | null,
          status: data.status,
          signed_at: data.signed_at,
          signed_by: data.signed_by,
          saved_at: data.saved_at,
          edit_window_until: data.edit_window_until,
          locked_at: data.locked_at,
          created_at: data.created_at,
          updated_at: data.updated_at,
        });
      } else {
        setRecord(null);
      }
    } catch (err) {
      console.error('Error fetching dynamic anamnese record:', err);
    } finally {
      setLoading(false);
    }
  }, [patientId, clinic?.id, templateId, skipFetch]);

  useEffect(() => {
    fetchRecord();
  }, [fetchRecord]);

  const saveResponses = useCallback(async (responses: DynamicFormValues) => {
    if (!patientId || !clinic?.id || !templateId) return;
    setSaving(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Usuário não autenticado');

      const { data: professional } = await supabase
        .from('professionals')
        .select('id')
        .eq('user_id', userData.user.id)
        .eq('clinic_id', clinic.id)
        .maybeSingle();

      const professionalId = professional?.id || userData.user.id;

      const { getEditWindowFields } = await import('@/hooks/prontuario/anamnesisEditWindowUtils');
      const editWindowFields = getEditWindowFields();

      if (record && !record.signed_at) {
        // Update existing draft — also refresh edit window on each manual save
        const { error } = await supabase
          .from('anamnesis_records')
          .update({
            responses: responses as unknown as Json,
            data: responses as unknown as Json,
            updated_at: new Date().toISOString(),
            ...editWindowFields,
          })
          .eq('id', record.id);

        if (error) throw error;

        setRecord((prev) => prev ? {
          ...prev,
          responses,
          updated_at: new Date().toISOString(),
          saved_at: editWindowFields.saved_at,
          edit_window_until: editWindowFields.edit_window_until,
        } : prev);
        toast.success('Anamnese salva');
      } else {
        // Create new record
        const structureSnapshot = fields as unknown as Json;
        const { data, error } = await supabase
          .from('anamnesis_records')
          .insert({
            patient_id: patientId,
            clinic_id: clinic.id,
            professional_id: professionalId,
            template_id: templateId,
            template_version_id: templateVersionId,
            specialty_id: specialtyId,
            appointment_id: appointmentId || null,
            responses: responses as unknown as Json,
            structure_snapshot: structureSnapshot,
            data: responses as unknown as Json,
            status: 'rascunho',
            created_by: userData.user.id,
            ...editWindowFields,
          })
          .select()
          .single();

        if (error) throw error;

        setRecord({
          id: data.id,
          template_id: data.template_id || '',
          template_version_id: data.template_version_id,
          responses: (data.responses as DynamicFormValues) || {},
          structure_snapshot: data.structure_snapshot as DynamicField[] | null,
          status: data.status,
          signed_at: data.signed_at,
          signed_by: data.signed_by,
          saved_at: data.saved_at,
          edit_window_until: data.edit_window_until,
          locked_at: data.locked_at,
          created_at: data.created_at,
          updated_at: data.updated_at,
        });
        toast.success('Anamnese criada');
      }
    } catch (err) {
      console.error('Error saving dynamic anamnese:', err);
      toast.error('Erro ao salvar anamnese');
    } finally {
      setSaving(false);
    }
  }, [patientId, clinic?.id, templateId, templateVersionId, specialtyId, appointmentId, record, fields]);

  return {
    record,
    fields,
    loading,
    saving,
    saveResponses,
    refetch: fetchRecord,
    isSigned: !!record?.signed_at,
  };
}
