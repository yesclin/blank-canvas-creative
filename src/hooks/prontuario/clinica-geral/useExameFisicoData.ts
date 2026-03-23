import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useClinicData } from '@/hooks/useClinicData';
import { toast } from 'sonner';
import type { ExameFisico } from '@/components/prontuario/clinica-geral/ExameFisicoBlock';

interface UseExameFisicoDataResult {
  exames: ExameFisico[];
  loading: boolean;
  saving: boolean;
  error: string | null;
  currentProfessionalId: string | null;
  currentProfessionalName: string | null;
  saveExame: (data: {
    evolucao_id?: string;
    pressao_sistolica?: number;
    pressao_diastolica?: number;
    frequencia_cardiaca?: number;
    frequencia_respiratoria?: number;
    temperatura?: number;
    peso?: number;
    altura?: number;
    observacoes?: string;
  }) => Promise<void>;
  refetch: () => Promise<void>;
}

/**
 * Hook para gerenciar Exames Físicos
 * 
 * Permite registrar sinais vitais e medidas do paciente.
 * Pode ser vinculado a uma evolução clínica.
 */
export function useExameFisicoData(patientId: string | null): UseExameFisicoDataResult {
  const { clinic } = useClinicData();
  const [exames, setExames] = useState<ExameFisico[]>([]);
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

  const fetchExames = useCallback(async () => {
    if (!patientId || !clinic?.id) {
      setExames([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('patient_exames_fisicos')
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

      const mapped: ExameFisico[] = (data || []).map(item => ({
        id: item.id,
        patient_id: item.patient_id,
        clinic_id: item.clinic_id,
        evolucao_id: item.evolucao_id || undefined,
        profissional_id: item.profissional_id,
        profissional_nome: professionalsMap[item.profissional_id] || 'Profissional',
        data_hora: item.data_hora,
        pressao_sistolica: item.pressao_sistolica || undefined,
        pressao_diastolica: item.pressao_diastolica || undefined,
        frequencia_cardiaca: item.frequencia_cardiaca || undefined,
        frequencia_respiratoria: item.frequencia_respiratoria || undefined,
        temperatura: item.temperatura ? parseFloat(String(item.temperatura)) : undefined,
        peso: item.peso ? parseFloat(String(item.peso)) : undefined,
        altura: item.altura ? parseFloat(String(item.altura)) : undefined,
        imc: item.imc ? parseFloat(String(item.imc)) : undefined,
        observacoes: item.observacoes || undefined,
        created_at: item.created_at,
      }));

      setExames(mapped);

    } catch (err) {
      console.error('Error fetching exames fisicos:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar exames físicos');
    } finally {
      setLoading(false);
    }
  }, [patientId, clinic?.id]);

  const saveExame = useCallback(async (data: {
    evolucao_id?: string;
    pressao_sistolica?: number;
    pressao_diastolica?: number;
    frequencia_cardiaca?: number;
    frequencia_respiratoria?: number;
    temperatura?: number;
    peso?: number;
    altura?: number;
    observacoes?: string;
  }) => {
    if (!patientId || !clinic?.id || !currentProfessionalId) {
      toast.error('Dados do paciente ou profissional não identificados');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Calculate IMC if weight and height are provided
      let imc: number | null = null;
      if (data.peso && data.altura && data.altura > 0) {
        imc = parseFloat((data.peso / (data.altura * data.altura)).toFixed(2));
      }

      const { error: insertError } = await supabase
        .from('patient_exames_fisicos')
        .insert({
          patient_id: patientId,
          clinic_id: clinic.id,
          profissional_id: currentProfessionalId,
          evolucao_id: data.evolucao_id || null,
          data_hora: new Date().toISOString(),
          pressao_sistolica: data.pressao_sistolica || null,
          pressao_diastolica: data.pressao_diastolica || null,
          frequencia_cardiaca: data.frequencia_cardiaca || null,
          frequencia_respiratoria: data.frequencia_respiratoria || null,
          temperatura: data.temperatura || null,
          peso: data.peso || null,
          altura: data.altura || null,
          imc: imc,
          observacoes: data.observacoes || null,
        });

      if (insertError) throw insertError;

      toast.success('Exame físico registrado com sucesso!');
      await fetchExames();

    } catch (err) {
      console.error('Error saving exame fisico:', err);
      const message = err instanceof Error ? err.message : 'Erro ao salvar exame físico';
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }, [patientId, clinic?.id, currentProfessionalId, fetchExames]);

  useEffect(() => {
    let cancelled = false;
    fetchExames().then(() => { if (cancelled) return; });
    return () => { cancelled = true; };
  }, [fetchExames]);

  return {
    exames,
    loading,
    saving,
    error,
    currentProfessionalId,
    currentProfessionalName,
    saveExame,
    refetch: fetchExames,
  };
}
