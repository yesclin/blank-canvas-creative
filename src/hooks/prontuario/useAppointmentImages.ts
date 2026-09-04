import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useClinicData } from '@/hooks/useClinicData';
import { toast } from 'sonner';

export type ImageClassification = 'antes' | 'depois' | 'evolucao';

export interface AppointmentImage {
  id: string;
  clinic_id: string;
  appointment_id: string;
  patient_id: string;
  field_id: string | null;
  file_url: string;
  file_name: string;
  file_size_bytes: number | null;
  caption: string | null;
  classification: ImageClassification;
  taken_at: string;
  uploaded_by: string | null;
  template_id: string | null;
  template_version_id: string | null;
  created_at: string;
  updated_at: string;
}

/** Persistência real: tabela `clinical_media` (category = classificação, description = legenda). */
function mapRow(row: any): AppointmentImage {
  return {
    id: row.id,
    clinic_id: row.clinic_id,
    appointment_id: row.appointment_id,
    patient_id: row.patient_id,
    field_id: null,
    file_url: row.file_url,
    file_name: row.file_name,
    file_size_bytes: row.file_size ?? null,
    caption: row.description ?? null,
    classification: (row.category ?? 'evolucao') as ImageClassification,
    taken_at: row.created_at,
    uploaded_by: row.professional_id ?? null,
    template_id: null,
    template_version_id: null,
    created_at: row.created_at,
    updated_at: row.created_at,
  };
}

export function useAppointmentImages(appointmentId: string | null, patientId: string | null) {
  const { clinic } = useClinicData();
  const [images, setImages] = useState<AppointmentImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fetchImages = useCallback(async (_fieldId?: string) => {
    if (!clinic?.id || !appointmentId) {
      setImages([]);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('clinical_media')
        .select('*')
        .eq('clinic_id', clinic.id)
        .eq('appointment_id', appointmentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setImages((data || []).map(mapRow));
    } catch (err) {
      console.error('Error fetching images:', err);
    } finally {
      setLoading(false);
    }
  }, [clinic?.id, appointmentId]);

  const uploadImages = async (
    files: File[],
    options: {
      fieldId?: string;
      classification: ImageClassification;
      caption?: string;
      templateId?: string;
      templateVersionId?: string;
    }
  ) => {
    if (!clinic?.id || !appointmentId || !patientId) {
      toast.error('Atendimento não identificado. Imagens só podem ser salvas dentro de um atendimento.');
      return [];
    }

    setUploading(true);
    const uploaded: AppointmentImage[] = [];

    try {
      for (const file of files) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} não é uma imagem válida.`);
          continue;
        }

        // Max 10MB per image
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`${file.name} excede o limite de 10MB.`);
          continue;
        }

        const ext = file.name.split('.').pop() || 'jpg';
        const path = `${clinic.id}/${appointmentId}/${crypto.randomUUID()}.${ext}`;

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from('clinical-media')
          .upload(path, file, { contentType: file.type });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          toast.error(`Erro ao enviar ${file.name}`);
          continue;
        }

        // Get signed URL (private bucket)
        const { data: urlData } = await supabase.storage
          .from('clinical-media')
          .createSignedUrl(path, 60 * 60 * 24 * 365); // 1 year

        const fileUrl = urlData?.signedUrl || path;

        // Save metadata
        const { data: record, error: dbError } = await supabase
          .from('clinical_media')
          .insert({
            clinic_id: clinic.id,
            appointment_id: appointmentId,
            patient_id: patientId,
            file_url: fileUrl,
            file_name: file.name,
            file_type: file.type || null,
            file_size: file.size,
            description: options.caption || null,
            category: options.classification,
          })
          .select()
          .maybeSingle();

        if (dbError) {
          console.error('DB error:', dbError);
          toast.error(`Erro ao salvar metadados de ${file.name}`);
          continue;
        }

        if (record) uploaded.push(mapRow(record));
      }

      if (uploaded.length > 0) {
        toast.success(`${uploaded.length} imagem(ns) enviada(s)`);
        await fetchImages(options.fieldId);
      }

      return uploaded;
    } catch (err) {
      console.error('Upload error:', err);
      toast.error('Erro ao enviar imagens');
      return [];
    } finally {
      setUploading(false);
    }
  };

  const updateImage = async (id: string, updates: { caption?: string; classification?: ImageClassification }) => {
    try {
      const payload: Record<string, unknown> = {};
      if (updates.caption !== undefined) payload.description = updates.caption;
      if (updates.classification !== undefined) payload.category = updates.classification;

      const { error } = await supabase
        .from('clinical_media')
        .update(payload)
        .eq('id', id);

      if (error) throw error;
      toast.success('Imagem atualizada');
      await fetchImages();
      return true;
    } catch (err) {
      console.error('Error updating image:', err);
      toast.error('Erro ao atualizar imagem');
      return false;
    }
  };

  const deleteImage = async (id: string) => {
    try {
      // Find the image to get the file path
      const img = images.find(i => i.id === id);

      const { error } = await supabase
        .from('clinical_media')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Try to delete from storage too
      if (img?.file_url) {
        try {
          const url = new URL(img.file_url);
          const pathMatch = url.pathname.match(/clinical-media\/(.+)/);
          if (pathMatch) {
            await supabase.storage.from('clinical-media').remove([pathMatch[1]]);
          }
        } catch { /* storage cleanup is best-effort */ }
      }

      toast.success('Imagem removida');
      setImages(prev => prev.filter(i => i.id !== id));
      return true;
    } catch (err) {
      console.error('Error deleting image:', err);
      toast.error('Erro ao remover imagem');
      return false;
    }
  };

  return {
    images,
    loading,
    uploading,
    fetchImages,
    uploadImages,
    updateImage,
    deleteImage,
  };
}
