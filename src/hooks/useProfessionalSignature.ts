import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useClinicData } from '@/hooks/useClinicData';
import { usePermissions } from '@/hooks/usePermissions';
import { toast } from 'sonner';

export interface ProfessionalSignature {
  id: string;
  clinic_id: string;
  professional_id: string;
  signature_file_url: string;
  signature_type: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useProfessionalSignature() {
  const { clinic } = useClinicData();
  const { professionalId } = usePermissions();
  const [signature, setSignature] = useState<ProfessionalSignature | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fetchSignature = useCallback(async () => {
    if (!clinic?.id || !professionalId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('professional_signatures')
        .select('*')
        .eq('clinic_id', clinic.id)
        .eq('professional_id', professionalId)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      setSignature(data as ProfessionalSignature | null);
    } catch (err) {
      console.error('[PROF_SIGNATURE] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [clinic?.id, professionalId]);

  useEffect(() => {
    fetchSignature();
  }, [fetchSignature]);

  const uploadSignature = useCallback(async (file: File): Promise<boolean> => {
    if (!clinic?.id || !professionalId) return false;
    setUploading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) {
        toast.error('Usuário não autenticado');
        return false;
      }

      // Validate file
      if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
        toast.error('Formato inválido. Use PNG, JPEG ou WebP.');
        return false;
      }
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Arquivo muito grande. Máximo 2MB.');
        return false;
      }

      // Upload to storage
      const ext = file.name.split('.').pop() || 'png';
      const path = `${userId}/${professionalId}/signature.${ext}`;
      
      // Remove old file if exists
      await supabase.storage.from('professional-signatures').remove([path]);

      const { error: uploadError } = await supabase.storage
        .from('professional-signatures')
        .upload(path, file, { contentType: file.type, upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('professional-signatures')
        .getPublicUrl(path);

      const fileUrl = urlData.publicUrl;

      // Deactivate any existing signatures
      await supabase
        .from('professional_signatures')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('clinic_id', clinic.id)
        .eq('professional_id', professionalId);

      // Insert new signature record
      const { data, error } = await supabase
        .from('professional_signatures')
        .insert({
          clinic_id: clinic.id,
          professional_id: professionalId,
          signature_file_url: path, // store path, resolve URL on display
          signature_type: 'uploaded',
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      setSignature(data as ProfessionalSignature);
      toast.success('Assinatura salva com sucesso!');
      return true;
    } catch (err: any) {
      console.error('[PROF_SIGNATURE] Upload error:', err);
      toast.error(err?.message || 'Erro ao salvar assinatura');
      return false;
    } finally {
      setUploading(false);
    }
  }, [clinic?.id, professionalId]);

  const removeSignature = useCallback(async (): Promise<boolean> => {
    if (!signature) return false;
    try {
      // Remove from storage
      await supabase.storage.from('professional-signatures').remove([signature.signature_file_url]);
      
      // Deactivate record
      await supabase
        .from('professional_signatures')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', signature.id);

      setSignature(null);
      toast.success('Assinatura removida');
      return true;
    } catch (err: any) {
      console.error('[PROF_SIGNATURE] Remove error:', err);
      toast.error('Erro ao remover assinatura');
      return false;
    }
  }, [signature]);

  const getSignatureUrl = useCallback((filePath: string): string => {
    const { data } = supabase.storage.from('professional-signatures').getPublicUrl(filePath);
    return data.publicUrl;
  }, []);

  // Get a signed URL for private bucket access
  const getSignedUrl = useCallback(async (filePath: string): Promise<string | null> => {
    const { data, error } = await supabase.storage
      .from('professional-signatures')
      .createSignedUrl(filePath, 3600);
    if (error) {
      console.error('[PROF_SIGNATURE] Signed URL error:', error);
      return null;
    }
    return data.signedUrl;
  }, []);

  return {
    signature,
    loading,
    uploading,
    uploadSignature,
    removeSignature,
    getSignatureUrl,
    getSignedUrl,
    refetch: fetchSignature,
  };
}
