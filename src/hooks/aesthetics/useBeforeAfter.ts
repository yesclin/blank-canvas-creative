 import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
 import { supabase } from '@/integrations/supabase/client';
 import { useClinicData } from '@/hooks/useClinicData';
 import { toast } from 'sonner';
 import type { AestheticBeforeAfter, ViewAngle } from '@/components/prontuario/aesthetics/types';
 
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
         console.error('Error fetching before/after:', error);
         throw error;
       }
 
       return data as AestheticBeforeAfter[];
     },
     enabled: !!patientId && !!clinic?.id,
   });
 
  // Upload image - retorna o path do arquivo (bucket é privado)
  const uploadImage = async (file: File, type: 'before' | 'after'): Promise<string> => {
    if (!clinic?.id) throw new Error('Clinic not found');

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;

    const fileExt = file.name.split('.').pop();
    const fileName = `${clinic.id}/${patientId}/${type}_${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('aesthetic-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) throw uploadError;

    // Retorna o path, não URL pública (bucket privado)
    return fileName;
  };

  // Obter URL assinada para visualização (válida por 1 hora)
  const getSignedUrl = async (path: string): Promise<string | null> => {
    if (!path) return null;
    
    // Se já é uma URL completa (legacy), retorna diretamente
    if (path.startsWith('http')) return path;

    const { data, error } = await supabase.storage
      .from('aesthetic-images')
      .createSignedUrl(path, 3600); // 1 hora

    if (error) {
      console.error('Error creating signed URL:', error);
      return null;
    }

    return data.signedUrl;
  };
 
   // Create record
   const createRecordMutation = useMutation({
     mutationFn: async (data: Partial<AestheticBeforeAfter> & { beforeFile?: File; afterFile?: File }) => {
       if (!patientId || !clinic?.id) throw new Error('Missing required data');
 
       const { data: userData } = await supabase.auth.getUser();
 
       let beforeUrl = data.before_image_url || null;
       let afterUrl = data.after_image_url || null;
 
       // Upload images if provided
       if (data.beforeFile) {
         beforeUrl = await uploadImage(data.beforeFile, 'before');
       }
       if (data.afterFile) {
         afterUrl = await uploadImage(data.afterFile, 'after');
       }
 
       const { data: result, error } = await supabase
         .from('aesthetic_before_after')
         .insert({
           clinic_id: clinic.id,
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
           created_by: userData.user?.id,
         })
         .select()
         .single();
 
       if (error) throw error;
       return result;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey });
       toast.success('Registro criado com sucesso');
     },
     onError: (error) => {
       console.error('Error creating record:', error);
       toast.error('Erro ao criar registro');
     },
   });
 
   // Update record (add after image)
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
       console.error('Error updating record:', error);
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
       console.error('Error deleting record:', error);
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