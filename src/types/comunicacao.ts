// CRM Status do Paciente
export type CRMStatus = 
  | 'novo_contato'
  | 'primeira_consulta_agendada'
  | 'em_atendimento'
  | 'tratamento_em_andamento'
  | 'em_acompanhamento'
  | 'inativo'
  | 'alta_finalizado';

export const CRM_STATUS_LABELS: Record<CRMStatus, string> = {
  novo_contato: 'Novo Contato',
  primeira_consulta_agendada: 'Primeira Consulta Agendada',
  em_atendimento: 'Em Atendimento',
  tratamento_em_andamento: 'Tratamento em Andamento',
  em_acompanhamento: 'Em Acompanhamento',
  inativo: 'Inativo',
  alta_finalizado: 'Alta / Finalizado',
};

export const CRM_STATUS_COLORS: Record<CRMStatus, string> = {
  novo_contato: 'bg-blue-100 text-blue-800 border-blue-200',
  primeira_consulta_agendada: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  em_atendimento: 'bg-amber-100 text-amber-800 border-amber-200',
  tratamento_em_andamento: 'bg-purple-100 text-purple-800 border-purple-200',
  em_acompanhamento: 'bg-teal-100 text-teal-800 border-teal-200',
  inativo: 'bg-gray-100 text-gray-800 border-gray-200',
  alta_finalizado: 'bg-green-100 text-green-800 border-green-200',
};

// Canal de comunicação
export type CommunicationChannel = 'whatsapp' | 'sms' | 'email' | 'phone';

export const CHANNEL_LABELS: Record<CommunicationChannel, string> = {
  whatsapp: 'WhatsApp',
  sms: 'SMS',
  email: 'E-mail',
  phone: 'Telefone',
};

export const CHANNEL_ICONS: Record<CommunicationChannel, string> = {
  whatsapp: 'MessageCircle',
  sms: 'Smartphone',
  email: 'Mail',
  phone: 'Phone',
};

// Categorias de templates
export type TemplateCategory = 
  | 'confirmacao_consulta'
  | 'lembrete_consulta'
  | 'pos_consulta'
  | 'convite_retorno'
  | 'pacote_fim'
  | 'pacote_vencido'
  | 'aniversario'
  | 'reativacao'
  | 'pesquisa_satisfacao'
  | 'campanha_geral';

export const TEMPLATE_CATEGORY_LABELS: Record<TemplateCategory, string> = {
  confirmacao_consulta: 'Confirmação de Consulta',
  lembrete_consulta: 'Lembrete de Consulta',
  pos_consulta: 'Pós-Consulta',
  convite_retorno: 'Convite de Retorno',
  pacote_fim: 'Pacote Próximo do Fim',
  pacote_vencido: 'Pacote Vencido',
  aniversario: 'Aniversário',
  reativacao: 'Reativação de Paciente',
  pesquisa_satisfacao: 'Pesquisa de Satisfação',
  campanha_geral: 'Campanha Geral',
};

// Tipos de gatilhos de automação
export type TriggerType = 
  | 'appointment_created'
  | 'appointment_reminder'
  | 'appointment_finished'
  | 'return_reminder'
  | 'return_expiring'
  | 'package_80_percent'
  | 'package_expiring'
  | 'package_expired'
  | 'patient_missed'
  | 'patient_birthday'
  | 'patient_inactive';

export const TRIGGER_TYPE_LABELS: Record<TriggerType, string> = {
  appointment_created: 'Ao Agendar Consulta',
  appointment_reminder: 'Lembrete de Consulta',
  appointment_finished: 'Atendimento Finalizado',
  return_reminder: 'Convite de Retorno',
  return_expiring: 'Retorno Gratuito Vencendo',
  package_80_percent: 'Pacote 80% Utilizado',
  package_expiring: 'Pacote Vencendo',
  package_expired: 'Pacote Vencido',
  patient_missed: 'Paciente Faltou',
  patient_birthday: 'Aniversário do Paciente',
  patient_inactive: 'Paciente Inativo',
};

export const TRIGGER_TYPE_ICONS: Record<TriggerType, string> = {
  appointment_created: 'CalendarPlus',
  appointment_reminder: 'Bell',
  appointment_finished: 'CheckCircle',
  return_reminder: 'RotateCcw',
  return_expiring: 'Clock',
  package_80_percent: 'Package',
  package_expiring: 'AlertTriangle',
  package_expired: 'XCircle',
  patient_missed: 'UserX',
  patient_birthday: 'Cake',
  patient_inactive: 'UserMinus',
};

// Status de campanha
export type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'cancelled';

export const CAMPAIGN_STATUS_LABELS: Record<CampaignStatus, string> = {
  draft: 'Rascunho',
  scheduled: 'Agendada',
  sending: 'Enviando',
  sent: 'Enviada',
  cancelled: 'Cancelada',
};

