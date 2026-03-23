/**
 * Hook para gerenciamento de modelos de anamnese configuráveis
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useClinicData } from '@/hooks/useClinicData';
import { toast } from 'sonner';
import type { CampoAnamnese } from '@/hooks/prontuario/estetica/anamneseTemplates';
import type { Json } from '@/integrations/supabase/types';

export interface AnamnesisTemplate {
  id: string;
  clinic_id: string;
  name: string;
  description: string | null;
  template_type: string;
  specialty: string;
  icon: string;
  campos: CampoAnamnese[];
  is_active: boolean;
  usage_count: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateAnamnesisTemplateInput {
  name: string;
  description?: string;
  template_type: string;
  specialty?: string;
  icon?: string;
  campos: CampoAnamnese[];
  is_active?: boolean;
}

export interface UpdateAnamnesisTemplateInput {
  id: string;
  name?: string;
  description?: string;
  template_type?: string;
  specialty?: string;
  icon?: string;
  campos?: CampoAnamnese[];
  is_active?: boolean;
}

// Helper to convert CampoAnamnese[] to Json
function camposToJson(campos: CampoAnamnese[]): Json {
  return campos as unknown as Json;
}

// Helper to convert Json to CampoAnamnese[]
function jsonToCampos(json: Json): CampoAnamnese[] {
  if (!json || !Array.isArray(json)) return [];
  return json as unknown as CampoAnamnese[];
}

export function useAnamnesisTemplates(activeOnly = false) {
  const { clinic } = useClinicData();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['anamnesis-templates', clinic?.id, activeOnly],
    queryFn: async () => {
      if (!clinic?.id) return [];
      
      let queryBuilder = supabase
        .from('anamnesis_templates')
        .select('*')
        .eq('clinic_id', clinic.id)
        .order('name');
      
      if (activeOnly) {
        queryBuilder = queryBuilder.eq('is_active', true);
      }
      
      const { data, error } = await queryBuilder;
      
      if (error) throw error;
      
      // Convert campos from Json to CampoAnamnese[]
      return (data || []).map(item => ({
        ...item,
        campos: jsonToCampos(item.campos),
      })) as AnamnesisTemplate[];
    },
    enabled: !!clinic?.id,
  });

  const createMutation = useMutation({
    mutationFn: async (input: CreateAnamnesisTemplateInput) => {
      if (!clinic?.id) throw new Error('Clínica não selecionada');
      
      const { data: userData } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('anamnesis_templates')
        .insert({
          clinic_id: clinic.id,
          name: input.name,
          description: input.description || null,
          template_type: input.template_type,
          specialty: input.specialty || 'estetica',
          icon: input.icon || 'ClipboardList',
          campos: camposToJson(input.campos),
          is_active: input.is_active ?? true,
          created_by: userData.user?.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['anamnesis-templates'] });
      toast.success('Modelo de anamnese criado com sucesso');
    },
    onError: (error) => {
      console.error('Erro ao criar modelo:', error);
      toast.error('Erro ao criar modelo de anamnese');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (input: UpdateAnamnesisTemplateInput) => {
      const { id, campos, ...rest } = input;
      
      const updateData: Record<string, unknown> = { ...rest };
      if (campos) {
        updateData.campos = camposToJson(campos);
      }
      
      const { data, error } = await supabase
        .from('anamnesis_templates')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['anamnesis-templates'] });
      toast.success('Modelo de anamnese atualizado');
    },
    onError: (error) => {
      console.error('Erro ao atualizar modelo:', error);
      toast.error('Erro ao atualizar modelo de anamnese');
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { data, error } = await supabase
        .from('anamnesis_templates')
        .update({ is_active })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['anamnesis-templates'] });
      toast.success(data.is_active ? 'Modelo ativado' : 'Modelo desativado');
    },
    onError: (error) => {
      console.error('Erro ao alterar status:', error);
      toast.error('Erro ao alterar status do modelo');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('anamnesis_templates')
        .delete()
        .eq('id', id);
      
      if (error) {
        if (error.message.includes('usage_count')) {
          throw new Error('Não é possível excluir um modelo que já foi utilizado');
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['anamnesis-templates'] });
      toast.success('Modelo excluído com sucesso');
    },
    onError: (error: Error) => {
      console.error('Erro ao excluir modelo:', error);
      toast.error(error.message || 'Erro ao excluir modelo de anamnese');
    },
  });

  return {
    templates: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    createTemplate: createMutation.mutateAsync,
    updateTemplate: updateMutation.mutateAsync,
    toggleActive: toggleActiveMutation.mutateAsync,
    deleteTemplate: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
