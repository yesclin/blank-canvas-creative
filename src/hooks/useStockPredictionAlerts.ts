import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// =============================================
// TYPES
// =============================================

export interface StockPrediction {
  product_id: string;
  product_name: string;
  product_unit: string;
  current_stock: number;
  min_stock: number;
  predicted_consumption: number;
  projected_stock: number;
  first_shortage_date: string | null;
  impacting_procedures: {
    procedure_id: string;
    procedure_name: string;
    quantity: number;
  }[];
}

export interface StockPredictionSettings {
  id: string;
  clinic_id: string;
  enabled: boolean;
  prediction_days: number;
  alert_level: 'info' | 'warning' | 'critical';
  created_at: string;
  updated_at: string;
}

export type AlertSeverity = 'critical' | 'warning' | 'info';

export interface StockAlert {
  product_id: string;
  product_name: string;
  product_unit: string;
  current_stock: number;
  min_stock: number;
  predicted_consumption: number;
  projected_stock: number;
  first_shortage_date: string | null;
  severity: AlertSeverity;
  impacting_procedures: {
    procedure_id: string;
    procedure_name: string;
    quantity: number;
  }[];
}

// =============================================
// HELPER: Get clinic_id from current user
// =============================================

async function getClinicId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('clinic_id')
    .eq('user_id', user.id)
    .single();
    
  if (!profile?.clinic_id) throw new Error('Clínica não encontrada');
  return profile.clinic_id;
}

// =============================================
// SETTINGS QUERIES
// =============================================

export function useStockPredictionSettings() {
  return useQuery({
    queryKey: ['stock-prediction-settings'],
    queryFn: async () => {
      const clinicId = await getClinicId();
      
      const { data, error } = await supabase
        .from('stock_prediction_settings')
        .select('*')
        .eq('clinic_id', clinicId)
        .maybeSingle();
      
      if (error) throw error;
      
      // Return default settings if none exist
      if (!data) {
        return {
          id: '',
          clinic_id: clinicId,
          enabled: true,
          prediction_days: 15,
          alert_level: 'warning' as const,
          created_at: '',
          updated_at: '',
        } satisfies StockPredictionSettings;
      }
      
      return data as StockPredictionSettings;
    },
  });
}

export function useUpdateStockPredictionSettings() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (settings: Partial<StockPredictionSettings>) => {
      const clinicId = await getClinicId();
      
      // Upsert the settings
      const { data, error } = await supabase
        .from('stock_prediction_settings')
        .upsert({
          clinic_id: clinicId,
          enabled: settings.enabled,
          prediction_days: settings.prediction_days,
          alert_level: settings.alert_level,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'clinic_id',
        })
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-prediction-settings'] });
      queryClient.invalidateQueries({ queryKey: ['stock-predictions'] });
      toast.success('Configurações de previsão atualizadas!');
    },
    onError: (error) => {
      console.error('Error updating stock prediction settings:', error);
      toast.error('Erro ao atualizar configurações');
    },
  });
}

// =============================================
// PREDICTIONS QUERY
// =============================================

export function useStockPredictions(daysOverride?: number) {
  const { data: settings } = useStockPredictionSettings();
  
  return useQuery({
    queryKey: ['stock-predictions', daysOverride || settings?.prediction_days],
    queryFn: async () => {
      const clinicId = await getClinicId();
      const days = daysOverride || settings?.prediction_days || 15;
      
      const { data, error } = await supabase
        .rpc('calculate_stock_predictions', {
          p_clinic_id: clinicId,
          p_days_ahead: days,
        });
      
      if (error) throw error;
      
      return (data || []) as StockPrediction[];
    },
    enabled: settings?.enabled !== false,
    refetchInterval: 60000, // Refresh every minute
  });
}

// =============================================
// ALERTS COMPUTED FROM PREDICTIONS
// =============================================

export function useStockAlerts() {
  const { data: settings } = useStockPredictionSettings();
  const { data: predictions = [], isLoading, error } = useStockPredictions();
  
  // Compute alerts with severity
  const alerts: StockAlert[] = predictions.map((prediction) => {
    let severity: AlertSeverity = 'info';
    
    // Critical: will run out before a scheduled procedure
    if (prediction.first_shortage_date) {
      severity = 'critical';
    }
    // Warning: projected stock is below minimum
    else if (prediction.projected_stock < prediction.min_stock) {
      severity = 'warning';
    }
    // Info: current stock already below minimum
    else if (prediction.current_stock <= prediction.min_stock) {
      severity = 'info';
    }
    
    return {
      ...prediction,
      severity,
    };
  });
  
  // Filter and sort by severity
  const sortedAlerts = alerts
    .filter(a => a.severity === 'critical' || a.severity === 'warning' || 
      (settings?.alert_level === 'info' && a.severity === 'info'))
    .sort((a, b) => {
      const severityOrder = { critical: 0, warning: 1, info: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  
  const criticalCount = sortedAlerts.filter(a => a.severity === 'critical').length;
  const warningCount = sortedAlerts.filter(a => a.severity === 'warning').length;
  
  return {
    alerts: sortedAlerts,
    criticalCount,
    warningCount,
    totalCount: sortedAlerts.length,
    isLoading,
    error,
    enabled: settings?.enabled !== false,
    predictionDays: settings?.prediction_days || 15,
  };
}
