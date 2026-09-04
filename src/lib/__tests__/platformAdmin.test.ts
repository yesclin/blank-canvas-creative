import { describe, expect, it, vi, beforeEach } from "vitest";

/**
 * `is_platform_admin` era chamada por 6 pontos independentes (escopo da
 * clínica, dados da clínica, convênios, super admin, login, home). Aqui
 * garantimos que a RPC roda UMA vez por usuário dentro da janela de cache e
 * que troca de identidade/logout força nova validação no banco.
 */

let rpcCalls: string[] = [];

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    rpc: async (name: string, args: { _user_id: string }) => {
      rpcCalls.push(`${name}:${args._user_id}`);
      return { data: args._user_id === "admin-1", error: null };
    },
  },
}));

const load = async () => {
  vi.resetModules();
  rpcCalls = [];
  return import("../platformAdmin");
};

beforeEach(() => {
  rpcCalls = [];
});

describe("checkPlatformAdmin", () => {
  it("20 chamadas simultâneas resultam em 1 RPC", async () => {
    const { checkPlatformAdmin } = await load();
    const results = await Promise.all(
      Array.from({ length: 20 }, () => checkPlatformAdmin("admin-1")),
    );
    expect(results.every((r) => r === true)).toBe(true);
    expect(rpcCalls).toHaveLength(1);
  });

  it("chamadas sequenciais reaproveitam o resultado", async () => {
    const { checkPlatformAdmin } = await load();
    await checkPlatformAdmin("user-2");
    const second = await checkPlatformAdmin("user-2");
    expect(second).toBe(false);
    expect(rpcCalls).toHaveLength(1);
  });

  it("usuário diferente revalida no banco", async () => {
    const { checkPlatformAdmin } = await load();
    await checkPlatformAdmin("user-2");
    await checkPlatformAdmin("admin-1");
    expect(rpcCalls).toEqual(["is_platform_admin:user-2", "is_platform_admin:admin-1"]);
  });

  it("logout/troca de identidade invalida o cache", async () => {
    const { checkPlatformAdmin, invalidatePlatformAdminCache } = await load();
    await checkPlatformAdmin("admin-1");
    invalidatePlatformAdminCache();
    await checkPlatformAdmin("admin-1");
    expect(rpcCalls).toHaveLength(2);
  });

  it("sem usuário não chama o banco", async () => {
    const { checkPlatformAdmin } = await load();
    expect(await checkPlatformAdmin(null)).toBe(false);
    expect(rpcCalls).toHaveLength(0);
  });
});
