export interface CrmQuote {
  id: string;
  clinic_id: string;
  lead_id: string | null;
  patient_id: string | null;
  opportunity_id: string | null;
  professional_id: string | null;
  quote_number: string | null;
  status: string;
  total_value: number;
  discount_value: number;
  discount_percent: number;
  final_value: number;
  valid_until: string | null;
  notes: string | null;
  terms_text: string | null;
  approved_at: string | null;
  rejected_at: string | null;
  converted_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  lead?: { id: string; name: string } | null;
  patient?: { id: string; full_name: string } | null;
  opportunity?: { id: string; title: string } | null;
  professional?: { id: string; name: string } | null;
  items?: CrmQuoteItem[];
}

export interface CrmQuoteItem {
  id: string;
  clinic_id: string;
  quote_id: string;
  procedure_id: string | null;
  specialty_id: string | null;
  professional_id: string | null;
  package_id: string | null;
  description: string;
  quantity: number;
  unit_value: number;
  discount_percent: number;
  total_value: number;
  created_at: string;
  updated_at: string;
  // Joined
  procedure?: { id: string; name: string } | null;
}

export interface CrmQuoteItemFormData {
  procedure_id?: string;
  specialty_id?: string;
  professional_id?: string;
  description: string;
  quantity: number;
  unit_value: number;
  discount_percent: number;
}

export interface CrmQuoteFormData {
  lead_id?: string;
  patient_id?: string;
  opportunity_id?: string;
  professional_id?: string;
  valid_until?: string;
  notes?: string;
  terms_text?: string;
  discount_percent?: number;
  items: CrmQuoteItemFormData[];
}

export const QUOTE_STATUSES = [
  { value: 'draft', label: 'Rascunho' },
  { value: 'sent', label: 'Enviado' },
  { value: 'viewed', label: 'Visualizado' },
  { value: 'approved', label: 'Aprovado' },
  { value: 'rejected', label: 'Recusado' },
  { value: 'expired', label: 'Expirado' },
  { value: 'converted', label: 'Convertido' },
] as const;

export function getQuoteStatusColor(status: string): string {
  const colors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-800',
    sent: 'bg-blue-100 text-blue-800',
    viewed: 'bg-cyan-100 text-cyan-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    expired: 'bg-amber-100 text-amber-800',
    converted: 'bg-emerald-100 text-emerald-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

export function calculateItemTotal(item: CrmQuoteItemFormData): number {
  const subtotal = item.quantity * item.unit_value;
  const discount = subtotal * (item.discount_percent / 100);
  return Math.max(0, subtotal - discount);
}

export function calculateQuoteTotals(items: CrmQuoteItemFormData[], discountPercent: number = 0) {
  const subtotal = items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  const discountAmount = subtotal * (discountPercent / 100);
  const total = Math.max(0, subtotal - discountAmount);
  return { subtotal, discountAmount, total };
}
