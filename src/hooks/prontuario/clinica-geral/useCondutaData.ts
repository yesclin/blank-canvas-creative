import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useClinicData } from '@/hooks/useClinicData';
import { toast } from 'sonner';
import type { Conduta } from '@/components/prontuario/clinica-geral/CondutaBlock';

interface UseCondutaDataResult {
  condutas: Conduta[];
  loading: boolean;
  saving: boolean;
  error: string | null;
  currentProfessionalId: string | null;
  currentProfessionalName: string | null;
  saveConduta: (data: {
    evolucao_id?: string;
    solicitacao_exames?: string;
    prescricoes?: string;
    orientacoes?: string;
    encaminhamentos?: string;
    retorno_agendado?: string;
    retorno_observacoes?: string;
  }) => Promise<void>;
  refetch: () => Promise<void>;
}

/**
 * Hook para gerenciar Planos/Condutas
 * 
 * Permite registrar exames, prescrições, orientações, encaminhamentos e retornos.
 * Pode ser vinculado a uma evolução clínica.
 */
export function useCondutaData(patientId: string | null): UseCondutaDataResult {
  const { clinic } = useClinicData();
  const [condutas, setCondutas] = useState<Conduta[]>([]);
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

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', user.id)
        .single();

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

  const fetchCondutas = useCallback(async () => {
    if (!patientId || !clinic?.id) {
      setCondutas([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('patient_condutas')
        .select('*')
        .eq('patient_id', patientId)
        .eq('clinic_id', clinic.id)
        .order('data_hora', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      // Get professional names
      const professionalIds = [...new Set((data || []).map(c => c.profissional_id).filter(Boolean))];
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

      const mapped: Conduta[] = (data || []).map(item => ({
        id: item.id,
        patient_id: item.patient_id,
        clinic_id: item.clinic_id,
        evolucao_id: item.evolucao_id || undefined,
        profissional_id: item.profissional_id,
        profissional_nome: professionalsMap[item.profissional_id] || 'Profissional',
        data_hora: item.data_hora,
        solicitacao_exames: item.solicitacao_exames || undefined,
        prescricoes: item.prescricoes || undefined,
        orientacoes: item.orientacoes || undefined,
        encaminhamentos: item.encaminhamentos || undefined,
        retorno_agendado: item.retorno_agendado || undefined,
        retorno_observacoes: item.retorno_observacoes || undefined,
        created_at: item.created_at,
      }));

      setCondutas(mapped);

    } catch (err) {
      console.error('Error fetching condutas:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar condutas');
    } finally {
      setLoading(false);
    }
  }, [patientId, clinic?.id]);

  const saveConduta = useCallback(async (data: {
    evolucao_id?: string;
    solicitacao_exames?: string;
    prescricoes?: string;
    orientacoes?: string;
    encaminhamentos?: string;
    retorno_agendado?: string;
    retorno_observacoes?: string;
  }) => {
    if (!patientId || !clinic?.id || !currentProfessionalId) {
      toast.error('Dados do paciente ou profissional não identificados');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const { error: insertError } = await supabase
        .from('patient_condutas')
        .insert({
          patient_id: patientId,
          clinic_id: clinic.id,
          profissional_id: currentProfessionalId,
          evolucao_id: data.evolucao_id || null,
          data_hora: new Date().toISOString(),
          solicitacao_exames: data.solicitacao_exames || null,
          prescricoes: data.prescricoes || null,
          orientacoes: data.orientacoes || null,
          encaminhamentos: data.encaminhamentos || null,
          retorno_agendado: data.retorno_agendado || null,
          retorno_observacoes: data.retorno_observacoes || null,
        });

      if (insertError) throw insertError;

      toast.success('Conduta registrada com sucesso!');
      await fetchCondutas();

    } catch (err) {
      console.error('Error saving conduta:', err);
      const message = err instanceof Error ? err.message : 'Erro ao salvar conduta';
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }, [patientId, clinic?.id, currentProfessionalId, fetchCondutas]);

  useEffect(() => {
    let cancelled = false;
    fetchCondutas().then(() => { if (cancelled) return; });
    return () => { cancelled = true; };
  }, [fetchCondutas]);

  return {
    condutas,
    loading,
    saving,
    error,
    currentProfessionalId,
    currentProfessionalName,
    saveConduta,
    refetch: fetchCondutas,
  };
}
