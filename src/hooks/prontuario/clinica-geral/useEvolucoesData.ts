import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useClinicData } from '@/hooks/useClinicData';
import { toast } from 'sonner';
import type { EvolucaoClinica, TipoAtendimento } from '@/components/prontuario/clinica-geral/EvolucoesBlock';

interface UseEvolucoesDataResult {
  evolucoes: EvolucaoClinica[];
  loading: boolean;
  saving: boolean;
  error: string | null;
  currentProfessionalId: string | null;
  currentProfessionalName: string | null;
  saveEvolucao: (data: {
    tipo_atendimento: TipoAtendimento;
    descricao_clinica: string;
    hipoteses_diagnosticas: string;
    conduta: string;
    assinar: boolean;
  }) => Promise<void>;
  signEvolucao: (evolucaoId: string) => Promise<void>;
  refetch: () => Promise<void>;
}

/**
 * Hook para gerenciar Evoluções Clínicas
 * 
 * Regras:
 * - Evoluções são exibidas em ordem cronológica
 * - Nunca podem ser apagadas automaticamente
 * - Após assinadas, não podem ser editadas
 */
export function useEvolucoesData(patientId: string | null): UseEvolucoesDataResult {
  const { clinic } = useClinicData();
  const [evolucoes, setEvolucoes] = useState<EvolucaoClinica[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentProfessionalId, setCurrentProfessionalId] = useState<string | null>(null);
  const [currentProfessionalName, setCurrentProfessionalName] = useState<string | null>(null);

  // Fetch current user's professional info
  useEffect(() => {
    const fetchCurrentProfessional = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !clinic?.id) return;

      // Get profile to get the professional name
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', user.id)
        .single();

      // Get professional ID
      const { data: professional } = await supabase
        .from('professionals')
        .select('id')
        .eq('user_id', user.id)
        .eq('clinic_id', clinic.id)
        .single();

      if (professional) {
        setCurrentProfessionalId(professional.id);
      }
      if (profile) {
        setCurrentProfessionalName(profile.full_name || null);
      }
    };

    fetchCurrentProfessional();
  }, [clinic?.id]);

  const fetchEvolucoes = useCallback(async () => {
    if (!patientId || !clinic?.id) {
      setEvolucoes([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('patient_evolucoes')
        .select('*')
        .eq('patient_id', patientId)
        .eq('clinic_id', clinic.id)
        .order('data_hora', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      // Get professional names
      const professionalIds = [...new Set((data || []).map(e => e.profissional_id).filter(Boolean))];
      let professionalsMap: Record<string, string> = {};

      if (professionalIds.length > 0) {
        const { data: professionals } = await supabase
          .from('professionals')
          .select('id, user_id')
          .in('id', professionalIds);

        if (professionals) {
          const userIds = professionals.map(p => p.user_id).filter(Boolean);
          const { data: profiles } = await supabase
            .from('profiles')
            .select('user_id, full_name')
            .in('user_id', userIds);

          if (profiles) {
            const userToName = profiles.reduce((acc, p) => {
              if (p.user_id && p.full_name) {
                acc[p.user_id] = p.full_name;
              }
              return acc;
            }, {} as Record<string, string>);

            professionals.forEach(prof => {
              if (prof.user_id && userToName[prof.user_id]) {
                professionalsMap[prof.id] = userToName[prof.user_id];
              }
            });
          }
        }
      }

      const mapped: EvolucaoClinica[] = (data || []).map(item => ({
        id: item.id,
        patient_id: item.patient_id,
        clinic_id: item.clinic_id,
        data_hora: item.data_hora,
        profissional_id: item.profissional_id,
        profissional_nome: professionalsMap[item.profissional_id] || 'Profissional',
        tipo_atendimento: item.tipo_atendimento as TipoAtendimento,
        descricao_clinica: item.descricao_clinica || '',
        hipoteses_diagnosticas: item.hipoteses_diagnosticas || '',
        conduta: item.conduta || '',
        status: item.status as 'rascunho' | 'assinada',
        assinada_em: item.assinada_em || undefined,
        created_at: item.created_at,
      }));

      setEvolucoes(mapped);

    } catch (err) {
      console.error('Error fetching evolucoes:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar evoluções');
    } finally {
      setLoading(false);
    }
  }, [patientId, clinic?.id]);

  const saveEvolucao = useCallback(async (data: {
    tipo_atendimento: TipoAtendimento;
    descricao_clinica: string;
    hipoteses_diagnosticas: string;
    conduta: string;
    assinar: boolean;
  }) => {
    if (!patientId || !clinic?.id || !currentProfessionalId) {
      toast.error('Dados do paciente ou profissional não identificados');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const now = new Date().toISOString();
      
      const { error: insertError } = await supabase
        .from('patient_evolucoes')
        .insert({
          patient_id: patientId,
          clinic_id: clinic.id,
          profissional_id: currentProfessionalId,
          data_hora: now,
          tipo_atendimento: data.tipo_atendimento,
          descricao_clinica: data.descricao_clinica,
          hipoteses_diagnosticas: data.hipoteses_diagnosticas,
          conduta: data.conduta,
          status: data.assinar ? 'assinada' : 'rascunho',
          assinada_em: data.assinar ? now : null,
        });

      if (insertError) throw insertError;

      toast.success(data.assinar ? 'Evolução registrada e assinada!' : 'Rascunho salvo com sucesso!');
      await fetchEvolucoes();

    } catch (err) {
      console.error('Error saving evolucao:', err);
      const message = err instanceof Error ? err.message : 'Erro ao salvar evolução';
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }, [patientId, clinic?.id, currentProfessionalId, fetchEvolucoes]);

  const signEvolucao = useCallback(async (evolucaoId: string) => {
    setSaving(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('patient_evolucoes')
        .update({
          status: 'assinada',
          assinada_em: new Date().toISOString(),
        })
        .eq('id', evolucaoId);

      if (updateError) throw updateError;

      toast.success('Evolução assinada com sucesso!');
      await fetchEvolucoes();

    } catch (err) {
      console.error('Error signing evolucao:', err);
      const message = err instanceof Error ? err.message : 'Erro ao assinar evolução';
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }, [fetchEvolucoes]);

  useEffect(() => {
    let cancelled = false;
    fetchEvolucoes().then(() => { if (cancelled) return; });
    return () => { cancelled = true; };
  }, [fetchEvolucoes]);

  return {
    evolucoes,
    loading,
    saving,
    error,
    currentProfessionalId,
    currentProfessionalName,
    saveEvolucao,
    signEvolucao,
    refetch: fetchEvolucoes,
  };
}
