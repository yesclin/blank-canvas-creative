import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useClinicData } from '@/hooks/useClinicData';
import { toast } from 'sonner';

/**
 * Maps to the real `clinical_media` table.
 */
export interface MedicalRecordFile {
  id: string;
  clinic_id: string;
  patient_id: string;
  file_name: string;
  file_type: string | null;
  file_size: number | null;
  file_url: string;
  category: string;
  description: string | null;
  professional_id: string | null;
  created_at: string;
}

export interface FileInput {
  patient_id: string;
  file_name: string;
  file_type: string;
  file_size?: number;
  file_url: string;
  category: string;
  description?: string;
  // Legacy fields kept for API compat — ignored
  entry_id?: string | null;
  is_before_after?: boolean;
  before_after_type?: 'before' | 'after';
}

export function useMedicalRecordFiles() {
  const { clinic } = useClinicData();
  const [files, setFiles] = useState<MedicalRecordFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchFilesForPatient = useCallback(async (patientId: string) => {
    if (!clinic?.id || !patientId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('clinical_media')
        .select('*')
        .eq('clinic_id', clinic.id)
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mapped: MedicalRecordFile[] = (data || []).map((row) => ({
        id: row.id,
        clinic_id: row.clinic_id,
        patient_id: row.patient_id,
        file_name: row.file_name,
        file_type: row.file_type,
        file_size: row.file_size,
        file_url: row.file_url,
        category: row.category || 'general',
        description: row.description,
        professional_id: row.professional_id,
        created_at: row.created_at,
      }));

      setFiles(mapped);
    } catch (err) {
      console.error('Error fetching files:', err);
      toast.error('Erro ao carregar arquivos');
    } finally {
      setLoading(false);
    }
  }, [clinic?.id]);

  const uploadFile = async (input: FileInput): Promise<string | null> => {
    if (!clinic?.id) return null;
    setSaving(true);
    try {
      const { data: userData } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('clinical_media')
        .insert({
          clinic_id: clinic.id,
          patient_id: input.patient_id,
          file_name: input.file_name,
          file_type: input.file_type,
          file_size: input.file_size || null,
          file_url: input.file_url,
          category: input.category,
          description: input.description || null,
          professional_id: userData?.user?.id ? undefined : null,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Arquivo anexado');
      await fetchFilesForPatient(input.patient_id);
      return data.id;
    } catch (err) {
      console.error('Error uploading file:', err);
      toast.error('Erro ao anexar arquivo');
      return null;
    } finally {
      setSaving(false);
    }
  };

  const deleteFile = async (id: string, patientId: string): Promise<boolean> => {
    setSaving(true);
    try {
      // clinical_media only allows delete for admins via RLS
      const { error } = await supabase.from('clinical_media').delete().eq('id', id);

      if (error) throw error;

      toast.success('Arquivo removido');
      await fetchFilesForPatient(patientId);
      return true;
    } catch (err) {
      console.error('Error deleting file:', err);
      toast.error('Erro ao remover arquivo');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const getFilesByCategory = useCallback(
    (category: string) => files.filter((f) => f.category === category),
    [files]
  );

  const getImages = useCallback(
    () => files.filter((f) => f.file_type?.startsWith('image/')),
    [files]
  );

  const getDocuments = useCallback(
    () => files.filter((f) => !f.file_type?.startsWith('image/')),
    [files]
  );

  const getBeforeAfterPairs = useCallback(() => {
    // Before/after is now managed via before_after_records table, not inline flags
    return { before: [] as MedicalRecordFile[], after: [] as MedicalRecordFile[] };
  }, []);

  return {
    files,
    loading,
    saving,
    fetchFilesForPatient,
    uploadFile,
    deleteFile,
    getFilesByCategory,
    getImages,
    getDocuments,
    getBeforeAfterPairs,
  };
}
