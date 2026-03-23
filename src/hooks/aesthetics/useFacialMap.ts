 import { useState, useCallback, useEffect } from 'react';
 import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
 import { supabase } from '@/integrations/supabase/client';
 import { useClinicData } from '@/hooks/useClinicData';
 import { toast } from 'sonner';
 import type { 
   FacialMap, 
   FacialMapApplication, 
   FacialMapImage,
   ProcedureType, 
   ViewType, 
   SideType,
   MapType,
   ImageType,
   ViewAngle,
 } from '@/components/prontuario/aesthetics/types';
 
 export function useFacialMap(patientId: string | null, appointmentId?: string | null) {
   const { clinic } = useClinicData();
   const queryClient = useQueryClient();
   const [currentMapId, setCurrentMapId] = useState<string | null>(null);
 
   const mapQueryKey = ['facial-map', patientId, appointmentId];
   const pointsQueryKey = ['facial-map-points', currentMapId];
   const imagesQueryKey = ['facial-map-images', currentMapId];
 
   // Fetch or find facial map for this appointment
   const { data: facialMap, isLoading: isLoadingMap } = useQuery({
     queryKey: mapQueryKey,
     queryFn: async () => {
       if (!patientId || !clinic?.id) return null;
 
       // Try to find existing map for this appointment
       if (appointmentId) {
         const { data: existingMap, error } = await supabase
           .from('facial_maps')
           .select('*')
           .eq('clinic_id', clinic.id)
           .eq('patient_id', patientId)
           .eq('appointment_id', appointmentId)
           .maybeSingle();
 
         if (error) {
           console.error('Error fetching facial map:', error);
           throw error;
         }
 
         if (existingMap) {
           return existingMap as FacialMap;
         }
       }
 
       // If viewing history (no appointmentId), get the most recent map
       if (!appointmentId) {
         const { data: recentMap, error } = await supabase
           .from('facial_maps')
           .select('*')
           .eq('clinic_id', clinic.id)
           .eq('patient_id', patientId)
           .order('created_at', { ascending: false })
           .limit(1)
           .maybeSingle();
 
         if (error) {
           console.error('Error fetching recent facial map:', error);
           throw error;
         }
 
         return recentMap as FacialMap | null;
       }
 
       return null;
     },
     enabled: !!patientId && !!clinic?.id,
   });
 
   // Update currentMapId when facialMap changes
   useEffect(() => {
     setCurrentMapId(facialMap?.id || null);
   }, [facialMap?.id]);
 
   // Fetch application points for current map
   const { data: applications = [], isLoading: isLoadingPoints } = useQuery({
     queryKey: pointsQueryKey,
     queryFn: async () => {
       if (!currentMapId || !clinic?.id) return [];
 
       const { data, error } = await supabase
         .from('facial_map_applications')
         .select('*')
         .eq('clinic_id', clinic.id)
         .eq('facial_map_id', currentMapId)
         .order('created_at', { ascending: false });
 
       if (error) {
         console.error('Error fetching facial map points:', error);
         throw error;
       }
 
       return data as FacialMapApplication[];
     },
     enabled: !!currentMapId && !!clinic?.id,
   });
 
   // Fetch images for current map
   const { data: mapImages = [], isLoading: isLoadingImages } = useQuery({
     queryKey: imagesQueryKey,
     queryFn: async () => {
       if (!currentMapId || !clinic?.id) return [];
 
       const { data, error } = await supabase
         .from('facial_map_images')
         .select('*')
         .eq('clinic_id', clinic.id)
         .eq('facial_map_id', currentMapId)
         .order('created_at', { ascending: false });
 
       if (error) {
         console.error('Error fetching facial map images:', error);
         throw error;
       }
 
       return data as FacialMapImage[];
     },
     enabled: !!currentMapId && !!clinic?.id,
   });
 
   // Create facial map
   const createMapMutation = useMutation({
     mutationFn: async (mapType: MapType = 'general') => {
       if (!patientId || !clinic?.id) throw new Error('Missing required data');
 
       const { data: userData } = await supabase.auth.getUser();
 
       const { data: result, error } = await supabase
         .from('facial_maps')
         .insert({
           clinic_id: clinic.id,
           patient_id: patientId,
           appointment_id: appointmentId || null,
           map_type: mapType,
           created_by: userData.user?.id,
         })
         .select()
         .single();
 
       if (error) throw error;
       return result as FacialMap;
     },
     onSuccess: (newMap) => {
       queryClient.invalidateQueries({ queryKey: mapQueryKey });
       setCurrentMapId(newMap.id);
       toast.success('Mapa facial criado');
     },
     onError: (error) => {
       console.error('Error creating facial map:', error);
       toast.error('Erro ao criar mapa facial');
     },
   });
 
   // Ensure map exists before adding points
   const ensureMapExists = async (): Promise<string> => {
     if (currentMapId) return currentMapId;
     
     const newMap = await createMapMutation.mutateAsync('general');
     return newMap.id;
   };
 
   // Add application point (creates map if needed)
   const addApplicationMutation = useMutation({
     mutationFn: async (data: Partial<FacialMapApplication>) => {
       if (!patientId || !clinic?.id) throw new Error('Missing required data');
 
       const mapId = await ensureMapExists();
       const { data: userData } = await supabase.auth.getUser();
 
       const { data: result, error } = await supabase
         .from('facial_map_applications')
         .insert({
           clinic_id: clinic.id,
           patient_id: patientId,
           facial_map_id: mapId,
           procedure_type: data.procedure_type as ProcedureType,
           view_type: data.view_type as ViewType,
           position_x: data.position_x!,
           position_y: data.position_y!,
           muscle: data.muscle || null,
           product_name: data.product_name!,
           quantity: data.quantity!,
           unit: data.unit || 'UI',
           side: data.side as SideType || null,
           notes: data.notes || null,
           created_by: userData.user?.id,
         })
         .select()
         .single();
 
       if (error) throw error;
       return result;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: pointsQueryKey });
       toast.success('Ponto de aplicação adicionado');
     },
     onError: (error) => {
       console.error('Error adding application:', error);
       toast.error('Erro ao adicionar ponto');
     },
   });
 
   // Update application point
   const updateApplicationMutation = useMutation({
     mutationFn: async ({ id, data }: { id: string; data: Partial<FacialMapApplication> }) => {
       const { error } = await supabase
         .from('facial_map_applications')
         .update({
           procedure_type: data.procedure_type as ProcedureType,
           muscle: data.muscle || null,
           product_name: data.product_name,
           quantity: data.quantity,
           unit: data.unit,
           side: data.side as SideType || null,
           notes: data.notes || null,
         })
         .eq('id', id);
 
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: pointsQueryKey });
       toast.success('Ponto atualizado');
     },
     onError: (error) => {
       console.error('Error updating application:', error);
       toast.error('Erro ao atualizar ponto');
     },
   });
 
   // Delete application point
   const deleteApplicationMutation = useMutation({
     mutationFn: async (id: string) => {
       const { error } = await supabase
         .from('facial_map_applications')
         .delete()
         .eq('id', id);
 
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: pointsQueryKey });
       toast.success('Ponto removido');
     },
     onError: (error) => {
       console.error('Error deleting application:', error);
       toast.error('Erro ao remover ponto');
     },
   });
 
   // Add image to map
   const addImageMutation = useMutation({
     mutationFn: async (data: { 
       image_type: ImageType; 
       image_url: string; 
       image_date?: string;
       view_angle?: ViewAngle;
       notes?: string;
     }) => {
       if (!clinic?.id) throw new Error('Missing required data');
 
       const mapId = await ensureMapExists();
       const { data: userData } = await supabase.auth.getUser();
 
       const { data: result, error } = await supabase
         .from('facial_map_images')
         .insert({
           clinic_id: clinic.id,
           facial_map_id: mapId,
           image_type: data.image_type,
           image_url: data.image_url,
           image_date: data.image_date || null,
           view_angle: data.view_angle || 'frontal',
           notes: data.notes || null,
           created_by: userData.user?.id,
         })
         .select()
         .single();
 
       if (error) throw error;
       return result as FacialMapImage;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: imagesQueryKey });
       toast.success('Imagem adicionada');
     },
     onError: (error) => {
       console.error('Error adding image:', error);
       toast.error('Erro ao adicionar imagem');
     },
   });
 
   // Delete image
   const deleteImageMutation = useMutation({
     mutationFn: async (id: string) => {
       const { error } = await supabase
         .from('facial_map_images')
         .delete()
         .eq('id', id);
 
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: imagesQueryKey });
       toast.success('Imagem removida');
     },
     onError: (error) => {
       console.error('Error deleting image:', error);
       toast.error('Erro ao remover imagem');
     },
   });
 
   // Update map notes
   const updateMapNotesMutation = useMutation({
     mutationFn: async (notes: string) => {
       if (!currentMapId) throw new Error('No map selected');
 
       const { error } = await supabase
         .from('facial_maps')
         .update({ general_notes: notes })
         .eq('id', currentMapId);
 
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: mapQueryKey });
       toast.success('Observações atualizadas');
     },
     onError: (error) => {
       console.error('Error updating notes:', error);
       toast.error('Erro ao atualizar observações');
     },
   });
 
   // Get all maps for history
   const { data: allMaps = [], isLoading: historyLoading } = useQuery({
     queryKey: ['facial-map-history', patientId],
     queryFn: async () => {
       if (!patientId || !clinic?.id) return [];
 
       const { data, error } = await supabase
         .from('facial_maps')
         .select('*')
         .eq('clinic_id', clinic.id)
         .eq('patient_id', patientId)
         .order('created_at', { ascending: false });
 
       if (error) {
         console.error('Error fetching facial map history:', error);
         throw error;
       }
 
       return data as FacialMap[];
     },
     enabled: !!patientId && !!clinic?.id,
   });
 
   // Get all applications across all maps (for history view)
   const { data: allApplications = [] } = useQuery({
     queryKey: ['facial-map-all-points', patientId],
     queryFn: async () => {
       if (!patientId || !clinic?.id) return [];
 
       const { data, error } = await supabase
         .from('facial_map_applications')
         .select('*')
         .eq('clinic_id', clinic.id)
         .eq('patient_id', patientId)
         .order('created_at', { ascending: false });
 
       if (error) {
         console.error('Error fetching all applications:', error);
         throw error;
       }
 
       return data as FacialMapApplication[];
     },
     enabled: !!patientId && !!clinic?.id,
   });
 
   return {
     // Map entity
     facialMap,
     currentMapId,
     setCurrentMapId,
     allMaps,
     createMap: createMapMutation.mutateAsync,
     updateMapNotes: updateMapNotesMutation.mutateAsync,
     isCreatingMap: createMapMutation.isPending,
     
     // Application points
     applications,
     allApplications,
     addApplication: addApplicationMutation.mutateAsync,
     updateApplication: updateApplicationMutation.mutateAsync,
     deleteApplication: deleteApplicationMutation.mutateAsync,
     isAdding: addApplicationMutation.isPending,
     isUpdating: updateApplicationMutation.isPending,
     isDeleting: deleteApplicationMutation.isPending,
     
     // Images
     mapImages,
     addImage: addImageMutation.mutateAsync,
     deleteImage: deleteImageMutation.mutateAsync,
     isAddingImage: addImageMutation.isPending,
     isDeletingImage: deleteImageMutation.isPending,
     
     // Loading states
     isLoading: isLoadingMap || isLoadingPoints,
     isLoadingImages,
     historyLoading,
   };
 }