/**
 * PILATES - Dados de Exames e Documentos
 * 
 * Hook para gerenciar uploads de laudos médicos, exames de imagem
 * e documentos complementares. Arquivos são armazenados no Supabase Storage
 * com identificadores únicos para evitar sobrescrita.
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Categorias de documentos
export const CATEGORIA_DOCUMENTO_OPTIONS = [
  { value: 'laudo_medico', label: 'Laudo Médico', icon: 'FileText' },
  { value: 'exame_imagem', label: 'Exame de Imagem', icon: 'Image' },
  { value: 'exame_laboratorio', label: 'Exame Laboratorial', icon: 'FlaskConical' },
  { value: 'atestado', label: 'Atestado', icon: 'FileCheck' },
  { value: 'encaminhamento', label: 'Encaminhamento', icon: 'Forward' },
  { value: 'outros', label: 'Outros', icon: 'File' },
];

export interface DocumentoPilates {
  id: string;
  patient_id: string;
  clinic_id: string;
  professional_id: string | null;
  professional_name?: string | null;
  
  // Metadados do arquivo
  file_name: string;
  file_path: string;
  file_url: string;
  file_type: string;
  file_size: number;
  
  // Campos do documento
  categoria: string;
  titulo: string;
  descricao: string | null;
  data_documento: string | null;
  
  created_at: string;
}

export interface UploadDocumentoFormData {
  file: File;
  categoria: string;
  titulo: string;
  descricao: string;
  data_documento: string;
}

interface UseExamesDocumentosPilatesDataParams {
  patientId: string | null;
  clinicId: string | null;
  professionalId: string | null;
}

export function useExamesDocumentosPilatesData({ 
  patientId, 
  clinicId, 
  professionalId 
}: UseExamesDocumentosPilatesDataParams) {
  const queryClient = useQueryClient();
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // Buscar todos os documentos do paciente
  const documentosQuery = useQuery({
    queryKey: ['pilates-documentos', patientId, clinicId],
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
        .eq('evolution_type', 'documento_pilates')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((record) => {
        const content = record.content as Record<string, unknown> | null;
        return {
          id: record.id,
          patient_id: patientId,
          clinic_id: clinicId,
          professional_id: record.professional_id,
          professional_name: (record.professionals as { full_name: string } | null)?.full_name || null,
          file_name: (content?.file_name as string) || '',
          file_path: (content?.file_path as string) || '',
          file_url: (content?.file_url as string) || '',
          file_type: (content?.file_type as string) || '',
          file_size: (content?.file_size as number) || 0,
          categoria: (content?.categoria as string) || 'outros',
          titulo: (content?.titulo as string) || '',
          descricao: (content?.descricao as string) || null,
          data_documento: (content?.data_documento as string) || null,
          created_at: record.created_at,
        } as DocumentoPilates;
      });
    },
    enabled: !!patientId && !!clinicId,
  });

  // Upload de novo documento
  const uploadMutation = useMutation({
    mutationFn: async (formData: UploadDocumentoFormData) => {
      if (!patientId || !clinicId || !professionalId) {
        throw new Error('Dados obrigatórios não informados');
      }

      const file = formData.file;
      const fileExt = file.name.split('.').pop();
      const uniqueId = crypto.randomUUID();
      const filePath = `${clinicId}/${patientId}/${uniqueId}.${fileExt}`;

      // Upload para o Storage
      const { error: uploadError } = await supabase.storage
        .from('clinical-documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false, // Não sobrescrever
        });

      if (uploadError) throw uploadError;

      // Obter URL signed (válida por 1 ano)
      const { data: urlData } = await supabase.storage
        .from('clinical-documents')
        .createSignedUrl(filePath, 31536000); // 1 ano

      const content = {
        file_name: file.name,
        file_path: filePath,
        file_url: urlData?.signedUrl || '',
        file_type: file.type,
        file_size: file.size,
        categoria: formData.categoria,
        titulo: formData.titulo || file.name,
        descricao: formData.descricao || null,
        data_documento: formData.data_documento || null,
      };

      // Salvar metadados no banco
      const { data, error } = await supabase
        .from('clinical_evolutions')
        .insert({
          patient_id: patientId,
          clinic_id: clinicId,
          professional_id: professionalId,
          evolution_type: 'documento_pilates',
          specialty: 'pilates',
          content,
          status: 'rascunho',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pilates-documentos', patientId, clinicId] });
      queryClient.invalidateQueries({ queryKey: ['pilates-summary', patientId, clinicId] });
      toast.success('Documento enviado com sucesso');
      setIsUploadOpen(false);
    },
    onError: (error) => {
      console.error('Erro ao enviar documento:', error);
      toast.error('Erro ao enviar documento');
    },
  });

  // Deletar documento
  const deleteMutation = useMutation({
    mutationFn: async (documento: DocumentoPilates) => {
      // Deletar do Storage
      if (documento.file_path) {
        await supabase.storage
          .from('clinical-documents')
          .remove([documento.file_path]);
      }

      // Deletar registro do banco
      const { error } = await supabase
        .from('clinical_evolutions')
        .delete()
        .eq('id', documento.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pilates-documentos', patientId, clinicId] });
      toast.success('Documento removido');
    },
    onError: (error) => {
      console.error('Erro ao remover documento:', error);
      toast.error('Erro ao remover documento');
    },
  });

  // Baixar documento
  const downloadDocument = async (documento: DocumentoPilates) => {
    try {
      const { data, error } = await supabase.storage
        .from('clinical-documents')
        .download(documento.file_path);

      if (error) throw error;

      // Criar URL e iniciar download
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = documento.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao baixar documento:', error);
      toast.error('Erro ao baixar documento');
    }
  };

  return {
    documentos: documentosQuery.data || [],
    loading: documentosQuery.isLoading,
    error: documentosQuery.error,
    isUploadOpen,
    setIsUploadOpen,
    uploadDocumento: uploadMutation.mutate,
    isUploading: uploadMutation.isPending,
    deleteDocumento: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
    downloadDocument,
  };
}

export function getEmptyUploadForm(): UploadDocumentoFormData {
  return {
    file: null as unknown as File,
    categoria: 'laudo_medico',
    titulo: '',
    descricao: '',
    data_documento: '',
  };
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
