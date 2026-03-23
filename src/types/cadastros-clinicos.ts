// =============================================
// TIPOS DO MÓDULO CADASTROS CLÍNICOS
// =============================================

// =============================================
// MATERIAIS
// =============================================

export type MaterialCategory = 
  | 'descartavel' 
  | 'medicamento' 
  | 'epi' 
  | 'instrumento' 
  | 'reagente'
  | 'consumivel'
  | 'outros';

export interface Material {
  id: string;
  clinic_id: string;
  name: string;
  category: MaterialCategory;
  unit: string;
  min_quantity: number;
  unit_cost?: number;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MaterialFormData {
  name: string;
  category: MaterialCategory;
  unit: string;
  min_quantity: number;
  unit_cost?: number;
  description?: string;
}

export const materialCategoryLabels: Record<MaterialCategory, string> = {
  descartavel: 'Descartável',
  medicamento: 'Medicamento',
  epi: 'EPI',
  instrumento: 'Instrumento',
  reagente: 'Reagente',
  consumivel: 'Consumível',
  outros: 'Outros',
};

export const materialCategoryColors: Record<MaterialCategory, string> = {
  descartavel: 'bg-blue-100 text-blue-800',
  medicamento: 'bg-green-100 text-green-800',
  epi: 'bg-yellow-100 text-yellow-800',
  instrumento: 'bg-purple-100 text-purple-800',
  reagente: 'bg-orange-100 text-orange-800',
  consumivel: 'bg-pink-100 text-pink-800',
  outros: 'bg-gray-100 text-gray-800',
};

export const materialUnits = [
  { value: 'unidade', label: 'Unidade' },
  { value: 'pacote', label: 'Pacote' },
  { value: 'caixa', label: 'Caixa' },
  { value: 'litro', label: 'Litro' },
  { value: 'ml', label: 'Mililitro (ml)' },
  { value: 'kg', label: 'Quilograma (kg)' },
  { value: 'g', label: 'Grama (g)' },
  { value: 'ampola', label: 'Ampola' },
  { value: 'frasco', label: 'Frasco' },
  { value: 'tubo', label: 'Tubo' },
  { value: 'rolo', label: 'Rolo' },
];

// =============================================
// VÍNCULOS PROCEDIMENTO-MATERIAL
// =============================================

export interface ProcedureMaterial {
  id: string;
  clinic_id: string;
  procedure_id: string;
  material_id: string;
  quantity: number;
  unit: string;
  is_required: boolean;
  allow_manual_edit: boolean;
  notes?: string;
  created_at: string;
  // Joined fields
  material_name?: string;
  material_category?: MaterialCategory;
  material_unit_cost?: number;
  procedure_name?: string;
}

export interface ProcedureMaterialFormData {
  procedure_id: string;
  material_id: string;
  quantity: number;
  unit: string;
  is_required: boolean;
  allow_manual_edit: boolean;
  notes?: string;
}

// =============================================
// KITS DE MATERIAIS
// =============================================

export interface MaterialKit {
  id: string;
  clinic_id: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
  // Computed
  items_count?: number;
  total_cost?: number;
}

export interface MaterialKitFormData {
  name: string;
  description?: string;
}

export interface MaterialKitItem {
  id: string;
  kit_id: string;
  material_id: string;
  quantity: number;
  unit: string;
  created_at: string;
  // Joined fields
  material_name?: string;
  material_category?: MaterialCategory;
  material_unit_cost?: number;
}

export interface MaterialKitItemFormData {
  material_id: string;
  quantity: number;
  unit: string;
}

// =============================================
// VÍNCULOS PROCEDIMENTO-KIT
// =============================================

export interface ProcedureKit {
  id: string;
  clinic_id: string;
  procedure_id: string;
  kit_id: string;
  quantity: number;
  is_required: boolean;
  created_at: string;
  // Joined fields
  kit_name?: string;
  procedure_name?: string;
}

export interface ProcedureKitFormData {
  procedure_id: string;
  kit_id: string;
  quantity: number;
  is_required: boolean;
}

// =============================================
// CUSTO DE PROCEDIMENTO
// =============================================

export interface ProcedureCostSummary {
  procedure_id: string;
  procedure_name: string;
  material_cost: number;
  kit_cost: number;
  total_cost: number;
  materials: Array<{
    name: string;
    quantity: number;
    unit: string;
    unit_cost: number;
    total: number;
  }>;
  kits: Array<{
    name: string;
    quantity: number;
    total: number;
  }>;
}
