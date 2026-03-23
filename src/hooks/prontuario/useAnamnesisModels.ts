import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useClinicData } from '@/hooks/useClinicData';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

export interface AnamnesisModelVersion {
  id: string;
  template_id: string;
  version_number: number;
  structure: Json;
  created_by: string | null;
  created_at: string;
}

export interface AnamnesisModel {
  id: string;
  clinic_id: string | null;
  name: string;
  description: string | null;
  template_type: string;
  specialty_id: string | null;
  procedure_id: string | null;
  icon: string | null;
  campos: Json;
  is_active: boolean;
  is_default: boolean;
  is_system: boolean;
  usage_count: number;
  current_version_id: string | null;
  current_version_number: number | null;
  created_at: string;
  updated_at: string;
  // joined
  procedure_name?: string;
}

export function useAnamnesisModels(specialtyId: string | null | undefined) {
  const { clinic, isLoading: clinicLoading } = useClinicData();
  const [models, setModels] = useState<AnamnesisModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchModels = useCallback(async () => {
    if (!clinic?.id || !specialtyId) {
      setModels([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('anamnesis_templates')
        .select('*, procedures(name)')
        .eq('specialty_id', specialtyId)
        .eq('archived', false)
        .or(`clinic_id.eq.${clinic.id},clinic_id.is.null`)
        .order('is_default', { ascending: false })
        .order('name', { ascending: true });

      if (error) throw error;

      // Fetch current version numbers
      const versionIds = (data || [])
        .map((d: any) => d.current_version_id)
        .filter(Boolean);

      let versionsMap: Record<string, number> = {};
      if (versionIds.length > 0) {
        const { data: versions } = await supabase
          .from('anamnesis_template_versions')
          .select('id, version_number')
          .in('id', versionIds);
        if (versions) {
          versionsMap = versions.reduce((acc, v) => {
            acc[v.id] = v.version_number;
            return acc;
          }, {} as Record<string, number>);
        }
      }

      const parsed: AnamnesisModel[] = (data || []).map((d: any) => ({
        ...d,
        procedure_name: d.procedures?.name || null,
        current_version_number: d.current_version_id
          ? versionsMap[d.current_version_id] ?? null
          : null,
      }));

      setModels(parsed);
    } catch (err) {
      console.error('Error fetching anamnesis models:', err);
      toast.error('Erro ao carregar modelos de anamnese');
    } finally {
      setLoading(false);
    }
  }, [clinic?.id, specialtyId]);

  useEffect(() => {
    if (!clinicLoading) fetchModels();
  }, [clinicLoading, fetchModels]);

  // Helper: create a new version for a template
  const createVersion = async (templateId: string, structure: Json): Promise<string | null> => {
    const { data: user } = await supabase.auth.getUser();

    // Get current max version
    const { data: versions } = await supabase
      .from('anamnesis_template_versions')
      .select('version_number')
      .eq('template_id', templateId)
      .order('version_number', { ascending: false })
      .limit(1);

    const nextVersion = (versions?.[0]?.version_number || 0) + 1;

    const { data: ver, error } = await supabase
      .from('anamnesis_template_versions')
      .insert({
        template_id: templateId,
        version_number: nextVersion,
        structure: structure,
        created_by: user?.user?.id || null,
      })
      .select()
      .single();

    if (error) throw error;

    // Update template pointer — use select().single() to catch RLS/silent failures
    const { error: ptrError } = await supabase
      .from('anamnesis_templates')
      .update({ current_version_id: ver.id } as any)
      .eq('id', templateId)
      .select()
      .single();
    if (ptrError) {
      console.error('Error updating current_version_id:', ptrError);
    }

    return ver.id;
  };

  const createModel = async (input: {
    name: string;
    description?: string;
    template_type?: string;
    procedure_id?: string | null;
    icon?: string;
  }) => {
    if (!clinic?.id || !specialtyId) return null;
    setSaving(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('anamnesis_templates')
        .insert({
          clinic_id: clinic.id,
          specialty_id: specialtyId,
          name: input.name.trim(),
          description: input.description?.trim() || null,
          template_type: input.template_type || 'custom',
          procedure_id: input.procedure_id || null,
          icon: input.icon || 'ClipboardList',
          campos: [],
          is_active: true,
          is_default: false,
          is_system: false,
          created_by: user?.user?.id || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Create version 1 with empty structure
      await createVersion(data.id, []);

      toast.success('Modelo criado');
      await fetchModels();
      return data;
    } catch (err) {
      console.error('Error creating model:', err);
      toast.error('Erro ao criar modelo');
      return null;
    } finally {
      setSaving(false);
    }
  };

  const updateModel = async (id: string, input: {
    name?: string;
    description?: string;
    procedure_id?: string | null;
    icon?: string;
    campos?: Json;
  }) => {
    setSaving(true);
    try {
      const updateData: Record<string, unknown> = {};
      if (input.name !== undefined) updateData.name = input.name.trim();
      if (input.description !== undefined) updateData.description = input.description?.trim() || null;
      if (input.procedure_id !== undefined) updateData.procedure_id = input.procedure_id || null;
      if (input.icon !== undefined) updateData.icon = input.icon;
      if (input.campos !== undefined) updateData.campos = input.campos;

      if (Object.keys(updateData).length > 0) {
        const { error } = await supabase
          .from('anamnesis_templates')
          .update(updateData)
          .eq('id', id);
        if (error) throw error;
      }

      // If campos/structure changed, create a new version automatically
      if (input.campos !== undefined) {
        await createVersion(id, input.campos);
      }

      toast.success('Modelo atualizado');
      await fetchModels();
      return true;
    } catch (err) {
      console.error('Error updating model:', err);
      toast.error('Erro ao atualizar');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const duplicateModel = async (id: string) => {
    if (!clinic?.id) return null;
    setSaving(true);
    try {
      const original = models.find(m => m.id === id);
      if (!original) throw new Error('Model not found');

      const { data: user } = await supabase.auth.getUser();

      // Get current version structure if exists
      let structure: Json = original.campos || [];
      if (original.current_version_id) {
        const { data: ver } = await supabase
          .from('anamnesis_template_versions')
          .select('structure')
          .eq('id', original.current_version_id)
          .single();
        if (ver?.structure) structure = ver.structure;
      }

      const { data, error } = await supabase
        .from('anamnesis_templates')
        .insert({
          clinic_id: clinic.id,
          specialty_id: original.specialty_id,
          name: `${original.name} (Cópia)`,
          description: original.description,
          template_type: original.template_type,
          procedure_id: original.procedure_id,
          icon: original.icon,
          campos: original.campos,
          is_active: true,
          is_default: false,
          is_system: false,
          created_by: user?.user?.id || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Create version 1 for clone with original structure
      await createVersion(data.id, structure);

      toast.success('Modelo duplicado');
      await fetchModels();
      return data;
    } catch (err) {
      console.error('Error duplicating model:', err);
      toast.error('Erro ao duplicar');
      return null;
    } finally {
      setSaving(false);
    }
  };

  // Fetch version history for a specific template
  const fetchVersionHistory = async (templateId: string): Promise<AnamnesisModelVersion[]> => {
    const { data, error } = await supabase
      .from('anamnesis_template_versions')
      .select('*')
      .eq('template_id', templateId)
      .order('version_number', { ascending: false });

    if (error) {
      console.error('Error fetching version history:', error);
      toast.error('Erro ao carregar histórico de versões');
      return [];
    }

    return (data || []).map(v => ({
      id: v.id,
      template_id: v.template_id,
      version_number: v.version_number,
      structure: v.structure,
      created_by: v.created_by,
      created_at: v.created_at,
    }));
  };

  const setAsDefault = async (id: string) => {
    if (!clinic?.id || !specialtyId) return false;
    setSaving(true);
    try {
      await supabase
        .from('anamnesis_templates')
        .update({ is_default: false })
        .eq('specialty_id', specialtyId)
        .or(`clinic_id.eq.${clinic.id},clinic_id.is.null`);

      const { error } = await supabase
        .from('anamnesis_templates')
        .update({ is_default: true })
        .eq('id', id);

      if (error) throw error;
      toast.success('Modelo definido como padrão');
      await fetchModels();
      return true;
    } catch (err) {
      console.error('Error setting default:', err);
      toast.error('Erro ao definir padrão');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (id: string, active: boolean) => {
    if (!active) {
      const activeModels = models.filter(m => m.is_active && m.id !== id);
      if (activeModels.length === 0) {
        toast.error('Deve haver pelo menos 1 modelo ativo por especialidade');
        return false;
      }
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from('anamnesis_templates')
        .update({ is_active: active })
        .eq('id', id);

      if (error) throw error;
      toast.success(active ? 'Modelo ativado' : 'Modelo desativado');
      await fetchModels();
      return true;
    } catch (err) {
      console.error('Error toggling model:', err);
      toast.error('Erro ao alterar modelo');
      return false;
    } finally {
      setSaving(false);
    }
  };

  return {
    models,
    loading: loading || clinicLoading,
    saving,
    fetchModels,
    createModel,
    updateModel,
    duplicateModel,
    setAsDefault,
    toggleActive,
    fetchVersionHistory,
  };
}
