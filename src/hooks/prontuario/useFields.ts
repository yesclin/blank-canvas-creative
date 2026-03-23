import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

export type FieldType = 'text' | 'textarea' | 'number' | 'boolean' | 'select' | 'multiselect' | 'date' | 'file' | 'odontogram' | 'tooth_select';

export interface Field {
  id: string;
  template_id: string;
  label: string;
  field_type: FieldType;
  placeholder: string | null;
  options: string[] | null;
  is_required: boolean;
  field_order: number;
  created_at: string;
  updated_at: string;
}

export interface FieldInput {
  id?: string;
  label: string;
  field_type: FieldType;
  placeholder?: string;
  options?: string[] | null;
  is_required: boolean;
  field_order: number;
}

export function useFields() {
  const [fields, setFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchFields = useCallback(async (templateId: string) => {
    if (!templateId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('medical_record_fields')
        .select('*')
        .eq('template_id', templateId)
        .order('field_order', { ascending: true });

      if (error) throw error;

      const parsed = (data || []).map((f) => ({
        ...f,
        options: f.options ? (f.options as unknown as string[]) : null,
      })) as Field[];

      setFields(parsed);
    } catch (err) {
      console.error('Error fetching fields:', err);
      toast.error('Erro ao carregar campos');
    } finally {
      setLoading(false);
    }
  }, []);

  const clearFields = useCallback(() => {
    setFields([]);
  }, []);

  const saveFields = async (templateId: string, fieldsToSave: FieldInput[]): Promise<boolean> => {
    setSaving(true);
    try {
      // Get existing IDs
      const existingIds = fields.map((f) => f.id);
      const newIds = fieldsToSave.filter((f) => f.id).map((f) => f.id!);

      // Delete removed
      const toDelete = existingIds.filter((id) => !newIds.includes(id));
      if (toDelete.length > 0) {
        const { error } = await supabase.from('medical_record_fields').delete().in('id', toDelete);
        if (error) throw error;
      }

      // Update existing
      const toUpdate = fieldsToSave.filter((f) => f.id && existingIds.includes(f.id));
      for (const f of toUpdate) {
        const { error } = await supabase
          .from('medical_record_fields')
          .update({
            label: f.label,
            field_type: f.field_type,
            placeholder: f.placeholder || null,
            options: f.options ? (f.options as unknown as Json) : null,
            is_required: f.is_required,
            field_order: f.field_order,
          })
          .eq('id', f.id!);
        if (error) throw error;
      }

      // Insert new
      const toInsert = fieldsToSave.filter((f) => !f.id || !existingIds.includes(f.id));
      if (toInsert.length > 0) {
        const inserts = toInsert.map((f) => ({
          template_id: templateId,
          label: f.label,
          field_type: f.field_type,
          placeholder: f.placeholder || null,
          options: f.options ? (f.options as unknown as Json) : null,
          is_required: f.is_required,
          field_order: f.field_order,
        }));

        const { error } = await supabase.from('medical_record_fields').insert(inserts);
        if (error) throw error;
      }

      await fetchFields(templateId);
      toast.success('Campos salvos');
      return true;
    } catch (err) {
      console.error('Error saving fields:', err);
      toast.error('Erro ao salvar campos');
      return false;
    } finally {
      setSaving(false);
    }
  };

  return {
    fields,
    loading,
    saving,
    fetchFields,
    clearFields,
    saveFields,
  };
}
