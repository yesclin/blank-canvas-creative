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

  /**
   * Invalida TODAS as queries relacionadas a alertas do paciente para garantir
   * que o card "Alertas Clínicos" da Visão Geral, a aba dedicada, os badges
   * superiores e os contadores fiquem 100% sincronizados após qualquer mutação.
   *
   * - 'aesthetic-alerts' (prefixo) → cobre ['aesthetic-alerts', patientId] e
   *   ['aesthetic-alerts', patientId, 'active-only'] usados pela Visão Geral.
   * - 'estetica-summary' → recalcula o resumo agregado.
   */
  const invalidateAllAlertCaches = () => {
    queryClient.invalidateQueries({
      predicate: (q) => {
        const k = q.queryKey;
        return (
          (Array.isArray(k) && k[0] === 'aesthetic-alerts' && k[1] === patientId) ||
          (Array.isArray(k) && k[0] === 'estetica-summary' && k[1] === patientId)
        );
      },
    });
  };

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

  // Allowed enum values defensively (DB column is TEXT, but FE must stay consistent)
  const ALLOWED_TYPES: AlertType[] = ['allergy', 'medication', 'disease', 'exam', 'return', 'contraindication', 'other'];
  const ALLOWED_SEVERITIES: AlertSeverity[] = ['critical', 'warning', 'info'];

  // Create alert
  const createMutation = useMutation({
    mutationFn: async (input: AlertInput) => {
      // Pre-flight validations with explicit messages
      if (!patientId) throw new Error('Paciente não identificado.');
      if (!clinic?.id) throw new Error('Clínica não identificada.');
      const title = input.title?.trim();
      if (!title) throw new Error('Informe o título do alerta.');

      const alert_type = ALLOWED_TYPES.includes(input.alert_type) ? input.alert_type : 'other';
      const severity = ALLOWED_SEVERITIES.includes(input.severity) ? input.severity : 'info';

      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user?.id) throw new Error('Usuário não autenticado.');

      // Insert ONLY columns that exist in clinical_alerts:
      // id, clinic_id, patient_id, alert_type, title, description, severity,
      // is_active, created_by, created_at, updated_at, appointment_id
      const payload = {
        clinic_id: clinic.id,
        patient_id: patientId,
        created_by: userData.user.id,
        alert_type,
        severity,
        title,
        description: input.description?.trim() ? input.description.trim() : null,
        is_active: true,
      };

      const { data, error } = await supabase
        .from('clinical_alerts')
        .insert(payload)
        .select()
        .single();

      if (error) {
        // Surface the full Supabase error object for technical debugging
        console.error('[clinical_alerts.insert] Supabase error:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          payload,
        });
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      invalidateAllAlertCaches();
      toast.success('Alerta adicionado com sucesso');
    },
    onError: (error: any) => {
      // User-friendly message; technical details already in console
      const friendly =
        error?.message && typeof error.message === 'string' && !error.message.startsWith('column ') && !error.code
          ? error.message
          : 'Erro ao adicionar alerta. Verifique o console para detalhes.';
      toast.error(friendly);
    },
  });

  // Update alert (only persists known columns)
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...input }: Partial<AlertInput> & { id: string }) => {
      const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (input.alert_type && ALLOWED_TYPES.includes(input.alert_type)) updates.alert_type = input.alert_type;
      if (input.severity && ALLOWED_SEVERITIES.includes(input.severity)) updates.severity = input.severity;
      if (typeof input.title === 'string') updates.title = input.title.trim();
      if (typeof input.description === 'string') updates.description = input.description.trim() || null;

      const { data, error } = await supabase
        .from('clinical_alerts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('[clinical_alerts.update] Supabase error:', error);
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      invalidateAllAlertCaches();
      toast.success('Alerta atualizado');
    },
    onError: () => {
      toast.error('Erro ao atualizar alerta. Verifique o console para detalhes.');
    },
  });

  // Dismiss/deactivate alert (column acknowledged_* não existe na tabela; só altera is_active)
  const dismissMutation = useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase
        .from('clinical_alerts')
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', alertId);

      if (error) {
        console.error('[clinical_alerts.dismiss] Supabase error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      invalidateAllAlertCaches();
      toast.success('Alerta desativado');
    },
    onError: () => {
      toast.error('Erro ao desativar alerta. Verifique o console para detalhes.');
    },
  });

  // Reactivate alert
  const reactivateMutation = useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase
        .from('clinical_alerts')
        .update({
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', alertId);

      if (error) {
        console.error('[clinical_alerts.reactivate] Supabase error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      invalidateAllAlertCaches();
      toast.success('Alerta reativado');
    },
    onError: () => {
      toast.error('Erro ao reativar alerta. Verifique o console para detalhes.');
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
      invalidateAllAlertCaches();
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
