import { useState, useCallback, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useClinicData } from '@/hooks/useClinicData';
import { toast } from 'sonner';
import type { TimelineEvent, TimelineFilters, TimelineEventType, TimelineEventCategory, TIMELINE_EVENT_CONFIG } from '@/types/timeline';

const ENTRY_TYPE_TO_EVENT: Record<string, TimelineEventType> = {
  anamnesis: 'ANAMNESIS_CREATED',
  evolution: 'EVOLUTION_CREATED',
  diagnosis: 'DIAGNOSIS_ADDED',
  procedure: 'PROCEDURE_ADDED',
  prescription: 'PRESCRIPTION_CREATED',
};

const ENTRY_TYPE_TO_TAB: Record<string, string> = {
  anamnesis: 'anamnese',
  evolution: 'evolucao',
  diagnosis: 'diagnostico',
  procedure: 'procedimentos',
  prescription: 'prescricoes',
};

const ACTION_TO_EVENT: Record<string, TimelineEventType> = {
  'sign_medical_record': 'RECORD_SIGNED',
  'EXPORT_DATA': 'PDF_EXPORTED',
  'DOWNLOAD': 'FILE_DOWNLOADED',
  'VIEW_RECORD': 'ACCESS_LOGGED',
  'EDIT_RECORD': 'ACCESS_LOGGED',
  'PRINT_RECORD': 'PDF_EXPORTED',
};

interface RawEntry {
  id: string;
  patient_id: string;
  entry_type: string;
  content: Record<string, unknown>;
  created_at: string;
  created_by: string | null;
  status: string;
}

interface RawFile {
  id: string;
  patient_id: string;
  file_name: string;
  category: string;
  created_at: string;
  created_by: string | null;
}

interface RawSignature {
  id: string;
  patient_id: string;
  medical_record_id: string;
  signed_name: string;
  signed_at: string;
}

interface RawConsent {
  id: string;
  patient_id: string;
  term_id: string;
  term_version: string;
  status: string;
  granted_at: string;
  revoked_at: string | null;
  granted_by: string | null;
}

interface RawAccessLog {
  id: string;
  user_id: string | null;
  action: string;
  resource: string | null;
  created_at: string;
}

interface RawSale {
  id: string;
  sale_number: string | null;
  patient_id: string;
  sale_date: string;
  total_amount: number;
  payment_status: string;
  created_at: string;
  created_by: string | null;
}

interface RawAppointment {
  id: string;
  patient_id: string;
  scheduled_date: string;
  status: string;
  created_at: string;
  created_by: string | null;
}

interface RawStockMovement {
  id: string;
  product_id: string;
  movement_type: string;
  quantity: number;
  reason: string;
  reference_type: string | null;
  reference_id: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  products?: {
    name: string;
    unit: string;
  } | null;
  appointments?: {
    patient_id: string;
    scheduled_date: string;
    procedure_id: string | null;
  } | null;
}

const PAGE_SIZE = 50;

