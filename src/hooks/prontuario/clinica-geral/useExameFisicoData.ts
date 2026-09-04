import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { fetchClinicalIdentity, resolveProfessionalNames } from '@/lib/clinicalDirectory';
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
      const identity = await fetchClinicalIdentity(clinic?.id);
      if (!identity.userId) return;
      if (identity.professionalId) setCurrentProfessionalId(identity.professionalId);
      setCurrentProfessionalName(identity.profileName);
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
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      // Get professional names
      const professionalIds = [...new Set((data || []).map((e: any) => e.professional_id).filter(Boolean))];
      let professionalsMap: Record<string, string> = {};

      professionalsMap = await resolveProfessionalNames(professionalIds);

      // Sinais vitais vivem no jsonb `data`
      const num = (v: unknown) => (v === null || v === undefined || v === '' ? undefined : parseFloat(String(v)));
      const mapped: ExameFisico[] = (data || []).map((item: any) => {
        const extra = (item.data || {}) as Record<string, any>;
        return {
          id: item.id,
          patient_id: item.patient_id,
          clinic_id: item.clinic_id,
          evolucao_id: extra.evolucao_id || undefined,
          profissional_id: item.professional_id,
          profissional_nome: professionalsMap[item.professional_id] || 'Profissional',
          data_hora: extra.data_hora || item.created_at,
          pressao_sistolica: num(extra.pressao_sistolica),
          pressao_diastolica: num(extra.pressao_diastolica),
          frequencia_cardiaca: num(extra.frequencia_cardiaca),
          frequencia_respiratoria: num(extra.frequencia_respiratoria),
          temperatura: num(extra.temperatura),
          peso: num(extra.peso),
          altura: num(extra.altura),
          imc: num(extra.imc),
          observacoes: extra.observacoes || item.notes || undefined,
          created_at: item.created_at,
        };
      });

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
          professional_id: currentProfessionalId,
          notes: data.observacoes || null,
          data: {
            evolucao_id: data.evolucao_id || null,
            data_hora: new Date().toISOString(),
            pressao_sistolica: data.pressao_sistolica ?? null,
            pressao_diastolica: data.pressao_diastolica ?? null,
            frequencia_cardiaca: data.frequencia_cardiaca ?? null,
            frequencia_respiratoria: data.frequencia_respiratoria ?? null,
            temperatura: data.temperatura ?? null,
            peso: data.peso ?? null,
            altura: data.altura ?? null,
            imc: imc,
            observacoes: data.observacoes || null,
          },
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
