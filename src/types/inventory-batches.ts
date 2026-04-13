export type BatchStatus = 'active' | 'expired' | 'blocked' | 'depleted';

export interface InventoryBatch {
  id: string;
  clinic_id: string;
  item_id: string;
  batch_number: string;
  manufacturing_date?: string | null;
  expiry_date?: string | null;
  supplier_id?: string | null;
  invoice_number?: string | null;
  unit_cost: number;
  unit_sale_price?: number | null;
  quantity_received: number;
  quantity_available: number;
  storage_location?: string | null;
  status: BatchStatus;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  inventory_items?: { id: string; name: string; unit_of_measure: string; controls_expiry: boolean };
}

export interface InventoryBatchFormData {
  item_id: string;
  batch_number: string;
  manufacturing_date?: string;
  expiry_date?: string;
  supplier_id?: string;
  invoice_number?: string;
  unit_cost: number;
  unit_sale_price?: number;
  quantity_received: number;
  storage_location?: string;
  notes?: string;
}

export type InventoryMovementType =
  | 'purchase_entry'
  | 'manual_entry'
  | 'procedure_consumption'
  | 'sale'
  | 'adjustment'
  | 'loss'
  | 'return'
  | 'transfer';

export interface InventoryMovement {
  id: string;
  clinic_id: string;
  item_id: string;
  batch_id?: string | null;
  movement_type: InventoryMovementType;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  unit_sale_price?: number | null;
  reason?: string | null;
  source_module?: string | null;
  source_id?: string | null;
  patient_id?: string | null;
  professional_id?: string | null;
  appointment_id?: string | null;
  notes?: string | null;
  created_by?: string | null;
  created_at: string;
  // Relations
  inventory_items?: { id: string; name: string; unit_of_measure: string };
  inventory_batches?: { id: string; batch_number: string } | null;
}

export interface InventoryMovementFormData {
  item_id: string;
  batch_id?: string;
  movement_type: InventoryMovementType;
  quantity: number;
  unit_cost?: number;
  unit_sale_price?: number;
  reason?: string;
  source_module?: string;
  source_id?: string;
  patient_id?: string;
  professional_id?: string;
  appointment_id?: string;
  notes?: string;
}

export const movementTypeLabels: Record<InventoryMovementType, string> = {
  purchase_entry: 'Entrada por Compra',
  manual_entry: 'Entrada Manual',
  procedure_consumption: 'Consumo em Procedimento',
  sale: 'Venda',
  adjustment: 'Ajuste',
  loss: 'Perda',
  return: 'Devolução',
  transfer: 'Transferência',
};

export const movementTypeColors: Record<InventoryMovementType, string> = {
  purchase_entry: 'bg-green-100 text-green-800',
  manual_entry: 'bg-blue-100 text-blue-800',
  procedure_consumption: 'bg-orange-100 text-orange-800',
  sale: 'bg-purple-100 text-purple-800',
  adjustment: 'bg-slate-100 text-slate-800',
  loss: 'bg-red-100 text-red-800',
  return: 'bg-teal-100 text-teal-800',
  transfer: 'bg-amber-100 text-amber-800',
};

export const batchStatusLabels: Record<BatchStatus, string> = {
  active: 'Ativo',
  expired: 'Vencido',
  blocked: 'Bloqueado',
  depleted: 'Esgotado',
};

export const batchStatusColors: Record<BatchStatus, string> = {
  active: 'bg-green-100 text-green-800',
  expired: 'bg-red-100 text-red-800',
  blocked: 'bg-yellow-100 text-yellow-800',
  depleted: 'bg-slate-100 text-slate-800',
};

// Which movement types are "entries" (increase stock)
export const entryMovementTypes: InventoryMovementType[] = ['purchase_entry', 'manual_entry', 'return'];
// Which movement types are "exits" (decrease stock)
export const exitMovementTypes: InventoryMovementType[] = ['procedure_consumption', 'sale', 'loss', 'transfer'];

export const entryReasons = [
  'Compra de fornecedor',
  'Doação',
  'Transferência entre unidades',
  'Devolução de cliente',
  'Outro',
];

export const exitReasons = [
  'Uso interno',
  'Perda',
  'Vencimento',
  'Transferência',
  'Descarte',
  'Outro',
];

export const adjustmentReasons = [
  'Correção de inventário',
  'Contagem física',
  'Erro de sistema',
  'Outro',
];
