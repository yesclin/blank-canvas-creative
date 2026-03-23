/**
 * ESTÉTICA - Hook de Alertas Clínicos
 * 
 * Gerencia alertas específicos para estética:
 * - Alergias a produtos/substâncias
 * - Riscos específicos (diabetes, coagulação, etc.)
 * - Histórico de intercorrências
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useClinicData } from '@/hooks/useClinicData';
import { toast } from 'sonner';
import type { AlertSeverity, AlertType } from '@/types/prontuario';

export interface AestheticAlert {
  id: string;
  clinic_id: string;
  patient_id: string;
  created_by: string | null;
  alert_type: AlertType;
  severity: AlertSeverity;
  title: string;
  description: string | null;
  is_active: boolean;
  expires_at: string | null;
  acknowledged_at: string | null;
  acknowledged_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AlertInput {
  alert_type: AlertType;
  severity: AlertSeverity;
  title: string;
  description?: string;
  expires_at?: string;
}

// Tipos de alerta específicos para estética
export const AESTHETIC_ALERT_TYPES: { value: AlertType; label: string; description: string }[] = [
  { value: 'allergy', label: 'Alergia', description: 'Alergia a produtos, anestésicos ou substâncias' },
  { value: 'contraindication', label: 'Contraindicação', description: 'Condição que contraindica procedimentos' },
  { value: 'medication', label: 'Medicamento', description: 'Uso de medicamento que requer atenção' },
  { value: 'disease', label: 'Condição Clínica', description: 'Doença ou condição de saúde relevante' },
  { value: 'other', label: 'Outro', description: 'Outros alertas importantes' },
];

// Alertas comuns pré-definidos para estética
export const COMMON_AESTHETIC_ALERTS = {
  allergies: [
    'Lidocaína',
    'Ácido Hialurônico',
    'Toxina Botulínica',
    'Látex',
    'PLLA (Sculptra)',
    'Hidroxiapatita de Cálcio',
    'Procaína',
    'Dipirona',
  ],
  contraindications: [
    'Gestante',
    'Lactante',
    'Herpes Ativa',
    'Infecção Local',
    'Doença Autoimune Ativa',
    'Uso de Anticoagulante',
    'Quelóide/Cicatriz Hipertrófica',
    'Expectativa Irrealista',
  ],
  risks: [
    'Diabetes',
    'Hipertensão',
    'Distúrbio de Coagulação',
    'Tendência a Equimose',
    'Histórico de Edema Prolongado',
    'Uso de AAS/Anticoagulante',
    'Imunossupressão',
    'Hipersensibilidade Cutânea',
  ],
};

export function useAestheticAlerts(patientId: string | null) {
  const { clinic } = useClinicData();
  const queryClient = useQueryClient();

  const queryKey = ['aesthetic-alerts', patientId];

  // Fetch alerts
  const { data: alerts = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!patientId || !clinic?.id) return [];

      const { data, error } = await supabase
        .from('clinical_alerts')
        .select('*')
        .eq('clinic_id', clinic.id)
        .eq('patient_id', patientId)
        .order('severity', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching alerts:', error);
        throw error;
      }

      return data as AestheticAlert[];
    },
    enabled: !!patientId && !!clinic?.id,
  });

  // Create alert
  const createMutation = useMutation({
    mutationFn: async (input: AlertInput) => {
      if (!patientId || !clinic?.id) throw new Error('Missing required data');

      const { data: userData } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('clinical_alerts')
        .insert({
          clinic_id: clinic.id,
          patient_id: patientId,
          created_by: userData.user?.id,
          alert_type: input.alert_type,
          severity: input.severity,
          title: input.title,
          description: input.description || null,
          expires_at: input.expires_at || null,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Alerta adicionado com sucesso');
    },
    onError: (error) => {
      console.error('Error creating alert:', error);
      toast.error('Erro ao adicionar alerta');
    },
  });

  // Update alert
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...input }: Partial<AlertInput> & { id: string }) => {
      const { data, error } = await supabase
        .from('clinical_alerts')
        .update({
          ...input,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Alerta atualizado');
    },
    onError: (error) => {
      console.error('Error updating alert:', error);
      toast.error('Erro ao atualizar alerta');
    },
  });

  // Dismiss/deactivate alert
  const dismissMutation = useMutation({
    mutationFn: async (alertId: string) => {
      const { data: userData } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('clinical_alerts')
        .update({
          is_active: false,
          acknowledged_at: new Date().toISOString(),
          acknowledged_by: userData.user?.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', alertId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Alerta desativado');
    },
    onError: (error) => {
      console.error('Error dismissing alert:', error);
      toast.error('Erro ao desativar alerta');
    },
  });

  // Reactivate alert
  const reactivateMutation = useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase
        .from('clinical_alerts')
        .update({
          is_active: true,
          acknowledged_at: null,
          acknowledged_by: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', alertId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Alerta reativado');
    },
    onError: (error) => {
      console.error('Error reactivating alert:', error);
      toast.error('Erro ao reativar alerta');
    },
  });

  // Delete alert
  const deleteMutation = useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase
        .from('clinical_alerts')
        .delete()
        .eq('id', alertId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Alerta removido');
    },
    onError: (error) => {
      console.error('Error deleting alert:', error);
      toast.error('Erro ao remover alerta');
    },
  });

  // Computed values
  const activeAlerts = alerts.filter(a => a.is_active);
  const inactiveAlerts = alerts.filter(a => !a.is_active);
  const criticalAlerts = activeAlerts.filter(a => a.severity === 'critical');
  const warningAlerts = activeAlerts.filter(a => a.severity === 'warning');
  const infoAlerts = activeAlerts.filter(a => a.severity === 'info');

  // Get alerts by type
  const getAlertsByType = (type: AlertType) => alerts.filter(a => a.alert_type === type);
  const getActiveAlertsByType = (type: AlertType) => activeAlerts.filter(a => a.alert_type === type);

  // Check if has specific alert
  const hasAlertForTitle = (title: string) => 
    activeAlerts.some(a => a.title.toLowerCase() === title.toLowerCase());

  return {
    alerts,
    activeAlerts,
    inactiveAlerts,
    criticalAlerts,
    warningAlerts,
    infoAlerts,
    isLoading,
    getAlertsByType,
    getActiveAlertsByType,
    hasAlertForTitle,
    createAlert: createMutation.mutateAsync,
    updateAlert: updateMutation.mutateAsync,
    dismissAlert: dismissMutation.mutateAsync,
    reactivateAlert: reactivateMutation.mutateAsync,
    deleteAlert: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDismissing: dismissMutation.isPending,
  };
}
