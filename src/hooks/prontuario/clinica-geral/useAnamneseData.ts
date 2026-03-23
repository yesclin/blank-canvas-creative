import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useClinicData } from '@/hooks/useClinicData';
import { toast } from 'sonner';
import type { AnamneseData } from '@/components/prontuario/clinica-geral/AnamneseBlock';

interface UseAnamneseDataResult {
  currentAnamnese: AnamneseData | null;
  anamneseHistory: AnamneseData[];
  loading: boolean;
  saving: boolean;
  error: string | null;
  saveAnamnese: (data: Omit<AnamneseData, 'id' | 'patient_id' | 'version' | 'created_at' | 'created_by' | 'created_by_name' | 'is_current'>) => Promise<void>;
  updateAnamnese: (id: string, data: Omit<AnamneseData, 'id' | 'patient_id' | 'version' | 'created_at' | 'created_by' | 'created_by_name' | 'is_current'>) => Promise<void>;
  refetch: () => Promise<void>;
}

/**
 * Hook para gerenciar dados de Anamnese com versionamento
 * Supports both legacy columns and new structured_data JSON
 */
export function useAnamneseData(patientId: string | null): UseAnamneseDataResult {
  const { clinic } = useClinicData();
  const [currentAnamnese, setCurrentAnamnese] = useState<AnamneseData | null>(null);
  const [anamneseHistory, setAnamneseHistory] = useState<AnamneseData[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnamneses = useCallback(async () => {
    if (!patientId || !clinic?.id) {
      setCurrentAnamnese(null);
      setAnamneseHistory([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('patient_anamneses')
        .select('*')
        .eq('patient_id', patientId)
        .eq('clinic_id', clinic.id)
        .order('version', { ascending: false });

      if (fetchError) throw fetchError;

      // Get creator names
      const creatorIds = [...new Set((data || []).map(a => a.created_by).filter(Boolean))];
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

      const mapped: AnamneseData[] = (data || []).map(item => ({
        id: item.id,
        patient_id: item.patient_id,
        version: item.version,
        queixa_principal: item.queixa_principal || '',
        historia_doenca_atual: item.historia_doenca_atual || '',
        antecedentes_pessoais: item.antecedentes_pessoais || '',
        antecedentes_familiares: item.antecedentes_familiares || '',
        habitos_vida: item.habitos_vida || '',
        medicamentos_uso_continuo: item.medicamentos_uso_continuo || '',
        alergias: item.alergias || '',
        comorbidades: item.comorbidades || '',
        historia_ginecologica: (item as any).historia_ginecologica || '',
        revisao_sistemas: (item as any).revisao_sistemas || '',
        structured_data: (item as any).structured_data as Record<string, unknown> || {},
        template_id: (item as any).template_id || undefined,
        created_at: item.created_at,
        created_by: item.created_by || '',
        created_by_name: item.created_by ? creatorsMap[item.created_by] : undefined,
        is_current: item.is_current ?? false,
      }));

      setAnamneseHistory(mapped);
      setCurrentAnamnese(mapped.find(a => a.is_current) || mapped[0] || null);
    } catch (err) {
      console.error('Error fetching anamneses:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar anamnese');
    } finally {
      setLoading(false);
    }
  }, [patientId, clinic?.id]);

  const saveAnamnese = useCallback(async (
    data: Omit<AnamneseData, 'id' | 'patient_id' | 'version' | 'created_at' | 'created_by' | 'created_by_name' | 'is_current'>
  ) => {
    if (!patientId || !clinic?.id) {
      toast.error('Paciente ou clínica não identificados');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const nextVersion = (currentAnamnese?.version || 0) + 1;

      // Mark existing as not current
      if (anamneseHistory.length > 0) {
        const { error: updateError } = await supabase
          .from('patient_anamneses')
          .update({ is_current: false })
          .eq('patient_id', patientId)
          .eq('clinic_id', clinic.id);
        if (updateError) throw updateError;
      }

      // Insert new version with structured data
      const insertData: Record<string, unknown> = {
        patient_id: patientId,
        clinic_id: clinic.id,
        version: nextVersion,
        queixa_principal: data.queixa_principal,
        historia_doenca_atual: data.historia_doenca_atual,
        antecedentes_pessoais: data.antecedentes_pessoais,
        antecedentes_familiares: data.antecedentes_familiares,
        habitos_vida: data.habitos_vida,
        medicamentos_uso_continuo: data.medicamentos_uso_continuo,
        alergias: data.alergias,
        comorbidades: data.comorbidades,
        created_by: user.id,
        is_current: true,
      };

      // Add new structured fields
      if (data.structured_data) insertData.structured_data = data.structured_data;
      if (data.template_id) insertData.template_id = data.template_id;
      if (data.historia_ginecologica) insertData.historia_ginecologica = data.historia_ginecologica;
      if (data.revisao_sistemas) insertData.revisao_sistemas = data.revisao_sistemas;

      const { error: insertError } = await supabase
        .from('patient_anamneses')
        .insert(insertData as any);

      if (insertError) throw insertError;

      toast.success(`Anamnese salva (versão ${nextVersion})`);
      await fetchAnamneses();
    } catch (err) {
      console.error('Error saving anamnese:', err);
      const message = err instanceof Error ? err.message : 'Erro ao salvar anamnese';
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }, [patientId, clinic?.id, currentAnamnese, anamneseHistory, fetchAnamneses]);

  const updateAnamnese = useCallback(async (
    id: string,
    data: Omit<AnamneseData, 'id' | 'patient_id' | 'version' | 'created_at' | 'created_by' | 'created_by_name' | 'is_current'>
  ) => {
    if (!patientId || !clinic?.id) {
      toast.error('Paciente ou clínica não identificados');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const updateData: Record<string, unknown> = {
        queixa_principal: data.queixa_principal,
        historia_doenca_atual: data.historia_doenca_atual,
        antecedentes_pessoais: data.antecedentes_pessoais,
        antecedentes_familiares: data.antecedentes_familiares,
        habitos_vida: data.habitos_vida,
        medicamentos_uso_continuo: data.medicamentos_uso_continuo,
        alergias: data.alergias,
        comorbidades: data.comorbidades,
      };

      if (data.structured_data) updateData.structured_data = data.structured_data;
      if (data.template_id) updateData.template_id = data.template_id;
      if (data.historia_ginecologica) updateData.historia_ginecologica = data.historia_ginecologica;
      if (data.revisao_sistemas) updateData.revisao_sistemas = data.revisao_sistemas;

      const { error: updateError } = await supabase
        .from('patient_anamneses')
        .update(updateData as any)
        .eq('id', id);

      if (updateError) throw updateError;

      toast.success('Anamnese atualizada');
      await fetchAnamneses();
    } catch (err) {
      console.error('Error updating anamnese:', err);
      const message = err instanceof Error ? err.message : 'Erro ao atualizar anamnese';
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }, [patientId, clinic?.id, fetchAnamneses]);

  useEffect(() => {
    let cancelled = false;
    fetchAnamneses().then(() => {
      if (cancelled) return;
    });
    return () => { cancelled = true; };
  }, [fetchAnamneses]);

  return {
    currentAnamnese,
    anamneseHistory,
    loading,
    saving,
    error,
    saveAnamnese,
    updateAnamnese,
    refetch: fetchAnamneses,
  };
}
