import { expect, test, type Page } from "@playwright/test";
import { getFixtures, loginAs, logout, type Role } from "../fixtures";

/**
 * Garante que, ao trocar de usuário (login A → logout → login B),
 * a sidebar e o storage local NUNCA exibam ou retenham dados do usuário anterior.
 *
 * Cobre o bug recorrente em que "Arthur Lopes / Proprietário" ou "yi4405 / Administrador"
 * apareciam para a Beatriz após troca de sessão.
 */

const roleLabel: Record<Role, string> = {
  owner: "Proprietário",
  admin: "Administrador",
  professional: "Profissional",
  receptionist: "Recepcionista",
};

function identityFor(role: Role) {
  const fx = getFixtures();
  const u = fx.users[role];
  return { name: u.fullName ?? u.email, email: u.email, id: u.id };
}

async function assertSidebarShows(page: Page, role: Role) {
  const me = identityFor(role);
  const footer = page.locator('[data-tour="user-profile"]');
  await expect(footer).toBeVisible({ timeout: 20_000 });
  await expect(footer).toContainText(me.name, { timeout: 20_000 });
  await expect(footer).toContainText(roleLabel[role]);
}

async function assertSidebarDoesNotShow(page: Page, role: Role) {
  const other = identityFor(role);
  const footer = page.locator('[data-tour="user-profile"]');
  await expect(footer).not.toContainText(other.name);
  await expect(footer).not.toContainText(other.email);
}

async function assertNoStaleUserInStorage(page: Page, previousUserId: string) {
  const leaks = await page.evaluate((prevId) => {
    const found: Array<{ key: string; where: "local" | "session" }> = [];
    for (const where of ["local", "session"] as const) {
      const store = where === "local" ? localStorage : sessionStorage;
      for (let i = 0; i < store.length; i++) {
        const key = store.key(i)!;
        const value = store.getItem(key) ?? "";
        if (value.includes(prevId)) found.push({ key, where });
      }
    }
    return found;
  }, previousUserId);
  expect(leaks, `storage ainda contém referências ao usuário anterior: ${JSON.stringify(leaks)}`).toEqual([]);
}

test.describe("Sidebar — zero vazamento de identidade entre sessões", () => {
  test("login A → logout → login B: sidebar reflete só B, sem traços de A", async ({ page }) => {
    const A: Role = "owner";
    const B: Role = "admin";
    const aId = identityFor(A).id;

    await loginAs(page, A);
    await assertSidebarShows(page, A);

    await logout(page);

    await loginAs(page, B);
    await assertSidebarShows(page, B);
    await assertSidebarDoesNotShow(page, A);

    // Reload — não pode "ressuscitar" identidade antiga via cache/localStorage
    await page.reload();
    await assertSidebarShows(page, B);
    await assertSidebarDoesNotShow(page, A);

    // Storage não deve conter user_id, profile, role nem cache de React Query do usuário A
    await assertNoStaleUserInStorage(page, aId);
  });

  test("ciclo triplo A → B → A mantém isolamento estrito", async ({ page }) => {
    await loginAs(page, "owner");
    await assertSidebarShows(page, "owner");
    await logout(page);

    await loginAs(page, "admin");
    await assertSidebarShows(page, "admin");
    await assertSidebarDoesNotShow(page, "owner");
    await logout(page);

    await loginAs(page, "owner");
    await assertSidebarShows(page, "owner");
    await assertSidebarDoesNotShow(page, "admin");
  });

  test("durante a transição de login a sidebar nunca exibe o usuário anterior", async ({ page }) => {
    await loginAs(page, "owner");
    await assertSidebarShows(page, "owner");

    const ownerName = identityFor("owner").name;
    const footer = page.locator('[data-tour="user-profile"]');

    await logout(page);
    await loginAs(page, "admin");

    // Captura amostras rápidas durante o boot pós-login: jamais deve aparecer "owner"
    const deadline = Date.now() + 5_000;
    while (Date.now() < deadline) {
      if (await footer.count()) {
        const text = (await footer.innerText().catch(() => "")) ?? "";
        expect(text).not.toContain(ownerName);
      }
      await page.waitForTimeout(150);
    }

    await assertSidebarShows(page, "admin");
  });
});
