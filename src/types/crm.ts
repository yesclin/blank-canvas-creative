export interface CrmLead {
  id: string;
  clinic_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  birth_date: string | null;
  gender: string | null;
  source: string | null;
  campaign_name: string | null;
  specialty_interest_id: string | null;
  procedure_interest_id: string | null;
  status: string;
  notes: string | null;
  assigned_to: string | null;
  created_by: string | null;
  patient_id: string | null;
  converted_patient_id: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  specialty_interest?: { id: string; name: string } | null;
  procedure_interest?: { id: string; name: string } | null;
  assigned_profile?: { full_name: string } | null;
}

export interface CrmLeadFormData {
  name: string;
  email?: string;
  phone?: string;
  birth_date?: string;
  gender?: string;
  source?: string;
  campaign_name?: string;
  specialty_interest_id?: string;
  procedure_interest_id?: string;
  status?: string;
  notes?: string;
  assigned_to?: string;
}

export interface CrmOpportunity {
  id: string;
  clinic_id: string;
  lead_id: string | null;
  patient_id: string | null;
  pipeline_stage_id: string | null;
  title: string;
  estimated_value: number | null;
  status: string;
  professional_id: string | null;
  procedure_id: string | null;
  specialty_id: string | null;
  loss_reason_id: string | null;
  loss_reason: string | null;
  expected_close_date: string | null;
  closed_at: string | null;
  closing_probability: number;
  is_won: boolean;
  is_lost: boolean;
  assigned_to_user_id: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  lead?: { id: string; name: string } | null;
  patient?: { id: string; full_name: string } | null;
  specialty?: { id: string; name: string } | null;
  procedure?: { id: string; name: string } | null;
  professional?: { id: string; name: string } | null;
  assigned_profile?: { full_name: string } | null;
}

export interface CrmOpportunityFormData {
  title: string;
  lead_id?: string;
  patient_id?: string;
  specialty_id?: string;
  professional_id?: string;
  procedure_id?: string;
  estimated_value?: number;
  closing_probability?: number;
  expected_close_date?: string;
  assigned_to_user_id?: string;
  notes?: string;
  status?: string;
}

export interface CrmOpportunityHistory {
  id: string;
  clinic_id: string;
  opportunity_id: string;
  field_changed: string;
  old_value: string | null;
  new_value: string | null;
  changed_by: string | null;
  created_at: string;
}

export const LEAD_STATUSES = [
  { value: 'novo', label: 'Novo' },
  { value: 'contatado', label: 'Contatado' },
  { value: 'qualificado', label: 'Qualificado' },
  { value: 'negociando', label: 'Negociando' },
  { value: 'convertido', label: 'Convertido' },
  { value: 'perdido', label: 'Perdido' },
  { value: 'arquivado', label: 'Arquivado' },
] as const;

export const LEAD_SOURCES = [
  { value: 'site', label: 'Site' },
  { value: 'indicacao', label: 'Indicação' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'google', label: 'Google' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'campanha', label: 'Campanha' },
  { value: 'telefone', label: 'Telefone' },
  { value: 'presencial', label: 'Presencial' },
  { value: 'outro', label: 'Outro' },
] as const;

export const OPPORTUNITY_STATUSES = [
  { value: 'aberta', label: 'Aberta' },
  { value: 'ganha', label: 'Ganha' },
  { value: 'perdida', label: 'Perdida' },
] as const;

export function getLeadStatusColor(status: string): string {
  const colors: Record<string, string> = {
    novo: 'bg-blue-100 text-blue-800',
    contatado: 'bg-cyan-100 text-cyan-800',
    qualificado: 'bg-emerald-100 text-emerald-800',
    negociando: 'bg-amber-100 text-amber-800',
    convertido: 'bg-green-100 text-green-800',
    perdido: 'bg-red-100 text-red-800',
    arquivado: 'bg-gray-100 text-gray-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

export function getOpportunityStatusColor(status: string): string {
  const colors: Record<string, string> = {
    aberta: 'bg-blue-100 text-blue-800',
    ganha: 'bg-green-100 text-green-800',
    perdida: 'bg-red-100 text-red-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}
