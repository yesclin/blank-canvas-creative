import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useClinicData } from '@/hooks/useClinicData';
import { toast } from 'sonner';

export interface MedicalRecordFile {
  id: string;
  clinic_id: string;
  patient_id: string;
  entry_id: string | null;
  file_name: string;
  file_type: string;
  file_size: number | null;
  file_url: string;
  category: string;
  description: string | null;
  is_before_after: boolean;
  before_after_type: string | null;
  created_at: string;
  created_by: string | null;
}

export interface FileInput {
  patient_id: string;
  entry_id?: string | null;
  file_name: string;
  file_type: string;
  file_size?: number;
  file_url: string;
  category: string;
  description?: string;
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
        .from('medical_record_files')
        .select('*')
        .eq('clinic_id', clinic.id)
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFiles((data as MedicalRecordFile[]) || []);
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
        .from('medical_record_files')
        .insert({
          clinic_id: clinic.id,
          patient_id: input.patient_id,
          entry_id: input.entry_id || null,
          file_name: input.file_name,
          file_type: input.file_type,
          file_size: input.file_size || null,
          file_url: input.file_url,
          category: input.category,
          description: input.description || null,
          is_before_after: input.is_before_after || false,
          before_after_type: input.before_after_type || null,
          created_by: userData?.user?.id || null,
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
      const { error } = await supabase.from('medical_record_files').delete().eq('id', id);

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

  // Filter by category
  const getFilesByCategory = useCallback(
    (category: string) => files.filter((f) => f.category === category),
    [files]
  );

  // Get images only
  const getImages = useCallback(
    () => files.filter((f) => f.file_type.startsWith('image/')),
    [files]
  );

  // Get documents
  const getDocuments = useCallback(
    () => files.filter((f) => !f.file_type.startsWith('image/')),
    [files]
  );

  // Get before/after pairs
  const getBeforeAfterPairs = useCallback(() => {
    const beforeAfter = files.filter((f) => f.is_before_after);
    const before = beforeAfter.filter((f) => f.before_after_type === 'before');
    const after = beforeAfter.filter((f) => f.before_after_type === 'after');
    return { before, after };
  }, [files]);

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
