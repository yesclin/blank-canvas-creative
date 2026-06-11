import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const read = (path: string) => readFileSync(path, "utf8");

describe("session/cache guardrails", () => {
  it("não mantém reload/navegação full-document acionável", () => {
    const files = [
      "src/components/app/AppLoadingFallback.tsx",
      "src/components/app/PageSkeleton.tsx",
      "src/components/app/ErrorBoundary.tsx",
      "src/components/app/ProtectedRoute.tsx",
      "src/components/super-admin/SupportSessionBanner.tsx",
      "src/pages/super-admin/SuperAdminClinics.tsx",
      "src/components/prontuario/clinica-geral/AnamneseBlock.tsx",
    ];

    for (const file of files) {
      const source = read(file);
      expect(source, file).not.toMatch(/window\.location\.(reload|assign|replace)\s*\(/);
      expect(source, file).not.toMatch(/window\.location\.href\s*=/);
      expect(source, file).not.toMatch(/navigate\(0\)/);
    }
  });

  it("usa storage de auth isolado por aba com binding de identidade", () => {
    const source = read("src/integrations/supabase/client.ts");
    expect(source).toContain("storage: perTabAuthStorage");
    expect(source).not.toMatch(/storage:\s*localStorage/);
    // Binding obrigatório por aba — não pode haver fallback "única sessão".
    expect(source).toContain("TAB_BINDING_PREFIX");
    expect(source).toContain("readTabBinding");
    expect(source).not.toContain("scopedSessions");
    expect(source).not.toContain("migrateTrustedLegacyAuthStorage");
    expect(source).toMatch(/userId !== expected/);
  });


  it("escopa queryKeys críticas por clinic_id", () => {
    const agenda = read("src/hooks/useAgendaRealData.ts");
    const stock = read("src/hooks/useStockData.ts");

    for (const key of [
      '["professionals", clinicId]',
      '["patients-list", clinicId]',
      '["rooms-list", clinicId]',
      '["insurances-list", clinicId]',
      '["appointments", clinicId, start, end]',
      '["clinic-schedule", clinicId]',
      '["professional-schedules-map", clinicId]',
      '["schedule-blocks", clinicId, startStr, endStr]',
    ]) {
      expect(agenda).toContain(key);
    }

    expect(stock).toContain('["stock-alerts", clinic?.id, "low"]');
    expect(stock).toContain('["stock-alerts", clinic?.id, "out"]');
    expect(stock).toContain('["stock-alerts", clinic?.id, "expiring", _daysThreshold]');
    expect(stock).toContain('["stock-movements", "recent", clinic?.id, limit]');
  });

  it("não limpa React Query duas vezes em SIGNED_IN", () => {
    const guard = read("src/components/app/AuthSessionGuard.tsx");
    expect(guard).not.toMatch(/event === "SIGNED_IN"[\s\S]{0,180}clearReactQueryCache/);
    expect(guard).not.toMatch(/event === "SIGNED_IN"[\s\S]{0,180}qc\.clear/);
  });

  it("não remonta o shell principal por key dinâmica de auth/clínica", () => {
    const app = read("src/App.tsx");
    expect(app).not.toMatch(/<ProviderShell\s+key=/);
    expect(app).not.toMatch(/key=\{[^}]*scopeKey/);
    expect(app).not.toMatch(/key=\{[^}]*clinicId/);
    expect(app).not.toMatch(/key=\{[^}]*location\.pathname/);
  });

  it("não limpa cache global no boot ou token refresh", () => {
    const app = read("src/App.tsx");
    const guard = read("src/components/app/AuthSessionGuard.tsx");
    expect(app).not.toMatch(/isInitialResolution[\s\S]{0,240}clearReactQueryCache/);
    expect(app).not.toMatch(/TOKEN_REFRESHED[\s\S]{0,240}clearReactQueryCache/);
    expect(guard).not.toMatch(/TOKEN_REFRESHED[\s\S]{0,240}clearReactQueryCache/);
  });

  it("centraliza auth.uid em AuthIdentityProvider resiliente", () => {
    const app = read("src/App.tsx");
    const identity = read("src/hooks/useAuthIdentity.ts");
    expect(app).toContain("<AuthIdentityProvider>");
    expect(identity).toContain("TOKEN_REFRESHED nunca troca identidade");
    expect(identity).toContain("tryRecoverSession");
    expect(identity).toContain("quarantineMismatchedAuthSession");
  });

  it("não expõe AuthDebugOverlay no layout final", () => {
    const layout = read("src/components/app/AppLayout.tsx");
    const overlay = read("src/components/dev/AuthDebugOverlay.tsx");
    const diagnostics = read("src/lib/authDiagnostics.ts");
    expect(layout).not.toContain("AuthDebugOverlay");
    expect(overlay).toContain("import.meta.env.DEV && import.meta.env.VITE_ENABLE_AUTH_DEBUG");
    expect(diagnostics).toContain("if (!import.meta.env.DEV");
  });

  it("não usa queryClient.clear para limpar sessão", () => {
    const diagnostics = read("src/lib/queryClientDiagnostics.ts");
    expect(diagnostics).not.toContain("queryClient.clear()");
    expect(diagnostics).toContain("queryClient.removeQueries()");
  });

  it("mantém sessão de suporte e view-role isolados por aba", () => {
    const support = read("src/lib/supportSession.ts");
    const viewMode = read("src/contexts/UserViewModeContext.tsx");
    expect(support).not.toMatch(/localStorage\.(getItem|setItem|removeItem)\(STORAGE_KEY\)/);
    expect(support).toMatch(/sessionStorage\.(getItem|setItem|removeItem)\(STORAGE_KEY\)/);
    expect(viewMode).not.toMatch(/localStorage\.(getItem|setItem|removeItem)\(STORAGE_KEY\)/);
    expect(viewMode).toMatch(/sessionStorage\.(getItem|setItem|removeItem)\(STORAGE_KEY\)/);
  });

  it("não mantém queryKeys sensíveis genéricas", () => {
    const files = [
      "src/hooks/useClinicData.ts",
      "src/hooks/useClinicFeatures.tsx",
      "src/hooks/useClinicSubscription.tsx",
      "src/hooks/usePermissions.tsx",
      "src/hooks/usePlatformAdmin.ts",
      "src/hooks/useUserManagement.ts",
    ];
    const forbidden = /queryKey:\s*\[\s*["'](profile|permissions|clinic|activeClinic|userRoles|clinicUsers|sidebar|user_roles|super-admin)["']\s*\]/;
    for (const file of files) {
      expect(read(file), file).not.toMatch(forbidden);
    }
  });
});