import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useClinicData } from '@/hooks/useClinicData';
import { toast } from 'sonner';

export type CategoriaInstrumento = 'projetivo' | 'psicometrico' | 'neuropsicologico' | 'comportamental' | 'personalidade' | 'inteligencia' | 'outro';
export type StatusInstrumento = 'aplicado' | 'em_correcao' | 'corrigido' | 'laudado' | 'cancelado';

export const categoriaInstrumentoLabels: Record<CategoriaInstrumento, string> = {
  projetivo: 'Projetivo',
  psicometrico: 'Psicométrico',
  neuropsicologico: 'Neuropsicológico',
  comportamental: 'Comportamental',
  personalidade: 'Personalidade',
  inteligencia: 'Inteligência',
  outro: 'Outro',
};

export const statusInstrumentoLabels: Record<StatusInstrumento, string> = {
  aplicado: 'Aplicado',
  em_correcao: 'Em Correção',
  corrigido: 'Corrigido',
  laudado: 'Laudado',
  cancelado: 'Cancelado',
};

export interface InstrumentoPsicologico {
  id: string;
  patient_id: string;
  clinic_id: string;
  nome_instrumento: string;
  categoria_instrumento: CategoriaInstrumento;
  objetivo_aplicacao: string;
  data_aplicacao: string;
  contexto_aplicacao: string;
  finalidade: string;
  observacoes: string;
  resultado_resumido: string;
  interpretacao_inicial: string;
  status_instrumento: StatusInstrumento;
  documento_url: string | null;
  documento_nome: string | null;
  profissional_id: string;
  profissional_nome?: string;
  created_at: string;
}

export interface InstrumentoFormData {
  nome_instrumento: string;
  categoria_instrumento: CategoriaInstrumento;
  objetivo_aplicacao: string;
  data_aplicacao: string;
  contexto_aplicacao: string;
  finalidade: string;
  observacoes: string;
  resultado_resumido: string;
  interpretacao_inicial: string;
  status_instrumento: StatusInstrumento;
  documento?: File | null;
}

