import { useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { withTimeout } from "@/lib/asyncTimeout";
import { clearUnsafeAuthCache } from "@/lib/authSessionIsolation";
import { useAuthIdentity } from "@/hooks/useAuthIdentity";
import { useActiveClinicScope } from "@/hooks/useActiveClinicScope";

export interface ClinicData {
  id: string;
  name: string;
  logo_url: string | null;
  cnpj: string | null;
  cpf: string | null;
  fiscal_type: string | null;
  inscricao_estadual: string | null;
  inscricao_municipal: string | null;
  phone: string | null;
  email: string | null;
  primary_specialty_id: string | null;
  address_street: string | null;
  address_number: string | null;
  address_complement: string | null;
  address_neighborhood: string | null;
  address_city: string | null;
  address_state: string | null;
  address_zip: string | null;
}

const CLINIC_FIELDS = `
  id,
  name,
  logo_url,
  cnpj,
  cpf,
  fiscal_type,
  inscricao_estadual,
  inscricao_municipal,
  phone,
  email,
  primary_specialty_id,
  address_street,
  address_number,
  address_complement,
  address_neighborhood,
  address_city,
  address_state,
  address_zip
`;

async function resolveClinicId(userId: string): Promise<string | null> {
  // Sessão de suporte (impersonation) — só se o admin de suporte for o userId atual.
  try {
    if (typeof window !== "undefined") {
      const supportClinicId = window.sessionStorage.getItem("yesclin_support_clinic_id");
      const supportAdminUserId = window.sessionStorage.getItem("yesclin_support_admin_user_id");
      if (supportClinicId && supportAdminUserId && supportAdminUserId !== userId) {
        const { clearSupportSessionIfMismatch } = await import("@/lib/supportSession");
        clearSupportSessionIfMismatch(userId);
      } else if (supportClinicId && supportAdminUserId === userId) {
        const { data: isAdmin } = await withTimeout<any>(
          supabase.rpc("is_platform_admin", { _user_id: userId })
        );
        if (isAdmin === true) return supportClinicId;
        const { clearSupportSessionIfMismatch } = await import("@/lib/supportSession");
        clearSupportSessionIfMismatch(null);
      }
    }
  } catch {
    /* segue fluxo normal */
  }

  const { data: profile } = await withTimeout<any>(
    supabase.from("profiles").select("clinic_id, user_id").eq("user_id", userId).maybeSingle()
  );
  if (profile && profile.user_id !== userId) {
    console.error("[AUTH_SECURITY] profile.user_id divergente — descartado", {
      expected: userId,
      received: profile.user_id,
    });
    clearUnsafeAuthCache();
    return null;
  }
  return profile?.clinic_id ?? null;
}

async function fetchClinic(userId: string): Promise<ClinicData> {
  const clinicId = await resolveClinicId(userId);
  if (!clinicId) {
    throw new Error("Login realizado, mas não foi possível carregar os dados da clínica.");
  }

  return fetchClinicById(userId, clinicId);
}

async function fetchClinicById(userId: string, clinicId: string): Promise<ClinicData> {
  if (!userId || !clinicId) {
    throw new Error("Login realizado, mas não foi possível carregar os dados da clínica.");
  }

  const { data: clinicData, error } = await withTimeout<any>(
    supabase.from("clinics").select(CLINIC_FIELDS).eq("id", clinicId).maybeSingle()
  );
  if (error) throw error;
  if (!clinicData) {
    throw new Error("Login realizado, mas não foi possível carregar os dados da clínica.");
  }

  let signedLogoUrl: string | null = clinicData.logo_url ?? null;
  if (clinicData.logo_url) {
    const match = String(clinicData.logo_url).match(/clinic-logos\/(.+)$/);
    if (match) {
      try {
        const { data: signedData } = await withTimeout<any>(
          supabase.storage.from("clinic-logos").createSignedUrl(match[1], 3600)
        );
        if (signedData?.signedUrl) signedLogoUrl = signedData.signedUrl;
      } catch {
        /* mantém URL original se assinatura falhar */
      }
    }
  }

  return { ...(clinicData as ClinicData), logo_url: signedLogoUrl };
}

/**
 * Hook compartilhado de dados da clínica ativa.
 *
 * Antes este hook fazia seu próprio fetch a cada montagem — com ~350 chamadas
 * espalhadas pelo app, qualquer navegação disparava dezenas de PROFILE/CLINIC
 * fetches duplicados. Agora todas as instâncias compartilham a MESMA query
 * (chave: ["clinic-data", userId]) via React Query, com cache de 5 minutos.
 * Apenas o primeiro consumidor dispara a rede; o resto lê do cache.
 */
export function useClinicData() {
  const { userId, isLoading: authLoading } = useAuthIdentity();
  const { scope, isLoading: scopeLoading } = useActiveClinicScope();
  const queryClient = useQueryClient();
  const clinicId = scope.userId === userId ? scope.clinicId : null;

  const query = useQuery({
    queryKey: ["clinic-data", userId, clinicId],
    queryFn: async () => {
      if (clinicId) return fetchClinicById(userId!, clinicId);
      return fetchClinic(userId!);
    },
    enabled: !authLoading && !scopeLoading && !!userId && !!clinicId,
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    retry: 1,
    throwOnError: false,
  });

  // Em troca de identidade / suporte: invalida o cache para refetch limpo.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const invalidate = () => {
      queryClient.invalidateQueries({ queryKey: ["clinic-data"] });
    };
    window.addEventListener("yesclin:identity-changed", invalidate);
    window.addEventListener("yesclin:support-session-changed", invalidate);
    return () => {
      window.removeEventListener("yesclin:identity-changed", invalidate);
      window.removeEventListener("yesclin:support-session-changed", invalidate);
    };
  }, [queryClient]);

  const clinic = query.data ?? null;

  const helpers = useMemo(() => {
    const getFormattedAddress = () => {
      if (!clinic) return null;
      const parts = [
        clinic.address_street,
        clinic.address_number,
        clinic.address_complement,
        clinic.address_neighborhood,
      ].filter(Boolean);
      const cityState = [clinic.address_city, clinic.address_state].filter(Boolean).join(" - ");
      if (parts.length === 0 && !cityState) return null;
      return `${parts.join(", ")}${cityState ? ` • ${cityState}` : ""}${
        clinic.address_zip ? ` • CEP: ${clinic.address_zip}` : ""
      }`;
    };

    const getFiscalDocument = () => {
      if (!clinic) return null;
      if (clinic.fiscal_type === "pj" && clinic.cnpj) return { type: "CNPJ", value: clinic.cnpj };
      if (clinic.fiscal_type === "pf" && clinic.cpf) return { type: "CPF", value: clinic.cpf };
      return null;
    };

    return { getFormattedAddress, getFiscalDocument };
  }, [clinic]);

  return {
    clinic,
    isLoading: authLoading || (query.isLoading && !query.data),
    error: query.error ?? null,
    refetch: () => {
      void query.refetch();
    },
    ...helpers,
  };
}
