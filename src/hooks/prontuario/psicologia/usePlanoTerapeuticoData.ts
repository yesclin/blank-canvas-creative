import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useClinicData } from '@/hooks/useClinicData';
import { toast } from 'sonner';

/**
 * Estrutura de dados do Plano Terapêutico
 */
export interface PlanoTerapeuticoData {
  id: string;
  patient_id: string;
  version: number;
  objetivos_terapeuticos: string;
  estrategias_intervencao: string;
  metas_curto_prazo: string;
  metas_medio_prazo: string;
  metas_longo_prazo: string;
  frequencia_recomendada: string;
  criterios_reavaliacao: string;
  observacoes: string;
  created_at: string;
  created_by: string;
  created_by_name?: string;
  is_current: boolean;
}

export type PlanoTerapeuticoFormData = Omit<
  PlanoTerapeuticoData, 
  'id' | 'patient_id' | 'version' | 'created_at' | 'created_by' | 'created_by_name' | 'is_current'
>;

interface UsePlanoTerapeuticoDataResult {
  currentPlano: PlanoTerapeuticoData | null;
  planoHistory: PlanoTerapeuticoData[];
  loading: boolean;
  saving: boolean;
  error: string | null;
  savePlano: (data: PlanoTerapeuticoFormData) => Promise<void>;
  refetch: () => Promise<void>;
}

/**
 * Hook para gerenciar Plano Terapêutico com versionamento
 * 
 * Regras:
 * - Pode ser ajustado ao longo do processo terapêutico
 * - Mantém histórico completo das versões anteriores
 */
export function usePlanoTerapeuticoData(patientId: string | null): UsePlanoTerapeuticoDataResult {
  const { clinic } = useClinicData();
  const [currentPlano, setCurrentPlano] = useState<PlanoTerapeuticoData | null>(null);
  const [planoHistory, setPlanoHistory] = useState<PlanoTerapeuticoData[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPlanos = useCallback(async () => {
    if (!patientId || !clinic?.id) {
      setCurrentPlano(null);
      setPlanoHistory([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('plano_terapeutico_psicologia')
        .select('*')
        .eq('patient_id', patientId)
        .eq('clinic_id', clinic.id)
        .order('version', { ascending: false });

      if (fetchError) throw fetchError;

      // Get creator names
      const creatorIds = [...new Set((data || []).map(p => p.created_by).filter(Boolean))];
      let creatorsMap: Record<string, string> = {};
      
      if (creatorIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name')
          .in('user_id', creatorIds);
        
        if (profiles) {
          creatorsMap = profiles.reduce((acc, p) => {
            if (p.user_id && p.full_name) {
              acc[p.user_id] = p.full_name;
            }
            return acc;
          }, {} as Record<string, string>);
        }
      }

      const mapped: PlanoTerapeuticoData[] = (data || []).map(item => ({
        id: item.id,
        patient_id: item.patient_id,
        version: item.version,
        objetivos_terapeuticos: item.objetivos_terapeuticos || '',
        estrategias_intervencao: item.estrategias_intervencao || '',
        metas_curto_prazo: item.metas_curto_prazo || '',
        metas_medio_prazo: item.metas_medio_prazo || '',
        metas_longo_prazo: item.metas_longo_prazo || '',
        frequencia_recomendada: item.frequencia_recomendada || '',
        criterios_reavaliacao: item.criterios_reavaliacao || '',
        observacoes: item.observacoes || '',
        created_at: item.created_at,
        created_by: item.created_by || '',
        created_by_name: item.created_by ? creatorsMap[item.created_by] : undefined,
        is_current: item.is_current ?? false,
      }));

      setPlanoHistory(mapped);
      setCurrentPlano(mapped.find(p => p.is_current) || mapped[0] || null);

    } catch (err) {
      console.error('Error fetching plano terapeutico:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar plano');
    } finally {
      setLoading(false);
    }
  }, [patientId, clinic?.id]);

  const savePlano = useCallback(async (data: PlanoTerapeuticoFormData) => {
    if (!patientId || !clinic?.id) {
      toast.error('Paciente ou clínica não identificados');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const nextVersion = (currentPlano?.version || 0) + 1;

      // Mark all existing as not current
      if (planoHistory.length > 0) {
        const { error: updateError } = await supabase
          .from('plano_terapeutico_psicologia')
          .update({ is_current: false })
          .eq('patient_id', patientId)
          .eq('clinic_id', clinic.id);

        if (updateError) throw updateError;
      }

      // Insert new version
      const { error: insertError } = await supabase
        .from('plano_terapeutico_psicologia')
        .insert({
          patient_id: patientId,
          clinic_id: clinic.id,
          version: nextVersion,
          objetivos_terapeuticos: data.objetivos_terapeuticos,
          estrategias_intervencao: data.estrategias_intervencao,
          metas_curto_prazo: data.metas_curto_prazo,
          metas_medio_prazo: data.metas_medio_prazo,
          metas_longo_prazo: data.metas_longo_prazo,
          frequencia_recomendada: data.frequencia_recomendada,
          criterios_reavaliacao: data.criterios_reavaliacao,
          observacoes: data.observacoes,
          created_by: user.id,
          is_current: true,
        });

      if (insertError) throw insertError;

      toast.success(`Plano terapêutico salvo (versão ${nextVersion})`);
      await fetchPlanos();

    } catch (err) {
      console.error('Error saving plano terapeutico:', err);
      const message = err instanceof Error ? err.message : 'Erro ao salvar plano';
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }, [patientId, clinic?.id, currentPlano, planoHistory, fetchPlanos]);

  useEffect(() => {
    fetchPlanos();
  }, [fetchPlanos]);

  return {
    currentPlano,
    planoHistory,
    loading,
    saving,
    error,
    savePlano,
    refetch: fetchPlanos,
  };
}
