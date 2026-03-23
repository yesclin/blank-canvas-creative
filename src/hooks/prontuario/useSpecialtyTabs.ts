import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useClinicData } from '@/hooks/useClinicData';
import { toast } from 'sonner';

export interface SpecialtyTab {
  id: string;
  clinic_id: string;
  name: string;
  key: string;
  icon: string | null;
  display_order: number;
  is_active: boolean;
  is_system: boolean;
  scope: string;
  specialty_id: string | null;
  created_at: string;
  updated_at: string;
}

const DEFAULT_SPECIALTY_TABS = [
  { name: 'Identificação', key: 'identificacao', icon: 'User', display_order: 1 },
  { name: 'Anamnese', key: 'anamnese', icon: 'FileText', display_order: 2 },
  { name: 'Evolução', key: 'evolucao', icon: 'Activity', display_order: 3 },
  { name: 'Procedimentos', key: 'procedimentos', icon: 'Stethoscope', display_order: 4 },
  { name: 'Documentos', key: 'documentos', icon: 'Paperclip', display_order: 5 },
];

export function useSpecialtyTabs(specialtyId: string | null | undefined) {
  const { clinic, isLoading: clinicLoading } = useClinicData();
  const [tabs, setTabs] = useState<SpecialtyTab[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchTabs = useCallback(async () => {
    if (!clinic?.id || !specialtyId) {
      setTabs([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('medical_record_tabs')
        .select('*')
        .eq('clinic_id', clinic.id)
        .eq('specialty_id', specialtyId)
        .eq('scope', 'specialty')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setTabs((data as SpecialtyTab[]) || []);
    } catch (err) {
      console.error('Error fetching specialty tabs:', err);
      toast.error('Erro ao carregar abas');
    } finally {
      setLoading(false);
    }
  }, [clinic?.id, specialtyId]);

  useEffect(() => {
    if (!clinicLoading) {
      fetchTabs();
    }
  }, [clinicLoading, fetchTabs]);

  const initializeDefaults = async () => {
    if (!clinic?.id || !specialtyId) return false;
    setSaving(true);
    try {
      const { count } = await supabase
        .from('medical_record_tabs')
        .select('*', { count: 'exact', head: true })
        .eq('clinic_id', clinic.id)
        .eq('specialty_id', specialtyId)
        .eq('scope', 'specialty');

      if (count && count > 0) {
        toast.info('Abas já configuradas para esta especialidade');
        return true;
      }

      const inserts = DEFAULT_SPECIALTY_TABS.map((tab) => ({
        clinic_id: clinic.id,
        name: tab.name,
        key: tab.key,
        icon: tab.icon,
        display_order: tab.display_order,
        is_active: true,
        is_system: true,
        scope: 'specialty' as const,
        specialty_id: specialtyId,
        professional_id: null,
      }));

      const { error } = await supabase.from('medical_record_tabs').insert(inserts);
      if (error) throw error;

      toast.success('Abas padrão criadas para esta especialidade');
      await fetchTabs();
      return true;
    } catch (err) {
      console.error('Error initializing specialty tabs:', err);
      toast.error('Erro ao criar abas padrão');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const createTab = async (data: { name: string; key: string; icon?: string }) => {
    if (!clinic?.id || !specialtyId) return null;
    setSaving(true);
    try {
      const maxOrder = tabs.length > 0 ? Math.max(...tabs.map(t => t.display_order)) : 0;
      const { data: created, error } = await supabase
        .from('medical_record_tabs')
        .insert({
          clinic_id: clinic.id,
          name: data.name.trim(),
          key: data.key.trim().toLowerCase().replace(/\s+/g, '_'),
          icon: data.icon || null,
          display_order: maxOrder + 1,
          is_active: true,
          is_system: false,
          scope: 'specialty',
          specialty_id: specialtyId,
          professional_id: null,
        })
        .select()
        .single();

      if (error) throw error;
      toast.success('Aba criada');
      await fetchTabs();
      return created;
    } catch (err) {
      console.error('Error creating tab:', err);
      toast.error('Erro ao criar aba');
      return null;
    } finally {
      setSaving(false);
    }
  };

  const updateTab = async (id: string, data: { name?: string; icon?: string }) => {
    setSaving(true);
    try {
      const updateData: Record<string, unknown> = {};
      if (data.name !== undefined) updateData.name = data.name.trim();
      if (data.icon !== undefined) updateData.icon = data.icon || null;

      const { error } = await supabase
        .from('medical_record_tabs')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
      toast.success('Aba atualizada');
      await fetchTabs();
      return true;
    } catch (err) {
      console.error('Error updating tab:', err);
      toast.error('Erro ao atualizar aba');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const removeTab = async (id: string) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('medical_record_tabs')
        .delete()
        .eq('id', id)
        .eq('is_system', false); // Only delete non-system tabs

      if (error) throw error;
      toast.success('Aba excluída');
      await fetchTabs();
      return true;
    } catch (err) {
      console.error('Error deleting tab:', err);
      toast.error('Erro ao excluir aba');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (id: string, active: boolean) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('medical_record_tabs')
        .update({ is_active: active })
        .eq('id', id);

      if (error) throw error;
      setTabs((prev) => prev.map((t) => (t.id === id ? { ...t, is_active: active } : t)));
      toast.success(active ? 'Aba ativada' : 'Aba desativada');
    } catch (err) {
      console.error('Error toggling tab:', err);
      toast.error('Erro ao alterar aba');
    } finally {
      setSaving(false);
    }
  };

  const reorder = async (reordered: { id: string; display_order: number }[]) => {
    setSaving(true);
    try {
      for (const item of reordered) {
        const { error } = await supabase
          .from('medical_record_tabs')
          .update({ display_order: item.display_order })
          .eq('id', item.id);
        if (error) throw error;
      }
      await fetchTabs();
      toast.success('Ordem salva');
    } catch (err) {
      console.error('Error reordering tabs:', err);
      toast.error('Erro ao reordenar');
    } finally {
      setSaving(false);
    }
  };

  return {
    tabs,
    loading: loading || clinicLoading,
    saving,
    fetchTabs,
    initializeDefaults,
    createTab,
    updateTab,
    removeTab,
    toggleActive,
    reorder,
    hasNoSpecialty: !specialtyId,
  };
}
