import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useClinicData } from '@/hooks/useClinicData';
import { toast } from 'sonner';

export interface MessageQueueRow {
  id: string;
  clinic_id: string;
  patient_id: string | null;
  appointment_id: string | null;
  automation_rule_id: string | null;
  template_id: string | null;
  channel: string;
  phone: string;
  message_body: string;
  rendered_message: string | null;
  scheduled_for: string | null;
  sent_at: string | null;
  status: string;
  error_message: string | null;
  provider_response: Record<string, unknown> | null;
  attempts: number;
  created_at: string;
  patient?: { full_name: string; phone?: string } | null;
}

export function useMessageHistory() {
  const { clinic } = useClinicData();
  const [messages, setMessages] = useState<MessageQueueRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = useCallback(async () => {
    if (!clinic?.id) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('message_queue')
        .select('*, patients(full_name, phone)')
        .eq('clinic_id', clinic.id)
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;

      const mapped = (data || []).map((row: any) => ({
        ...row,
        provider_response: row.provider_response as Record<string, unknown> | null,
        patient: row.patients ? { full_name: row.patients.full_name, phone: row.patients.phone } : null,
      }));

      setMessages(mapped);
    } catch (err) {
      console.error('Error fetching message history:', err);
      toast.error('Erro ao carregar histórico');
    } finally {
      setLoading(false);
    }
  }, [clinic?.id]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  return { messages, loading, refetch: fetchMessages };
}
