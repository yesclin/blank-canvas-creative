// Clinical Timeline Types

export type TimelineEventType =
  // Administrative
  | 'PATIENT_CREATED'
  | 'APPOINTMENT_CREATED'
  | 'APPOINTMENT_STATUS_CHANGED'
  // Clinical
  | 'ANAMNESIS_CREATED'
  | 'EVOLUTION_CREATED'
  | 'DIAGNOSIS_ADDED'
  | 'PROCEDURE_ADDED'
  | 'PRESCRIPTION_CREATED'
  // Files
  | 'FILE_UPLOADED'
  | 'FILE_DOWNLOADED'
  // LGPD & Legal
  | 'CONSENT_COLLECTED'
  | 'CONSENT_REVOKED'
  | 'RECORD_SIGNED'
  | 'PDF_EXPORTED'
  // Security
  | 'UNAUTHORIZED_ACCESS_ATTEMPT'
  | 'ACCESS_LOGGED'
  // Sales
  | 'SALE_CREATED'
  | 'SALE_STATUS_UPDATED'
  // Stock / Product consumption
  | 'PRODUCT_CONSUMED'
  | 'PROCEDURE_COST_RECORDED'
  | 'KIT_CONSUMED'
  | 'SALE_CANCELLED';

export type TimelineEventCategory = 'administrative' | 'clinical' | 'files' | 'lgpd' | 'security' | 'sales' | 'stock';

export interface TimelineEvent {
  id: string;
  event_type: TimelineEventType;
  category: TimelineEventCategory;
  entity: string; // e.g., 'medical_record_entries', 'appointments'
  entity_id: string;
  patient_id: string;
  author_id: string | null;
  author_name: string;
  timestamp: string;
  summary: string;
  metadata: Record<string, unknown>;
  // For navigation
  target_tab?: string;
  can_navigate?: boolean;
}

export interface TimelineFilters {
  dateFrom?: string;
  dateTo?: string;
  eventTypes?: TimelineEventType[];
  categories?: TimelineEventCategory[];
  authorId?: string;
}

// Event type configurations
export const TIMELINE_EVENT_CONFIG: Record<TimelineEventType, {
  label: string;
  icon: string;
  category: TimelineEventCategory;
  color: string;
  bgColor: string;
  targetTab?: string;
}> = {
  // Administrative
  PATIENT_CREATED: {
    label: 'Paciente Cadastrado',
    icon: 'UserPlus',
    category: 'administrative',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
  },
  APPOINTMENT_CREATED: {
    label: 'Consulta Agendada',
    icon: 'Calendar',
    category: 'administrative',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
  },
  APPOINTMENT_STATUS_CHANGED: {
    label: 'Status Alterado',
    icon: 'RefreshCw',
    category: 'administrative',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
  },
  // Clinical
  ANAMNESIS_CREATED: {
    label: 'Anamnese Registrada',
    icon: 'ClipboardList',
    category: 'clinical',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    targetTab: 'anamnese',
  },
  EVOLUTION_CREATED: {
    label: 'Evolução Registrada',
    icon: 'Activity',
    category: 'clinical',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    targetTab: 'evolucao',
  },
  DIAGNOSIS_ADDED: {
    label: 'Diagnóstico Adicionado',
    icon: 'Stethoscope',
    category: 'clinical',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    targetTab: 'diagnostico',
  },
  PROCEDURE_ADDED: {
    label: 'Procedimento Realizado',
    icon: 'Syringe',
    category: 'clinical',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    targetTab: 'procedimentos',
  },
  PRESCRIPTION_CREATED: {
    label: 'Receita Emitida',
    icon: 'Pill',
    category: 'clinical',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    targetTab: 'prescricoes',
  },
  // Files
  FILE_UPLOADED: {
    label: 'Arquivo Anexado',
    icon: 'Upload',
    category: 'files',
    color: 'text-purple-700',
    bgColor: 'bg-purple-100',
    targetTab: 'documentos',
  },
  FILE_DOWNLOADED: {
    label: 'Arquivo Baixado',
    icon: 'Download',
    category: 'files',
    color: 'text-purple-700',
    bgColor: 'bg-purple-100',
  },
  // LGPD
  CONSENT_COLLECTED: {
    label: 'Consentimento Coletado',
    icon: 'FileCheck',
    category: 'lgpd',
    color: 'text-teal-700',
    bgColor: 'bg-teal-100',
    targetTab: 'consentimentos',
  },
  CONSENT_REVOKED: {
    label: 'Consentimento Revogado',
    icon: 'FileX',
    category: 'lgpd',
    color: 'text-orange-700',
    bgColor: 'bg-orange-100',
    targetTab: 'consentimentos',
  },
  RECORD_SIGNED: {
    label: 'Registro Assinado',
    icon: 'PenTool',
    category: 'lgpd',
    color: 'text-teal-700',
    bgColor: 'bg-teal-100',
  },
  PDF_EXPORTED: {
    label: 'PDF Exportado',
    icon: 'FileText',
    category: 'lgpd',
    color: 'text-teal-700',
    bgColor: 'bg-teal-100',
  },
  // Security
  UNAUTHORIZED_ACCESS_ATTEMPT: {
    label: 'Tentativa de Acesso Negada',
    icon: 'ShieldAlert',
    category: 'security',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
  },
  ACCESS_LOGGED: {
    label: 'Acesso Registrado',
    icon: 'Eye',
    category: 'security',
    color: 'text-gray-700',
    bgColor: 'bg-gray-100',
    targetTab: 'auditoria',
  },
  // Sales
  SALE_CREATED: {
    label: 'Venda Realizada',
    icon: 'ShoppingCart',
    category: 'sales',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-100',
  },
  SALE_STATUS_UPDATED: {
    label: 'Status da Venda Atualizado',
    icon: 'RefreshCw',
    category: 'sales',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
  },
  SALE_CANCELLED: {
    label: 'Venda Cancelada',
    icon: 'XCircle',
    category: 'sales',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
  },
  // Stock / Product consumption
  PRODUCT_CONSUMED: {
    label: 'Produto Consumido',
    icon: 'Package',
    category: 'stock',
    color: 'text-orange-700',
    bgColor: 'bg-orange-100',
    targetTab: 'procedimentos',
  },
  PROCEDURE_COST_RECORDED: {
    label: 'Custo Registrado',
    icon: 'DollarSign',
    category: 'stock',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    targetTab: 'procedimentos',
  },
  KIT_CONSUMED: {
    label: 'Kit Consumido',
    icon: 'Boxes',
    category: 'stock',
    color: 'text-purple-700',
    bgColor: 'bg-purple-100',
    targetTab: 'procedimentos',
  },
};

export const CATEGORY_LABELS: Record<TimelineEventCategory, { label: string; color: string }> = {
  administrative: { label: 'Administrativo', color: 'text-blue-600' },
  clinical: { label: 'Clínico', color: 'text-green-600' },
  files: { label: 'Arquivos', color: 'text-purple-600' },
  lgpd: { label: 'LGPD / Legal', color: 'text-teal-600' },
  security: { label: 'Segurança', color: 'text-gray-600' },
  sales: { label: 'Vendas', color: 'text-emerald-600' },
  stock: { label: 'Estoque', color: 'text-orange-600' },
};
