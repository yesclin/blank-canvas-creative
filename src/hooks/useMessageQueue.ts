import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useClinicData } from '@/hooks/useClinicData';
import { toast } from 'sonner';
import { useQueryClient, useQuery } from '@tanstack/react-query';

export interface QueueMessage {
  id: string;
  clinic_id: string;
  patient_id: string | null;
  appointment_id: string | null;
  template_id: string | null;
  channel: string;
  phone: string;
  message_body: string;
  rendered_message: string | null;
  status: string;
  sent_at: string | null;
  sent_by: string | null;
  origin: string;
  notes: string | null;
  error_message: string | null;
  created_at: string;
  patient?: { full_name: string; phone: string | null } | null;
}

export function useMessageQueue() {
  const { clinic } = useClinicData();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);

  const query = useQuery({
    queryKey: ['message-queue', clinic?.id],
    enabled: !!clinic?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('message_queue')
        .select('*, patients(full_name, phone)')
        .eq('clinic_id', clinic!.id)
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) throw error;

      return (data || []).map((row: any) => ({
        ...row,
        patient: row.patients ? { full_name: row.patients.full_name, phone: row.patients.phone } : null,
      })) as QueueMessage[];
    },
  });

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['message-queue'] });
    queryClient.invalidateQueries({ queryKey: ['marketing-dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['marketing-stats'] });
  }, [queryClient]);

  // Create a message in the queue (generate message)
  const createMessage = useCallback(async (params: {
    patient_id: string;
    phone: string;
    message_body: string;
    rendered_message?: string;
    template_id?: string;
    appointment_id?: string;
    channel?: string;
    origin?: string;
  }) => {
    if (!clinic?.id) return null;
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('message_queue')
        .insert({
          clinic_id: clinic.id,
          patient_id: params.patient_id,
          phone: params.phone,
          message_body: params.message_body,
          rendered_message: params.rendered_message || null,
          template_id: params.template_id || null,
          appointment_id: params.appointment_id || null,
          channel: params.channel || 'whatsapp',
          origin: params.origin || 'manual',
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      toast.success('Mensagem gerada com sucesso');
      invalidate();
      return data;
    } catch (err: any) {
      console.error('Error creating message:', err);
      toast.error('Erro ao gerar mensagem: ' + (err.message || ''));
      return null;
    } finally {
      setSaving(false);
    }
  }, [clinic?.id, invalidate]);

  // Create messages in batch
  const createBatch = useCallback(async (messages: Array<{
    patient_id: string;
    phone: string;
    message_body: string;
    rendered_message?: string;
    template_id?: string;
    appointment_id?: string;
    channel?: string;
  }>) => {
    if (!clinic?.id || messages.length === 0) return;
    setSaving(true);
    try {
      const rows = messages.map((m) => ({
        clinic_id: clinic.id,
        patient_id: m.patient_id,
        phone: m.phone,
        message_body: m.message_body,
        rendered_message: m.rendered_message || null,
        template_id: m.template_id || null,
        appointment_id: m.appointment_id || null,
        channel: m.channel || 'whatsapp',
        origin: 'manual',
        status: 'pending',
      }));

      const { error } = await supabase
        .from('message_queue')
        .insert(rows);

      if (error) throw error;
      toast.success(`${messages.length} mensagens geradas`);
      invalidate();
    } catch (err: any) {
      console.error('Error creating batch:', err);
      toast.error('Erro ao gerar mensagens: ' + (err.message || ''));
    } finally {
      setSaving(false);
    }
  }, [clinic?.id, invalidate]);

  // Mark as sent
  const markAsSent = useCallback(async (id: string) => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('message_queue')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          sent_by: user?.id || null,
        })
        .eq('id', id);

      if (error) throw error;
      toast.success('Mensagem marcada como enviada');
      invalidate();
    } catch (err: any) {
      toast.error('Erro: ' + (err.message || ''));
    } finally {
      setSaving(false);
    }
  }, [invalidate]);

  // Mark as failed with reason
  const markAsFailed = useCallback(async (id: string, reason: string) => {
    if (!reason.trim()) {
      toast.error('Informe o motivo da falha');
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from('message_queue')
        .update({
          status: 'failed',
          error_message: reason,
        })
        .eq('id', id);

      if (error) throw error;
      toast.success('Falha registrada');
      invalidate();
    } catch (err: any) {
      toast.error('Erro: ' + (err.message || ''));
    } finally {
      setSaving(false);
    }
  }, [invalidate]);

  // Batch mark as sent
  const markBatchAsSent = useCallback(async (ids: string[]) => {
    if (ids.length === 0) return;
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('message_queue')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          sent_by: user?.id || null,
        })
        .in('id', ids);

      if (error) throw error;
      toast.success(`${ids.length} mensagens marcadas como enviadas`);
      invalidate();
    } catch (err: any) {
      toast.error('Erro: ' + (err.message || ''));
    } finally {
      setSaving(false);
    }
  }, [invalidate]);

  return {
    messages: query.data || [],
    loading: query.isLoading,
    saving,
    createMessage,
    createBatch,
    markAsSent,
    markAsFailed,
    markBatchAsSent,
    refetch: query.refetch,
  };
}
