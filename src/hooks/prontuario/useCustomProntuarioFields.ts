import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useClinicData } from '@/hooks/useClinicData';
import { toast } from 'sonner';

export type CustomFieldType = 'text' | 'textarea' | 'number' | 'date' | 'select' | 'checkbox' | 'multiselect';

export interface CustomProntuarioField {
  id: string;
  clinic_id: string;
  name: string;
  field_type: CustomFieldType;
  description: string | null;
  placeholder: string | null;
  options: string[] | null;
  is_required: boolean;
  is_active: boolean;
  display_order: number;
  all_appointments: boolean;
  specialty_id: string | null;
  procedure_id: string | null;
  specialty_name?: string;
  procedure_name?: string;
  created_at: string;
  updated_at: string;
}

export interface CustomFieldInput {
  name: string;
  field_type: CustomFieldType;
  description?: string;
  placeholder?: string;
  options?: string[];
  is_required?: boolean;
  is_active?: boolean;
  display_order?: number;
  all_appointments?: boolean;
  specialty_id?: string | null;
  procedure_id?: string | null;
}

export function useCustomProntuarioFields() {
  const { clinic, isLoading: clinicLoading } = useClinicData();
  const [fields, setFields] = useState<CustomProntuarioField[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchFields = useCallback(async () => {
    if (!clinic?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('custom_prontuario_fields')
        .select(`
          *,
          specialties:specialty_id(name),
          procedures:procedure_id(name)
        `)
        .eq('clinic_id', clinic.id)
        .order('display_order', { ascending: true });

      if (error) throw error;

      const formattedFields: CustomProntuarioField[] = (data || []).map((field: any) => ({
        ...field,
        options: field.options as string[] | null,
        specialty_name: field.specialties?.name || null,
        procedure_name: field.procedures?.name || null,
      }));

      setFields(formattedFields);
    } catch (err) {
      console.error('Error fetching custom fields:', err);
      toast.error('Erro ao carregar campos personalizados');
    } finally {
      setLoading(false);
    }
  }, [clinic?.id]);

  useEffect(() => {
    if (!clinicLoading && clinic?.id) {
      fetchFields();
    }
  }, [clinicLoading, clinic?.id, fetchFields]);

  const create = async (input: CustomFieldInput): Promise<string | null> => {
    if (!clinic?.id) return null;
    setSaving(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('custom_prontuario_fields')
        .insert({
          clinic_id: clinic.id,
          name: input.name,
          field_type: input.field_type,
          description: input.description || null,
          placeholder: input.placeholder || null,
          options: input.options || null,
          is_required: input.is_required || false,
          is_active: input.is_active !== false,
          display_order: input.display_order || 0,
          all_appointments: input.all_appointments || false,
          specialty_id: input.specialty_id || null,
          procedure_id: input.procedure_id || null,
          created_by: userData.user?.id || null,
        })
        .select()
        .single();

      if (error) throw error;
      toast.success('Campo personalizado criado');
      await fetchFields();
      return data.id;
    } catch (err) {
      console.error('Error creating custom field:', err);
      toast.error('Erro ao criar campo personalizado');
      return null;
    } finally {
      setSaving(false);
    }
  };

  const update = async (id: string, input: Partial<CustomFieldInput>): Promise<boolean> => {
    setSaving(true);
    try {
      const updateData: Record<string, any> = {};
      
      if (input.name !== undefined) updateData.name = input.name;
      if (input.field_type !== undefined) updateData.field_type = input.field_type;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.placeholder !== undefined) updateData.placeholder = input.placeholder;
      if (input.options !== undefined) updateData.options = input.options;
      if (input.is_required !== undefined) updateData.is_required = input.is_required;
      if (input.is_active !== undefined) updateData.is_active = input.is_active;
      if (input.display_order !== undefined) updateData.display_order = input.display_order;
      if (input.all_appointments !== undefined) updateData.all_appointments = input.all_appointments;
      if (input.specialty_id !== undefined) updateData.specialty_id = input.specialty_id;
      if (input.procedure_id !== undefined) updateData.procedure_id = input.procedure_id;

      const { error } = await supabase
        .from('custom_prontuario_fields')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
      toast.success('Campo atualizado');
      await fetchFields();
      return true;
    } catch (err) {
      console.error('Error updating custom field:', err);
      toast.error('Erro ao atualizar campo');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string): Promise<boolean> => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('custom_prontuario_fields')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Campo excluído');
      await fetchFields();
      return true;
    } catch (err) {
      console.error('Error deleting custom field:', err);
      toast.error('Erro ao excluir campo');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (id: string, active: boolean): Promise<boolean> => {
    return update(id, { is_active: active });
  };

  const reorder = async (orderedIds: string[]): Promise<boolean> => {
    setSaving(true);
    try {
      const updates = orderedIds.map((id, index) => ({
        id,
        display_order: index,
      }));

      for (const { id, display_order } of updates) {
        await supabase
          .from('custom_prontuario_fields')
          .update({ display_order })
          .eq('id', id);
      }

      await fetchFields();
      return true;
    } catch (err) {
      console.error('Error reordering fields:', err);
      toast.error('Erro ao reordenar campos');
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Get fields applicable to a specific context
  const getFieldsForContext = useCallback((
    specialtyId?: string | null,
    procedureId?: string | null
  ): CustomProntuarioField[] => {
    return fields.filter(field => {
      if (!field.is_active) return false;
      if (field.all_appointments) return true;
      if (specialtyId && field.specialty_id === specialtyId) return true;
      if (procedureId && field.procedure_id === procedureId) return true;
      return false;
    });
  }, [fields]);

  return {
    fields,
    loading: loading || clinicLoading,
    saving,
    fetchFields,
    create,
    update,
    remove,
    toggleActive,
    reorder,
    getFieldsForContext,
  };
}
