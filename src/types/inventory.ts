// =============================================
// INVENTORY & SALES TYPES
// =============================================

export interface Product {
  id: string;
  clinic_id: string;
  name: string;
  description?: string | null;
  sku?: string | null;
  barcode?: string | null;
  category?: string | null;
  unit: string;
  stock_quantity: number;
  min_stock_quantity: number;
  cost_price: number;
  sale_price: number;
  supplier?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductFormData {
  name: string;
  description?: string;
  sku?: string;
  barcode?: string;
  category?: string;
  unit: string;
  stock_quantity?: number;
  min_stock_quantity?: number;
  cost_price?: number;
  sale_price: number;
  supplier?: string;
  is_active?: boolean;
}

export type StockMovementType = 'entrada' | 'saida' | 'ajuste' | 'venda' | 'devolucao';

export interface StockMovement {
  id: string;
  clinic_id: string;
  product_id: string;
  movement_type: StockMovementType;
  quantity: number;
  previous_quantity?: number | null;
  new_quantity?: number | null;
  unit_cost?: number | null;
  total_cost?: number | null;
  reason: string;
  reference_type?: string | null;
  reference_id?: string | null;
  notes?: string | null;
  created_by?: string | null;
  created_at: string;
  // Relations
  product?: Product;
}

export interface StockMovementFormData {
  product_id: string;
  movement_type: StockMovementType;
  quantity: number;
  unit_cost?: number;
  reason: string;
  reference_type?: string;
  reference_id?: string;
  notes?: string;
}

export type PaymentStatus = 'pendente' | 'pago' | 'parcial' | 'cancelado';

export type SaleStatus = 'ativo' | 'cancelado';

export interface Sale {
  id: string;
  clinic_id: string;
  sale_number?: string | null;
  patient_id?: string | null;
  professional_id?: string | null;
  sale_date: string;
  subtotal: number;
  discount_amount: number;
  discount_percent: number;
  total_amount: number;
  payment_method?: string | null;
  payment_status: PaymentStatus;
  status: SaleStatus;
  canceled_at?: string | null;
  canceled_by?: string | null;
  notes?: string | null;
  transaction_id?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  patients?: { id: string; full_name: string } | null;
  professionals?: { id: string; full_name: string } | null;
  sale_items?: SaleItem[];
}

export interface SaleFormData {
  patient_id?: string;
  professional_id?: string;
  appointment_id?: string;
  sale_date?: string;
  discount_amount?: number;
  discount_percent?: number;
  payment_method?: string;
  payment_status?: PaymentStatus;
  notes?: string;
  items: SaleItemFormData[];
}

export interface SaleItem {
  id: string;
  clinic_id: string;
  sale_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  total_price: number;
  cost_price: number;
  total_cost: number;
  profit: number;
  margin_percent: number;
  notes?: string | null;
  created_at: string;
  // Relations
  product?: Product;
}

export interface SaleItemFormData {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  discount_amount?: number;
  notes?: string;
}

// Labels and constants
export const stockMovementTypeLabels: Record<StockMovementType, string> = {
  entrada: 'Entrada',
  saida: 'Saída',
  ajuste: 'Ajuste',
  venda: 'Venda',
  devolucao: 'Devolução',
};

export const paymentStatusLabels: Record<PaymentStatus, string> = {
  pendente: 'Pendente',
  pago: 'Pago',
  parcial: 'Parcial',
  cancelado: 'Cancelado',
};

export const paymentStatusColors: Record<PaymentStatus, string> = {
  pendente: 'bg-yellow-100 text-yellow-800',
  pago: 'bg-green-100 text-green-800',
  parcial: 'bg-blue-100 text-blue-800',
  cancelado: 'bg-red-100 text-red-800',
};

export const stockMovementReasons: Record<StockMovementType, string[]> = {
  entrada: ['Compra', 'Doação', 'Transferência', 'Ajuste de inventário', 'Devolução de cliente'],
  saida: ['Uso interno', 'Perda', 'Vencimento', 'Transferência', 'Ajuste de inventário'],
  ajuste: ['Correção de inventário', 'Contagem física', 'Erro de sistema'],
  venda: ['Venda'],
  devolucao: ['Devolução de fornecedor', 'Produto com defeito'],
};

export const productUnits = [
  { value: 'un', label: 'Unidade' },
  { value: 'cx', label: 'Caixa' },
  { value: 'pct', label: 'Pacote' },
  { value: 'ml', label: 'Mililitro' },
  { value: 'l', label: 'Litro' },
  { value: 'g', label: 'Grama' },
  { value: 'kg', label: 'Quilograma' },
  { value: 'fr', label: 'Frasco' },
  { value: 'tb', label: 'Tubo' },
];

export const productCategories = [
  { value: 'cosmetico', label: 'Cosmético' },
  { value: 'medicamento', label: 'Medicamento' },
  { value: 'suplemento', label: 'Suplemento' },
  { value: 'equipamento', label: 'Equipamento' },
  { value: 'acessorio', label: 'Acessório' },
  { value: 'higiene', label: 'Higiene' },
  { value: 'outro', label: 'Outro' },
];
