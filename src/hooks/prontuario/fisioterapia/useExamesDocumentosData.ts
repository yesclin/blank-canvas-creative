/**
 * FISIOTERAPIA - Dados de Exames / Documentos
 * 
 * Hook para gerenciar upload e listagem de documentos clínicos.
 * Usa storage privado com nomes únicos para evitar sobrescrita.
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Categorias de documentos
export const CATEGORIA_DOCUMENTO_OPTIONS = [
  { value: 'exame_imagem', label: 'Exame de Imagem' },
  { value: 'laudo', label: 'Laudo' },
  { value: 'relatorio', label: 'Relatório' },
  { value: 'encaminhamento', label: 'Encaminhamento' },
  { value: 'atestado', label: 'Atestado' },
  { value: 'receita', label: 'Receita/Prescrição' },
  { value: 'termo', label: 'Termo/Consentimento' },
  { value: 'outro', label: 'Outro' },
];

export interface DocumentoFisioterapia {
  id: string;
  patient_id: string;
  clinic_id: string;
  uploaded_by: string | null;
  uploader_name?: string | null;
  
  file_name: string;
  file_path: string;
  file_size: number | null;
  file_type: string;
  categoria: string;
  descricao: string | null;
  data_documento: string | null;
  
  created_at: string;
}

export interface UploadDocumentoData {
  file: File;
  categoria: string;
  descricao: string;
  data_documento: string;
}

interface UseExamesDocumentosDataParams {
  patientId: string | null;
  clinicId: string | null;
}

const BUCKET_NAME = 'fisioterapia-documentos';

export function useExamesDocumentosData({ 
  patientId, 
  clinicId 
}: UseExamesDocumentosDataParams) {
  const queryClient = useQueryClient();
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // Buscar documentos do paciente
  const documentosQuery = useQuery({
    queryKey: ['fisioterapia-documentos', patientId, clinicId],
    queryFn: async () => {
      if (!patientId || !clinicId) return [];

      const { data, error } = await supabase
        .from('clinical_evolutions')
        .select(`
          id,
          content,
          created_at,
          professional_id,
          professionals:professional_id (
            full_name
          )
        `)
        .eq('patient_id', patientId)
        .eq('clinic_id', clinicId)
        .eq('evolution_type', 'documento_fisioterapia')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((record) => {
        const content = record.content as Record<string, unknown> | null;
        return {
          id: record.id,
          patient_id: patientId,
          clinic_id: clinicId,
          uploaded_by: record.professional_id,
          uploader_name: (record.professionals as { full_name: string } | null)?.full_name || null,
          file_name: (content?.file_name as string) || 'Documento',
          file_path: (content?.file_path as string) || '',
          file_size: (content?.file_size as number) || null,
          file_type: (content?.file_type as string) || '',
          categoria: (content?.categoria as string) || 'outro',
          descricao: (content?.descricao as string) || null,
          data_documento: (content?.data_documento as string) || null,
          created_at: record.created_at,
        } as DocumentoFisioterapia;
      });
    },
    enabled: !!patientId && !!clinicId,
  });

  // Upload de documento
  const uploadMutation = useMutation({
    mutationFn: async ({ file, categoria, descricao, data_documento }: UploadDocumentoData) => {
      if (!patientId || !clinicId) {
        throw new Error('Dados obrigatórios não informados');
      }

      // Gerar nome único para o arquivo
      const timestamp = Date.now();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const uniqueName = `${timestamp}_${sanitizedName}`;
      const filePath = `${clinicId}/${patientId}/${uniqueName}`;

      // Upload para o storage
      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false, // Nunca sobrescrever
        });

      if (uploadError) throw uploadError;

      // Obter usuário atual
      const { data: userData } = await supabase.auth.getUser();

      // Salvar registro no banco
      const content = {
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        file_type: file.type,
        categoria,
        descricao: descricao.trim() || null,
        data_documento: data_documento || null,
      };

      const { data, error } = await supabase
        .from('clinical_evolutions')
        .insert({
          patient_id: patientId,
          clinic_id: clinicId,
          professional_id: userData?.user?.id || null,
          evolution_type: 'documento_fisioterapia',
          specialty: 'fisioterapia',
          content,
          status: 'signed',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fisioterapia-documentos', patientId, clinicId] });
      queryClient.invalidateQueries({ queryKey: ['fisioterapia-summary', patientId, clinicId] });
      toast.success('Documento enviado com sucesso');
      setIsUploadOpen(false);
    },
    onError: (error) => {
      console.error('Erro ao enviar documento:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao enviar documento');
    },
  });

  // Obter URL assinada para visualização
  const getSignedUrl = async (filePath: string): Promise<string | null> => {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(filePath, 3600); // 1 hora de validade

    if (error) {
      console.error('Erro ao gerar URL:', error);
      return null;
    }
    return data.signedUrl;
  };

  // Deletar documento
  const deleteMutation = useMutation({
    mutationFn: async (documento: DocumentoFisioterapia) => {
      // Deletar do storage
      const { error: storageError } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([documento.file_path]);

      if (storageError) {
        console.error('Erro ao deletar do storage:', storageError);
        // Continua mesmo se falhar no storage
      }

      // Deletar registro do banco
      const { error } = await supabase
        .from('clinical_evolutions')
        .delete()
        .eq('id', documento.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fisioterapia-documentos', patientId, clinicId] });
      toast.success('Documento removido');
    },
    onError: (error) => {
      console.error('Erro ao remover documento:', error);
      toast.error('Erro ao remover documento');
    },
  });

  // Estatísticas
  const documentos = documentosQuery.data || [];
  const totalDocumentos = documentos.length;
  const documentosPorCategoria = documentos.reduce((acc, doc) => {
    acc[doc.categoria] = (acc[doc.categoria] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    documentos,
    totalDocumentos,
    documentosPorCategoria,
    loading: documentosQuery.isLoading,
    error: documentosQuery.error,
    isUploadOpen,
    setIsUploadOpen,
    uploadDocumento: uploadMutation.mutate,
    isUploading: uploadMutation.isPending,
    deleteDocumento: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
    getSignedUrl,
  };
}
