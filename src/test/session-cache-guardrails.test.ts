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

  it("usa storage de auth isolado por aba", () => {
    const source = read("src/integrations/supabase/client.ts");
    expect(source).toContain("storage: perTabAuthStorage");
    expect(source).not.toMatch(/storage:\s*localStorage/);
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
});