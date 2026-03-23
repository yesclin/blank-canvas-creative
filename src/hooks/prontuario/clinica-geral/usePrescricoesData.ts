import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useClinicData } from '@/hooks/useClinicData';
import { toast } from 'sonner';

export type TipoReceita = 'simples' | 'controle_especial' | 'antimicrobiano' | 'entorpecente';
export type StatusPrescricao = 'rascunho' | 'assinada' | 'enviada' | 'cancelada';
export type ViaAdministracao = 'oral' | 'topica' | 'injetavel' | 'inalatoria' | 'sublingual' | 'retal' | 'oftalmico' | 'nasal' | 'otologico' | 'transdermico' | 'outra';

export interface PrescricaoItem {
  id: string;
  prescricao_id: string;
  medicamento_nome: string;
  medicamento_principio_ativo: string | null;
  medicamento_concentracao: string | null;
  medicamento_forma_farmaceutica: string | null;
  dose: string;
  unidade_dose: string | null;
  posologia: string;
  frequencia: string | null;
  duracao_dias: number | null;
  via_administracao: ViaAdministracao;
  instrucoes_especiais: string | null;
  uso_continuo: boolean;
  ordem: number;
}

export interface Prescricao {
  id: string;
  patient_id: string;
  clinic_id: string;
  appointment_id: string | null;
  profissional_id: string;
  profissional_nome: string;
  data_prescricao: string;
  tipo_receita: TipoReceita;
  status: StatusPrescricao;
  assinada_em: string | null;
  numero_receita: string | null;
  validade_dias: number;
  observacoes: string | null;
  itens: PrescricaoItem[];
  created_at: string;
}

export interface NewPrescricaoItem {
  medicamento_nome: string;
  medicamento_principio_ativo?: string;
  medicamento_concentracao?: string;
  medicamento_forma_farmaceutica?: string;
  dose: string;
  unidade_dose?: string;
  posologia: string;
  frequencia?: string;
  duracao_dias?: number;
  via_administracao?: ViaAdministracao;
  instrucoes_especiais?: string;
  uso_continuo?: boolean;
}

interface UsePrescricoesDataResult {
  prescricoes: Prescricao[];
  loading: boolean;
  saving: boolean;
  error: string | null;
  currentProfessionalId: string | null;
  currentProfessionalName: string | null;
  savePrescricao: (data: {
    tipo_receita: TipoReceita;
    observacoes?: string;
    validade_dias?: number;
    itens: NewPrescricaoItem[];
  }) => Promise<string | null>;
  signPrescricao: (prescricaoId: string) => Promise<void>;
  addItem: (prescricaoId: string, item: NewPrescricaoItem) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export function usePrescricoesData(patientId: string | null): UsePrescricoesDataResult {
  const { clinic } = useClinicData();
  const [prescricoes, setPrescricoes] = useState<Prescricao[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentProfessionalId, setCurrentProfessionalId] = useState<string | null>(null);
  const [currentProfessionalName, setCurrentProfessionalName] = useState<string | null>(null);

  // Fetch current professional
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

      if (professional) setCurrentProfessionalId(professional.id);
      if (profile) setCurrentProfessionalName(profile.full_name || null);
    };