export function useClinicalTimeline(patientId: string | null) {
  const { clinic } = useClinicData();
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<TimelineFilters>({});
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [profileMap, setProfileMap] = useState<Map<string, string>>(new Map());

  // Fetch profile names for author attribution
  const fetchProfiles = useCallback(async (userIds: string[]) => {
    if (userIds.length === 0) return new Map<string, string>();
    
    const { data } = await supabase
      .from('profiles')
      .select('user_id, full_name')
      .in('user_id', userIds);

    return new Map((data || []).map(p => [p.user_id, p.full_name || 'Usuário']));
  }, []);

  // Transform medical record entries to timeline events
  const transformEntries = useCallback((
    entries: RawEntry[], 
    profiles: Map<string, string>
  ): TimelineEvent[] => {
    return entries.map(entry => {
      const eventType = ENTRY_TYPE_TO_EVENT[entry.entry_type] || 'EVOLUTION_CREATED';
      const targetTab = ENTRY_TYPE_TO_TAB[entry.entry_type] || 'evolucao';
      
      // Extract summary from content
      const contentKeys = Object.keys(entry.content);
      let summary = '';
      if (contentKeys.length > 0) {
        const firstValue = String(entry.content[contentKeys[0]] || '');
        summary = firstValue.substring(0, 100) + (firstValue.length > 100 ? '...' : '');
      }

      return {
        id: `entry-${entry.id}`,
        event_type: eventType,
        category: 'clinical' as TimelineEventCategory,
        entity: 'medical_record_entries',
        entity_id: entry.id,
        patient_id: entry.patient_id,
        author_id: entry.created_by,
        author_name: entry.created_by ? (profiles.get(entry.created_by) || 'Profissional') : 'Sistema',
        timestamp: entry.created_at,
        summary: summary || `Registro de ${entry.entry_type}`,
        metadata: { entry_type: entry.entry_type, status: entry.status },
        target_tab: targetTab,
        can_navigate: true,
      };
    });
  }, []);

  // Transform files to timeline events
  const transformFiles = useCallback((
    files: RawFile[],
    profiles: Map<string, string>
  ): TimelineEvent[] => {
    return files.map(file => ({
      id: `file-${file.id}`,
      event_type: 'FILE_UPLOADED' as TimelineEventType,
      category: 'files' as TimelineEventCategory,
      entity: 'medical_record_files',
      entity_id: file.id,
      patient_id: file.patient_id,
      author_id: file.created_by,
      author_name: file.created_by ? (profiles.get(file.created_by) || 'Usuário') : 'Sistema',
      timestamp: file.created_at,
      summary: file.file_name,
      metadata: { category: file.category },
      target_tab: file.category === 'image' ? 'imagens' : 'documentos',
      can_navigate: true,
    }));
  }, []);

  // Transform signatures to timeline events
  const transformSignatures = useCallback((
    signatures: RawSignature[]
  ): TimelineEvent[] => {
    return signatures.map(sig => ({
      id: `sig-${sig.id}`,
      event_type: 'RECORD_SIGNED' as TimelineEventType,
      category: 'lgpd' as TimelineEventCategory,
      entity: 'medical_record_signatures',
      entity_id: sig.id,
      patient_id: sig.patient_id,
      author_id: null,
      author_name: sig.signed_name,
      timestamp: sig.signed_at,
      summary: `Registro assinado digitalmente por ${sig.signed_name}`,
      metadata: { medical_record_id: sig.medical_record_id },
      target_tab: 'evolucao',
      can_navigate: true,
    }));
  }, []);

  // Transform consents to timeline events
  const transformConsents = useCallback((
    consents: RawConsent[],
    profiles: Map<string, string>
  ): TimelineEvent[] => {
    const events: TimelineEvent[] = [];

    consents.forEach(consent => {
      // Grant event
      events.push({
        id: `consent-grant-${consent.id}`,
        event_type: 'CONSENT_COLLECTED' as TimelineEventType,
        category: 'lgpd' as TimelineEventCategory,
        entity: 'patient_consents',
        entity_id: consent.id,
        patient_id: consent.patient_id,
        author_id: consent.granted_by,
        author_name: consent.granted_by ? (profiles.get(consent.granted_by) || 'Usuário') : 'Sistema',
        timestamp: consent.granted_at,
        summary: `Consentimento coletado (v${consent.term_version})`,
        metadata: { term_id: consent.term_id, term_version: consent.term_version },
        target_tab: 'consentimentos',
        can_navigate: true,
      });

      // Revoke event if applicable
      if (consent.status === 'revoked' && consent.revoked_at) {
        events.push({
          id: `consent-revoke-${consent.id}`,
          event_type: 'CONSENT_REVOKED' as TimelineEventType,
          category: 'lgpd' as TimelineEventCategory,
          entity: 'patient_consents',
          entity_id: consent.id,
          patient_id: consent.patient_id,
          author_id: null,
          author_name: 'Sistema',
          timestamp: consent.revoked_at,
          summary: `Consentimento revogado (v${consent.term_version})`,
          metadata: { term_id: consent.term_id, term_version: consent.term_version },
          target_tab: 'consentimentos',
          can_navigate: true,
        });
      }
    });

    return events;
  }, []);

  // Transform access logs to timeline events (security/audit)
  const transformAccessLogs = useCallback((
    logs: RawAccessLog[],
    profiles: Map<string, string>
  ): TimelineEvent[] => {
    return logs
      .filter(log => log.resource?.includes(`patient:`))
      .map(log => {
        const eventType = ACTION_TO_EVENT[log.action] || 'ACCESS_LOGGED';
        
        return {
          id: `log-${log.id}`,
          event_type: eventType,
          category: 'security' as TimelineEventCategory,
          entity: 'access_logs',
          entity_id: log.id,
          patient_id: patientId || '',
          author_id: log.user_id,
          author_name: log.user_id ? (profiles.get(log.user_id) || 'Usuário') : 'Sistema',
          timestamp: log.created_at,
          summary: `Ação: ${log.action}`,
          metadata: { action: log.action, resource: log.resource },
          target_tab: 'auditoria',
          can_navigate: true,
        };
      });
  }, [patientId]);

  // Transform appointments to timeline events
  const transformAppointments = useCallback((
    appointments: RawAppointment[],
    profiles: Map<string, string>
  ): TimelineEvent[] => {
    return appointments.map(apt => ({
      id: `apt-${apt.id}`,
      event_type: 'APPOINTMENT_CREATED' as TimelineEventType,
      category: 'administrative' as TimelineEventCategory,
      entity: 'appointments',
      entity_id: apt.id,
      patient_id: apt.patient_id,
      author_id: apt.created_by,
      author_name: apt.created_by ? (profiles.get(apt.created_by) || 'Usuário') : 'Sistema',
      timestamp: apt.created_at,
      summary: `Consulta agendada para ${apt.scheduled_date}`,
      metadata: { scheduled_date: apt.scheduled_date, status: apt.status },
      can_navigate: false,
    }));
  }, []);

  // Transform sales to timeline events (including cancellations)
  const transformSales = useCallback((
    sales: RawSale[],
    profiles: Map<string, string>
  ): TimelineEvent[] => {
    const events: TimelineEvent[] = [];
    
    sales.forEach(sale => {
      const formattedAmount = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(sale.total_amount);

      // Sale created event
      events.push({
        id: `sale-${sale.id}`,
        event_type: 'SALE_CREATED' as TimelineEventType,
        category: 'sales' as TimelineEventCategory,
        entity: 'sales',
        entity_id: sale.id,
        patient_id: sale.patient_id,
        author_id: sale.created_by,
        author_name: sale.created_by ? (profiles.get(sale.created_by) || 'Usuário') : 'Sistema',
        timestamp: sale.created_at,
        summary: `Venda ${sale.sale_number || ''} - ${formattedAmount}`,
        metadata: { 
          sale_number: sale.sale_number, 
          total_amount: sale.total_amount,
          payment_status: sale.payment_status,
        },
        target_tab: 'vendas',
        can_navigate: true,
      });
    });
    
    return events;
  }, []);

  // Transform cancelled sales from access logs to timeline events
  const transformCancelledSales = useCallback((
    logs: RawAccessLog[],
    profiles: Map<string, string>
  ): TimelineEvent[] => {
    return logs
      .filter(log => log.action === 'SALE_CANCELLED' && log.resource?.includes('patient:'))
      .map(log => {
        // Parse resource: sales/{id}|patient:{id}|sale_number:{num}|amount:{val}|reason:{text}
        const parts = log.resource?.split('|') || [];
        const saleIdPart = parts[0]?.replace('sales/', '') || '';
        const patientPart = parts.find(p => p.startsWith('patient:'))?.replace('patient:', '') || '';
        const saleNumberPart = parts.find(p => p.startsWith('sale_number:'))?.replace('sale_number:', '') || 'N/A';
        const amountPart = parts.find(p => p.startsWith('amount:'))?.replace('amount:', '') || '0';
        const reasonPart = parts.find(p => p.startsWith('reason:'))?.replace('reason:', '') || 'Cancelamento';
        
        const formattedAmount = new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }).format(Number(amountPart) || 0);

        return {
          id: `sale-cancelled-${log.id}`,
          event_type: 'SALE_CANCELLED' as TimelineEventType,
          category: 'sales' as TimelineEventCategory,
          entity: 'access_logs',
          entity_id: log.id,
          patient_id: patientPart || patientId || '',
          author_id: log.user_id,
          author_name: log.user_id ? (profiles.get(log.user_id) || 'Usuário') : 'Sistema',
          timestamp: log.created_at,
          summary: `Venda ${saleNumberPart} cancelada - ${formattedAmount} - Motivo: ${reasonPart}`,
          metadata: { 
            sale_id: saleIdPart,
            sale_number: saleNumberPart, 
            amount_reversed: Number(amountPart),
            reason: reasonPart,
          },
          target_tab: 'vendas',
          can_navigate: false,
        };
      });
  }, [patientId]);

  // Transform stock movements (product consumption) to timeline events
  const transformStockMovements = useCallback((
    movements: RawStockMovement[],
    profiles: Map<string, string>
  ): TimelineEvent[] => {
    return movements
      .filter(m => 
        m.reference_type === 'procedure_execution' && 
        m.appointments?.patient_id === patientId
      )
      .map(movement => {
        const productName = movement.products?.name || 'Produto';
        const productUnit = movement.products?.unit || 'un';
        
        return {
          id: `stock-${movement.id}`,
          event_type: 'PRODUCT_CONSUMED' as TimelineEventType,
          category: 'stock' as TimelineEventCategory,
          entity: 'stock_movements',
          entity_id: movement.id,
          patient_id: movement.appointments?.patient_id || patientId || '',
          author_id: movement.created_by,
          author_name: movement.created_by ? (profiles.get(movement.created_by) || 'Profissional') : 'Sistema',
          timestamp: movement.created_at,
          summary: `${productName}: ${movement.quantity} ${productUnit} consumido(s) - Uso em Procedimento`,
          metadata: { 
            product_id: movement.product_id,
            product_name: productName,
            quantity: movement.quantity,
            unit: productUnit,
            appointment_id: movement.reference_id,
            reason: movement.reason,
          },
          target_tab: 'procedimentos',
          can_navigate: false,
        };
      });
  }, [patientId]);

  // Main fetch function that aggregates all sources
  const fetchTimeline = useCallback(async (reset = false) => {
    if (!clinic?.id || !patientId) return;
    
    setLoading(true);
    const currentPage = reset ? 0 : page;
    
    try {
      // First get appointment IDs for this patient to filter stock movements
      const patientAppointmentsRes = await supabase
        .from('appointments')
        .select('id')
        .eq('clinic_id', clinic.id)
        .eq('patient_id', patientId);
      
      const patientAppointmentIds = (patientAppointmentsRes.data || []).map(a => a.id);

      // Fetch all data sources in parallel
      const [
        entriesRes,
        filesRes,
        signaturesRes,
        consentsRes,
        accessLogsRes,
        appointmentsRes,
        salesRes,
        stockMovementsRes,
      ] = await Promise.all([
        // Medical record entries
        supabase
          .from('medical_record_entries')
          .select('id, patient_id, entry_type, content, created_at, created_by, status')
          .eq('clinic_id', clinic.id)
          .eq('patient_id', patientId)
          .order('created_at', { ascending: false }),

        // Files
        supabase
          .from('medical_record_files')
          .select('id, patient_id, file_name, category, created_at, created_by')
          .eq('clinic_id', clinic.id)
          .eq('patient_id', patientId)
          .order('created_at', { ascending: false }),

        // Signatures
        supabase
          .from('medical_record_signatures')
          .select('id, patient_id, medical_record_id, signed_name, signed_at')
          .eq('clinic_id', clinic.id)
          .eq('patient_id', patientId)
          .order('signed_at', { ascending: false }),

        // Consents
        supabase
          .from('patient_consents')
          .select('id, patient_id, term_id, term_version, status, granted_at, revoked_at, granted_by')
          .eq('clinic_id', clinic.id)
          .eq('patient_id', patientId)
          .order('granted_at', { ascending: false }),

        // Access logs (limited for performance)
        supabase
          .from('access_logs')
          .select('id, user_id, action, resource, created_at')
          .eq('clinic_id', clinic.id)
          .ilike('resource', `%patient:${patientId}%`)
          .order('created_at', { ascending: false })
          .limit(50),

        // Appointments
        supabase
          .from('appointments')
          .select('id, patient_id, scheduled_date, status, created_at, created_by')
          .eq('clinic_id', clinic.id)
          .eq('patient_id', patientId)
          .order('created_at', { ascending: false }),

        // Sales
        supabase
          .from('sales')
          .select('id, sale_number, patient_id, sale_date, total_amount, payment_status, created_at, created_by')
          .eq('clinic_id', clinic.id)
          .eq('patient_id', patientId)
          .order('created_at', { ascending: false }),

        // Stock movements (product consumption linked to patient appointments)
        patientAppointmentIds.length > 0
          ? supabase
              .from('stock_movements')
              .select(`
                id, product_id, movement_type, quantity, reason, 
                reference_type, reference_id, notes, created_by, created_at,
                products(name, unit)
              `)
              .eq('clinic_id', clinic.id)
              .eq('reference_type', 'procedure_execution')
              .in('reference_id', patientAppointmentIds)
              .order('created_at', { ascending: false })
          : Promise.resolve({ data: [], error: null }),
      ]);

      // Collect all user IDs for profile lookup
      const allUserIds = new Set<string>();
      
      (entriesRes.data || []).forEach(e => e.created_by && allUserIds.add(e.created_by));
      (filesRes.data || []).forEach(f => f.created_by && allUserIds.add(f.created_by));
      (consentsRes.data || []).forEach(c => c.granted_by && allUserIds.add(c.granted_by));
      (accessLogsRes.data || []).forEach(l => l.user_id && allUserIds.add(l.user_id));
      (appointmentsRes.data || []).forEach(a => a.created_by && allUserIds.add(a.created_by));
      (salesRes.data || []).forEach(s => s.created_by && allUserIds.add(s.created_by));
      (stockMovementsRes.data || []).forEach((m: RawStockMovement) => m.created_by && allUserIds.add(m.created_by));

      // Fetch profiles
      const profiles = await fetchProfiles(Array.from(allUserIds));
      setProfileMap(profiles);

      // Build a map of appointment_id -> patient_id for stock movements
      const appointmentPatientMap = new Map<string, string>();
      (appointmentsRes.data || []).forEach(a => {
        appointmentPatientMap.set(a.id, a.patient_id);
      });

      // Transform stock movements with patient info
      const stockMovementsWithPatient = (stockMovementsRes.data || []).map((m: RawStockMovement) => ({
        ...m,
        appointments: {
          patient_id: m.reference_id ? appointmentPatientMap.get(m.reference_id) || '' : '',
          scheduled_date: '',
          procedure_id: null,
        },
      }));

      // Transform all data to timeline events
      let allEvents: TimelineEvent[] = [
        ...transformEntries((entriesRes.data || []) as RawEntry[], profiles),
        ...transformFiles((filesRes.data || []) as RawFile[], profiles),
        ...transformSignatures((signaturesRes.data || []) as RawSignature[]),
        ...transformConsents((consentsRes.data || []) as RawConsent[], profiles),
        ...transformAccessLogs((accessLogsRes.data || []) as RawAccessLog[], profiles),
        ...transformAppointments((appointmentsRes.data || []) as RawAppointment[], profiles),
        ...transformSales((salesRes.data || []) as RawSale[], profiles),
        ...transformCancelledSales((accessLogsRes.data || []) as RawAccessLog[], profiles),
        ...transformStockMovements(stockMovementsWithPatient as RawStockMovement[], profiles),
      ];

      // Apply filters
      if (filters.dateFrom) {
        allEvents = allEvents.filter(e => e.timestamp >= filters.dateFrom!);
      }
      if (filters.dateTo) {
        allEvents = allEvents.filter(e => e.timestamp <= filters.dateTo! + 'T23:59:59');
      }
      if (filters.eventTypes && filters.eventTypes.length > 0) {
        allEvents = allEvents.filter(e => filters.eventTypes!.includes(e.event_type));
      }
      if (filters.categories && filters.categories.length > 0) {
        allEvents = allEvents.filter(e => filters.categories!.includes(e.category));
      }
      if (filters.authorId) {
        allEvents = allEvents.filter(e => e.author_id === filters.authorId);
      }

      // Sort by timestamp descending
      allEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      // Pagination
      const start = currentPage * PAGE_SIZE;
      const paginatedEvents = allEvents.slice(start, start + PAGE_SIZE);
      
      setHasMore(allEvents.length > start + PAGE_SIZE);

      if (reset) {
        setEvents(paginatedEvents);
        setPage(0);
      } else {
        setEvents(prev => [...prev, ...paginatedEvents]);
      }

    } catch (err) {
      console.error('Error fetching timeline:', err);
      toast.error('Erro ao carregar linha do tempo');
    } finally {
      setLoading(false);
    }
  }, [
    clinic?.id, 
    patientId, 
    page, 
    filters,
    fetchProfiles,
    transformEntries,
    transformFiles,
    transformSignatures,
    transformConsents,
    transformAccessLogs,
    transformAppointments,
    transformSales,
    transformCancelledSales,
    transformStockMovements,
  ]);

  // Initial load
  useEffect(() => {
    if (patientId) {
      fetchTimeline(true);
    }
  }, [patientId, filters]);

  // Load more
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
      fetchTimeline(false);
    }
  }, [loading, hasMore, fetchTimeline]);

  // Group events by date
  const groupedEvents = useMemo(() => {
    const groups = new Map<string, TimelineEvent[]>();
    
    events.forEach(event => {
      const date = event.timestamp.split('T')[0];
      if (!groups.has(date)) {
        groups.set(date, []);
      }
      groups.get(date)!.push(event);
    });

    return Array.from(groups.entries()).map(([date, items]) => ({
      date,
      events: items,
    }));
  }, [events]);

  // Update filters with debounce consideration
  const applyFilters = useCallback((newFilters: TimelineFilters) => {
    setFilters(newFilters);
    setPage(0);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
    setPage(0);
  }, []);

  return {
    events,
    groupedEvents,
    loading,
    hasMore,
    filters,
    applyFilters,
    clearFilters,
    loadMore,
    refetch: () => fetchTimeline(true),
  };
}
