import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useClinicData } from '@/hooks/useClinicData';
import { toast } from 'sonner';

export interface AccessLog {
  id: string;
  user_id: string | null;
  clinic_id: string;
  action: string;
  resource: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  user_name?: string;
}

export interface AccessLogFilters {
  userId?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
}

const ACTION_LABELS: Record<string, { label: string; color: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  LOGIN: { label: 'Login', color: 'default' },
  LOGOUT: { label: 'Logout', color: 'secondary' },
  VIEW_RECORD: { label: 'Visualização de Prontuário', color: 'outline' },
  EDIT_RECORD: { label: 'Edição de Prontuário', color: 'default' },
  PRINT_RECORD: { label: 'Impressão', color: 'secondary' },
  EXPORT_DATA: { label: 'Exportação', color: 'secondary' },
  DOWNLOAD: { label: 'Download', color: 'secondary' },
  CREATE: { label: 'Criação', color: 'default' },
  UPDATE: { label: 'Atualização', color: 'default' },
  DELETE: { label: 'Exclusão', color: 'destructive' },
  // Clinical evolution actions
  VIEW_EVOLUTION: { label: 'Visualização de Evolução', color: 'outline' },
  CREATE_EVOLUTION: { label: 'Criação de Evolução', color: 'default' },
  EDIT_EVOLUTION: { label: 'Edição de Evolução', color: 'default' },
  EVOLUTION_CREATED: { label: 'Evolução Criada', color: 'default' },
  EVOLUTION_UPDATED: { label: 'Evolução Atualizada', color: 'default' },
  // Clinical alert actions
  VIEW_ALERT: { label: 'Visualização de Alerta', color: 'outline' },
  CREATE_ALERT: { label: 'Criação de Alerta', color: 'default' },
  // Media actions
  VIEW_MEDIA: { label: 'Visualização de Mídia', color: 'outline' },
  UPLOAD_MEDIA: { label: 'Upload de Mídia', color: 'default' },
  // Sales actions
  SALE_CREATED: { label: 'Venda Realizada', color: 'default' },
  SALE_STATUS_UPDATED: { label: 'Status de Venda Atualizado', color: 'secondary' },
  SALE_CANCELLED: { label: 'Venda Cancelada', color: 'destructive' },
};

export function useAccessLogs() {
  const { clinic, isLoading: clinicLoading } = useClinicData();
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<AccessLogFilters>({});

  const fetchLogs = useCallback(async (customFilters?: AccessLogFilters) => {
    if (!clinic?.id) return;
    setLoading(true);
    try {
      const activeFilters = customFilters || filters;

      let query = supabase
        .from('access_logs')
        .select('*')
        .eq('clinic_id', clinic.id)
        .order('created_at', { ascending: false })
        .limit(200);

      if (activeFilters.userId) {
        query = query.eq('user_id', activeFilters.userId);
      }
      if (activeFilters.action) {
        query = query.eq('action', activeFilters.action);
      }
      if (activeFilters.startDate) {
        query = query.gte('created_at', activeFilters.startDate);
      }
      if (activeFilters.endDate) {
        query = query.lte('created_at', activeFilters.endDate + 'T23:59:59');
      }

      const { data: logsData, error } = await query;

      if (error) throw error;

      // Get unique user IDs to fetch names
      const userIds = [...new Set((logsData || []).filter(l => l.user_id).map(l => l.user_id))];

      let profileMap = new Map<string, string>();
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name')
          .in('user_id', userIds as string[]);

        profileMap = new Map((profiles || []).map(p => [p.user_id, p.full_name || 'Usuário']));
      }

      const enrichedLogs: AccessLog[] = (logsData || []).map(log => ({
        ...log,
        user_name: log.user_id ? profileMap.get(log.user_id) || 'Usuário' : 'Sistema',
      }));

      setLogs(enrichedLogs);
    } catch (err) {
      console.error('Error fetching access logs:', err);
      toast.error('Erro ao carregar logs de acesso');
    } finally {
      setLoading(false);
    }
  }, [clinic?.id, filters]);

  useEffect(() => {
    if (!clinicLoading && clinic?.id) {
      fetchLogs();
    }
  }, [clinicLoading, clinic?.id, fetchLogs]);

  const logAction = async (action: string, resource?: string): Promise<void> => {
    if (!clinic?.id) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Use edge function to log action (server-side logging for security)
      await supabase.functions.invoke('log-access', {
        body: {
          action,
          resource,
          user_agent: navigator.userAgent,
        },
      });
    } catch (err) {
      // Silently fail - logging should not disrupt user experience
      console.error('Error logging action:', err);
    }
  };

  const applyFilters = (newFilters: AccessLogFilters) => {
    setFilters(newFilters);
    fetchLogs(newFilters);
  };

  const clearFilters = () => {
    setFilters({});
    fetchLogs({});
  };

  return {
    logs,
    loading: loading || clinicLoading,
    filters,
    actionLabels: ACTION_LABELS,
    fetchLogs,
    logAction,
    applyFilters,
    clearFilters,
  };
}
