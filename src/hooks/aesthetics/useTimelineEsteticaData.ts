/**
 * ESTÉTICA - Timeline Consolidada
 * 
 * Agrega dados de múltiplas fontes em uma timeline unificada:
 * - Anamneses
 * - Avaliações
 * - Mapas Faciais
 * - Produtos Utilizados
 * - Evoluções
 * - Termos de Consentimento
 * - Documentos/Anexos
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useClinicData } from '@/hooks/useClinicData';
import { useMemo } from 'react';

export type TimelineEventType = 
  | 'anamnese'
  | 'avaliacao'
  | 'evolucao'
  | 'facial_map'
  | 'produto'
  | 'consentimento'
  | 'documento'
  | 'before_after'
  | 'alerta';

export interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  title: string;
  subtitle?: string;
  description?: string;
  date: string;
  metadata?: Record<string, unknown>;
  status?: string;
  professionalName?: string;
  appointmentId?: string | null;
}

export function useTimelineEsteticaData(patientId: string | null) {
  const { clinic } = useClinicData();

  // Fetch clinical evolutions (anamnese, avaliacao, evolucao)
  const { data: evolutions = [], isLoading: loadingEvolutions } = useQuery({
    queryKey: ['timeline-evolutions', patientId],
    queryFn: async () => {
      if (!patientId || !clinic?.id) return [];

      const { data, error } = await supabase
        .from('clinical_evolutions')
        .select(`
          id,
          evolution_type,
          content,
          status,
          created_at,
          appointment_id,
          professional_id,
          professionals:professional_id (full_name)
        `)
        .eq('clinic_id', clinic.id)
        .eq('patient_id', patientId)
        .in('evolution_type', [
          'anamnese_estetica',
          'avaliacao_estetica',
          'evolucao_estetica',
        ])
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!patientId && !!clinic?.id,
  });

  // Fetch facial maps
  const { data: facialMaps = [], isLoading: loadingMaps } = useQuery({
    queryKey: ['timeline-facial-maps', patientId],
    queryFn: async () => {
      if (!patientId || !clinic?.id) return [];

      const { data, error } = await supabase
        .from('facial_maps')
        .select(`
          id,
          map_type,
          general_notes,
          created_at,
          appointment_id,
          professional_id,
          professionals:professional_id (full_name),
          facial_map_applications (id)
        `)
        .eq('clinic_id', clinic.id)
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!patientId && !!clinic?.id,
  });

  // Fetch products used
  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ['timeline-products', patientId],
    queryFn: async () => {
      if (!patientId || !clinic?.id) return [];

      const { data, error } = await supabase
        .from('aesthetic_products_used')
        .select('*')
        .eq('clinic_id', clinic.id)
        .eq('patient_id', patientId)
        .order('registered_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!patientId && !!clinic?.id,
  });

  // Fetch consent records
  const { data: consents = [], isLoading: loadingConsents } = useQuery({
    queryKey: ['timeline-consents', patientId],
    queryFn: async () => {
      if (!patientId || !clinic?.id) return [];

      const { data, error } = await supabase
        .from('aesthetic_consent_records')
        .select('*')
        .eq('clinic_id', clinic.id)
        .eq('patient_id', patientId)
        .order('accepted_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!patientId && !!clinic?.id,
  });

  // Fetch before/after records
  const { data: beforeAfter = [], isLoading: loadingBeforeAfter } = useQuery({
    queryKey: ['timeline-before-after', patientId],
    queryFn: async () => {
      if (!patientId || !clinic?.id) return [];

      const { data, error } = await supabase
        .from('aesthetic_before_after')
        .select('*')
        .eq('clinic_id', clinic.id)
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!patientId && !!clinic?.id,
  });

  // Fetch clinical alerts
  const { data: alerts = [], isLoading: loadingAlerts } = useQuery({
    queryKey: ['timeline-alerts', patientId],
    queryFn: async () => {
      if (!patientId || !clinic?.id) return [];

      const { data, error } = await supabase
        .from('clinical_alerts')
        .select('*')
        .eq('clinic_id', clinic.id)
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!patientId && !!clinic?.id,
  });

  // Transform and merge all data into timeline events
  const timelineEvents = useMemo((): TimelineEvent[] => {
    const events: TimelineEvent[] = [];

    // Clinical Evolutions
    evolutions.forEach((ev: any) => {
      const content = ev.content as Record<string, any> || {};
      let type: TimelineEventType = 'evolucao';
      let title = 'Evolução Estética';

      if (ev.evolution_type === 'anamnese_estetica') {
        type = 'anamnese';
        title = 'Anamnese Estética';
      } else if (ev.evolution_type === 'avaliacao_estetica') {
        type = 'avaliacao';
        title = 'Avaliação Estética';
      }

      events.push({
        id: ev.id,
        type,
        title,
        subtitle: content.procedimento_realizado || content.queixa_principal || undefined,
        date: ev.created_at,
        status: ev.status,
        professionalName: ev.professionals?.full_name,
        appointmentId: ev.appointment_id,
        metadata: content,
      });
    });

    // Facial Maps
    facialMaps.forEach((map: any) => {
      const applicationCount = map.facial_map_applications?.length || 0;
      events.push({
        id: map.id,
        type: 'facial_map',
        title: 'Mapa Facial',
        subtitle: `${applicationCount} ponto(s) de aplicação`,
        description: map.general_notes,
        date: map.created_at,
        professionalName: map.professionals?.full_name,
        appointmentId: map.appointment_id,
        metadata: { map_type: map.map_type, applicationCount },
      });
    });

    // Products Used
    products.forEach((prod: any) => {
      events.push({
        id: prod.id,
        type: 'produto',
        title: 'Produto Utilizado',
        subtitle: prod.product_name,
        description: `${prod.quantity} ${prod.unit} - ${prod.application_area || 'N/A'}`,
        date: prod.registered_at,
        appointmentId: prod.appointment_id,
        metadata: {
          batch_number: prod.batch_number,
          manufacturer: prod.manufacturer,
          procedure_type: prod.procedure_type,
        },
      });
    });

    // Consent Records
    consents.forEach((consent: any) => {
      events.push({
        id: consent.id,
        type: 'consentimento',
        title: 'Termo de Consentimento',
        subtitle: consent.term_title,
        description: consent.procedure_name || undefined,
        date: consent.accepted_at,
        appointmentId: consent.appointment_id,
        metadata: {
          consent_type: consent.consent_type,
          term_version: consent.term_version,
          has_signature: !!consent.signature_data,
        },
      });
    });

    // Before/After Records
    beforeAfter.forEach((ba: any) => {
      events.push({
        id: ba.id,
        type: 'before_after',
        title: 'Foto Antes/Depois',
        subtitle: ba.title,
        description: ba.description,
        date: ba.created_at,
        appointmentId: ba.appointment_id,
        metadata: {
          before_date: ba.before_image_date,
          after_date: ba.after_image_date,
          has_before: !!ba.before_image_url,
          has_after: !!ba.after_image_url,
          consent_for_marketing: ba.consent_for_marketing,
        },
      });
    });

    // Alerts
    alerts.forEach((alert: any) => {
      events.push({
        id: alert.id,
        type: 'alerta',
        title: 'Alerta Clínico',
        subtitle: alert.title,
        description: alert.description,
        date: alert.created_at,
        status: alert.is_active ? 'active' : 'inactive',
        metadata: {
          alert_type: alert.alert_type,
          severity: alert.severity,
          is_active: alert.is_active,
        },
      });
    });

    // Sort by date descending
    return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [evolutions, facialMaps, products, consents, beforeAfter, alerts]);

  // Group events by date
  const groupedByDate = useMemo(() => {
    const groups: Record<string, TimelineEvent[]> = {};
    
    timelineEvents.forEach((event) => {
      const dateKey = new Date(event.date).toISOString().split('T')[0];
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(event);
    });

    return groups;
  }, [timelineEvents]);

  // Group events by month
  const groupedByMonth = useMemo(() => {
    const groups: Record<string, TimelineEvent[]> = {};
    
    timelineEvents.forEach((event) => {
      const date = new Date(event.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!groups[monthKey]) {
        groups[monthKey] = [];
      }
      groups[monthKey].push(event);
    });

    return groups;
  }, [timelineEvents]);

  // Filter by type
  const filterByType = (type: TimelineEventType) => {
    return timelineEvents.filter((e) => e.type === type);
  };

  // Filter by appointment
  const filterByAppointment = (appointmentId: string) => {
    return timelineEvents.filter((e) => e.appointmentId === appointmentId);
  };

  const isLoading = loadingEvolutions || loadingMaps || loadingProducts || loadingConsents || loadingBeforeAfter || loadingAlerts;

  return {
    events: timelineEvents,
    groupedByDate,
    groupedByMonth,
    filterByType,
    filterByAppointment,
    isLoading,
    counts: {
      total: timelineEvents.length,
      anamnese: timelineEvents.filter((e) => e.type === 'anamnese').length,
      avaliacao: timelineEvents.filter((e) => e.type === 'avaliacao').length,
      evolucao: timelineEvents.filter((e) => e.type === 'evolucao').length,
      facial_map: timelineEvents.filter((e) => e.type === 'facial_map').length,
      produto: timelineEvents.filter((e) => e.type === 'produto').length,
      consentimento: timelineEvents.filter((e) => e.type === 'consentimento').length,
      before_after: timelineEvents.filter((e) => e.type === 'before_after').length,
      alerta: timelineEvents.filter((e) => e.type === 'alerta').length,
    },
  };
}
