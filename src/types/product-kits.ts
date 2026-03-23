// =============================================
// TIPOS DO MÓDULO PRODUCT KITS
// =============================================

export interface ProductKit {
  id: string;
  clinic_id: string;
  name: string;
  description?: string | null;
  is_active: boolean;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  // Computed
  items_count?: number;
  total_cost?: number;
}

export interface ProductKitFormData {
  name: string;
  description?: string;
}

export interface ProductKitItem {
  id: string;
  kit_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
  // Joined fields
  product_name?: string;
  product_unit?: string;
  product_cost_price?: number;
  product_stock?: number;
}

export interface ProductKitItemFormData {
  product_id: string;
  quantity: number;
}

export interface ProcedureProductKit {
  id: string;
  clinic_id: string;
  procedure_id: string;
  kit_id: string;
  quantity: number;
  is_required: boolean;
  created_at: string;
  // Joined fields
  kit_name?: string;
  kit_total_cost?: number;
  procedure_name?: string;
}

export interface ProcedureProductKitFormData {
  procedure_id: string;
  kit_id: string;
  quantity: number;
  is_required: boolean;
}
