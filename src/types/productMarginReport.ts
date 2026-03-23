// =============================================
// TIPOS DOS FILTROS DE RELATÓRIO DE MARGEM
// =============================================

export interface ProductMarginFilters {
  startDate: Date;
  endDate: Date;
  status: 'all' | 'active' | 'canceled';
  productId?: string;
  categoryId?: string;
}

export const defaultMarginFilters: ProductMarginFilters = {
  startDate: new Date(),
  endDate: new Date(),
  status: 'all',
};

export const marginStatusOptions = [
  { value: 'all', label: 'Todas' },
  { value: 'active', label: 'Ativas' },
  { value: 'canceled', label: 'Canceladas' },
];
