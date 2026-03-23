import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useClinicData } from './useClinicData';
import { toast } from 'sonner';

export interface AppointmentType {
  id: string;
  clinic_id: string;
  name: string;
  description: string | null;
  color: string;
  duration_minutes: number;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface AppointmentTypeFormData {
  name: string;
  description?: string;
  color: string;
  duration_minutes: number;
  is_active?: boolean;
}

export function useAppointmentTypes() {
  const { clinic } = useClinicData();
  const [types, setTypes] = useState<AppointmentType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchTypes = useCallback(async () => {
    if (!clinic?.id) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('appointment_types')
        .select('*')
        .eq('clinic_id', clinic.id)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setTypes((data as AppointmentType[]) || []);
    } catch (error) {
      console.error('Error fetching appointment types:', error);
      toast.error('Erro ao carregar tipos de atendimento');
    } finally {
      setIsLoading(false);
    }
  }, [clinic?.id]);

  useEffect(() => {
    fetchTypes();
  }, [fetchTypes]);

  const createType = async (data: AppointmentTypeFormData) => {
    if (!clinic?.id) return null;

    setIsSaving(true);
    try {
      const maxOrder = types.length > 0 
        ? Math.max(...types.map(t => t.display_order)) + 1 
        : 0;

      const { data: newType, error } = await supabase
        .from('appointment_types')
        .insert({
          clinic_id: clinic.id,
          name: data.name,
          description: data.description || null,
          color: data.color,
          duration_minutes: data.duration_minutes,
          is_active: data.is_active ?? true,
          display_order: maxOrder,
        })
        .select()
        .single();

      if (error) throw error;
      
      toast.success('Tipo de atendimento criado com sucesso!');
      await fetchTypes();
      return newType as AppointmentType;
    } catch (error) {
      console.error('Error creating appointment type:', error);
      toast.error('Erro ao criar tipo de atendimento');
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const updateType = async (id: string, data: Partial<AppointmentTypeFormData>) => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('appointment_types')
        .update({
          name: data.name,
          description: data.description,
          color: data.color,
          duration_minutes: data.duration_minutes,
          is_active: data.is_active,
        })
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Tipo de atendimento atualizado com sucesso!');
      await fetchTypes();
      return true;
    } catch (error) {
      console.error('Error updating appointment type:', error);
      toast.error('Erro ao atualizar tipo de atendimento');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const deleteType = async (id: string) => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('appointment_types')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Tipo de atendimento excluído com sucesso!');
      await fetchTypes();
      return true;
    } catch (error) {
      console.error('Error deleting appointment type:', error);
      toast.error('Erro ao excluir tipo de atendimento');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  return {
    types,
    isLoading,
    isSaving,
    createType,
    updateType,
    deleteType,
    refetch: fetchTypes,
  };
}
