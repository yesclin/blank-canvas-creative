export interface CrmFollowup {
  id: string;
  clinic_id: string;
  lead_id: string | null;
  opportunity_id: string | null;
  patient_id: string | null;
  followup_type: string;
  subject: string | null;
  notes: string | null;
  scheduled_at: string;
  completed_at: string | null;
  completed_by: string | null;
  status: string;
  assigned_to: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  lead?: { id: string; name: string } | null;
  opportunity?: { id: string; title: string } | null;
  patient?: { id: string; full_name: string } | null;
  assigned_profile?: { full_name: string } | null;
}

export interface CrmFollowupFormData {
  lead_id?: string;
  opportunity_id?: string;
  patient_id?: string;
  followup_type: string;
  subject?: string;
  notes?: string;
  scheduled_at: string;
  assigned_to?: string;
}

export const FOLLOWUP_TYPES = [
  { value: 'ligacao', label: 'Ligação' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'email', label: 'E-mail' },
  { value: 'presencial', label: 'Presencial' },
  { value: 'retorno', label: 'Retorno' },
  { value: 'lembrete', label: 'Lembrete' },
] as const;

export const FOLLOWUP_STATUSES = [
  { value: 'pending', label: 'Pendente' },
  { value: 'overdue', label: 'Atrasado' },
  { value: 'completed', label: 'Concluído' },
  { value: 'canceled', label: 'Cancelado' },
] as const;

export function getFollowupStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-800',
    overdue: 'bg-red-100 text-red-800',
    completed: 'bg-green-100 text-green-800',
    canceled: 'bg-gray-100 text-gray-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

export function getFollowupTypeIcon(type: string): string {
  const icons: Record<string, string> = {
    ligacao: '📞',
    whatsapp: '💬',
    email: '📧',
    presencial: '🤝',
    retorno: '🔄',
    lembrete: '🔔',
  };
  return icons[type] || '📋';
}
