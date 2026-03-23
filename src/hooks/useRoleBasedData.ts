import { useMemo } from "react";
import { usePermissions } from "./usePermissions";

/**
 * Hook to determine data access scope based on user role
 * Returns filters and flags to be used when querying data
 */
export function useRoleBasedDataAccess() {
  const { role, professionalId, isOwner, isAdmin, hasRestriction, isLoading } = usePermissions();

  const dataAccess = useMemo(() => {
    // Owner and Admin see everything
    if (isOwner || isAdmin) {
      return {
        isLoading,
        canViewAllData: true,
        mustFilterByProfessional: false,
        professionalIdFilter: null,
        restrictions: {
          ownDataOnly: false,
          noClinicalAccess: false,
          limitedStats: false,
        },
      };
    }

    // Professional: filter by their own professional_id
    if (role === "profissional") {
      return {
        isLoading,
        canViewAllData: false,
        mustFilterByProfessional: true,
        professionalIdFilter: professionalId,
        restrictions: {
          ownDataOnly: true,
          noClinicalAccess: false,
          limitedStats: false,
        },
      };
    }

    // Receptionist: can see all appointments but no clinical data
    if (role === "recepcionista") {
      return {
        isLoading,
        canViewAllData: true, // Can see all schedules
        mustFilterByProfessional: false,
        professionalIdFilter: null,
        restrictions: {
          ownDataOnly: false,
          noClinicalAccess: true,
          limitedStats: true,
        },
      };
    }

    // Default: no access
    return {
      isLoading,
      canViewAllData: false,
      mustFilterByProfessional: false,
      professionalIdFilter: null,
      restrictions: {
        ownDataOnly: true,
        noClinicalAccess: true,
        limitedStats: true,
      },
    };
  }, [role, professionalId, isOwner, isAdmin, isLoading]);

  return dataAccess;
}

/**
 * Hook specifically for agenda filtering
 */
export function useAgendaFilter() {
  const { role, professionalId, isOwner, isAdmin } = usePermissions();

  return useMemo(() => {
    // Owner/Admin: no filter, see all professionals
    if (isOwner || isAdmin) {
      return {
        defaultProfessionalId: undefined,
        lockProfessionalFilter: false,
        canSwitchProfessional: true,
      };
    }

    // Professional: filter to their own schedule by default, locked
    if (role === "profissional" && professionalId) {
      return {
        defaultProfessionalId: professionalId,
        lockProfessionalFilter: true,
        canSwitchProfessional: false,
      };
    }

    // Receptionist: can see and switch between all professionals
    if (role === "recepcionista") {
      return {
        defaultProfessionalId: undefined,
        lockProfessionalFilter: false,
        canSwitchProfessional: true,
      };
    }

    return {
      defaultProfessionalId: undefined,
      lockProfessionalFilter: false,
      canSwitchProfessional: false,
    };
  }, [role, professionalId, isOwner, isAdmin]);
}

/**
 * Hook for patient list filtering
 * Professionals should only see patients they have attended
 */
export function usePatientFilter() {
  const { role, professionalId, isOwner, isAdmin } = usePermissions();

  return useMemo(() => {
    // Owner/Admin: see all patients
    if (isOwner || isAdmin) {
      return {
        filterByAttendedProfessional: false,
        professionalIdFilter: null,
        canViewClinicalData: true,
      };
    }

    // Professional: only patients they have attended
    if (role === "profissional" && professionalId) {
      return {
        filterByAttendedProfessional: true,
        professionalIdFilter: professionalId,
        canViewClinicalData: true,
      };
    }

    // Receptionist: see all patients but no clinical data
    if (role === "recepcionista") {
      return {
        filterByAttendedProfessional: false,
        professionalIdFilter: null,
        canViewClinicalData: false,
      };
    }

    return {
      filterByAttendedProfessional: true,
      professionalIdFilter: null,
      canViewClinicalData: false,
    };
  }, [role, professionalId, isOwner, isAdmin]);
}

/**
 * Hook for medical record (prontuario) access control
 */
export function useProntuarioAccess() {
  const { role, professionalId, isOwner, isAdmin, can } = usePermissions();

  return useMemo(() => {
    // Check if user can access prontuario at all
    const canAccessProntuario = can("prontuario", "view");
    
    // Owner/Admin: full access
    if (isOwner || isAdmin) {
      return {
        canAccess: true,
        canCreate: true,
        canEdit: true,
        canSign: true,
        canViewHistory: true,
        canExport: true,
        isRestricted: false,
        currentProfessionalId: professionalId,
      };
    }

    // Professional: full clinical access
    if (role === "profissional") {
      return {
        canAccess: canAccessProntuario,
        canCreate: can("prontuario", "create"),
        canEdit: can("prontuario", "edit"),
        canSign: true,
        canViewHistory: true,
        canExport: can("prontuario", "export"),
        isRestricted: false,
        currentProfessionalId: professionalId,
      };
    }

    // Receptionist: NO clinical access
    if (role === "recepcionista") {
      return {
        canAccess: false,
        canCreate: false,
        canEdit: false,
        canSign: false,
        canViewHistory: false,
        canExport: false,
        isRestricted: true,
        currentProfessionalId: null,
      };
    }

    // Default: no access
    return {
      canAccess: false,
      canCreate: false,
      canEdit: false,
      canSign: false,
      canViewHistory: false,
      canExport: false,
      isRestricted: true,
      currentProfessionalId: null,
    };
  }, [role, professionalId, isOwner, isAdmin, can]);
}

/**
 * Returns clinical field visibility flags (for hiding/showing clinical fields in UI)
 * Different from patient-level access control in useClinicalDataAccess hook
 */
export function useClinicalFieldVisibility() {
  const { role, isOwner, isAdmin } = usePermissions();

  return useMemo(() => {
    // Owner, Admin, Profissional: can view clinical data
    if (isOwner || isAdmin || role === "profissional") {
      return {
        canViewClinicalAlerts: true,
        canViewAllergies: true,
        canViewMedications: true,
        canViewClinicalNotes: true,
        canViewEvolutions: true,
        canViewAttachments: true,
      };
    }

    // Receptionist: NO clinical data
    return {
      canViewClinicalAlerts: false,
      canViewAllergies: false,
      canViewMedications: false,
      canViewClinicalNotes: false,
      canViewEvolutions: false,
      canViewAttachments: false,
    };
  }, [role, isOwner, isAdmin]);
}

/**
 * @deprecated Use useClinicalFieldVisibility instead
 */
export const useClinicalDataAccess = useClinicalFieldVisibility;
