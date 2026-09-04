import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useClinicData } from '@/hooks/useClinicData';
import { toast } from 'sonner';

export type TipoDiagnostico = 'principal' | 'diferencial' | 'descartado';
export type StatusDiagnostico = 'ativo' | 'resolvido' | 'descartado';

export interface Diagnostico {
  id: string;
  patient_id: string;
  clinic_id: string;
  appointment_id: string | null;
  profissional_id: string;
  profissional_nome: string;
  codigo_cid10: string | null;
  descricao_cid10: string | null;
  descricao_personalizada: string | null;
  observacoes: string | null;
  tipo_diagnostico: TipoDiagnostico;
  status: StatusDiagnostico;
  data_diagnostico: string;
  data_resolucao: string | null;
  created_at: string;
}

interface UseDiagnosticosDataResult {
  diagnosticos: Diagnostico[];
  loading: boolean;
  saving: boolean;
  error: string | null;
  currentProfessionalId: string | null;
  saveDiagnostico: (data: {
    codigo_cid10?: string;
    descricao_cid10?: string;
    descricao_personalizada?: string;
    observacoes?: string;
    tipo_diagnostico: TipoDiagnostico;
  }) => Promise<void>;
  updateDiagnostico: (id: string, data: Partial<{
    tipo_diagnostico: TipoDiagnostico;
    status: StatusDiagnostico;
    observacoes: string;
  }>) => Promise<void>;
  refetch: () => Promise<void>;
}

/** Rebaixa diagnósticos principais ativos para diferencial (tipo vive no jsonb `data`). */
async function demotePrincipais(patientId: string, clinicId: string, exceptId?: string) {
  const { data: principais } = await supabase
    .from('patient_diagnosticos')
    .select('id, data')
    .eq('patient_id', patientId)
    .eq('clinic_id', clinicId)
    .eq('status', 'ativo');

  const targets = (principais || []).filter(
    (row: any) => (row.data || {}).tipo_diagnostico === 'principal' && row.id !== exceptId,
  );

  for (const row of targets) {
    await supabase
      .from('patient_diagnosticos')
      .update({ data: { ...((row as any).data || {}), tipo_diagnostico: 'diferencial' } })
      .eq('id', (row as any).id);
  }
}

