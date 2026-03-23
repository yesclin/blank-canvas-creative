// =============================================
// TIPOS DOS FILTROS DE RELATÓRIO DE VENDAS
// =============================================

export interface SalesReportFilters {
  startDate: Date;
  endDate: Date;
  status: 'all' | 'active' | 'canceled';
  productId?: string;
  patientId?: string;
  paymentMethod?: string;
  responsibleUserId?: string;
}

export const defaultSalesFilters: SalesReportFilters = {
  startDate: new Date(),
  endDate: new Date(),
  status: 'all',
};

export const paymentMethodOptions = [
  { value: 'pix', label: 'PIX' },
  { value: 'credito', label: 'Cartão de Crédito' },
  { value: 'debito', label: 'Cartão de Débito' },
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'convenio', label: 'Convênio' },
  { value: 'boleto', label: 'Boleto' },
  { value: 'transferencia', label: 'Transferência' },
];

export const saleStatusOptions = [
  { value: 'all', label: 'Todas' },
  { value: 'active', label: 'Ativas' },
  { value: 'canceled', label: 'Canceladas' },
];