interface UseInstrumentosPsicologicosDataResult {
  instrumentos: InstrumentoPsicologico[];
  loading: boolean;
  saving: boolean;
  error: string | null;
  saveInstrumento: (data: InstrumentoFormData) => Promise<void>;
  deleteInstrumento: (id: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useInstrumentosPsicologicosData(
  patientId: string | null,
  currentProfessionalId?: string
): UseInstrumentosPsicologicosDataResult {
  const { clinic } = useClinicData();
  const [instrumentos, setInstrumentos] = useState<InstrumentoPsicologico[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInstrumentos = useCallback(async () => {
    if (!patientId || !clinic?.id) {
      setInstrumentos([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('instrumentos_psicologicos')
        .select(`
          *,
          professionals:professional_id (
            id,
            profiles:user_id (full_name)
          )
        `)
        .eq('patient_id', patientId)
        .eq('clinic_id', clinic.id)
        .order('data_aplicacao', { ascending: false });

      if (fetchError) throw fetchError;

      const mapped: InstrumentoPsicologico[] = (data || []).map((item: any) => ({
        id: item.id,
        patient_id: item.patient_id,
        clinic_id: item.clinic_id,
        nome_instrumento: item.nome_instrumento || item.nome || '',
        categoria_instrumento: item.categoria_instrumento || item.tipo || 'outro',
        objetivo_aplicacao: item.objetivo_aplicacao || '',
        data_aplicacao: item.data_aplicacao || item.created_at,
        contexto_aplicacao: item.contexto_aplicacao || '',
        finalidade: item.finalidade || '',
        observacoes: item.observacoes || '',
        resultado_resumido: item.resultado_resumido || '',
        interpretacao_inicial: item.interpretacao_inicial || '',
        status_instrumento: item.status_instrumento || 'aplicado',
        documento_url: item.documento_url,
        documento_nome: item.documento_nome,
        profissional_id: item.profissional_id || item.professional_id,
        profissional_nome: (item.professionals as any)?.profiles?.full_name || 'Profissional',
        created_at: item.created_at,
      }));

      setInstrumentos(mapped);
    } catch (err) {
      console.error('Error fetching instrumentos:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar instrumentos');
    } finally {
      setLoading(false);
    }
  }, [patientId, clinic?.id]);

  const uploadDocumento = async (file: File): Promise<{ url: string; nome: string } | null> => {
    if (!clinic?.id || !patientId) return null;

    const fileExt = file.name.split('.').pop();
    const fileName = `${clinic.id}/${patientId}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('instrumentos-psicologicos')
      .upload(fileName, file);

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error('Erro ao fazer upload do documento');
    }

    const { data: urlData } = supabase.storage
      .from('instrumentos-psicologicos')
      .getPublicUrl(fileName);

    return {
      url: urlData.publicUrl,
      nome: file.name,
    };
  };

  const saveInstrumento = useCallback(async (data: InstrumentoFormData) => {
    if (!patientId || !clinic?.id || !currentProfessionalId) {
      toast.error('Dados insuficientes para salvar o instrumento');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      let documentoUrl: string | null = null;
      let documentoNome: string | null = null;

      if (data.documento) {
        const uploadResult = await uploadDocumento(data.documento);
        if (uploadResult) {
          documentoUrl = uploadResult.url;
          documentoNome = uploadResult.nome;
        }
      }

      const insertData: any = {
        patient_id: patientId,
        clinic_id: clinic.id,
        professional_id: currentProfessionalId,
        profissional_id: currentProfessionalId,
        nome: data.nome_instrumento,
        nome_instrumento: data.nome_instrumento,
        categoria_instrumento: data.categoria_instrumento,
        tipo: data.categoria_instrumento,
        objetivo_aplicacao: data.objetivo_aplicacao,
        data_aplicacao: data.data_aplicacao,
        contexto_aplicacao: data.contexto_aplicacao,
        finalidade: data.finalidade,
        observacoes: data.observacoes,
        resultado_resumido: data.resultado_resumido,
        interpretacao_inicial: data.interpretacao_inicial,
        status_instrumento: data.status_instrumento,
        documento_url: documentoUrl,
        documento_nome: documentoNome,
      };

      const { error: insertError } = await supabase
        .from('instrumentos_psicologicos')
        .insert(insertData);

      if (insertError) throw insertError;

      toast.success('Instrumento registrado com sucesso');
      await fetchInstrumentos();
    } catch (err) {
      console.error('Error saving instrumento:', err);
      const message = err instanceof Error ? err.message : 'Erro ao salvar instrumento';
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }, [patientId, clinic?.id, currentProfessionalId, fetchInstrumentos]);

  const deleteInstrumento = useCallback(async (id: string) => {
    setSaving(true);
    setError(null);

    try {
      const instrumento = instrumentos.find(i => i.id === id);
      
      if (instrumento?.documento_url && clinic?.id) {
        const path = instrumento.documento_url.split('/').slice(-3).join('/');
        await supabase.storage
          .from('instrumentos-psicologicos')
          .remove([path]);
      }

      const { error: deleteError } = await supabase
        .from('instrumentos_psicologicos')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      toast.success('Instrumento removido');
      await fetchInstrumentos();
    } catch (err) {
      console.error('Error deleting instrumento:', err);
      const message = err instanceof Error ? err.message : 'Erro ao remover instrumento';
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }, [instrumentos, clinic?.id, fetchInstrumentos]);

  useEffect(() => {
    fetchInstrumentos();
  }, [fetchInstrumentos]);

  return {
    instrumentos,
    loading,
    saving,
    error,
    saveInstrumento,
    deleteInstrumento,
    refetch: fetchInstrumentos,
  };
}
