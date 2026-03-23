import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useClinicData } from '@/hooks/useClinicData';
import { toast } from 'sonner';

/**
 * Estrutura de dados do Instrumento Psicológico
 */
export interface InstrumentoPsicologico {
  id: string;
  patient_id: string;
  clinic_id: string;
  nome_instrumento: string;
  data_aplicacao: string;
  finalidade: string;
  observacoes: string;
  documento_url: string | null;
  documento_nome: string | null;
  profissional_id: string;
  profissional_nome?: string;
  created_at: string;
}

export interface InstrumentoFormData {
  nome_instrumento: string;
  data_aplicacao: string;
  finalidade: string;
  observacoes: string;
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

/**
 * Hook para gerenciar Instrumentos / Testes Psicológicos
 * 
 * Regras:
 * - Registro de aplicação de testes psicológicos
 * - Suporte a upload de documentos relacionados
 * - Não realiza correção automática de testes
 */
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
          professionals:profissional_id (
            id,
            profiles:user_id (full_name)
          )
        `)
        .eq('patient_id', patientId)
        .eq('clinic_id', clinic.id)
        .order('data_aplicacao', { ascending: false });

      if (fetchError) throw fetchError;

      const mapped: InstrumentoPsicologico[] = (data || []).map(item => ({
        id: item.id,
        patient_id: item.patient_id,
        clinic_id: item.clinic_id,
        nome_instrumento: item.nome_instrumento,
        data_aplicacao: item.data_aplicacao,
        finalidade: item.finalidade || '',
        observacoes: item.observacoes || '',
        documento_url: item.documento_url,
        documento_nome: item.documento_nome,
        profissional_id: item.profissional_id,
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

      // Upload document if provided
      if (data.documento) {
        const uploadResult = await uploadDocumento(data.documento);
        if (uploadResult) {
          documentoUrl = uploadResult.url;
          documentoNome = uploadResult.nome;
        }
      }

      const insertData = {
        patient_id: patientId,
        clinic_id: clinic.id,
        profissional_id: currentProfessionalId,
        nome_instrumento: data.nome_instrumento,
        data_aplicacao: data.data_aplicacao,
        finalidade: data.finalidade,
        observacoes: data.observacoes,
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
      // Find the instrumento to get document URL
      const instrumento = instrumentos.find(i => i.id === id);
      
      // Delete document from storage if exists
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
