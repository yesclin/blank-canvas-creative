// =============================================
// TIPOS DO MÓDULO GESTÃO
// =============================================

// =============================================
// CONTROLE DE ESTOQUE
// =============================================

export interface StockCategory {
  id: string;
  clinic_id: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StockProduct {
  id: string;
  clinic_id: string;
  category_id?: string;
  category?: StockCategory;
  name: string;
  unit: string;
  current_quantity: number;
  min_quantity: number;
  avg_cost?: number;
  supplier?: string;
  expiration_date?: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type MovementType = 'entrada' | 'saida' | 'ajuste';

export interface StockMovement {
  id: string;
  clinic_id: string;
  product_id: string;
  product?: StockProduct;
  movement_type: MovementType;
  quantity: number;
  reason: string;
  procedure_id?: string;
  professional_id?: string;
  unit_cost?: number;
  notes?: string;
  created_by?: string;
  created_at: string;
}

export const movementTypeLabels: Record<MovementType, string> = {
  entrada: 'Entrada',
  saida: 'Saída',
  ajuste: 'Ajuste',
};

export const movementReasons = {
  entrada: ['Compra', 'Doação', 'Transferência', 'Ajuste de inventário'],
  saida: ['Uso em atendimento', 'Perda', 'Vencimento', 'Transferência', 'Ajuste de inventário'],
  ajuste: ['Correção de inventário', 'Contagem física'],
};

export const stockUnits = [
  { value: 'un', label: 'Unidade' },
  { value: 'cx', label: 'Caixa' },
  { value: 'pct', label: 'Pacote' },
  { value: 'ml', label: 'Mililitro' },
  { value: 'l', label: 'Litro' },
  { value: 'g', label: 'Grama' },
  { value: 'kg', label: 'Quilograma' },
  { value: 'amp', label: 'Ampola' },
  { value: 'fr', label: 'Frasco' },
];

// =============================================
// FINANCEIRO
// =============================================

export interface FinanceCategory {
  id: string;
  clinic_id: string;
  name: string;
  type: 'entrada' | 'saida';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type TransactionType = 'entrada' | 'saida' | 'ajuste';

export interface FinanceTransaction {
  id: string;
  clinic_id: string;
  category_id?: string;
  category?: FinanceCategory;
  type: TransactionType;
  description: string;
  amount: number;
  payment_method?: string;
  origin?: string;
  appointment_id?: string;
  patient_id?: string;
  professional_id?: string;
  insurance_id?: string;
  transaction_date: string;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export type PackageStatus = 'ativo' | 'finalizado' | 'cancelado' | 'vencido';

export interface TreatmentPackage {
  id: string;
  clinic_id: string;
  patient_id: string;
  procedure_id?: string;
  name: string;
  total_sessions: number;
  used_sessions: number;
  total_amount: number;
  paid_amount: number;
  payment_method?: string;
  status: PackageStatus;
  valid_until?: string;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export const transactionTypeLabels: Record<TransactionType, string> = {
  entrada: 'Entrada',
  saida: 'Saída',
  ajuste: 'Ajuste',
};

export const paymentMethods = [
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'pix', label: 'PIX' },
  { value: 'credito', label: 'Cartão de Crédito' },
  { value: 'debito', label: 'Cartão de Débito' },
  { value: 'convenio', label: 'Convênio' },
  { value: 'boleto', label: 'Boleto' },
  { value: 'transferencia', label: 'Transferência' },
];

export const transactionOrigins = [
  { value: 'consulta', label: 'Consulta' },
  { value: 'procedimento', label: 'Procedimento' },
  { value: 'pacote', label: 'Pacote' },
  { value: 'produto', label: 'Venda de Produtos' },
  { value: 'outros', label: 'Outros' },
];

export const packageStatusLabels: Record<PackageStatus, string> = {
  ativo: 'Ativo',
  finalizado: 'Finalizado',
  cancelado: 'Cancelado',
  vencido: 'Vencido',
};

export const packageStatusColors: Record<PackageStatus, string> = {
  ativo: 'bg-green-100 text-green-800',
  finalizado: 'bg-blue-100 text-blue-800',
  cancelado: 'bg-red-100 text-red-800',
  vencido: 'bg-yellow-100 text-yellow-800',
};

// =============================================
// CONVÊNIOS
// =============================================

export interface InsuranceExtended {
  id: string;
  clinic_id: string;
  name: string;
  code?: string;
  ans_code?: string;
  contact_phone?: string;
  contact_email?: string;
  requires_authorization: boolean;
  return_allowed: boolean;
  return_days: number;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface InsuranceProcedure {
  id: string;
  clinic_id: string;
  insurance_id: string;
  procedure_id: string;
  covered_value?: number;
  requires_authorization: boolean;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type AuthorizationStatus = 'pendente' | 'aprovada' | 'negada' | 'utilizada';

export interface InsuranceAuthorization {
  id: string;
  clinic_id: string;
  insurance_id: string;
  patient_id: string;
  procedure_id?: string;
  appointment_id?: string;
  authorization_number: string;
  authorization_date: string;
  valid_until?: string;
  status: AuthorizationStatus;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export const authorizationStatusLabels: Record<AuthorizationStatus, string> = {
  pendente: 'Pendente',
  aprovada: 'Aprovada',
  negada: 'Negada',
  utilizada: 'Utilizada',
};

export const authorizationStatusColors: Record<AuthorizationStatus, string> = {
  pendente: 'bg-yellow-100 text-yellow-800',
  aprovada: 'bg-green-100 text-green-800',
  negada: 'bg-red-100 text-red-800',
  utilizada: 'bg-blue-100 text-blue-800',
};