    fetchCurrentProfessional();
  }, [clinic?.id]);

  const fetchPrescricoes = useCallback(async () => {
    if (!patientId || !clinic?.id) {
      setPrescricoes([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch prescriptions
      const { data: prescricoesData, error: fetchError } = await supabase
        .from('patient_prescricoes')
        .select('*')
        .eq('patient_id', patientId)
        .eq('clinic_id', clinic.id)
        .order('data_prescricao', { ascending: false });

      if (fetchError) throw fetchError;

      if (!prescricoesData || prescricoesData.length === 0) {
        setPrescricoes([]);
        return;
      }

      // Fetch all items for these prescriptions
      const prescricaoIds = prescricoesData.map(p => p.id);
      const { data: itensData } = await supabase
        .from('patient_prescricao_itens')
        .select('*')
        .in('prescricao_id', prescricaoIds)
        .order('ordem', { ascending: true });

      // Get professional names
      const professionalIds = [...new Set(prescricoesData.map(p => p.profissional_id).filter(Boolean))];
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

      // Map prescriptions with their items
      const mapped: Prescricao[] = prescricoesData.map(presc => ({
        id: presc.id,
        patient_id: presc.patient_id,
        clinic_id: presc.clinic_id,
        appointment_id: presc.appointment_id,
        profissional_id: presc.profissional_id,
        profissional_nome: professionalsMap[presc.profissional_id] || 'Profissional',
        data_prescricao: presc.data_prescricao,
        tipo_receita: presc.tipo_receita as TipoReceita,
        status: presc.status as StatusPrescricao,
        assinada_em: presc.assinada_em,
        numero_receita: presc.numero_receita,
        validade_dias: presc.validade_dias || 30,
        observacoes: presc.observacoes,
        itens: (itensData || [])
          .filter(item => item.prescricao_id === presc.id)
          .map(item => ({
            id: item.id,
            prescricao_id: item.prescricao_id,
            medicamento_nome: item.medicamento_nome,
            medicamento_principio_ativo: item.medicamento_principio_ativo,
            medicamento_concentracao: item.medicamento_concentracao,
            medicamento_forma_farmaceutica: item.medicamento_forma_farmaceutica,
            dose: item.dose,
            unidade_dose: item.unidade_dose,
            posologia: item.posologia,
            frequencia: item.frequencia,
            duracao_dias: item.duracao_dias,
            via_administracao: item.via_administracao as ViaAdministracao,
            instrucoes_especiais: item.instrucoes_especiais,
            uso_continuo: item.uso_continuo || false,
            ordem: item.ordem || 0,
          })),
        created_at: presc.created_at,
      }));

      setPrescricoes(mapped);
    } catch (err) {
      console.error('Error fetching prescricoes:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar prescrições');
    } finally {
      setLoading(false);
    }
  }, [patientId, clinic?.id]);

  const savePrescricao = useCallback(async (data: {
    tipo_receita: TipoReceita;
    observacoes?: string;
    validade_dias?: number;
    itens: NewPrescricaoItem[];
  }): Promise<string | null> => {
    if (!patientId || !clinic?.id || !currentProfessionalId) {
      toast.error('Dados do paciente ou profissional não identificados');
      return null;
    }

    if (data.itens.length === 0) {
      toast.error('Adicione pelo menos um medicamento à prescrição');
      return null;
    }

    setSaving(true);
    setError(null);

    try {
      // Create prescription
      const { data: newPrescricao, error: insertError } = await supabase
        .from('patient_prescricoes')
        .insert({
          patient_id: patientId,
          clinic_id: clinic.id,
          profissional_id: currentProfessionalId,
          tipo_receita: data.tipo_receita,
          observacoes: data.observacoes || null,
          validade_dias: data.validade_dias || 30,
        })
        .select('id')
        .single();

      if (insertError) throw insertError;

      // Insert items
      const itensToInsert = data.itens.map((item, index) => ({
        prescricao_id: newPrescricao.id,
        medicamento_nome: item.medicamento_nome,
        medicamento_principio_ativo: item.medicamento_principio_ativo || null,
        medicamento_concentracao: item.medicamento_concentracao || null,
        medicamento_forma_farmaceutica: item.medicamento_forma_farmaceutica || null,
        dose: item.dose,
        unidade_dose: item.unidade_dose || null,
        posologia: item.posologia,
        frequencia: item.frequencia || null,
        duracao_dias: item.duracao_dias || null,
        via_administracao: item.via_administracao || 'oral',
        instrucoes_especiais: item.instrucoes_especiais || null,
        uso_continuo: item.uso_continuo || false,
        ordem: index,
      }));

      const { error: itensError } = await supabase
        .from('patient_prescricao_itens')
        .insert(itensToInsert);

      if (itensError) throw itensError;

      toast.success('Prescrição criada com sucesso!');
      await fetchPrescricoes();
      return newPrescricao.id;
    } catch (err) {
      console.error('Error saving prescricao:', err);
      const message = err instanceof Error ? err.message : 'Erro ao salvar prescrição';
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setSaving(false);
    }
  }, [patientId, clinic?.id, currentProfessionalId, fetchPrescricoes]);

  const signPrescricao = useCallback(async (prescricaoId: string) => {
    setSaving(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('patient_prescricoes')
        .update({
          status: 'assinada',
          assinada_em: new Date().toISOString(),
        })
        .eq('id', prescricaoId);

      if (updateError) throw updateError;

      toast.success('Prescrição assinada com sucesso!');
      await fetchPrescricoes();
    } catch (err) {
      console.error('Error signing prescricao:', err);
      const message = err instanceof Error ? err.message : 'Erro ao assinar prescrição';
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }, [fetchPrescricoes]);

  const addItem = useCallback(async (prescricaoId: string, item: NewPrescricaoItem) => {
    setSaving(true);
    try {
      const { error: insertError } = await supabase
        .from('patient_prescricao_itens')
        .insert({
          prescricao_id: prescricaoId,
          medicamento_nome: item.medicamento_nome,
          medicamento_principio_ativo: item.medicamento_principio_ativo || null,
          medicamento_concentracao: item.medicamento_concentracao || null,
          medicamento_forma_farmaceutica: item.medicamento_forma_farmaceutica || null,
          dose: item.dose,
          unidade_dose: item.unidade_dose || null,
          posologia: item.posologia,
          frequencia: item.frequencia || null,
          duracao_dias: item.duracao_dias || null,
          via_administracao: item.via_administracao || 'oral',
          instrucoes_especiais: item.instrucoes_especiais || null,
          uso_continuo: item.uso_continuo || false,
        });

      if (insertError) throw insertError;

      toast.success('Medicamento adicionado!');
      await fetchPrescricoes();
    } catch (err) {
      console.error('Error adding item:', err);
      toast.error('Erro ao adicionar medicamento');
    } finally {
      setSaving(false);
    }
  }, [fetchPrescricoes]);

  const removeItem = useCallback(async (itemId: string) => {
    setSaving(true);
    try {
      const { error: deleteError } = await supabase
        .from('patient_prescricao_itens')
        .delete()
        .eq('id', itemId);

      if (deleteError) throw deleteError;

      toast.success('Medicamento removido!');
      await fetchPrescricoes();
    } catch (err) {
      console.error('Error removing item:', err);
      toast.error('Erro ao remover medicamento');
    } finally {
      setSaving(false);
    }
  }, [fetchPrescricoes]);

  useEffect(() => {
    let cancelled = false;
    fetchPrescricoes().then(() => { if (cancelled) return; });
    return () => { cancelled = true; };
  }, [fetchPrescricoes]);

  return {
    prescricoes,
    loading,
    saving,
    error,
    currentProfessionalId,
    currentProfessionalName,
    savePrescricao,
    signPrescricao,
    addItem,
    removeItem,
    refetch: fetchPrescricoes,
  };
}
