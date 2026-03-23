import { useState } from 'react';
import type {
  StockCategory,
  StockProduct,
  StockMovement,
  FinanceCategory,
  FinanceTransaction,
  TreatmentPackage,
  InsuranceExtended,
  InsuranceProcedure,
  InsuranceAuthorization,
} from '@/types/gestao';

// =============================================
// MOCK DATA - ESTOQUE
// =============================================

const mockStockCategories: StockCategory[] = [
  { id: '1', clinic_id: '1', name: 'Descartáveis', description: 'Materiais descartáveis', is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: '2', clinic_id: '1', name: 'Medicamentos', description: 'Medicamentos e fármacos', is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: '3', clinic_id: '1', name: 'Insumos', description: 'Insumos gerais', is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
];

const mockStockProducts: StockProduct[] = [
  { id: '1', clinic_id: '1', category_id: '1', name: 'Seringa 10ml', unit: 'un', current_quantity: 150, min_quantity: 50, avg_cost: 1.50, supplier: 'MedSupply', is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: '2', clinic_id: '1', category_id: '1', name: 'Gaze Estéril', unit: 'pct', current_quantity: 30, min_quantity: 40, avg_cost: 5.00, supplier: 'MedSupply', is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: '3', clinic_id: '1', category_id: '2', name: 'Lidocaína 2%', unit: 'fr', current_quantity: 20, min_quantity: 10, avg_cost: 25.00, supplier: 'FarmaDist', is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: '4', clinic_id: '1', category_id: '2', name: 'Ácido Hialurônico', unit: 'amp', current_quantity: 5, min_quantity: 8, avg_cost: 350.00, supplier: 'EstéticaPro', expiration_date: '2024-06-15', is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: '5', clinic_id: '1', category_id: '3', name: 'Álcool 70%', unit: 'l', current_quantity: 0, min_quantity: 5, avg_cost: 12.00, supplier: 'MedSupply', is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
];

const mockStockMovements: StockMovement[] = [
  { id: '1', clinic_id: '1', product_id: '1', movement_type: 'entrada', quantity: 100, reason: 'Compra', unit_cost: 1.50, created_at: '2024-01-15T10:00:00' },
  { id: '2', clinic_id: '1', product_id: '1', movement_type: 'saida', quantity: 10, reason: 'Uso em atendimento', created_at: '2024-01-16T14:30:00' },
  { id: '3', clinic_id: '1', product_id: '2', movement_type: 'entrada', quantity: 50, reason: 'Compra', unit_cost: 5.00, created_at: '2024-01-10T09:00:00' },
  { id: '4', clinic_id: '1', product_id: '3', movement_type: 'saida', quantity: 5, reason: 'Uso em atendimento', created_at: '2024-01-18T11:00:00' },
];

// =============================================
// MOCK DATA - FINANCEIRO
// =============================================

const mockFinanceCategories: FinanceCategory[] = [
  { id: '1', clinic_id: '1', name: 'Consultas', type: 'entrada', is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: '2', clinic_id: '1', name: 'Procedimentos', type: 'entrada', is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: '3', clinic_id: '1', name: 'Pacotes', type: 'entrada', is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: '4', clinic_id: '1', name: 'Fornecedores', type: 'saida', is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: '5', clinic_id: '1', name: 'Aluguel', type: 'saida', is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: '6', clinic_id: '1', name: 'Salários', type: 'saida', is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
];

const mockFinanceTransactions: FinanceTransaction[] = [
  { id: '1', clinic_id: '1', category_id: '1', type: 'entrada', description: 'Consulta - Maria Silva', amount: 250.00, payment_method: 'pix', origin: 'consulta', transaction_date: '2024-01-20', created_at: '2024-01-20', updated_at: '2024-01-20' },
  { id: '2', clinic_id: '1', category_id: '2', type: 'entrada', description: 'Botox - João Santos', amount: 1500.00, payment_method: 'credito', origin: 'procedimento', transaction_date: '2024-01-20', created_at: '2024-01-20', updated_at: '2024-01-20' },
  { id: '3', clinic_id: '1', category_id: '3', type: 'entrada', description: 'Pacote 10 sessões - Ana Costa', amount: 2000.00, payment_method: 'pix', origin: 'pacote', transaction_date: '2024-01-19', created_at: '2024-01-19', updated_at: '2024-01-19' },
  { id: '4', clinic_id: '1', category_id: '4', type: 'saida', description: 'Compra materiais - MedSupply', amount: 850.00, payment_method: 'boleto', origin: 'outros', transaction_date: '2024-01-18', created_at: '2024-01-18', updated_at: '2024-01-18' },
  { id: '5', clinic_id: '1', category_id: '1', type: 'entrada', description: 'Consulta - Pedro Lima', amount: 300.00, payment_method: 'convenio', origin: 'consulta', transaction_date: '2024-01-20', created_at: '2024-01-20', updated_at: '2024-01-20' },
];

const mockTreatmentPackages: TreatmentPackage[] = [
  { id: '1', clinic_id: '1', patient_id: '1', name: 'Pacote Limpeza de Pele', total_sessions: 10, used_sessions: 3, total_amount: 1500.00, paid_amount: 1500.00, payment_method: 'pix', status: 'ativo', valid_until: '2024-06-30', created_at: '2024-01-01', updated_at: '2024-01-15' },
  { id: '2', clinic_id: '1', patient_id: '2', name: 'Pacote Fisioterapia', total_sessions: 20, used_sessions: 20, total_amount: 3000.00, paid_amount: 3000.00, payment_method: 'credito', status: 'finalizado', created_at: '2023-10-01', updated_at: '2024-01-10' },
  { id: '3', clinic_id: '1', patient_id: '3', name: 'Pacote Massagem', total_sessions: 5, used_sessions: 1, total_amount: 750.00, paid_amount: 400.00, payment_method: 'pix', status: 'ativo', valid_until: '2024-03-15', created_at: '2024-01-05', updated_at: '2024-01-12' },
];

// =============================================
// MOCK DATA - CONVÊNIOS
// =============================================

const mockInsurances: InsuranceExtended[] = [
  { id: '1', clinic_id: '1', name: 'Unimed', code: 'UNI001', ans_code: '359017', contact_phone: '(11) 3344-5566', requires_authorization: true, return_allowed: true, return_days: 30, is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: '2', clinic_id: '1', name: 'Bradesco Saúde', code: 'BRA001', ans_code: '005711', contact_phone: '(11) 4444-5555', requires_authorization: true, return_allowed: true, return_days: 15, is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: '3', clinic_id: '1', name: 'SulAmérica', code: 'SUL001', ans_code: '006246', requires_authorization: false, return_allowed: true, return_days: 30, is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: '4', clinic_id: '1', name: 'Particular', code: 'PART', requires_authorization: false, return_allowed: true, return_days: 30, is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
];

const mockInsuranceProcedures: InsuranceProcedure[] = [
  { id: '1', clinic_id: '1', insurance_id: '1', procedure_id: '1', covered_value: 150.00, requires_authorization: false, is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: '2', clinic_id: '1', insurance_id: '1', procedure_id: '2', covered_value: 250.00, requires_authorization: true, is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: '3', clinic_id: '1', insurance_id: '2', procedure_id: '1', covered_value: 180.00, requires_authorization: false, is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
];

const mockInsuranceAuthorizations: InsuranceAuthorization[] = [
  { id: '1', clinic_id: '1', insurance_id: '1', patient_id: '1', procedure_id: '2', authorization_number: 'AUTH-2024-001', authorization_date: '2024-01-15', valid_until: '2024-02-15', status: 'aprovada', created_at: '2024-01-15', updated_at: '2024-01-15' },
  { id: '2', clinic_id: '1', insurance_id: '2', patient_id: '2', procedure_id: '1', authorization_number: 'AUTH-2024-002', authorization_date: '2024-01-18', status: 'pendente', created_at: '2024-01-18', updated_at: '2024-01-18' },
  { id: '3', clinic_id: '1', insurance_id: '1', patient_id: '3', procedure_id: '2', authorization_number: 'AUTH-2024-003', authorization_date: '2024-01-10', valid_until: '2024-01-20', status: 'utilizada', created_at: '2024-01-10', updated_at: '2024-01-20' },
];

// =============================================
// HOOKS
// =============================================

export function useStockData() {
  const [categories] = useState<StockCategory[]>(mockStockCategories);
  const [products] = useState<StockProduct[]>(mockStockProducts);
  const [movements] = useState<StockMovement[]>(mockStockMovements);

  const lowStockProducts = products.filter(p => p.current_quantity <= p.min_quantity && p.is_active);
  const outOfStockProducts = products.filter(p => p.current_quantity === 0 && p.is_active);
  const expiringProducts = products.filter(p => {
    if (!p.expiration_date) return false;
    const expDate = new Date(p.expiration_date);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  });

  return {
    categories,
    products,
    movements,
    lowStockProducts,
    outOfStockProducts,
    expiringProducts,
    stats: {
      totalProducts: products.filter(p => p.is_active).length,
      lowStock: lowStockProducts.length,
      outOfStock: outOfStockProducts.length,
      expiringSoon: expiringProducts.length,
    },
  };
}

export function useFinanceData() {
  const [categories] = useState<FinanceCategory[]>(mockFinanceCategories);
  const [transactions] = useState<FinanceTransaction[]>(mockFinanceTransactions);
  const [packages] = useState<TreatmentPackage[]>(mockTreatmentPackages);

  const today = new Date().toISOString().split('T')[0];
  const todayTransactions = transactions.filter(t => t.transaction_date === today);
  
  const todayRevenue = todayTransactions
    .filter(t => t.type === 'entrada')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const todayExpenses = todayTransactions
    .filter(t => t.type === 'saida')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalRevenue = transactions
    .filter(t => t.type === 'entrada')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter(t => t.type === 'saida')
    .reduce((sum, t) => sum + t.amount, 0);

  const pendingPackagePayments = packages
    .filter(p => p.status === 'ativo' && p.paid_amount < p.total_amount)
    .reduce((sum, p) => sum + (p.total_amount - p.paid_amount), 0);

  return {
    categories,
    transactions,
    packages,
    stats: {
      todayRevenue,
      todayExpenses,
      todayBalance: todayRevenue - todayExpenses,
      totalRevenue,
      totalExpenses,
      totalBalance: totalRevenue - totalExpenses,
      activePackages: packages.filter(p => p.status === 'ativo').length,
      pendingPackagePayments,
    },
  };
}

export function useConveniosData() {
  const [insurances] = useState<InsuranceExtended[]>(mockInsurances);
  const [insuranceProcedures] = useState<InsuranceProcedure[]>(mockInsuranceProcedures);
  const [authorizations] = useState<InsuranceAuthorization[]>(mockInsuranceAuthorizations);

  return {
    insurances,
    insuranceProcedures,
    authorizations,
    stats: {
      totalInsurances: insurances.filter(i => i.is_active && i.code !== 'PART').length,
      pendingAuthorizations: authorizations.filter(a => a.status === 'pendente').length,
      approvedAuthorizations: authorizations.filter(a => a.status === 'aprovada').length,
    },
  };
}
