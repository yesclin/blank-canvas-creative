import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useClinicData } from '@/hooks/useClinicData';
import { toast } from '@/hooks/use-toast';

export interface HipoteseDiagnostica {
  id: string;
  patient_id: string;
  clinic_id: string;
  professional_id: string | null;
  professional_name: string | null;
  hipotese_principal: string;
  hipoteses_secundarias: string | null;
  descricao_clinica: string | null;
  sintomas_observados: string | null;
  comportamentos_observados: string | null;
  fatores_desencadeantes: string | null;
  gravidade_impacto: string | null;
  status: 'provisoria' | 'fechada';
  observacoes: string | null;
  data_registro: string;
  created_at: string;
  updated_at: string;
}

export interface HipoteseFormData {
  hipotese_principal: string;
  hipoteses_secundarias: string;
  descricao_clinica: string;
  sintomas_observados: string;
  comportamentos_observados: string;
  fatores_desencadeantes: string;
  gravidade_impacto: string;
  status: 'provisoria' | 'fechada';
  observacoes: string;
  data_registro: string;
}

export function useHipotesesDiagnosticasData(patientId: string | null) {
  const { clinic } = useClinicData();
  const [hipoteses, setHipoteses] = useState<HipoteseDiagnostica[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchHipoteses = useCallback(async () => {
    if (!patientId || !clinic?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('psychology_diagnostic_hypotheses')
        .select('*')
        .eq('patient_id', patientId)
        .eq('clinic_id', clinic.id)
        .order('data_registro', { ascending: false });
      if (error) throw error;
      setHipoteses((data as HipoteseDiagnostica[]) || []);
    } catch (err) {
      console.error('Error fetching hipóteses:', err);
    } finally {
      setLoading(false);
    }
  }, [patientId, clinic?.id]);

  const saveHipotese = useCallback(async (
    formData: HipoteseFormData,
    professionalId: string | null,
    professionalName: string | null,
  ) => {
    if (!patientId || !clinic?.id) return null;
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('psychology_diagnostic_hypotheses')
        .insert({
          patient_id: patientId,
          clinic_id: clinic.id,
          professional_id: professionalId,
          professional_name: professionalName,
          hipotese_principal: formData.hipotese_principal,
          hipoteses_secundarias: formData.hipoteses_secundarias || null,
          descricao_clinica: formData.descricao_clinica || null,
          sintomas_observados: formData.sintomas_observados || null,
          comportamentos_observados: formData.comportamentos_observados || null,
          fatores_desencadeantes: formData.fatores_desencadeantes || null,
          gravidade_impacto: formData.gravidade_impacto || null,
          status: formData.status,
          observacoes: formData.observacoes || null,
          data_registro: formData.data_registro || new Date().toISOString(),
        })
        .select()
        .single();
      if (error) throw error;
      toast({ title: 'Hipótese salva com sucesso' });
      await fetchHipoteses();
      return data?.id || null;
    } catch (err: any) {
      console.error('Error saving hipótese:', err);
      toast({ title: 'Erro ao salvar hipótese', description: err.message, variant: 'destructive' });
      return null;
    } finally {
      setSaving(false);
    }
  }, [patientId, clinic?.id, fetchHipoteses]);

  const updateHipotese = useCallback(async (id: string, formData: Partial<HipoteseFormData>) => {
    if (!clinic?.id) return false;
    setSaving(true);
    try {
      const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
      for (const [key, value] of Object.entries(formData)) {
        updateData[key] = value || null;
      }
      const { error } = await supabase
        .from('psychology_diagnostic_hypotheses')
        .update(updateData)
        .eq('id', id)
        .eq('clinic_id', clinic.id);
      if (error) throw error;
      toast({ title: 'Hipótese atualizada com sucesso' });
      await fetchHipoteses();
      return true;
    } catch (err: any) {
      console.error('Error updating hipótese:', err);
      toast({ title: 'Erro ao atualizar', description: err.message, variant: 'destructive' });
      return false;
    } finally {
      setSaving(false);
    }
  }, [clinic?.id, fetchHipoteses]);

  const deleteHipotese = useCallback(async (id: string) => {
    if (!clinic?.id) return false;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('psychology_diagnostic_hypotheses')
        .delete()
        .eq('id', id)
        .eq('clinic_id', clinic.id);
      if (error) throw error;
      toast({ title: 'Hipótese excluída' });
      await fetchHipoteses();
      return true;
    } catch (err: any) {
      console.error('Error deleting hipótese:', err);
      toast({ title: 'Erro ao excluir', description: err.message, variant: 'destructive' });
      return false;
    } finally {
      setSaving(false);
    }
  }, [clinic?.id, fetchHipoteses]);

  return { hipoteses, loading, saving, fetchHipoteses, saveHipotese, updateHipotese, deleteHipotese };
}
