import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { withTimeout } from "@/lib/asyncTimeout";
import { clearUnsafeAuthCache } from "@/lib/authSessionIsolation";

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

export function useClinicData() {
  const [clinic, setClinic] = useState<ClinicData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const requestRef = useRef(0);
  const activeUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchClinicData = async () => {
      const reqId = ++requestRef.current;
      let loadedClinic = false;

      const stillCurrent = (expectedUserId: string | null) => {
        if (cancelled) return false;
        if (reqId !== requestRef.current) return false;
        if (expectedUserId !== null && activeUserIdRef.current !== expectedUserId) return false;
        return true;
      };

      try {
        const { data: authData, error: authError } = await withTimeout<any>(supabase.auth.getUser());
        if (authError) throw authError;

        const userId = authData.user?.id ?? null;
        // CRÍTICO: registramos quem é o usuário desta requisição. Toda
        // resposta posterior só pode atualizar estado se o usuário ativo
        // continuar igual — caso contrário descartamos silenciosamente.
        activeUserIdRef.current = userId;

        if (!userId) {
          if (stillCurrent(null)) {
            setClinic(null);
            setIsLoading(false);
          }
          return;
        }

        // SUPER ADMIN IMPERSONATION:
        // Se houver uma sessão de suporte ativa em localStorage e o usuário
        // logado for um Platform Admin, usamos a clinic_id alvo no lugar da
        // clínica natural do usuário. A identidade Auth real NÃO muda — RLS
        // continua respeitando auth.uid() (super admins têm policies próprias).
        let resolvedClinicId: string | null = null;

        try {
          const supportClinicId = typeof window !== 'undefined'
            ? window.localStorage.getItem('yesclin_support_clinic_id')
            : null;
          const supportAdminUserId = typeof window !== 'undefined'
            ? window.localStorage.getItem('yesclin_support_admin_user_id')
            : null;

          // CRÍTICO: a sessão de suporte só vale se foi iniciada pelo MESMO
          // usuário atualmente autenticado. Caso contrário, é resíduo de outro
          // login na mesma máquina e DEVE ser descartada — nunca pode trocar
          // o contexto da clínica para o novo usuário.
          if (supportClinicId && supportAdminUserId && supportAdminUserId !== userId) {
            const { clearSupportSessionIfMismatch } = await import('@/lib/supportSession');
            clearSupportSessionIfMismatch(userId);
          } else if (supportClinicId && supportAdminUserId === userId) {
            const { data: isAdmin } = await withTimeout<any>(
              supabase.rpc('is_platform_admin', { _user_id: userId })
            );
            if (!stillCurrent(userId)) return;
            if (isAdmin === true) {
              resolvedClinicId = supportClinicId;
            } else {
              const { clearSupportSessionIfMismatch } = await import('@/lib/supportSession');
              clearSupportSessionIfMismatch(null);
            }
          }
        } catch {
          // Ignora — segue com fluxo normal
        }

        if (!stillCurrent(userId)) return;

        if (!resolvedClinicId) {
          const { data: profile } = await withTimeout<any>(supabase
            .from("profiles")
            .select("clinic_id, user_id")
            .eq("user_id", userId)
            .maybeSingle());

          if (!stillCurrent(userId)) return;

          // Sanity: nunca aceitar profile que não seja do auth.uid() atual.
          if (profile && profile.user_id !== userId) {
            console.error("[AUTH_SECURITY] profile.user_id divergente — descartado", {
              expected: userId,
              received: profile.user_id,
            });
            clearUnsafeAuthCache();
            setClinic(null);
            setIsLoading(false);
            return;
          }

          if (!profile?.clinic_id) {
            setClinic(null);
            setIsLoading(false);
            return;
          }
          resolvedClinicId = profile.clinic_id;
        }

        const { data: clinicData } = await withTimeout<any>(supabase
          .from("clinics")
          .select(`
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
          `)
          .eq("id", resolvedClinicId)
          .maybeSingle());

        if (!stillCurrent(userId)) return;

        if (clinicData) {
          loadedClinic = true;
          let signedLogoUrl = clinicData.logo_url;
          if (clinicData.logo_url) {
            const match = clinicData.logo_url.match(/clinic-logos\/(.+)$/);
            if (match) {
              const path = match[1];
              const { data: signedData } = await withTimeout<any>(supabase.storage
                .from('clinic-logos')
                .createSignedUrl(path, 3600));
              if (stillCurrent(userId) && signedData?.signedUrl) {
                signedLogoUrl = signedData.signedUrl;
              }
            }
          }
          if (stillCurrent(userId)) {
            setClinic({ ...clinicData, logo_url: signedLogoUrl });
          }
        }
      } catch (error) {
        console.error("[APP_ERROR]", error);
      } finally {
        if (stillCurrent(activeUserIdRef.current)) {
          console.log("[CLINIC] carregada", { hasClinic: loadedClinic });
          setIsLoading(false);
        }
      }
    };

    fetchClinicData();

    // Re-fetch when auth state changes. Em SIGNED_OUT/identidade-trocada,
    // limpamos imediatamente o estado para nunca exibir a clínica anterior.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'TOKEN_REFRESHED') return;
      const newUserId = session?.user?.id ?? null;
      if (event === 'SIGNED_OUT' || (newUserId && newUserId !== activeUserIdRef.current)) {
        requestRef.current++;
        activeUserIdRef.current = newUserId;
        clearUnsafeAuthCache();
        setClinic(null);
        setIsLoading(true);
      }
      // TOKEN_REFRESHED não troca clínica nem usuário — refetch aqui causa
      // re-render em background ("sistema atualiza sozinho") enquanto o
      // usuário digita. Só refetch em SIGNED_IN/INITIAL_SESSION.
      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
        setTimeout(() => {
          if (!cancelled) fetchClinicData();
        }, 0);
      }
      if (event === 'SIGNED_OUT') {
        setClinic(null);
        setIsLoading(false);
      }
    });

    const onIdentityChanged = () => {
      // Identidade trocada: derrubar o estado atual ANTES de recarregar,
      // para que nenhuma resposta em voo possa preencher o usuário antigo.
      requestRef.current++;
      activeUserIdRef.current = null;
      clearUnsafeAuthCache();
      setClinic(null);
      setIsLoading(true);
      setTimeout(() => {
        if (!cancelled) fetchClinicData();
      }, 0);
    };

    const onSupportToggle = () => fetchClinicData();
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'yesclin_support_clinic_id') fetchClinicData();
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('yesclin:identity-changed', onIdentityChanged);
      window.addEventListener('yesclin:support-session-changed', onSupportToggle);
      window.addEventListener('storage', onStorage);
    }

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      if (typeof window !== 'undefined') {
        window.removeEventListener('yesclin:identity-changed', onIdentityChanged);
        window.removeEventListener('yesclin:support-session-changed', onSupportToggle);
        window.removeEventListener('storage', onStorage);
      }
    };
  }, []);

  const getFormattedAddress = () => {
    if (!clinic) return null;
    
    const parts = [
      clinic.address_street,
      clinic.address_number,
      clinic.address_complement,
      clinic.address_neighborhood,
    ].filter(Boolean);

    const cityState = [clinic.address_city, clinic.address_state]
      .filter(Boolean)
      .join(" - ");

    if (parts.length === 0 && !cityState) return null;

    return `${parts.join(", ")}${cityState ? ` • ${cityState}` : ""}${clinic.address_zip ? ` • CEP: ${clinic.address_zip}` : ""}`;
  };

  const getFiscalDocument = () => {
    if (!clinic) return null;
    if (clinic.fiscal_type === "pj" && clinic.cnpj) {
      return { type: "CNPJ", value: clinic.cnpj };
    }
    if (clinic.fiscal_type === "pf" && clinic.cpf) {
      return { type: "CPF", value: clinic.cpf };
    }
    return null;
  };

  return {
    clinic,
    isLoading,
    getFormattedAddress,
    getFiscalDocument,
  };
}
