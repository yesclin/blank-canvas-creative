import { useMemo, useCallback } from "react";
import { usePermissions } from "@/hooks/usePermissions";
import { useLgpdEnforcement } from "@/hooks/lgpd/useLgpdEnforcement";
import { supabase } from "@/integrations/supabase/client";

export interface SalePermissionResult {
  canCreateSale: boolean;
  canCreateLinkedSale: boolean;
  canCancelSale: boolean;
  isBlocked: boolean;
  blockReason: string | null;
  isLoading: boolean;
  lgpdStatus: {
    hasValidConsent: boolean;
    isEnforcementEnabled: boolean;
    needsConsent: boolean;
  };
  logDeniedAction: (action: string, saleId?: string) => Promise<void>;
}

/**
 * Hook to validate permissions for creating and canceling sales linked to patients/appointments
 * Respects LGPD rules and role-based permissions
 */
export function useSalePermissions(patientId: string | null): SalePermissionResult {
  const { can, isOwner, isLoading: permissionsLoading } = usePermissions();
  const lgpdEnforcement = useLgpdEnforcement(patientId);

  // Log denied permission attempts to audit
  const logDeniedAction = useCallback(async (action: string, saleId?: string) => {
    try {
      await supabase.functions.invoke('log-access', {
        body: {
          action: `PERMISSION_DENIED_${action.toUpperCase()}`,
          resource: saleId ? `sales/${saleId}` : 'sales',
          user_agent: navigator.userAgent,
        },
      });
    } catch (error) {
      console.warn("Failed to log denied action:", error);
    }
  }, []);

  const result = useMemo((): SalePermissionResult => {
    // Base permission check: can user create financial transactions?
    const canAccessFinanceiro = can("financeiro", "create");
    const canAccessEstoque = can("estoque", "view");
    
    // Check if user has permission to view patient data (required for linked sales)
    const canAccessPacientes = can("pacientes", "view");
    
    // Check if user can delete financial transactions (required for canceling sales)
    const canDeleteFinanceiro = can("financeiro", "delete");
    
    // Calculate base sale permission
    const canCreateSale = canAccessFinanceiro && canAccessEstoque;
    
    // For linked sales, user must also have patient access
    const canCreateLinkedSale = canCreateSale && canAccessPacientes;
    
    // For canceling sales, user must have delete permission on financeiro module
    // Owner has full bypass for canceling sales
    const canCancelSale = canDeleteFinanceiro || isOwner;

    // LGPD status
    const lgpdStatus = {
      hasValidConsent: lgpdEnforcement.hasValidConsent,
      isEnforcementEnabled: lgpdEnforcement.isEnforcementEnabled,
      needsConsent: lgpdEnforcement.isEnforcementEnabled && !lgpdEnforcement.hasValidConsent,
    };

    // Determine if action is blocked and why
    let isBlocked = false;
    let blockReason: string | null = null;

    // Check permission blocking first
    if (!canCreateSale) {
      isBlocked = true;
      blockReason = "Você não tem permissão para registrar vendas. Entre em contato com o administrador da clínica.";
    } else if (patientId && !canAccessPacientes) {
      isBlocked = true;
      blockReason = "Você não tem permissão para acessar dados de pacientes. Não é possível vincular vendas a atendimentos.";
    }
    // Then check LGPD blocking (only if patient is involved)
    else if (patientId && lgpdStatus.needsConsent) {
      isBlocked = true;
      blockReason = "Este paciente não possui consentimento LGPD válido. Colete o consentimento antes de registrar vendas vinculadas.";
    }

    return {
      canCreateSale,
      canCreateLinkedSale,
      canCancelSale,
      isBlocked,
      blockReason,
      isLoading: permissionsLoading || lgpdEnforcement.loading,
      lgpdStatus,
      logDeniedAction,
    };
  }, [
    can,
    isOwner,
    permissionsLoading,
    patientId,
    lgpdEnforcement.hasValidConsent,
    lgpdEnforcement.isEnforcementEnabled,
    lgpdEnforcement.loading,
    logDeniedAction,
  ]);

  return result;
}
