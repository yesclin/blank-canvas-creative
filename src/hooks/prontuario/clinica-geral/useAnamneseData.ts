import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { resolveProfessionalNames } from '@/lib/clinicalDirectory';
import { useClinicData } from '@/hooks/useClinicData';
import { toast } from 'sonner';
import type { AnamneseData } from '@/components/prontuario/clinica-geral/AnamneseBlock';

type AnamnesePayload = Omit<
  AnamneseData,
  'id' | 'patient_id' | 'version' | 'created_at' | 'created_by' | 'created_by_name' | 'is_current'
>;

interface UseAnamneseDataResult {
  currentAnamnese: AnamneseData | null;
  anamneseHistory: AnamneseData[];
  loading: boolean;
  saving: boolean;
  error: string | null;
  saveAnamnese: (data: AnamnesePayload) => Promise<void>;
  updateAnamnese: (id: string, data: AnamnesePayload) => Promise<void>;
  refetch: () => Promise<void>;
}

/**
 * Anamnese genérica (Clínica Geral) — pipeline atual de `patient_anamneses`:
 * todo o conteúdo clínico vive no jsonb `data`. Não existem colunas
 * `version` / `is_current` / `created_by`: a versão é derivada da ordem
 * cronológica e a autoria vem de `professional_id`.
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
        .select('id, patient_id, professional_id, data, status, created_at')
        .eq('patient_id', patientId)
        .eq('clinic_id', clinic.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      const rows = data || [];

      // Autoria: professional_id -> professionals.full_name
      const professionalIds = [...new Set(rows.map(r => r.professional_id).filter(Boolean))] as string[];
      const professionalsMap = await resolveProfessionalNames(professionalIds);

      const total = rows.length;
      const mapped: AnamneseData[] = rows.map((item, index) => {
        const payload = (item.data || {}) as Record<string, any>;
        return {
          id: item.id,
          patient_id: item.patient_id,
          // Ordem desc: o mais recente é a maior versão
          version: total - index,
          queixa_principal: payload.queixa_principal || '',
          historia_doenca_atual: payload.historia_doenca_atual || '',
          antecedentes_pessoais: payload.antecedentes_pessoais || '',
          antecedentes_familiares: payload.antecedentes_familiares || '',
          habitos_vida: payload.habitos_vida || '',
          medicamentos_uso_continuo: payload.medicamentos_uso_continuo || '',
          alergias: payload.alergias || '',
          comorbidades: payload.comorbidades || '',
          historia_ginecologica: payload.historia_ginecologica || '',
          revisao_sistemas: payload.revisao_sistemas || '',
          structured_data: (payload.structured_data as Record<string, unknown>) || {},
          template_id: payload.template_id || undefined,
          created_at: item.created_at,
          created_by: item.professional_id || '',
          created_by_name: item.professional_id ? professionalsMap[item.professional_id] : undefined,
          is_current: index === 0,
        };
      });

      setAnamneseHistory(mapped);
      setCurrentAnamnese(mapped[0] || null);
    } catch (err) {
      console.error('Error fetching anamneses:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar anamnese');
    } finally {
      setLoading(false);
    }
  }, [patientId, clinic?.id]);

  const buildPayload = (data: AnamnesePayload) => ({
    queixa_principal: data.queixa_principal ?? '',
    historia_doenca_atual: data.historia_doenca_atual ?? '',
    antecedentes_pessoais: data.antecedentes_pessoais ?? '',
    antecedentes_familiares: data.antecedentes_familiares ?? '',
    habitos_vida: data.habitos_vida ?? '',
    medicamentos_uso_continuo: data.medicamentos_uso_continuo ?? '',
    alergias: data.alergias ?? '',
    comorbidades: data.comorbidades ?? '',
    historia_ginecologica: data.historia_ginecologica ?? '',
    revisao_sistemas: data.revisao_sistemas ?? '',
    structured_data: data.structured_data ?? {},
    template_id: data.template_id ?? null,
  });

  const saveAnamnese = useCallback(async (data: AnamnesePayload) => {
    if (!patientId || !clinic?.id) {
      toast.error('Paciente ou clínica não identificados');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;
      if (!user) throw new Error('Usuário não autenticado');

      const { data: professional } = await supabase
        .from('professionals')
        .select('id')
        .eq('clinic_id', clinic.id)
        .eq('user_id', user.id)
        .maybeSingle();

      const { error: insertError } = await supabase
        .from('patient_anamneses')
        .insert({
          patient_id: patientId,
          clinic_id: clinic.id,
          professional_id: professional?.id ?? null,
          data: buildPayload(data),
          status: 'rascunho',
        });

      if (insertError) throw insertError;

      toast.success(`Anamnese salva (versão ${anamneseHistory.length + 1})`);
      await fetchAnamneses();
    } catch (err) {
      console.error('Error saving anamnese:', err);
      const message = err instanceof Error ? err.message : 'Erro ao salvar anamnese';
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }, [patientId, clinic?.id, anamneseHistory.length, fetchAnamneses]);

  const updateAnamnese = useCallback(async (id: string, data: AnamnesePayload) => {
    if (!patientId || !clinic?.id) {
      toast.error('Paciente ou clínica não identificados');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('patient_anamneses')
        .update({ data: buildPayload(data), updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('clinic_id', clinic.id);

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
    fetchAnamneses();
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
