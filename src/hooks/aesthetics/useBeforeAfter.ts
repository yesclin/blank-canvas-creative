import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useClinicData } from '@/hooks/useClinicData';
import { toast } from 'sonner';
import type { AestheticBeforeAfter, ViewAngle } from '@/components/prontuario/aesthetics/types';

const LOG = {
  ba: '[ESTETICA_BEFORE_AFTER]',
  ctx: '[ESTETICA_CONTEXT]',
  payload: '[ESTETICA_PAYLOAD]',
  db: '[ESTETICA_DB_ERROR]',
} as const;

export function useBeforeAfter(patientId: string | null) {
  const { clinic } = useClinicData();
  const queryClient = useQueryClient();

  const queryKey = ['before-after', patientId];

  // Fetch records
  const { data: records = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!patientId || !clinic?.id) return [];

      const { data, error } = await supabase
        .from('aesthetic_before_after')
        .select('*')
        .eq('clinic_id', clinic.id)
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error(`${LOG.db} Fetch before/after failed:`, error);
        throw error;
      }

      return data as AestheticBeforeAfter[];
    },
    enabled: !!patientId && !!clinic?.id,
  });

  // Upload image
  const uploadImage = async (file: File, type: 'before' | 'after'): Promise<string> => {
    console.log(`${LOG.ba} Upload ${type} image: ${file.name} (${file.size} bytes)`);

    if (!clinic?.id) throw new Error('clinic_id ausente para upload');

    const fileExt = file.name.split('.').pop();
    const fileName = `${clinic.id}/${patientId}/${type}_${Date.now()}.${fileExt}`;

    console.log(`${LOG.ba} Uploading to bucket 'aesthetic-images', path: ${fileName}`);

    const { error: uploadError } = await supabase.storage
      .from('aesthetic-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error(`${LOG.db} Upload ${type} falhou:`, JSON.stringify(uploadError));
      throw new Error(`Falha no upload da foto ${type === 'before' ? 'Antes' : 'Depois'}: ${uploadError.message}`);
    }

    console.log(`${LOG.ba} Upload ${type} OK: ${fileName}`);
    return fileName;
  };

  // Obter URL assinada para visualização
  const getSignedUrl = async (path: string): Promise<string | null> => {
    if (!path) return null;
    if (path.startsWith('http')) return path;

    const { data, error } = await supabase.storage
      .from('aesthetic-images')
      .createSignedUrl(path, 3600);

    if (error) {
      console.error(`${LOG.db} Signed URL failed for path ${path}:`, error);
      return null;
    }

    return data.signedUrl;
  };

  // Create record
  const createRecordMutation = useMutation({
    mutationFn: async (data: Partial<AestheticBeforeAfter> & { beforeFile?: File; afterFile?: File }) => {
      console.log(`${LOG.ba} ── Início da criação de registro Before/After ──`);

      // ── Step 1: Validate context ──
      const contextErrors: string[] = [];
      if (!patientId) contextErrors.push('patient_id ausente');
      if (!clinic?.id) contextErrors.push('clinic_id ausente');
      if (!data.title) contextErrors.push('title ausente');
      if (!data.beforeFile && !data.before_image_url) contextErrors.push('Foto Antes ausente (sem arquivo e sem URL)');

      if (contextErrors.length > 0) {
        const msg = `Validação falhou: ${contextErrors.join('; ')}`;
        console.error(`${LOG.ctx} ${msg}`);
        throw new Error(msg);
      }

      console.log(`${LOG.ctx} clinic_id=${clinic!.id}, patient_id=${patientId}, appointment_id=${data.appointment_id || 'NENHUM'}`);

      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      console.log(`${LOG.ctx} user_id=${userId || 'NÃO AUTENTICADO'}`);

      // ── Step 2: Upload images ──
      let beforeUrl = data.before_image_url || null;
      let afterUrl = data.after_image_url || null;

      if (data.beforeFile) {
        console.log(`${LOG.ba} Etapa: upload foto Antes`);
        beforeUrl = await uploadImage(data.beforeFile, 'before');
      }
      if (data.afterFile) {
        console.log(`${LOG.ba} Etapa: upload foto Depois`);
        afterUrl = await uploadImage(data.afterFile, 'after');
      }

      // ── Step 3: Build insert payload ──
      const insertPayload = {
        clinic_id: clinic!.id,
        patient_id: patientId,
        appointment_id: data.appointment_id || null,
        procedure_id: data.procedure_id || null,
        title: data.title!,
        description: data.description || null,
        procedure_type: data.procedure_type || null,
        before_image_url: beforeUrl,
        before_image_date: data.before_image_date || (beforeUrl ? new Date().toISOString() : null),
        after_image_url: afterUrl,
        after_image_date: data.after_image_date || (afterUrl ? new Date().toISOString() : null),
        view_angle: (data.view_angle as ViewAngle) || 'frontal',
        consent_for_marketing: data.consent_for_marketing || false,
        created_by: userId,
      };

      console.log(`${LOG.payload} Insert payload (aesthetic_before_after):`, JSON.stringify(insertPayload, null, 2));

      // ── Step 4: Insert ──
      console.log(`${LOG.ba} Etapa: insert em aesthetic_before_after`);
      const { data: result, error } = await supabase
        .from('aesthetic_before_after')
        .insert(insertPayload)
        .select()
        .single();

      if (error) {
        console.error(`${LOG.db} Insert falhou na tabela aesthetic_before_after`);
        console.error(`${LOG.db} Código: ${error.code}`);
        console.error(`${LOG.db} Mensagem: ${error.message}`);
        console.error(`${LOG.db} Detalhes: ${error.details}`);
        console.error(`${LOG.db} Hint: ${error.hint}`);
        console.error(`${LOG.db} Erro completo:`, JSON.stringify(error));

        // Cleanup uploaded files on insert failure
        if (data.beforeFile && beforeUrl) {
          console.log(`${LOG.ba} Rollback: removendo foto Antes do storage (${beforeUrl})`);
          await supabase.storage.from('aesthetic-images').remove([beforeUrl]).catch(() => {});
        }
        if (data.afterFile && afterUrl) {
          console.log(`${LOG.ba} Rollback: removendo foto Depois do storage (${afterUrl})`);
          await supabase.storage.from('aesthetic-images').remove([afterUrl]).catch(() => {});
        }

        let userMsg = 'Falha ao criar registro';
        if (error.code === '23503') userMsg = `Chave estrangeira inválida: ${error.details}`;
        else if (error.code === '23502') userMsg = `Campo obrigatório ausente: ${error.message}`;
        else if (error.code === '42501') userMsg = 'Permissão negada (RLS)';
        else if (error.message) userMsg = error.message;

        throw new Error(userMsg);
      }

      console.log(`${LOG.ba} Registro criado com sucesso. id=${result.id}`);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Registro criado com sucesso');
    },
    onError: (error: Error) => {
      console.error(`${LOG.ba} FALHA FINAL:`, error);
      toast.error(`Erro ao criar registro: ${error.message}`);
    },
  });

  // Update record
  const updateRecordMutation = useMutation({
    mutationFn: async ({ id, data, afterFile }: { id: string; data: Partial<AestheticBeforeAfter>; afterFile?: File }) => {
      let afterUrl = data.after_image_url;

      if (afterFile) {
        afterUrl = await uploadImage(afterFile, 'after');
      }

      const { error } = await supabase
        .from('aesthetic_before_after')
        .update({
          after_image_url: afterUrl,
          after_image_date: afterUrl ? new Date().toISOString() : null,
          description: data.description,
          consent_for_marketing: data.consent_for_marketing,
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Registro atualizado');
    },
    onError: (error) => {
      console.error(`${LOG.db} Update failed:`, error);
      toast.error('Erro ao atualizar registro');
    },
  });

  // Delete record
  const deleteRecordMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('aesthetic_before_after')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Registro removido');
    },
    onError: (error) => {
      console.error(`${LOG.db} Delete failed:`, error);
      toast.error('Erro ao remover registro');
    },
  });

  return {
    records,
    isLoading,
    createRecord: createRecordMutation.mutateAsync,
    updateRecord: updateRecordMutation.mutateAsync,
    deleteRecord: deleteRecordMutation.mutateAsync,
    uploadImage,
    getSignedUrl,
    isCreating: createRecordMutation.isPending,
    isUpdating: updateRecordMutation.isPending,
    isDeleting: deleteRecordMutation.isPending,
  };
}
