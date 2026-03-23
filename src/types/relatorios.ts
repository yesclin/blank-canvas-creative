// =============================================
// TIPOS DO MÓDULO RELATÓRIOS
// =============================================

// =============================================
// FILTROS COMUNS
// =============================================

export interface ReportFilters {
  startDate: Date;
  endDate: Date;
  professionalId?: string;
  insuranceId?: string;
  procedureId?: string;
  specialtyId?: string;
  paymentMethod?: string;
}

export type ReportPeriod = 'day' | 'week' | 'month' | 'custom';

// =============================================
// RELATÓRIOS FINANCEIROS
// =============================================

export interface FinancialReportData {
  period: string;
  faturamento: number;
  recebido: number;
  pendente: number;
}

export interface RevenueByProfessional {
  professionalId: string;
  professionalName: string;
  totalRevenue: number;
  appointmentCount: number;
  averageTicket: number;
}

export interface RevenueByProcedure {
  procedureId: string;
  procedureName: string;
  totalRevenue: number;
  quantity: number;
  averageValue: number;
}

export interface RevenueByPaymentMethod {
  method: string;
  label: string;
  totalRevenue: number;
  percentage: number;
  count: number;
}

export interface PackageReport {
  packageId: string;
  patientName: string;
  packageName: string;
  totalSessions: number;
  usedSessions: number;
  totalValue: number;
  paidValue: number;
  status: string;
}

// =============================================
// RELATÓRIOS DE AGENDA & ATENDIMENTOS
// =============================================

export interface AppointmentReportData {
  period: string;
  realizados: number;
  cancelados: number;
  faltas: number;
  total: number;
}

export interface AttendanceByProfessional {
  professionalId: string;
  professionalName: string;
  realized: number;
  cancelled: number;
  noShow: number;
  occupancyRate: number;
}

export interface AttendanceBySpecialty {
  specialtyId: string;
  specialtyName: string;
  count: number;
  percentage: number;
}

// =============================================
// RELATÓRIOS DE PACIENTES
// =============================================

export interface PatientReportData {
  period: string;
  novos: number;
  ativos: number;
  inativos: number;
  retornos: number;
}

export interface PatientRetention {
  month: string;
  newPatients: number;
  returningPatients: number;
  retentionRate: number;
}

export interface PatientByInsurance {
  insuranceId: string;
  insuranceName: string;
  patientCount: number;
  percentage: number;
}

// =============================================
// RELATÓRIOS DE CONVÊNIOS
// =============================================

export interface InsuranceReportData {
  insuranceId: string;
  insuranceName: string;
  appointmentCount: number;
  totalRevenue: number;
  averageValue: number;
}

export interface InsuranceProcedureReport {
  procedureId: string;
  procedureName: string;
  count: number;
  totalValue: number;
}

// =============================================
// RELATÓRIOS DE PROFISSIONAIS
// =============================================

export interface ProfessionalPerformance {
  professionalId: string;
  professionalName: string;
  specialty: string;
  appointmentsRealized: number;
  totalRevenue: number;
  averageTicket: number;
  occupancyRate: number;
  commission?: number;
}

// =============================================
// RELATÓRIOS DE ESTOQUE
// =============================================

export interface StockConsumptionReport {
  productId: string;
  productName: string;
  category: string;
  consumed: number;
  unit: string;
  estimatedCost: number;
}

export interface StockByProcedure {
  procedureId: string;
  procedureName: string;
  materials: {
    productName: string;
    quantity: number;
    cost: number;
  }[];
  totalCost: number;
}

// =============================================
// RELATÓRIOS DE COMUNICAÇÃO
// =============================================

export interface CommunicationReportData {
  period: string;
  enviadas: number;
  confirmadas: number;
  taxaConfirmacao: number;
}

export interface CampaignPerformance {
  campaignId: string;
  campaignName: string;
  sentCount: number;
  deliveredCount: number;
  readCount: number;
  appointmentsGenerated: number;
}

// =============================================
// RELATÓRIOS GERENCIAIS (KPIs)
// =============================================

export interface ExecutiveSummary {
  faturamentoAtual: number;
  faturamentoAnterior: number;
  variacaoFaturamento: number;
  ocupacaoAgenda: number;
  ocupacaoAnterior: number;
  variacaoOcupacao: number;
  ticketMedio: number;
  ticketMedioAnterior: number;
  variacaoTicket: number;
  taxaRetencao: number;
  taxaRetencaoAnterior: number;
  variacaoRetencao: number;
  novosPacientes: number;
  atendimentosRealizados: number;
  taxaFaltas: number;
}

export interface KPICard {
  title: string;
  value: string | number;
  previousValue?: string | number;
  variation?: number;
  trend?: 'up' | 'down' | 'stable';
  format?: 'currency' | 'percentage' | 'number';
}

// =============================================
// CATEGORIAS DE RELATÓRIOS
// =============================================

export type ReportCategory = 
  | 'financeiro'
  | 'agenda'
  | 'pacientes'
  | 'convenios'
  | 'profissionais'
  | 'estoque'
  | 'comunicacao'
  | 'gerencial'
  | 'vendas';

export interface ReportDefinition {
  id: string;
  category: ReportCategory;
  title: string;
  description: string;
  icon: string;
}

export const reportCategoryLabels: Record<ReportCategory, string> = {
  financeiro: 'Financeiro',
  agenda: 'Agenda & Atendimentos',
  pacientes: 'Pacientes',
  convenios: 'Convênios',
  profissionais: 'Profissionais',
  estoque: 'Estoque',
  comunicacao: 'Comunicação',
  gerencial: 'Gerencial',
  vendas: 'Vendas & Estornos',
};

export const reportCategoryColors: Record<ReportCategory, string> = {
  financeiro: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  agenda: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  pacientes: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  convenios: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  profissionais: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400',
  estoque: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  comunicacao: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400',
  gerencial: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
  vendas: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
};

// =============================================
// RELATÓRIOS DE VENDAS E ESTORNOS
// =============================================

export type SaleStatus = 'active' | 'canceled';

export interface SaleReportItem {
  id: string;
  saleDate: string;
  status: SaleStatus;
  patientId: string | null;
  patientName: string | null;
  totalAmount: number;
  discountAmount: number;
  netAmount: number;
  paymentMethod: string | null;
  paymentStatus: string;
  itemCount: number;
  professionalId: string | null;
  professionalName: string | null;
  createdBy: string | null;
  createdByName: string | null;
  canceledBy: string | null;
  canceledByName: string | null;
}

export interface SalesReportSummary {
  totalVendas: number;
  totalEstornos: number;
  vendasAtivas: number;
  vendasCanceladas: number;
  quantidadeVendas: number;
  quantidadeEstornos: number;
  descontosConcedidos: number;
  ticketMedio: number;
}

export interface SalesByPeriod {
  period: string;
  vendas: number;
  estornos: number;
  liquido: number;
}

export interface SalesByPaymentMethod {
  method: string;
  label: string;
  totalAmount: number;
  count: number;
  percentage: number;
}

export interface SaleItemDetail {
  id: string;
  saleId: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface StockMovementForSale {
  id: string;
  saleId: string;
  productId: string;
  productName: string;
  movementType: 'sale' | 'sale_reversal';
  quantity: number;
  movementDate: string;
}