export const CAMPAIGN_STATUS_COLORS: Record<CampaignStatus, string> = {
  draft: 'bg-gray-100 text-gray-800',
  scheduled: 'bg-blue-100 text-blue-800',
  sending: 'bg-amber-100 text-amber-800',
  sent: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

// Status de mensagem
export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed' | 'cancelled';

export const MESSAGE_STATUS_LABELS: Record<MessageStatus, string> = {
  pending: 'Pendente',
  sent: 'Enviada',
  delivered: 'Entregue',
  read: 'Lida',
  failed: 'Erro',
  cancelled: 'Cancelada',
};

export const MESSAGE_STATUS_COLORS: Record<MessageStatus, string> = {
  pending: 'bg-gray-100 text-gray-800',
  sent: 'bg-blue-100 text-blue-800',
  delivered: 'bg-cyan-100 text-cyan-800',
  read: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800',
};

// Tipo de mensagem
export type MessageType = 'automation' | 'campaign' | 'manual' | 'system';

export const MESSAGE_TYPE_LABELS: Record<MessageType, string> = {
  automation: 'Automação',
  campaign: 'Campanha',
  manual: 'Manual',
  system: 'Sistema',
};

// Interfaces
export interface PatientTag {
  id: string;
  clinic_id: string;
  name: string;
  color: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CRMPatientStatus {
  id: string;
  patient_id: string;
  clinic_id: string;
  status: CRMStatus;
  preferred_contact: CommunicationChannel;
  opt_out_messages: boolean;
  opt_out_date?: string;
  notes?: string;
  last_contact_at?: string;
  created_at: string;
  updated_at: string;
}

export interface MessageTemplate {
  id: string;
  clinic_id?: string;
  name: string;
  category: TemplateCategory;
  channel: CommunicationChannel;
  subject?: string;
  content: string;
  is_active: boolean;
  is_system: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface AutomationRule {
  id: string;
  clinic_id: string;
  name: string;
  description?: string;
  trigger_type: TriggerType;
  trigger_config: {
    hours_before?: number;
    days_after?: number;
    days_inactive?: number;
  };
  template_id?: string;
  template?: MessageTemplate;
  is_active: boolean;
  priority: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface SegmentConfig {
  days_since_last_visit?: number;
  has_active_package?: boolean;
  has_expired_package?: boolean;
  has_missed_appointments?: boolean;
  specialties?: string[];
  professionals?: string[];
  is_new_patient?: boolean;
  is_inactive?: boolean;
  tags?: string[];
}

export interface MarketingCampaign {
  id: string;
  clinic_id: string;
  name: string;
  description?: string;
  template_id?: string;
  template?: MessageTemplate;
  segment_config: SegmentConfig;
  status: CampaignStatus;
  scheduled_at?: string;
  sent_at?: string;
  total_recipients: number;
  sent_count: number;
  delivered_count: number;
  read_count: number;
  error_count: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface MessageLog {
  id: string;
  clinic_id: string;
  patient_id: string;
  patient?: {
    full_name: string;
    phone?: string;
  };
  template_id?: string;
  template?: MessageTemplate;
  campaign_id?: string;
  campaign?: MarketingCampaign;
  automation_rule_id?: string;
  channel: CommunicationChannel;
  message_type: MessageType;
  content: string;
  status: MessageStatus;
  status_updated_at?: string;
  error_message?: string;
  external_id?: string;
  metadata: Record<string, unknown>;
  sent_by?: string;
  created_at: string;
}

export interface CommunicationSettings {
  id: string;
  clinic_id: string;
  daily_message_limit: number;
  send_start_time: string;
  send_end_time: string;
  send_on_weekends: boolean;
  whatsapp_number?: string;
  whatsapp_connected: boolean;
  default_channel: CommunicationChannel;
  created_at: string;
  updated_at: string;
}

// CRM Patient com dados agregados
export interface CRMPatient {
  id: string;
  full_name: string;
  phone?: string;
  email?: string;
  birth_date?: string;
  crm_status: CRMStatus;
  preferred_contact: CommunicationChannel;
  opt_out_messages: boolean;
  last_appointment?: string;
  next_appointment?: string;
  total_appointments: number;
  missed_appointments: number;
  active_packages: number;
  tags: PatientTag[];
  messages_count: number;
  last_message_at?: string;
}

// Campos dinâmicos suportados
export const DYNAMIC_FIELDS = [
  { key: '{{nome_paciente}}', label: 'Nome do Paciente', description: 'Nome completo do paciente' },
  { key: '{{primeiro_nome}}', label: 'Primeiro Nome', description: 'Primeiro nome do paciente' },
  { key: '{{data_consulta}}', label: 'Data da Consulta', description: 'Data formatada da consulta' },
  { key: '{{hora_consulta}}', label: 'Hora da Consulta', description: 'Horário da consulta' },
  { key: '{{profissional}}', label: 'Profissional', description: 'Nome do profissional' },
  { key: '{{endereco_clinica}}', label: 'Endereço da Clínica', description: 'Endereço completo' },
  { key: '{{link_agenda}}', label: 'Link de Agendamento', description: 'Link para agendar online' },
  { key: '{{nome_clinica}}', label: 'Nome da Clínica', description: 'Nome da clínica' },
];
