import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useClinicData } from '@/hooks/useClinicData';
import { toast } from 'sonner';
import type { MessageTemplate, TemplateCategory, CommunicationChannel } from '@/types/comunicacao';

export interface TemplateFormData {
  name: string;
  category: TemplateCategory;
  channel: CommunicationChannel;
  subject?: string;
  content: string;
  is_active: boolean;
}

export function useMessageTemplates() {
  const { clinic } = useClinicData();
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchTemplates = useCallback(async () => {
    if (!clinic?.id) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('message_templates')
        .select('*')
        .or(`clinic_id.eq.${clinic.id},is_system.eq.true`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates((data || []) as unknown as MessageTemplate[]);
    } catch (err) {
      console.error('Error fetching templates:', err);
      toast.error('Erro ao carregar templates');
    } finally {
      setLoading(false);
    }
  }, [clinic?.id]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const createTemplate = async (formData: TemplateFormData) => {
    if (!clinic?.id) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('message_templates')
        .insert({
          clinic_id: clinic.id,
          name: formData.name,
          category: formData.category,
          channel: formData.channel,
          subject: formData.subject || null,
          content: formData.content,
          is_active: formData.is_active,
          is_system: false,
        });
      if (error) throw error;
      toast.success('Template criado com sucesso');
      await fetchTemplates();
    } catch (err: any) {
      console.error('Error creating template:', err);
      toast.error('Erro ao criar template: ' + (err.message || ''));
    } finally {
      setSaving(false);
    }
  };

  const updateTemplate = async (id: string, formData: Partial<TemplateFormData>) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('message_templates')
        .update({
          ...formData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
      if (error) throw error;
      toast.success('Template atualizado com sucesso');
      await fetchTemplates();
    } catch (err: any) {
      console.error('Error updating template:', err);
      toast.error('Erro ao atualizar template: ' + (err.message || ''));
    } finally {
      setSaving(false);
    }
  };

  const deleteTemplate = async (id: string) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('message_templates')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast.success('Template excluído com sucesso');
      await fetchTemplates();
    } catch (err: any) {
      console.error('Error deleting template:', err);
      toast.error('Erro ao excluir template: ' + (err.message || ''));
    } finally {
      setSaving(false);
    }
  };

  const duplicateTemplate = async (template: MessageTemplate) => {
    if (!clinic?.id) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('message_templates')
        .insert({
          clinic_id: clinic.id,
          name: `${template.name} (Cópia)`,
          category: template.category,
          channel: template.channel,
          subject: template.subject || null,
          content: template.content,
          is_active: false,
          is_system: false,
        });
      if (error) throw error;
      toast.success('Template duplicado com sucesso');
      await fetchTemplates();
    } catch (err: any) {
      console.error('Error duplicating template:', err);
      toast.error('Erro ao duplicar template: ' + (err.message || ''));
    } finally {
      setSaving(false);
    }
  };

  return {
    templates,
    loading,
    saving,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate,
    refetch: fetchTemplates,
  };
}
