import { useMemo } from 'react';
import { usePermissions } from '@/hooks/usePermissions';

export type FinancialMetric = 'revenue' | 'cost' | 'profit' | 'margin';

interface FinancialAccessControl {
  /** Usuário pode ver faturamento/receita */
  canViewRevenue: boolean;
  /** Usuário pode ver custo */
  canViewCost: boolean;
  /** Usuário pode ver lucro */
  canViewProfit: boolean;
  /** Usuário pode ver margem */
  canViewMargin: boolean;
  /** Verifica se pode ver uma métrica específica */
  canView: (metric: FinancialMetric) => boolean;
  /** Está carregando permissões */
  isLoading: boolean;
}

/**
 * Hook para controle de acesso a métricas financeiras
 * 
 * Regras:
 * - Custo, Lucro e Margem: apenas perfis com permissão 'financeiro' + ação 'view'
 *   E sem restrição 'hide_costs'
 * - Faturamento: visível para quem tem permissão no módulo 'financeiro' (se não tiver restrição)
 * - Admins (owner/admin) têm acesso completo
 */
export function useFinancialAccessControl(): FinancialAccessControl {
  const { can, hasRestriction, isOwner, isAdmin, isLoading } = usePermissions();

  const access = useMemo(() => {
    // Se está carregando, nega tudo temporariamente
    if (isLoading) {
      return {
        canViewRevenue: false,
        canViewCost: false,
        canViewProfit: false,
        canViewMargin: false,
      };
    }

    // OWNER tem BYPASS TOTAL - acesso irrestrito a todas as métricas financeiras
    if (isOwner) {
      return {
        canViewRevenue: true,
        canViewCost: true,
        canViewProfit: true,
        canViewMargin: true,
      };
    }

    // Admins também têm acesso completo
    if (isAdmin) {
      return {
        canViewRevenue: true,
        canViewCost: true,
        canViewProfit: true,
        canViewMargin: true,
      };
    }

    // Verifica se tem acesso ao módulo financeiro
    const hasFinanceAccess = can('financeiro', 'view');
    
    // Verifica se tem restrição para ocultar custos
    const hideCosts = hasRestriction('financeiro', 'hide_costs');
    
    // Verifica se tem restrição para ocultar faturamento
    const hideRevenue = hasRestriction('financeiro', 'hide_revenue');

    return {
      // Faturamento: precisa ter acesso ao financeiro e não ter restrição hide_revenue
      canViewRevenue: hasFinanceAccess && !hideRevenue,
      // Custo, Lucro e Margem: precisa ter acesso ao financeiro e NÃO ter restrição hide_costs
      canViewCost: hasFinanceAccess && !hideCosts,
      canViewProfit: hasFinanceAccess && !hideCosts,
      canViewMargin: hasFinanceAccess && !hideCosts,
    };
  }, [can, hasRestriction, isOwner, isAdmin, isLoading]);

  const canView = (metric: FinancialMetric): boolean => {
    switch (metric) {
      case 'revenue':
        return access.canViewRevenue;
      case 'cost':
        return access.canViewCost;
      case 'profit':
        return access.canViewProfit;
      case 'margin':
        return access.canViewMargin;
      default:
        return false;
    }
  };

  return {
    ...access,
    canView,
    isLoading,
  };
}
