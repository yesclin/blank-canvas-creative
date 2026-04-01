import { useState, useEffect } from 'react';
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
  MapStatus,
  ImageType,
  ViewAngle,
} from '@/components/prontuario/aesthetics/types';

interface UseFacialMapOptions {
  professionalId?: string | null;
  specialtyKey?: string | null;
  canEditRecords?: boolean;
  validationError?: string | null;
  mapType?: MapType;
}

function getErrorDetails(error: any) {
  return {
    code: error?.code || null,
    message: error?.message || 'Erro desconhecido',
    details: error?.details || null,
    hint: error?.hint || null,
  };
}

function logFacialMapError(
  type: 'facial_map_create_failed' | 'facial_map_point_create_failed' | 'facial_map_point_update_failed',
  params: {
    functionName: string;
    payload: unknown;
    response?: unknown;
    error: unknown;
    table: 'facial_maps' | 'facial_map_applications';
    context: Record<string, unknown>;
  }
) {
  console.error(type, {
    function: params.functionName,
    payload: params.payload,
    response: params.response ?? null,
    error: getErrorDetails(params.error),
    table: params.table,
    context: params.context,
  });
}

function normalizeCoordinate(value: number | null | undefined) {
  if (!Number.isFinite(value)) return null;
  if (value == null || value < 0 || value > 100) return null;
  return Number(value.toFixed(4));
}

function inferSide(positionX: number, viewType: ViewType): SideType | null {
  if (viewType === 'left_lateral') return 'left';
  if (viewType === 'right_lateral') return 'right';
  if (positionX < 45) return 'left';
  if (positionX > 55) return 'right';
  return 'center';
}

// Helper: convert DB row to FacialMap domain object
function dbRowToFacialMap(row: any): FacialMap {
  const extra = (row.data as Record<string, any>) || {};
  return {
    id: row.id,
    clinic_id: row.clinic_id,
    patient_id: row.patient_id,
    professional_id: row.professional_id,
    map_type: (row.map_type || 'general') as MapType,
    status: (extra.status || 'active') as MapStatus,
    general_notes: row.notes,
    appointment_id: extra.appointment_id || null,
    concluded_at: extra.concluded_at || null,
    created_at: row.created_at,
    created_by: extra.created_by || null,
    updated_at: row.updated_at,
    source_session_id: extra.source_session_id || null,
  };
}

// Helper: convert DB row to FacialMapApplication domain object
function dbRowToApplication(row: any): FacialMapApplication {
  const extra = (row.data as Record<string, any>) || {};
  return {
    id: row.id,
    clinic_id: extra.clinic_id || '',
    patient_id: extra.patient_id || '',
    appointment_id: extra.appointment_id || null,
    professional_id: extra.professional_id || null,
    facial_map_id: row.facial_map_id,
    procedure_type: (extra.procedure_type || 'toxin') as ProcedureType,
    view_type: (extra.view_type || 'frontal') as ViewType,
    position_x: extra.position_x ?? 0,
    position_y: extra.position_y ?? 0,
    muscle: row.region || extra.muscle || null,
    product_name: row.product_name || 'A definir',
    quantity: row.units ?? extra.quantity ?? 0,
    unit: extra.unit || 'U',
    side: (extra.side as SideType) || null,
    notes: row.notes,
    created_at: row.created_at,
    created_by: extra.created_by || null,
    updated_at: extra.updated_at || row.created_at,
    // Extended fields
    manufacturer: extra.manufacturer || null,
    lot_number: extra.lot_number || null,
    expiry_date: extra.expiry_date || null,
    dilution: extra.dilution || null,
    technique: extra.technique || null,
    depth: extra.depth || null,
    planned_volume: extra.planned_volume ?? null,
    applied_volume: extra.applied_volume ?? null,
    application_plan: extra.application_plan || null,
    session_number: extra.session_number ?? null,
    total_sessions: extra.total_sessions ?? null,
    session_interval: extra.session_interval || null,
    protocol: extra.protocol || null,
  };
}

