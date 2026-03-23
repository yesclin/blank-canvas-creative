import { useState, useMemo } from 'react';
import type {
  CRMPatient,
  PatientTag,
  MessageTemplate,
  AutomationRule,
  MarketingCampaign,
  MessageLog,
  CommunicationSettings,
  CRMStatus,
} from '@/types/comunicacao';

// Mock Tags
const mockTags: PatientTag[] = [
  { id: '1', clinic_id: 'clinic-1', name: 'VIP', color: '#f59e0b', is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: '2', clinic_id: 'clinic-1', name: 'Retorno Pendente', color: '#ef4444', is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: '3', clinic_id: 'clinic-1', name: 'Estética', color: '#ec4899', is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: '4', clinic_id: 'clinic-1', name: 'Convênio', color: '#3b82f6', is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: '5', clinic_id: 'clinic-1', name: 'Odontologia', color: '#10b981', is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
];

// Mock CRM Patients
const mockCRMPatients: CRMPatient[] = [
  {
    id: '1',
    full_name: 'Maria Silva Santos',
    phone: '(11) 99999-1234',
    email: 'maria@email.com',
    birth_date: '1985-03-15',
    crm_status: 'em_acompanhamento',
    preferred_contact: 'whatsapp',
    opt_out_messages: false,
    last_appointment: '2024-01-20',
    next_appointment: '2024-02-15',
    total_appointments: 12,
    missed_appointments: 1,
    active_packages: 1,
    tags: [mockTags[0], mockTags[2]],
    messages_count: 24,
    last_message_at: '2024-01-20T14:30:00',
  },
  {
    id: '2',
    full_name: 'João Pedro Costa',
    phone: '(11) 98888-5678',
    email: 'joao.pedro@email.com',
    birth_date: '1990-07-22',
    crm_status: 'tratamento_em_andamento',
    preferred_contact: 'whatsapp',
    opt_out_messages: false,
    last_appointment: '2024-01-18',
    next_appointment: '2024-01-25',
    total_appointments: 8,
    missed_appointments: 0,
    active_packages: 2,
    tags: [mockTags[4]],
    messages_count: 16,
    last_message_at: '2024-01-18T10:00:00',
  },
  {
    id: '3',
    full_name: 'Ana Beatriz Lima',
    phone: '(11) 97777-9012',
    email: 'ana.beatriz@email.com',
    birth_date: '1978-11-08',
    crm_status: 'inativo',
    preferred_contact: 'email',
    opt_out_messages: false,
    last_appointment: '2023-09-10',
    total_appointments: 5,
    missed_appointments: 2,
    active_packages: 0,
    tags: [mockTags[1]],
    messages_count: 8,
    last_message_at: '2023-10-15T09:00:00',
  },
  {
    id: '4',
    full_name: 'Carlos Eduardo Oliveira',
    phone: '(11) 96666-3456',
    email: 'carlos.edu@email.com',
    birth_date: '1995-05-30',
    crm_status: 'novo_contato',
    preferred_contact: 'whatsapp',
    opt_out_messages: false,
    total_appointments: 0,
    missed_appointments: 0,
    active_packages: 0,
    tags: [],
    messages_count: 2,
    last_message_at: '2024-01-22T16:45:00',
  },
  {
    id: '5',
    full_name: 'Fernanda Rodrigues',
    phone: '(11) 95555-7890',
    email: 'fernanda.r@email.com',
    birth_date: '1982-09-12',
    crm_status: 'alta_finalizado',
    preferred_contact: 'whatsapp',
    opt_out_messages: true,
    last_appointment: '2023-12-20',
    total_appointments: 15,
    missed_appointments: 0,
    active_packages: 0,
    tags: [mockTags[0], mockTags[3]],
    messages_count: 32,
    last_message_at: '2023-12-20T11:30:00',
  },
];

// Mock Templates
const mockTemplates: MessageTemplate[] = [
  {
    id: '1',
    name: 'Confirmação de Consulta',
    category: 'confirmacao_consulta',
    channel: 'whatsapp',
    content: 'Olá {{nome_paciente}}! 👋\n\nSua consulta está confirmada para {{data_consulta}} às {{hora_consulta}} com {{profissional}}.\n\nConfirme sua presença respondendo SIM.\n\nAté breve! 💚',
    is_active: true,
    is_system: true,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  },
  {
    id: '2',
    name: 'Lembrete 24h',
    category: 'lembrete_consulta',
    channel: 'whatsapp',
    content: 'Olá {{nome_paciente}}! 🔔\n\nLembrando que amanhã você tem consulta às {{hora_consulta}} com {{profissional}}.\n\nTe esperamos! 💚',
    is_active: true,
    is_system: true,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  },
  {
    id: '3',
    name: 'Pós-Consulta',
    category: 'pos_consulta',
    channel: 'whatsapp',
    content: 'Olá {{nome_paciente}}! 💚\n\nFoi um prazer atendê-lo(a) hoje!\n\nSe tiver dúvidas, estamos à disposição.\n\nCuide-se! 🙏',
    is_active: true,
    is_system: true,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  },
  {
    id: '4',
    name: 'Convite de Retorno',
    category: 'convite_retorno',
    channel: 'whatsapp',
    content: 'Olá {{nome_paciente}}! 👋\n\nJá faz um tempo desde sua última visita. Que tal agendar seu retorno?\n\nClique aqui: {{link_agenda}}\n\nEstamos te esperando! 💚',
    is_active: true,
    is_system: true,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  },
  {
    id: '5',
    name: 'Aniversário',
    category: 'aniversario',
    channel: 'whatsapp',
    content: '🎂 Parabéns, {{nome_paciente}}!\n\nToda a equipe deseja um dia muito especial!\n\nQue esse novo ciclo seja repleto de saúde! 🎉💚',
    is_active: true,
    is_system: true,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  },
];

// Mock Automations
const mockAutomations: AutomationRule[] = [
  {
    id: '1',
    clinic_id: 'clinic-1',
    name: 'Confirmação ao Agendar',
    description: 'Envia mensagem de confirmação quando uma consulta é agendada',
    trigger_type: 'appointment_created',
    trigger_config: {},
    template_id: '1',
    template: mockTemplates[0],
    is_active: true,
    priority: 1,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  },
  {
    id: '2',
    clinic_id: 'clinic-1',
    name: 'Lembrete 24h Antes',
    description: 'Envia lembrete 24 horas antes da consulta',
    trigger_type: 'appointment_reminder',
    trigger_config: { hours_before: 24 },
    template_id: '2',
    template: mockTemplates[1],
    is_active: true,
    priority: 2,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  },
  {
    id: '3',
    clinic_id: 'clinic-1',
    name: 'Mensagem Pós-Atendimento',
    description: 'Envia mensagem após finalizar o atendimento',
    trigger_type: 'appointment_finished',
    trigger_config: {},
    template_id: '3',
    template: mockTemplates[2],
    is_active: true,
    priority: 3,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  },
  {
    id: '4',
    clinic_id: 'clinic-1',
    name: 'Convite de Retorno 30 dias',
    description: 'Convida pacientes para retorno após 30 dias sem consulta',
    trigger_type: 'return_reminder',
    trigger_config: { days_after: 30 },
    template_id: '4',
    template: mockTemplates[3],
    is_active: false,
    priority: 4,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  },
  {
    id: '5',
    clinic_id: 'clinic-1',
    name: 'Aniversário',
    description: 'Envia mensagem de aniversário para pacientes',
    trigger_type: 'patient_birthday',
    trigger_config: {},
    template_id: '5',
    template: mockTemplates[4],
    is_active: true,
    priority: 5,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  },
];

// Mock Campaigns
const mockCampaigns: MarketingCampaign[] = [
  {
    id: '1',
    clinic_id: 'clinic-1',
    name: 'Vagas da Semana',
    description: 'Divulgação de horários disponíveis esta semana',
    template_id: '4',
    segment_config: { is_inactive: true, days_since_last_visit: 60 },
    status: 'sent',
    sent_at: '2024-01-15T10:00:00',
    total_recipients: 45,
    sent_count: 45,
    delivered_count: 42,
    read_count: 28,
    error_count: 3,
    created_at: '2024-01-14',
    updated_at: '2024-01-15',
  },
  {
    id: '2',
    clinic_id: 'clinic-1',
    name: 'Retorno Pendente',
    description: 'Lembrete para pacientes com retorno atrasado',
    template_id: '4',
    segment_config: { days_since_last_visit: 90, tags: ['2'] },
    status: 'scheduled',
    scheduled_at: '2024-01-25T09:00:00',
    total_recipients: 23,
    sent_count: 0,
    delivered_count: 0,
    read_count: 0,
    error_count: 0,
    created_at: '2024-01-20',
    updated_at: '2024-01-20',
  },
  {
    id: '3',
    clinic_id: 'clinic-1',
    name: 'Promoção Estética Janeiro',
    description: 'Campanha de procedimentos estéticos',
    segment_config: { tags: ['3'] },
    status: 'draft',
    total_recipients: 0,
    sent_count: 0,
    delivered_count: 0,
    read_count: 0,
    error_count: 0,
    created_at: '2024-01-22',
    updated_at: '2024-01-22',
  },
];

// Mock Message Logs
const mockMessageLogs: MessageLog[] = [
  {
    id: '1',
    clinic_id: 'clinic-1',
    patient_id: '1',
    patient: { full_name: 'Maria Silva Santos', phone: '(11) 99999-1234' },
    template_id: '1',
    channel: 'whatsapp',
    message_type: 'automation',
    content: 'Olá Maria Silva Santos! 👋\n\nSua consulta está confirmada para 20/01/2024 às 14:00 com Dr. João Oliveira.\n\nConfirme sua presença respondendo SIM.\n\nAté breve! 💚',
    status: 'read',
    status_updated_at: '2024-01-19T15:30:00',
    created_at: '2024-01-19T14:00:00',
    metadata: {},
  },
  {
    id: '2',
    clinic_id: 'clinic-1',
    patient_id: '2',
    patient: { full_name: 'João Pedro Costa', phone: '(11) 98888-5678' },
    template_id: '2',
    channel: 'whatsapp',
    message_type: 'automation',
    content: 'Olá João Pedro Costa! 🔔\n\nLembrando que amanhã você tem consulta às 10:00 com Dra. Ana Costa.\n\nTe esperamos! 💚',
    status: 'delivered',
    status_updated_at: '2024-01-17T09:05:00',
    created_at: '2024-01-17T09:00:00',
    metadata: {},
  },
  {
    id: '3',
    clinic_id: 'clinic-1',
    patient_id: '3',
    patient: { full_name: 'Ana Beatriz Lima', phone: '(11) 97777-9012' },
    campaign_id: '1',
    channel: 'whatsapp',
    message_type: 'campaign',
    content: 'Olá Ana Beatriz Lima! 👋\n\nJá faz um tempo desde sua última visita. Que tal agendar seu retorno?',
    status: 'failed',
    status_updated_at: '2024-01-15T10:05:00',
    error_message: 'Número inválido ou bloqueado',
    created_at: '2024-01-15T10:00:00',
    metadata: {},
  },
  {
    id: '4',
    clinic_id: 'clinic-1',
    patient_id: '1',
    patient: { full_name: 'Maria Silva Santos', phone: '(11) 99999-1234' },
    template_id: '3',
    channel: 'whatsapp',
    message_type: 'automation',
    content: 'Olá Maria Silva Santos! 💚\n\nFoi um prazer atendê-lo(a) hoje!\n\nSe tiver dúvidas, estamos à disposição.\n\nCuide-se! 🙏',
    status: 'sent',
    status_updated_at: '2024-01-20T15:00:00',
    created_at: '2024-01-20T14:30:00',
    metadata: {},
  },
];

// Mock Settings
const mockSettings: CommunicationSettings = {
  id: '1',
  clinic_id: 'clinic-1',
  daily_message_limit: 500,
  send_start_time: '08:00',
  send_end_time: '20:00',
  send_on_weekends: false,
  whatsapp_connected: false,
  default_channel: 'whatsapp',
  created_at: '2024-01-01',
  updated_at: '2024-01-01',
};

export function useComunicacaoMockData() {
  const [crmPatients] = useState<CRMPatient[]>(mockCRMPatients);
  const [tags] = useState<PatientTag[]>(mockTags);
  const [templates] = useState<MessageTemplate[]>(mockTemplates);
  const [automations, setAutomations] = useState<AutomationRule[]>(mockAutomations);
  const [campaigns] = useState<MarketingCampaign[]>(mockCampaigns);
  const [messageLogs] = useState<MessageLog[]>(mockMessageLogs);
  const [settings] = useState<CommunicationSettings>(mockSettings);

  // Estatísticas do pipeline
  const pipelineStats = useMemo(() => {
    const stats: Record<CRMStatus, number> = {
      novo_contato: 0,
      primeira_consulta_agendada: 0,
      em_atendimento: 0,
      tratamento_em_andamento: 0,
      em_acompanhamento: 0,
      inativo: 0,
      alta_finalizado: 0,
    };

    crmPatients.forEach((patient) => {
      // Fix: handle potential typo in mock data
      const status = patient.crm_status === 'nova_contato' as CRMStatus ? 'novo_contato' : patient.crm_status;
      if (stats[status] !== undefined) {
        stats[status]++;
      }
    });

    return stats;
  }, [crmPatients]);

  // Estatísticas de mensagens
  const messageStats = useMemo(() => {
    const total = messageLogs.length;
    const sent = messageLogs.filter((m) => m.status === 'sent' || m.status === 'delivered' || m.status === 'read').length;
    const delivered = messageLogs.filter((m) => m.status === 'delivered' || m.status === 'read').length;
    const read = messageLogs.filter((m) => m.status === 'read').length;
    const failed = messageLogs.filter((m) => m.status === 'failed').length;

    return {
      total,
      sent,
      delivered,
      read,
      failed,
      deliveryRate: sent > 0 ? Math.round((delivered / sent) * 100) : 0,
      readRate: delivered > 0 ? Math.round((read / delivered) * 100) : 0,
    };
  }, [messageLogs]);

  // Toggle automação
  const toggleAutomation = (id: string) => {
    setAutomations((prev) =>
      prev.map((a) => (a.id === id ? { ...a, is_active: !a.is_active } : a))
    );
  };

  return {
    crmPatients,
    tags,
    templates,
    automations,
    campaigns,
    messageLogs,
    settings,
    pipelineStats,
    messageStats,
    toggleAutomation,
  };
}
