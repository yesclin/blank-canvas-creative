import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useClinicData } from '@/hooks/useClinicData';
import { toast } from 'sonner';

export type TabFieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'date'
  | 'select'
  | 'multiselect'
  | 'checkbox'
  | 'image_upload'
  | 'image_gallery'
  | 'document_upload'
  | 'signature'
  | 'auto_date';

export interface TabField {
  id: string;
  clinic_id: string;
  tab_id: string;
  specialty_id: string;
  label: string;
  field_type: TabFieldType;
  placeholder: string | null;
  default_value: string | null;
  options: string[] | null;
  is_required: boolean;
  field_order: number;
  visible_to_roles: string[];
  condition_field_id: string | null;
  condition_operator: string | null;
  condition_value: string | null;
  is_active: boolean;
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

export interface TabFieldInput {
  id?: string;
  label: string;
  field_type: TabFieldType;
  placeholder?: string | null;
  default_value?: string | null;
  options?: string[] | null;
  is_required: boolean;
  field_order: number;
  visible_to_roles?: string[];
  condition_field_id?: string | null;
  condition_operator?: string | null;
  condition_value?: string | null;
}

function slugifyFieldName(label: string): string {
  return label
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '') || 'campo';
}

export function useTabFields(tabId: string | null, specialtyId: string | null) {
  const { clinic, isLoading: clinicLoading } = useClinicData();
  const [fields, setFields] = useState<TabField[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchFields = useCallback(async () => {
    if (!clinic?.id || !tabId || !specialtyId) {
      setFields([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('medical_record_tab_fields')
        // Escopo de clínica/especialidade vive em medical_record_tabs (tab_id)
        .select('*')
        .eq('tab_id', tabId)
        .order('sort_order', { ascending: true });

      if (error) throw error;

      const parsed = (data || []).map((f: any) => ({
        ...f,
        field_order: f.sort_order ?? 0,
        options: f.options ? (f.options as unknown as string[]) : null,
        visible_to_roles: f.visible_to_roles || [],
      })) as TabField[];

      setFields(parsed);
    } catch (err) {
      console.error('Error fetching tab fields:', err);
      toast.error('Erro ao carregar campos');
    } finally {
      setLoading(false);
    }
  }, [clinic?.id, tabId, specialtyId]);

  useEffect(() => {
    if (!clinicLoading) fetchFields();
  }, [clinicLoading, fetchFields]);

  const createField = async (input: TabFieldInput) => {
    if (!clinic?.id || !tabId || !specialtyId) return null;
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('medical_record_tab_fields')
        .insert({
          tab_id: tabId,
          field_name: slugifyFieldName(input.label),
          label: input.label,
          field_type: input.field_type,
          placeholder: input.placeholder || null,
          options: (input.options || null) as never,
          is_required: input.is_required,
          sort_order: input.field_order,
        })
        .select()
        .single();

      if (error) throw error;
      toast.success('Campo criado');
      await fetchFields();
      return data;
    } catch (err) {
      console.error('Error creating field:', err);
      toast.error('Erro ao criar campo');
      return null;
    } finally {
      setSaving(false);
    }
  };

  const updateField = async (id: string, input: Partial<TabFieldInput>) => {
    setSaving(true);
    try {
      const updateData: Record<string, unknown> = {};
      if (input.label !== undefined) updateData.label = input.label;
      if (input.field_type !== undefined) updateData.field_type = input.field_type;
      if (input.placeholder !== undefined) updateData.placeholder = input.placeholder || null;
      if (input.options !== undefined) updateData.options = input.options || null;
      if (input.is_required !== undefined) updateData.is_required = input.is_required;
      if (input.field_order !== undefined) updateData.sort_order = input.field_order;
      if (input.label !== undefined) updateData.field_name = slugifyFieldName(input.label);

      const { error } = await supabase
        .from('medical_record_tab_fields')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
      toast.success('Campo atualizado');
      await fetchFields();
      return true;
    } catch (err) {
      console.error('Error updating field:', err);
      toast.error('Erro ao atualizar campo');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const removeField = async (id: string) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('medical_record_tab_fields')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Campo excluído');
      await fetchFields();
      return true;
    } catch (err) {
      console.error('Error deleting field:', err);
      toast.error('Erro ao excluir campo');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const reorderFields = async (reordered: { id: string; field_order: number }[]) => {
    setSaving(true);
    try {
      for (const item of reordered) {
        const { error } = await supabase
          .from('medical_record_tab_fields')
          .update({ sort_order: item.field_order })
          .eq('id', item.id);
        if (error) throw error;
      }
      await fetchFields();
      toast.success('Ordem salva');
    } catch (err) {
      console.error('Error reordering fields:', err);
      toast.error('Erro ao reordenar');
    } finally {
      setSaving(false);
    }
  };

  return {
    fields,
    loading: loading || clinicLoading,
    saving,
    fetchFields,
    createField,
    updateField,
    removeField,
    reorderFields,
  };
}