export function useFacialMap(
  patientId: string | null,
  appointmentId?: string | null,
  options?: UseFacialMapOptions
) {
  const { clinic } = useClinicData();
  const queryClient = useQueryClient();
  const [currentMapId, setCurrentMapId] = useState<string | null>(null);
  const preferredMapType = options?.mapType || 'toxin';

  const mapQueryKey = ['facial-map', patientId, appointmentId];
  const pointsQueryKey = ['facial-map-points', currentMapId];
  const imagesQueryKey = ['facial-map-images', currentMapId];

  const getContextSnapshot = () => ({
    clinic_id: clinic?.id || null,
    patient_id: patientId || null,
    professional_id: options?.professionalId || null,
    appointment_id: appointmentId || null,
    specialty_key: options?.specialtyKey || null,
    can_edit_records: options?.canEditRecords ?? null,
    validation_error: options?.validationError || null,
    map_type: preferredMapType,
    current_map_id: currentMapId,
  });

  const ensureEditableContext = () => {
    if (!patientId) {
      throw new Error('Paciente não identificado para o Mapa Facial.');
    }

    if (!clinic?.id) {
      throw new Error('Clínica não identificada para o Mapa Facial.');
    }

    if (options?.specialtyKey && options.specialtyKey !== 'estetica') {
      throw new Error('O Mapa Facial só pode ser usado na especialidade Estética / Harmonização Facial.');
    }

    if (options && options.canEditRecords === false) {
      throw new Error(options.validationError || 'Inicie ou vincule um atendimento para registrar aplicações no mapa facial.');
    }
  };

  const getAuthUserId = async () => {
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      throw error;
    }

    return data.user?.id || null;
  };

  const findExistingMapForContext = async () => {
    if (!patientId || !clinic?.id) return null;

    if (appointmentId) {
      const { data: maps, error } = await supabase
        .from('facial_maps')
        .select('*')
        .eq('clinic_id', clinic.id)
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      if (error) {
        logFacialMapError('facial_map_create_failed', {
          functionName: 'getOrCreateFacialMap',
          payload: { clinic_id: clinic.id, patient_id: patientId, appointment_id: appointmentId },
          error,
          table: 'facial_maps',
          context: getContextSnapshot(),
        });
        throw error;
      }

      return (maps || []).find((map: any) => {
        const data = (map.data as Record<string, any>) || {};
        return data.appointment_id === appointmentId;
      }) || null;
    }

    const { data: recentMap, error } = await supabase
      .from('facial_maps')
      .select('*')
      .eq('clinic_id', clinic.id)
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      logFacialMapError('facial_map_create_failed', {
        functionName: 'getOrCreateFacialMap',
        payload: { clinic_id: clinic.id, patient_id: patientId, appointment_id: null },
        error,
        table: 'facial_maps',
        context: getContextSnapshot(),
      });
      throw error;
    }

    return recentMap || null;
  };

  const createNewFacialMap = async (mapType: MapType = preferredMapType, sourceSessionId?: string | null) => {
    ensureEditableContext();

    const authUserId = await getAuthUserId();
    const payload = {
      clinic_id: clinic!.id,
      patient_id: patientId!,
      map_type: mapType,
      professional_id: options?.professionalId || null,
      notes: '',
      data: {
        appointment_id: appointmentId || null,
        created_by: authUserId,
        specialty_key: options?.specialtyKey || null,
        source_session_id: sourceSessionId || null,
      },
    };

    const { data: result, error } = await supabase
      .from('facial_maps')
      .insert(payload)
      .select('*')
      .single();

    if (error) {
      logFacialMapError('facial_map_create_failed', {
        functionName: 'getOrCreateFacialMap',
        payload,
        response: result,
        error,
        table: 'facial_maps',
        context: getContextSnapshot(),
      });
      throw error;
    }

    const createdMap = dbRowToFacialMap(result);
    setCurrentMapId(createdMap.id);
    queryClient.setQueryData(mapQueryKey, createdMap);

    return createdMap;
  };

  const getOrCreateFacialMap = async (mapType: MapType = preferredMapType): Promise<FacialMap> => {
    ensureEditableContext();

    if (facialMap?.id) {
      setCurrentMapId(facialMap.id);
      return facialMap;
    }

    const existing = await findExistingMapForContext();
    if (existing) {
      const mappedMap = dbRowToFacialMap(existing);
      setCurrentMapId(mappedMap.id);
      queryClient.setQueryData(mapQueryKey, mappedMap);
      return mappedMap;
    }

    return createNewFacialMap(mapType);
  };

  const createFacialMapPoint = async (appData: Partial<FacialMapApplication>) => {
    ensureEditableContext();

    const positionX = normalizeCoordinate(appData.position_x);
    const positionY = normalizeCoordinate(appData.position_y);

    if (positionX === null || positionY === null) {
      throw new Error('Coordenadas inválidas para marcar o ponto no mapa facial.');
    }

    const procedureType = appData.procedure_type || 'toxin';
    const viewType = appData.view_type || 'frontal';
    const quantity = appData.quantity ?? 0;
    const unit = appData.unit || 'U';
    const map = await getOrCreateFacialMap(preferredMapType);
    const authUserId = await getAuthUserId();

    const payload = {
      facial_map_id: map.id,
      product_name: appData.product_name || 'A definir',
      region: appData.muscle || null,
      units: quantity,
      notes: appData.notes || null,
      data: {
        clinic_id: clinic!.id,
        patient_id: patientId!,
        professional_id: options?.professionalId || null,
        appointment_id: appointmentId || null,
        procedure_type: procedureType,
        view_type: viewType,
        position_x: positionX,
        position_y: positionY,
        muscle: appData.muscle || null,
        unit,
        side: appData.side ?? inferSide(positionX, viewType),
        quantity,
        created_by: authUserId,
        updated_at: new Date().toISOString(),
        // Extended fields
        manufacturer: appData.manufacturer || null,
        lot_number: appData.lot_number || null,
        expiry_date: appData.expiry_date || null,
        dilution: appData.dilution || null,
        technique: appData.technique || null,
        depth: appData.depth || null,
        planned_volume: appData.planned_volume ?? null,
        applied_volume: appData.applied_volume ?? null,
        application_plan: appData.application_plan || null,
        session_number: appData.session_number ?? null,
        total_sessions: appData.total_sessions ?? null,
        session_interval: appData.session_interval || null,
        protocol: appData.protocol || null,
      },
    };

    const { data: result, error } = await supabase
      .from('facial_map_applications')
      .insert(payload)
      .select('*')
      .single();

    if (error) {
      logFacialMapError('facial_map_point_create_failed', {
        functionName: 'createFacialMapPoint',
        payload,
        response: result,
        error,
        table: 'facial_map_applications',
        context: getContextSnapshot(),
      });
      throw error;
    }

    return dbRowToApplication(result);
  };

  // Fetch or find facial map for this patient
  const { data: facialMap, isLoading: isLoadingMap } = useQuery({
    queryKey: mapQueryKey,
    queryFn: async () => {
      if (!patientId || !clinic?.id) return null;

      // Try to find existing map for this appointment (stored in data JSON)
      if (appointmentId) {
        const { data: maps, error } = await supabase
          .from('facial_maps')
          .select('*')
          .eq('clinic_id', clinic.id)
          .eq('patient_id', patientId)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching facial maps:', error);
          throw error;
        }

        // Find one matching appointment_id in data JSON
        const match = (maps || []).find((m: any) => {
          const d = (m.data as Record<string, any>) || {};
          return d.appointment_id === appointmentId;
        });
        if (match) return dbRowToFacialMap(match);

        return null;
      }

      // No appointmentId → get the most recent map
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

        return recentMap ? dbRowToFacialMap(recentMap) : null;
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
      if (!currentMapId) return [];

      const { data, error } = await supabase
        .from('facial_map_applications')
        .select('*')
        .eq('facial_map_id', currentMapId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching facial map points:', error);
        throw error;
      }

      return (data || []).map(dbRowToApplication);
    },
    enabled: !!currentMapId,
  });

  // Fetch images for current map
  const { data: mapImages = [], isLoading: isLoadingImages } = useQuery({
    queryKey: imagesQueryKey,
    queryFn: async () => {
      if (!currentMapId) return [];

      const { data, error } = await supabase
        .from('facial_map_images')
        .select('*')
        .eq('facial_map_id', currentMapId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching facial map images:', error);
        throw error;
      }

      return data as FacialMapImage[];
    },
    enabled: !!currentMapId,
  });

  // Create facial map
  const createMapMutation = useMutation({
    mutationFn: async (mapType: MapType = preferredMapType) => {
      return getOrCreateFacialMap(mapType);
    },
    onSuccess: (newMap) => {
      queryClient.invalidateQueries({ queryKey: mapQueryKey });
      setCurrentMapId(newMap.id);
      toast.success('Mapa facial pronto');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Erro ao criar mapa facial');
    },
  });

  // Add application point (creates map if needed)
  const addApplicationMutation = useMutation({
    mutationFn: createFacialMapPoint,
    onSuccess: (newApplication) => {
      if (newApplication.facial_map_id) {
        queryClient.invalidateQueries({ queryKey: ['facial-map-points', newApplication.facial_map_id] });
        setCurrentMapId(newApplication.facial_map_id);
      } else {
        queryClient.invalidateQueries({ queryKey: pointsQueryKey });
      }
      toast.success('Ponto de aplicação adicionado');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Erro ao adicionar ponto');
    },
  });

  // Update application point
  const updateApplicationMutation = useMutation({
    mutationFn: async ({ id, data: appData }: { id: string; data: Partial<FacialMapApplication> }) => {
      const { data: existingRow, error: fetchError } = await supabase
        .from('facial_map_applications')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) {
        logFacialMapError('facial_map_point_update_failed', {
          functionName: 'updateFacialMapPoint',
          payload: { id, data: appData },
          error: fetchError,
          table: 'facial_map_applications',
          context: getContextSnapshot(),
        });
        throw fetchError;
      }

      const existingData = (existingRow?.data as Record<string, any>) || {};
      const existingPositionX = normalizeCoordinate(Number(existingData.position_x));
      const existingPositionY = normalizeCoordinate(Number(existingData.position_y));
      const positionX = normalizeCoordinate(appData.position_x ?? existingPositionX);
      const positionY = normalizeCoordinate(appData.position_y ?? existingPositionY);

      if (positionX === null || positionY === null) {
        throw new Error('Coordenadas inválidas para atualizar o ponto do mapa facial.');
      }

      const procedureType = appData.procedure_type || existingData.procedure_type || 'toxin';
      const viewType = appData.view_type || existingData.view_type || 'frontal';
      const quantity = appData.quantity ?? existingRow.units ?? existingData.quantity ?? 0;
      const payload = {
        product_name: appData.product_name ?? existingRow.product_name ?? 'A definir',
        region: appData.muscle ?? existingRow.region ?? existingData.muscle ?? null,
        units: quantity,
        notes: appData.notes ?? existingRow.notes ?? null,
        data: {
          ...existingData,
          clinic_id: existingData.clinic_id || clinic?.id || '',
          patient_id: existingData.patient_id || patientId || '',
          professional_id: appData.professional_id ?? existingData.professional_id ?? options?.professionalId ?? null,
          appointment_id: appData.appointment_id ?? existingData.appointment_id ?? appointmentId ?? null,
          procedure_type: procedureType,
          view_type: viewType,
          position_x: positionX,
          position_y: positionY,
          muscle: appData.muscle ?? existingRow.region ?? existingData.muscle ?? null,
          unit: appData.unit || existingData.unit || 'U',
          side: appData.side ?? existingData.side ?? inferSide(positionX, viewType),
          quantity,
          updated_at: new Date().toISOString(),
          // Extended fields
          manufacturer: appData.manufacturer ?? existingData.manufacturer ?? null,
          lot_number: appData.lot_number ?? existingData.lot_number ?? null,
          expiry_date: appData.expiry_date ?? existingData.expiry_date ?? null,
          dilution: appData.dilution ?? existingData.dilution ?? null,
          technique: appData.technique ?? existingData.technique ?? null,
          depth: appData.depth ?? existingData.depth ?? null,
          planned_volume: appData.planned_volume ?? existingData.planned_volume ?? null,
          applied_volume: appData.applied_volume ?? existingData.applied_volume ?? null,
          application_plan: appData.application_plan ?? existingData.application_plan ?? null,
          session_number: appData.session_number ?? existingData.session_number ?? null,
          total_sessions: appData.total_sessions ?? existingData.total_sessions ?? null,
          session_interval: appData.session_interval ?? existingData.session_interval ?? null,
          protocol: appData.protocol ?? existingData.protocol ?? null,
        },
      };

      const { error } = await supabase
        .from('facial_map_applications')
        .update(payload)
        .eq('id', id);

      if (error) {
        logFacialMapError('facial_map_point_update_failed', {
          functionName: 'updateFacialMapPoint',
          payload,
          error,
          table: 'facial_map_applications',
          context: getContextSnapshot(),
        });
        throw error;
      }
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
    mutationFn: async (imgData: { 
      image_type: ImageType; 
      image_url: string; 
      image_date?: string;
      view_angle?: ViewAngle;
      notes?: string;
    }) => {
      if (!clinic?.id) throw new Error('Missing required data');

      const map = await getOrCreateFacialMap(preferredMapType);
      const mapId = map.id;

      const { data: result, error } = await supabase
        .from('facial_map_images')
        .insert({
          facial_map_id: mapId,
          image_url: imgData.image_url,
          annotations: {
            image_type: imgData.image_type,
            image_date: imgData.image_date || null,
            view_angle: imgData.view_angle || 'frontal',
            notes: imgData.notes || null,
          },
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
        .update({ notes })
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

  // Conclude session (mark map as concluded)
  const concludeSessionMutation = useMutation({
    mutationFn: async () => {
      if (!currentMapId) throw new Error('Nenhum mapa selecionado');
      
      const { data: row, error: fetchError } = await supabase
        .from('facial_maps')
        .select('data')
        .eq('id', currentMapId)
        .single();
      
      if (fetchError) throw fetchError;
      
      const existingData = (row?.data as Record<string, any>) || {};
      const { error } = await supabase
        .from('facial_maps')
        .update({
          data: {
            ...existingData,
            status: 'concluded',
            concluded_at: new Date().toISOString(),
          },
        })
        .eq('id', currentMapId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mapQueryKey });
      queryClient.invalidateQueries({ queryKey: ['facial-map-history', patientId] });
      toast.success('Sessão concluída com sucesso');
    },
    onError: (error) => {
      console.error('Error concluding session:', error);
      toast.error('Erro ao concluir sessão');
    },
  });

  // Reopen a concluded session
  const reopenSessionMutation = useMutation({
    mutationFn: async () => {
      if (!currentMapId) throw new Error('Nenhum mapa selecionado');
      
      const { data: row, error: fetchError } = await supabase
        .from('facial_maps')
        .select('data')
        .eq('id', currentMapId)
        .single();
      
      if (fetchError) throw fetchError;
      
      const existingData = (row?.data as Record<string, any>) || {};
      const { error } = await supabase
        .from('facial_maps')
        .update({
          data: {
            ...existingData,
            status: 'active',
            concluded_at: null,
          },
        })
        .eq('id', currentMapId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mapQueryKey });
      queryClient.invalidateQueries({ queryKey: ['facial-map-history', patientId] });
      toast.success('Sessão reaberta com sucesso');
    },
    onError: (error) => {
      console.error('Error reopening session:', error);
      toast.error('Erro ao reabrir sessão');
    },
  });

  // Duplicate a session as base for a new one
  const duplicateSessionMutation = useMutation({
    mutationFn: async (sourceMapId: string) => {
      ensureEditableContext();
      
      // Fetch source map's applications
      const { data: sourceApps, error: appsError } = await supabase
        .from('facial_map_applications')
        .select('*')
        .eq('facial_map_id', sourceMapId);
      
      if (appsError) throw appsError;
      
      // Create a new map for this appointment
      const newMap = await createNewFacialMap(preferredMapType);
      
      // Copy applications to new map
      if (sourceApps && sourceApps.length > 0) {
        const authUserId = await getAuthUserId();
        const newApps = sourceApps.map((app: any) => {
          const existingData = (app.data as Record<string, any>) || {};
          return {
            facial_map_id: newMap.id,
            product_name: app.product_name,
            region: app.region,
            units: app.units,
            notes: app.notes,
            data: {
              ...existingData,
              appointment_id: appointmentId || null,
              created_by: authUserId,
              updated_at: new Date().toISOString(),
            },
          };
        });
        
        const { error: insertError } = await supabase
          .from('facial_map_applications')
          .insert(newApps);
        
        if (insertError) throw insertError;
      }
      
      return newMap;
    },
    onSuccess: (newMap) => {
      queryClient.invalidateQueries({ queryKey: mapQueryKey });
      queryClient.invalidateQueries({ queryKey: ['facial-map-points', newMap.id] });
      setCurrentMapId(newMap.id);
      toast.success('Sessão duplicada como base para nova sessão');
    },
    onError: (error) => {
      console.error('Error duplicating session:', error);
      toast.error('Erro ao duplicar sessão');
    },
  });

  // Load applications for a specific map (for history viewing)
  const loadMapApplications = async (mapId: string) => {
    const { data, error } = await supabase
      .from('facial_map_applications')
      .select('*')
      .eq('facial_map_id', mapId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (data || []).map(dbRowToApplication);
  };


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

      return (data || []).map(dbRowToFacialMap);
    },
    enabled: !!patientId && !!clinic?.id,
  });

  // Get all applications across all maps (for history view)
  const { data: allApplications = [] } = useQuery({
    queryKey: ['facial-map-all-points', patientId],
    queryFn: async () => {
      if (!patientId || !clinic?.id) return [];

      // Get all map IDs for this patient
      const { data: maps, error: mapsError } = await supabase
        .from('facial_maps')
        .select('id')
        .eq('clinic_id', clinic.id)
        .eq('patient_id', patientId);

      if (mapsError) throw mapsError;
      if (!maps || maps.length === 0) return [];

      const mapIds = maps.map((m: any) => m.id);

      const { data, error } = await supabase
        .from('facial_map_applications')
        .select('*')
        .in('facial_map_id', mapIds)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching all applications:', error);
        throw error;
      }

      return (data || []).map(dbRowToApplication);
    },
    enabled: !!patientId && !!clinic?.id,
  });

  return {
    facialMap,
    currentMapId,
    setCurrentMapId,
    allMaps,
    createMap: createMapMutation.mutateAsync,
    getOrCreateFacialMap,
    updateMapNotes: updateMapNotesMutation.mutateAsync,
    isCreatingMap: createMapMutation.isPending,
    
    applications,
    allApplications,
    addApplication: addApplicationMutation.mutateAsync,
    updateApplication: updateApplicationMutation.mutateAsync,
    deleteApplication: deleteApplicationMutation.mutateAsync,
    isAdding: addApplicationMutation.isPending,
    isUpdating: updateApplicationMutation.isPending,
    isDeleting: deleteApplicationMutation.isPending,
    
    mapImages,
    addImage: addImageMutation.mutateAsync,
    deleteImage: deleteImageMutation.mutateAsync,
    isAddingImage: addImageMutation.isPending,
    isDeletingImage: deleteImageMutation.isPending,
    
    // Session lifecycle
    concludeSession: concludeSessionMutation.mutateAsync,
    isConcluding: concludeSessionMutation.isPending,
    reopenSession: reopenSessionMutation.mutateAsync,
    isReopening: reopenSessionMutation.isPending,
    duplicateSession: duplicateSessionMutation.mutateAsync,
    isDuplicating: duplicateSessionMutation.isPending,
    loadMapApplications,
    
    isLoading: isLoadingMap || isLoadingPoints,
    isLoadingImages,
    historyLoading,
  };
}
