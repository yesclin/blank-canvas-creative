// =============================================
// INVENTORY ITEMS - CADASTRO MESTRE UNIFICADO
// =============================================

export type InventoryItemType =
  | 'clinical_supply'
  | 'medication'
  | 'injectable'
  | 'vaccine'
  | 'retail_product'
  | 'equipment'
  | 'other';

export interface InventoryItem {
  id: string;
  clinic_id: string;
  name: string;
  commercial_name?: string | null;
  description?: string | null;
  internal_code?: string | null;
  sku?: string | null;
  barcode?: string | null;
  category?: string | null;
  brand?: string | null;
  manufacturer?: string | null;
  item_type: InventoryItemType;
  is_sellable: boolean;
  is_consumable_in_procedures: boolean;
  is_active: boolean;
  controls_stock: boolean;
  controls_batch: boolean;
  controls_expiry: boolean;
  requires_traceability: boolean;
  requires_cold_chain: boolean;
  storage_notes?: string | null;
  unit_of_measure: string;
  minimum_stock: number;
  ideal_stock: number;
  default_cost_price: number;
  default_sale_price: number;
  alert_days_before_expiry: number;
  anvisa_registration?: string | null;
  composition?: string | null;
  leaflet_text_or_url?: string | null;
  supplier_id?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface InventoryItemFormData {
  name: string;
  commercial_name?: string;
  description?: string;
  internal_code?: string;
  sku?: string;
  barcode?: string;
  category?: string;
  brand?: string;
  manufacturer?: string;
  item_type: InventoryItemType;
  is_sellable: boolean;
  is_consumable_in_procedures: boolean;
  is_active: boolean;
  controls_stock: boolean;
  controls_batch: boolean;
  controls_expiry: boolean;
  requires_traceability: boolean;
  requires_cold_chain: boolean;
  storage_notes?: string;
  unit_of_measure: string;
  minimum_stock: number;
  ideal_stock: number;
  default_cost_price: number;
  default_sale_price: number;
  alert_days_before_expiry: number;
  anvisa_registration?: string;
  composition?: string;
  leaflet_text_or_url?: string;
  supplier_id?: string;
  notes?: string;
}

export const inventoryItemTypeLabels: Record<InventoryItemType, string> = {
  clinical_supply: 'Insumo Clínico',
  medication: 'Medicamento',
  injectable: 'Injetável',
  vaccine: 'Vacina',
  retail_product: 'Produto de Venda',
  equipment: 'Equipamento',
  other: 'Outro',
};

export const inventoryItemTypeColors: Record<InventoryItemType, string> = {
  clinical_supply: 'bg-blue-100 text-blue-800',
  medication: 'bg-green-100 text-green-800',
  injectable: 'bg-purple-100 text-purple-800',
  vaccine: 'bg-teal-100 text-teal-800',
  retail_product: 'bg-amber-100 text-amber-800',
  equipment: 'bg-slate-100 text-slate-800',
  other: 'bg-gray-100 text-gray-800',
};

export const inventoryUnits = [
  { value: 'un', label: 'Unidade' },
  { value: 'cx', label: 'Caixa' },
  { value: 'pct', label: 'Pacote' },
  { value: 'ml', label: 'Mililitro' },
  { value: 'l', label: 'Litro' },
  { value: 'g', label: 'Grama' },
  { value: 'kg', label: 'Quilograma' },
  { value: 'fr', label: 'Frasco' },
  { value: 'tb', label: 'Tubo' },
  { value: 'amp', label: 'Ampola' },
  { value: 'rl', label: 'Rolo' },
  { value: 'cp', label: 'Comprimido' },
  { value: 'dose', label: 'Dose' },
];

export const defaultInventoryItemForm: InventoryItemFormData = {
  name: '',
  item_type: 'clinical_supply',
  is_sellable: false,
  is_consumable_in_procedures: true,
  is_active: true,
  controls_stock: true,
  controls_batch: false,
  controls_expiry: false,
  requires_traceability: false,
  requires_cold_chain: false,
  unit_of_measure: 'un',
  minimum_stock: 0,
  ideal_stock: 0,
  default_cost_price: 0,
  default_sale_price: 0,
  alert_days_before_expiry: 30,
};
