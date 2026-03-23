import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useClinicData } from '@/hooks/useClinicData';
import { toast } from 'sonner';
import type { Documento, CategoriaDocumento } from '@/components/prontuario/clinica-geral/DocumentosBlock';

interface UseDocumentosDataResult {
  documentos: Documento[];
  loading: boolean;
  uploading: boolean;
  error: string | null;
  currentProfessionalId: string | null;
  currentProfessionalName: string | null;
  uploadDocumento: (data: {
    file: File;
    titulo: string;
    categoria: CategoriaDocumento;
    descricao?: string;
    data_documento?: string;
    observacoes?: string;
  }) => Promise<void>;
  deleteDocumento: (id: string) => Promise<void>;
  downloadDocumento: (documento: Documento) => Promise<void>;
  refetch: () => Promise<void>;
}

/**
 * Hook para gerenciar Documentos do Prontuário
 * 
 * Permite upload de exames, laudos, relatórios e documentos.
 * Arquivos são armazenados no bucket 'medical-documents'.
 */
export function useDocumentosData(patientId: string | null): UseDocumentosDataResult {
  const { clinic } = useClinicData();
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
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

  const fetchDocumentos = useCallback(async () => {
    if (!patientId || !clinic?.id) {
      setDocumentos([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('patient_documentos')
        .select('*')
        .eq('patient_id', patientId)
        .eq('clinic_id', clinic.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      // Get professional names
      const professionalIds = [...new Set((data || []).map(d => d.profissional_id).filter(Boolean))];
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

      // Generate signed URLs for files
      const mapped: Documento[] = await Promise.all((data || []).map(async (item) => {
        let fileUrl: string | undefined;
        
        if (item.file_path) {
          const { data: signedUrlData } = await supabase.storage
            .from('medical-documents')
            .createSignedUrl(item.file_path, 3600); // 1 hour
          
          if (signedUrlData?.signedUrl) {
            fileUrl = signedUrlData.signedUrl;
          }
        }

        return {
          id: item.id,
          patient_id: item.patient_id,
          clinic_id: item.clinic_id,
          profissional_id: item.profissional_id,
          profissional_nome: professionalsMap[item.profissional_id] || 'Profissional',
          titulo: item.titulo,
          categoria: (item.categoria as CategoriaDocumento) || 'documento',
          descricao: item.descricao || undefined,
          data_documento: item.data_documento || undefined,
          observacoes: item.observacoes || undefined,
          file_path: item.file_path,
          file_name: item.file_name,
          file_type: item.file_type || undefined,
          file_size: item.file_size || undefined,
          file_url: fileUrl,
          created_at: item.created_at,
        };
      }));

      setDocumentos(mapped);

    } catch (err) {
      console.error('Error fetching documentos:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar documentos');
    } finally {
      setLoading(false);
    }
  }, [patientId, clinic?.id]);

  const uploadDocumento = useCallback(async (data: {
    file: File;
    titulo: string;
    categoria: CategoriaDocumento;
    descricao?: string;
    data_documento?: string;
    observacoes?: string;
  }) => {
    if (!patientId || !clinic?.id || !currentProfessionalId) {
      toast.error('Dados do paciente ou profissional não identificados');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // Generate unique file path: clinic_id/patient_id/timestamp_filename
      const timestamp = Date.now();
      const sanitizedFileName = data.file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `${clinic.id}/${patientId}/${timestamp}_${sanitizedFileName}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('medical-documents')
        .upload(filePath, data.file);

      if (uploadError) throw uploadError;

      // Save metadata to database
      const { error: insertError } = await supabase
        .from('patient_documentos')
        .insert({
          patient_id: patientId,
          clinic_id: clinic.id,
          profissional_id: currentProfessionalId,
          titulo: data.titulo,
          categoria: data.categoria,
          descricao: data.descricao || null,
          data_documento: data.data_documento || null,
          observacoes: data.observacoes || null,
          file_path: filePath,
          file_name: data.file.name,
          file_type: data.file.type,
          file_size: data.file.size,
        });

      if (insertError) throw insertError;

      toast.success('Documento anexado com sucesso!');
      await fetchDocumentos();

    } catch (err) {
      console.error('Error uploading documento:', err);
      const message = err instanceof Error ? err.message : 'Erro ao enviar documento';
      setError(message);
      toast.error(message);
    } finally {
      setUploading(false);
    }
  }, [patientId, clinic?.id, currentProfessionalId, fetchDocumentos]);

  const deleteDocumento = useCallback(async (id: string) => {
    const documento = documentos.find(d => d.id === id);
    if (!documento) return;

    try {
      // Delete file from storage
      const { error: storageError } = await supabase.storage
        .from('medical-documents')
        .remove([documento.file_path]);

      if (storageError) {
        console.warn('Error deleting file from storage:', storageError);
      }

      // Delete metadata from database
      const { error: dbError } = await supabase
        .from('patient_documentos')
        .delete()
        .eq('id', id);

      if (dbError) throw dbError;

      toast.success('Documento excluído com sucesso!');
      await fetchDocumentos();

    } catch (err) {
      console.error('Error deleting documento:', err);
      const message = err instanceof Error ? err.message : 'Erro ao excluir documento';
      toast.error(message);
    }
  }, [documentos, fetchDocumentos]);

  const downloadDocumento = useCallback(async (documento: Documento) => {
    try {
      const { data, error } = await supabase.storage
        .from('medical-documents')
        .download(documento.file_path);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = documento.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

    } catch (err) {
      console.error('Error downloading documento:', err);
      toast.error('Erro ao baixar documento');
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchDocumentos().then(() => { if (cancelled) return; });
    return () => { cancelled = true; };
  }, [fetchDocumentos]);

  return {
    documentos,
    loading,
    uploading,
    error,
    currentProfessionalId,
    currentProfessionalName,
    uploadDocumento,
    deleteDocumento,
    downloadDocumento,
    refetch: fetchDocumentos,
  };
}
