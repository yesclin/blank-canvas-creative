import { describe, expect, it, vi, beforeEach } from "vitest";

/**
 * Garante que supabase.auth.getUser() não dispare uma requisição de rede por
 * chamador. O app tem ~170 pontos que precisam do auth.uid(); sem dedup isso
 * virava centenas de chamadas a /auth/v1/user por navegação (Stalled alto).
 */

let networkCalls = 0;
const listeners: Array<(event: string, session: unknown) => void> = [];

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    auth: {
      getUser: async (jwt?: string) => {
        networkCalls++;
        return { data: { user: { id: jwt ? "from-jwt" : "user-1" } }, error: null };
      },
      onAuthStateChange: (cb: (event: string, session: unknown) => void) => {
        listeners.push(cb);
        return { data: { subscription: { unsubscribe: () => {} } } };
      },
      getSession: async () => ({ data: { session: null }, error: null }),
    },
    from: () => ({}),
  }),
}));

const loadClient = async () => {
  vi.resetModules();
  networkCalls = 0;
  listeners.length = 0;
  return import("../client");
};

beforeEach(() => {
  vi.useRealTimers();
});

describe("dedup de auth.getUser", () => {
  it("40 chamadas simultâneas resultam em 1 requisição", async () => {
    const { supabase } = await loadClient();
    const results = await Promise.all(
      Array.from({ length: 40 }, () => supabase.auth.getUser()),
    );
    expect(results).toHaveLength(40);
    expect(results.every((r: any) => r.data.user.id === "user-1")).toBe(true);
    expect(networkCalls).toBe(1);
  });

  it("chamadas sequenciais dentro da janela reaproveitam o resultado", async () => {
    const { supabase } = await loadClient();
    await supabase.auth.getUser();
    await supabase.auth.getUser();
    await supabase.auth.getUser();
    expect(networkCalls).toBe(1);
  });

  it("evento de auth invalida o cache (segurança preservada)", async () => {
    const { supabase } = await loadClient();
    await supabase.auth.getUser();
    expect(networkCalls).toBe(1);
    listeners.forEach((cb) => cb("SIGNED_OUT", null));
    await supabase.auth.getUser();
    expect(networkCalls).toBe(2);
  });

  it("validação de um JWT específico nunca usa cache", async () => {
    const { supabase } = await loadClient();
    await supabase.auth.getUser();
    const a = await supabase.auth.getUser("token-a");
    const b = await supabase.auth.getUser("token-b");
    expect(a.data.user.id).toBe("from-jwt");
    expect(b.data.user.id).toBe("from-jwt");
    expect(networkCalls).toBe(3);
  });
});
