/**
 * NUTRIÇÃO - Alertas Nutricionais
 * 
 * Hook para gerenciar alertas específicos da especialidade Nutrição.
 * Inclui alergias alimentares, restrições e riscos nutricionais.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useClinicData } from '@/hooks/useClinicData';
import { toast } from 'sonner';

export type TipoAlertaNutricao = 'alergia_alimentar' | 'restricao_alimentar' | 'risco_nutricional' | 'intolerancia' | 'outro';
export type SeveridadeAlerta = 'critical' | 'warning' | 'info';

export const TIPO_ALERTA_NUTRICAO_LABELS: Record<TipoAlertaNutricao, string> = {
  alergia_alimentar: 'Alergia Alimentar',
  restricao_alimentar: 'Restrição Alimentar',
  risco_nutricional: 'Risco Nutricional',
  intolerancia: 'Intolerância',
  outro: 'Outro',
};

export const SEVERIDADE_LABELS: Record<SeveridadeAlerta, string> = {
  critical: 'Crítico',
  warning: 'Atenção',
  info: 'Informativo',
};

export interface AlertaNutricional {
  id: string;
  patient_id: string;
  clinic_id: string;
  created_by?: string;
  created_by_nome?: string;
  alert_type: TipoAlertaNutricao;
  severity: SeveridadeAlerta;
  title: string;
  description?: string;
  is_active: boolean;
  created_at: string;
}

export interface AlertaNutricionalFormData {
  alert_type: TipoAlertaNutricao;
  severity: SeveridadeAlerta;
  title: string;
  description?: string;
}

// Opções pré-definidas para alergias alimentares comuns
export const ALERGIAS_ALIMENTARES_COMUNS = [
  'Amendoim',
  'Nozes',
  'Leite de vaca',
  'Ovos',
  'Trigo (glúten)',
  'Soja',
  'Peixes',
  'Frutos do mar',
  'Castanhas',
  'Gergelim',
  'Mostarda',
  'Aipo',
  'Sulfitos',
];

// Opções pré-definidas para restrições alimentares
export const RESTRICOES_COMUNS = [
  'Vegetariano',
  'Vegano',
  'Sem glúten (celíaco)',
  'Sem lactose',
  'Kosher',
  'Halal',
  'Baixo sódio',
  'Baixo carboidrato',
  'Sem açúcar',
  'Renal (restrição proteica)',
  'Fenilcetonúria',
];

/**
 * Hook para gerenciar alertas nutricionais do paciente
 */
export function useAlertasNutricaoData(patientId: string | null) {
  const { clinic } = useClinicData();
  const [alertas, setAlertas] = useState<AlertaNutricional[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Fetch current user
  useEffect(() => {
    const fetchCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    };
    fetchCurrentUser();
  }, []);

  const fetchAlertas = useCallback(async () => {
    if (!patientId || !clinic?.id) {
      setAlertas([]);
      return;
    }

    setLoading(true);

    try {
      // Busca alertas com tipos de nutrição
      const { data, error } = await supabase
        .from('clinical_alerts')
        .select('*')
        .eq('patient_id', patientId)
        .eq('clinic_id', clinic.id)
        .in('alert_type', ['alergia_alimentar', 'restricao_alimentar', 'risco_nutricional', 'intolerancia', 'allergy', 'outro'])
        .order('severity', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Buscar nomes dos criadores
      const creatorIds = [...new Set((data || []).map(a => a.created_by).filter(Boolean))];
      let creatorsMap: Record<string, string> = {};

      if (creatorIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name')
          .in('user_id', creatorIds);

        if (profiles) {
          profiles.forEach(p => {
            if (p.user_id && p.full_name) {
              creatorsMap[p.user_id] = p.full_name;
            }
          });
        }
      }

      const mapped: AlertaNutricional[] = (data || []).map(item => ({
        id: item.id,
        patient_id: item.patient_id,
        clinic_id: item.clinic_id,
        created_by: item.created_by || undefined,
        created_by_nome: item.created_by ? creatorsMap[item.created_by] : undefined,
        // Mapeia 'allergy' para 'alergia_alimentar' para compatibilidade
        alert_type: (item.alert_type === 'allergy' ? 'alergia_alimentar' : item.alert_type) as TipoAlertaNutricao,
        severity: (item.severity as SeveridadeAlerta) || 'warning',
        title: item.title,
        description: item.description || undefined,
        is_active: item.is_active ?? true,
        created_at: item.created_at,
      }));

      setAlertas(mapped);
    } catch (err) {
      console.error('Error fetching alertas nutricao:', err);
    } finally {
      setLoading(false);
    }
  }, [patientId, clinic?.id]);

  const saveAlerta = useCallback(async (formData: AlertaNutricionalFormData) => {
    if (!patientId || !clinic?.id) {
      toast.error('Dados do paciente não identificados');
      return false;
    }

    setSaving(true);

    try {
      const { error } = await supabase
        .from('clinical_alerts')
        .insert({
          patient_id: patientId,
          clinic_id: clinic.id,
          created_by: currentUserId,
          alert_type: formData.alert_type,
          severity: formData.severity,
          title: formData.title,
          description: formData.description || null,
          is_active: true,
        });

      if (error) throw error;

      toast.success('Alerta nutricional registrado!');
      await fetchAlertas();
      return true;
    } catch (err) {
      console.error('Error saving alerta:', err);
      toast.error('Erro ao salvar alerta');
      return false;
    } finally {
      setSaving(false);
    }
  }, [patientId, clinic?.id, currentUserId, fetchAlertas]);

  const deactivateAlerta = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('clinical_alerts')
        .update({
          is_active: false,
          acknowledged_at: new Date().toISOString(),
          acknowledged_by: currentUserId,
        })
        .eq('id', id);

      if (error) throw error;

      toast.success('Alerta desativado');
      await fetchAlertas();
    } catch (err) {
      console.error('Error deactivating alerta:', err);
      toast.error('Erro ao desativar alerta');
    }
  }, [currentUserId, fetchAlertas]);

  const reactivateAlerta = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('clinical_alerts')
        .update({
          is_active: true,
          acknowledged_at: null,
          acknowledged_by: null,
        })
        .eq('id', id);

      if (error) throw error;

      toast.success('Alerta reativado');
      await fetchAlertas();
    } catch (err) {
      console.error('Error reactivating alerta:', err);
      toast.error('Erro ao reativar alerta');
    }
  }, [fetchAlertas]);

  useEffect(() => {
    fetchAlertas();
  }, [fetchAlertas]);

  const activeAlertas = alertas.filter(a => a.is_active);
  const inactiveAlertas = alertas.filter(a => !a.is_active);

  return {
    alertas,
    activeAlertas,
    inactiveAlertas,
    loading,
    saving,
    saveAlerta,
    deactivateAlerta,
    reactivateAlerta,
    refetch: fetchAlertas,
  };
}
