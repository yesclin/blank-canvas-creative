import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useClinicData } from './useClinicData';
import { toast } from 'sonner';

export interface AppointmentStatus {
  id: string;
  clinic_id: string;
  name: string;
  description: string | null;
  color: string;
  display_order: number;
  is_system: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AppointmentStatusFormData {
  name: string;
  description?: string;
  color: string;
  display_order?: number;
  is_active?: boolean;
}

export function useAppointmentStatuses() {
  const { clinic } = useClinicData();
  const [statuses, setStatuses] = useState<AppointmentStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchStatuses = useCallback(async () => {
    if (!clinic?.id) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('appointment_statuses')
        .select('*')
        .eq('clinic_id', clinic.id)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setStatuses((data as AppointmentStatus[]) || []);
    } catch (error) {
      console.error('Error fetching appointment statuses:', error);
      toast.error('Erro ao carregar status de atendimento');
    } finally {
      setIsLoading(false);
    }
  }, [clinic?.id]);

  useEffect(() => {
    fetchStatuses();
  }, [fetchStatuses]);

  const createStatus = async (data: AppointmentStatusFormData) => {
    if (!clinic?.id) return null;

    setIsSaving(true);
    try {
      const maxOrder = statuses.length > 0 
        ? Math.max(...statuses.map(s => s.display_order)) + 1 
        : 0;

      const { data: newStatus, error } = await supabase
        .from('appointment_statuses')
        .insert({
          clinic_id: clinic.id,
          name: data.name,
          description: data.description || null,
          color: data.color,
          display_order: data.display_order ?? maxOrder,
          is_active: data.is_active ?? true,
          is_system: false,
        })
        .select()
        .single();

      if (error) throw error;
      
      toast.success('Status de atendimento criado com sucesso!');
      await fetchStatuses();
      return newStatus as AppointmentStatus;
    } catch (error) {
      console.error('Error creating appointment status:', error);
      toast.error('Erro ao criar status de atendimento');
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const updateStatus = async (id: string, data: Partial<AppointmentStatusFormData>) => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('appointment_statuses')
        .update({
          name: data.name,
          description: data.description,
          color: data.color,
          display_order: data.display_order,
          is_active: data.is_active,
        })
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Status de atendimento atualizado com sucesso!');
      await fetchStatuses();
      return true;
    } catch (error) {
      console.error('Error updating appointment status:', error);
      toast.error('Erro ao atualizar status de atendimento');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const reorderStatuses = async (reorderedStatuses: { id: string; display_order: number }[]) => {
    setIsSaving(true);
    try {
      // Update all statuses with new order
      for (const item of reorderedStatuses) {
        const { error } = await supabase
          .from('appointment_statuses')
          .update({ display_order: item.display_order })
          .eq('id', item.id);
        
        if (error) throw error;
      }
      
      toast.success('Ordem dos status atualizada com sucesso!');
      await fetchStatuses();
      return true;
    } catch (error) {
      console.error('Error reordering statuses:', error);
      toast.error('Erro ao reordenar status');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const deleteStatus = async (id: string) => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('appointment_statuses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Status de atendimento excluído com sucesso!');
      await fetchStatuses();
      return true;
    } catch (error) {
      console.error('Error deleting appointment status:', error);
      toast.error('Erro ao excluir status de atendimento');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  return {
    statuses,
    isLoading,
    isSaving,
    createStatus,
    updateStatus,
    deleteStatus,
    reorderStatuses,
    refetch: fetchStatuses,
  };
}