export function useDiagnosticosData(patientId: string | null): UseDiagnosticosDataResult {
  const { clinic } = useClinicData();
  const [diagnosticos, setDiagnosticos] = useState<Diagnostico[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentProfessionalId, setCurrentProfessionalId] = useState<string | null>(null);

  // Fetch current professional
  useEffect(() => {
    const fetchCurrentProfessional = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !clinic?.id) return;

      const { data: professional } = await supabase
        .from('professionals')
        .select('id')
        .eq('user_id', user.id)
        .eq('clinic_id', clinic.id)
        .single();

      if (professional) {
        setCurrentProfessionalId(professional.id);
      }
    };

    fetchCurrentProfessional();
  }, [clinic?.id]);

  const fetchDiagnosticos = useCallback(async () => {
    if (!patientId || !clinic?.id) {
      setDiagnosticos([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('patient_diagnosticos')
        .select('*')
        .eq('patient_id', patientId)
        .eq('clinic_id', clinic.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      // Get professional names
      const professionalIds = [...new Set((data || []).map((d: any) => d.professional_id).filter(Boolean))];
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
              if (p.user_id && p.full_name) acc[p.user_id] = p.full_name;
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

      // Campos estendidos vivem no jsonb `data`; colunas reais: codigo_cid, descricao, status.
      const mapped: Diagnostico[] = (data || []).map((item: any) => {
        const extra = (item.data || {}) as Record<string, any>;
        return {
          id: item.id,
          patient_id: item.patient_id,
          clinic_id: item.clinic_id,
          appointment_id: item.appointment_id,
          profissional_id: item.professional_id,
          profissional_nome: professionalsMap[item.professional_id] || 'Profissional',
          codigo_cid10: item.codigo_cid ?? null,
          descricao_cid10: extra.descricao_cid10 ?? item.descricao ?? null,
          descricao_personalizada: extra.descricao_personalizada ?? null,
          observacoes: extra.observacoes ?? null,
          tipo_diagnostico: (extra.tipo_diagnostico ?? 'diferencial') as TipoDiagnostico,
          status: (item.status ?? 'ativo') as StatusDiagnostico,
          data_diagnostico: extra.data_diagnostico ?? item.created_at,
          data_resolucao: extra.data_resolucao ?? null,
          created_at: item.created_at,
        };
      });

      setDiagnosticos(mapped);
    } catch (err) {
      console.error('Error fetching diagnosticos:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar diagnósticos');
    } finally {
      setLoading(false);
    }
  }, [patientId, clinic?.id]);

  const saveDiagnostico = useCallback(async (data: {
    codigo_cid10?: string;
    descricao_cid10?: string;
    descricao_personalizada?: string;
    observacoes?: string;
    tipo_diagnostico: TipoDiagnostico;
  }) => {
    if (!patientId || !clinic?.id || !currentProfessionalId) {
      toast.error('Dados do paciente ou profissional não identificados');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // If setting as principal, demote existing principal to diferencial
      if (data.tipo_diagnostico === 'principal') {
        await demotePrincipais(patientId, clinic.id);
      }

      const { error: insertError } = await supabase
        .from('patient_diagnosticos')
        .insert({
          patient_id: patientId,
          clinic_id: clinic.id,
          professional_id: currentProfessionalId,
          codigo_cid: data.codigo_cid10 || null,
          descricao: data.descricao_cid10 || data.descricao_personalizada || null,
          status: 'ativo',
          data: {
            descricao_cid10: data.descricao_cid10 || null,
            descricao_personalizada: data.descricao_personalizada || null,
            observacoes: data.observacoes || null,
            tipo_diagnostico: data.tipo_diagnostico,
            data_diagnostico: new Date().toISOString(),
          },
        });

      if (insertError) throw insertError;

      toast.success('Diagnóstico registrado com sucesso!');
      await fetchDiagnosticos();
    } catch (err) {
      console.error('Error saving diagnostico:', err);
      const message = err instanceof Error ? err.message : 'Erro ao salvar diagnóstico';
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }, [patientId, clinic?.id, currentProfessionalId, fetchDiagnosticos]);

  const updateDiagnostico = useCallback(async (
    id: string,
    data: Partial<{
      tipo_diagnostico: TipoDiagnostico;
      status: StatusDiagnostico;
      observacoes: string;
    }>
  ) => {
    setSaving(true);
    setError(null);

    try {
      // If promoting to principal, demote existing principal
      if (data.tipo_diagnostico === 'principal' && patientId && clinic?.id) {
        await demotePrincipais(patientId, clinic.id, id);
      }

      // Ler registro atual para mesclar o jsonb `data`
      const { data: current } = await supabase
        .from('patient_diagnosticos')
        .select('data')
        .eq('id', id)
        .maybeSingle();

      const extra = { ...(((current as any)?.data || {}) as Record<string, unknown>) };
      if (data.tipo_diagnostico !== undefined) extra.tipo_diagnostico = data.tipo_diagnostico;
      if (data.observacoes !== undefined) extra.observacoes = data.observacoes;
      if (data.status === 'resolvido' || data.status === 'descartado') {
        extra.data_resolucao = new Date().toISOString();
      }

      const updateData: Record<string, unknown> = { data: extra };
      if (data.status !== undefined) updateData.status = data.status;

      const { error: updateError } = await supabase
        .from('patient_diagnosticos')
        .update(updateData)
        .eq('id', id);

      if (updateError) throw updateError;

      toast.success('Diagnóstico atualizado!');
      await fetchDiagnosticos();
    } catch (err) {
      console.error('Error updating diagnostico:', err);
      const message = err instanceof Error ? err.message : 'Erro ao atualizar diagnóstico';
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }, [patientId, clinic?.id, fetchDiagnosticos]);

  useEffect(() => {
    let cancelled = false;
    fetchDiagnosticos().then(() => { if (cancelled) return; });
    return () => { cancelled = true; };
  }, [fetchDiagnosticos]);

  return {
    diagnosticos,
    loading,
    saving,
    error,
    currentProfessionalId,
    saveDiagnostico,
    updateDiagnostico,
    refetch: fetchDiagnosticos,
  };
}
