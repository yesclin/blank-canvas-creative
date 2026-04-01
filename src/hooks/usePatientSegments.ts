import { useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useClinicData } from '@/hooks/useClinicData';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export interface SegmentFilters {
  type?: string; // 'tomorrow' | 'no_return_30' | 'no_return_60' | 'no_return_90' | 'birthday' | 'missed' | 'custom'
  specialty_id?: string;
  professional_id?: string;
  insurance_id?: string;
  period_start?: string;
  period_end?: string;
  crm_status?: string;
  tags?: string[];
}

export interface SavedSegment {
  id: string;
  clinic_id: string;
  name: string;
  description: string | null;
  filters: SegmentFilters;
  is_system: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export function usePatientSegments() {
  const { clinic } = useClinicData();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);

  const query = useQuery({
    queryKey: ['saved-segments', clinic?.id],
    enabled: !!clinic?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('saved_segments')
        .select('*')
        .eq('clinic_id', clinic!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map((s: any) => ({
        ...s,
        filters: (s.filters || {}) as SegmentFilters,
      })) as SavedSegment[];
    },
  });

  const createSegment = useCallback(async (name: string, description: string, filters: SegmentFilters) => {
    if (!clinic?.id) return;
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('saved_segments')
        .insert({
          clinic_id: clinic.id,
          name,
          description: description || null,
          filters: filters as any,
          created_by: user?.id || null,
        });

      if (error) throw error;
      toast.success('Segmentação salva');
      queryClient.invalidateQueries({ queryKey: ['saved-segments'] });
    } catch (err: any) {
      toast.error('Erro: ' + (err.message || ''));
    } finally {
      setSaving(false);
    }
  }, [clinic?.id, queryClient]);

  const updateSegment = useCallback(async (id: string, name: string, description: string, filters: SegmentFilters) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('saved_segments')
        .update({
          name,
          description: description || null,
          filters: filters as any,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
      toast.success('Segmentação atualizada');
      queryClient.invalidateQueries({ queryKey: ['saved-segments'] });
    } catch (err: any) {
      toast.error('Erro: ' + (err.message || ''));
    } finally {
      setSaving(false);
    }
  }, [queryClient]);

  const deleteSegment = useCallback(async (id: string) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('saved_segments')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Segmentação excluída');
      queryClient.invalidateQueries({ queryKey: ['saved-segments'] });
    } catch (err: any) {
      toast.error('Erro: ' + (err.message || ''));
    } finally {
      setSaving(false);
    }
  }, [queryClient]);

  return {
    segments: query.data || [],
    loading: query.isLoading,
    saving,
    createSegment,
    updateSegment,
    deleteSegment,
    refetch: query.refetch,
  };
}
