import { expect, test, type Page } from "@playwright/test";
import { getFixtures, loginAs, logout } from "../fixtures";

/**
 * Spec independente de bootstrap (service_role). Funciona com qualquer par de
 * usuários reais informados via env (E2E_USER_A_* / E2E_USER_B_*).
 *
 * Valida o invariante essencial: ao trocar A→B, a sidebar e o storage NUNCA
 * podem conter resíduo do usuário A (e vice-versa).
 *
 * Skipa automaticamente quando as credenciais não estão configuradas.
 */
const fx = getFixtures();
const usingExisting = fx.mode === "existing-users";

const emailA = fx.users.owner.email;
const emailB = fx.users.admin.email;
const localA = emailA.split("@")[0];
const localB = emailB.split("@")[0];

async function getStorageDump(page: Page) {
  return page.evaluate(() => {
    const dump: Array<{ where: string; key: string; value: string }> = [];
    for (const where of ["local", "session"] as const) {
      const s = where === "local" ? localStorage : sessionStorage;
      for (let i = 0; i < s.length; i++) {
        const k = s.key(i)!;
        dump.push({ where, key: k, value: s.getItem(k) ?? "" });
      }
    }
    return dump;
  });
}

async function expectNoTraceOf(page: Page, needles: string[]) {
  const footer = page.locator('[data-tour="user-profile"]');
  await expect(footer).toBeVisible({ timeout: 20_000 });
  const text = (await footer.innerText()) ?? "";
  for (const n of needles) {
    expect(text, `sidebar contém resíduo do usuário anterior (${n})`).not.toContain(n);
  }
  const dump = await getStorageDump(page);
  for (const entry of dump) {
    for (const n of needles) {
      expect(
        entry.value.toLowerCase().includes(n.toLowerCase()),
        `storage[${entry.where}][${entry.key}] contém resíduo do usuário anterior (${n})`,
      ).toBe(false);
    }
  }
}

test.describe("Identidade — usuários reais via env (sem service role)", () => {
  test.skip(!usingExisting, "Defina E2E_USER_A_* e E2E_USER_B_* em e2e/.env.local para rodar esta spec");

  test("login A → logout → login B: sidebar e storage não contêm A", async ({ page }) => {
    await loginAs(page, "owner"); // A
    await expect(page.locator('[data-tour="user-profile"]')).toContainText(localA, {
      timeout: 20_000,
    });

    await logout(page);

    await loginAs(page, "admin"); // B
    await expect(page.locator('[data-tour="user-profile"]')).toContainText(localB, {
      timeout: 20_000,
    });

    await expectNoTraceOf(page, [emailA, localA]);

    await page.reload();
    await expect(page.locator('[data-tour="user-profile"]')).toContainText(localB, {
      timeout: 20_000,
    });
    await expectNoTraceOf(page, [emailA, localA]);
  });

  test("login B → logout → login A: sidebar e storage não contêm B", async ({ page }) => {
    await loginAs(page, "admin");
    await expect(page.locator('[data-tour="user-profile"]')).toContainText(localB, { timeout: 20_000 });

    await logout(page);

    await loginAs(page, "owner");
    await expect(page.locator('[data-tour="user-profile"]')).toContainText(localA, { timeout: 20_000 });
    await expectNoTraceOf(page, [emailB, localB]);
  });
});
