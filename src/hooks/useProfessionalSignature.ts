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
  signature_width: number;
  signature_scale: number;
  signature_alignment: string;
  signature_offset_x: number;
  signature_offset_y: number;
  created_at: string;
  updated_at: string;
}

export const SIGNATURE_DEFAULTS = {
  width: 200,
  scale: 1.0,
  alignment: 'center',
  offsetX: 0,
  offsetY: 0,
  minWidth: 80,
  maxWidth: 400,
  minScale: 0.5,
  maxScale: 2.0,
};

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

      if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
        toast.error('Formato inválido. Use PNG, JPEG ou WebP.');
        return false;
      }
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Arquivo muito grande. Máximo 2MB.');
        return false;
      }

      const ext = file.name.split('.').pop() || 'png';
      const path = `${userId}/${professionalId}/signature.${ext}`;

      await supabase.storage.from('professional-signatures').remove([path]);

      const { error: uploadError } = await supabase.storage
        .from('professional-signatures')
        .upload(path, file, { contentType: file.type, upsert: true });

      if (uploadError) throw uploadError;

      // Deactivate existing
      await supabase
        .from('professional_signatures')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('clinic_id', clinic.id)
        .eq('professional_id', professionalId);

      const { data, error } = await supabase
        .from('professional_signatures')
        .insert({
          clinic_id: clinic.id,
          professional_id: professionalId,
          signature_file_url: path,
          signature_type: 'uploaded',
          is_active: true,
          signature_width: SIGNATURE_DEFAULTS.width,
          signature_scale: SIGNATURE_DEFAULTS.scale,
          signature_alignment: SIGNATURE_DEFAULTS.alignment,
          signature_offset_x: SIGNATURE_DEFAULTS.offsetX,
          signature_offset_y: SIGNATURE_DEFAULTS.offsetY,
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

  const updateSignatureSize = useCallback(async (updates: {
    signature_width?: number;
    signature_scale?: number;
    signature_alignment?: string;
    signature_offset_x?: number;
    signature_offset_y?: number;
  }): Promise<boolean> => {
    if (!signature) return false;
    try {
      const { error } = await supabase
        .from('professional_signatures')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', signature.id);

      if (error) throw error;
      setSignature(prev => prev ? { ...prev, ...updates } : prev);
      toast.success('Configurações de tamanho salvas');
      return true;
    } catch (err: any) {
      console.error('[PROF_SIGNATURE] Update size error:', err);
      toast.error('Erro ao salvar configurações');
      return false;
    }
  }, [signature]);

  const removeSignature = useCallback(async (): Promise<boolean> => {
    if (!signature) return false;
    try {
      await supabase.storage.from('professional-signatures').remove([signature.signature_file_url]);
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
    updateSignatureSize,
    getSignatureUrl,
    getSignedUrl,
    refetch: fetchSignature,
  };
}
