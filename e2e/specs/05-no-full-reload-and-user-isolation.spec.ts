import { expect, test, type Page } from "@playwright/test";
import { getFixtures, loginAs, logout, type Role } from "../fixtures";

const roleLabel: Record<Role, string> = {
  owner: "Proprietário",
  admin: "Administrador",
  professional: "Profissional",
  receptionist: "Recepcionista",
};

function expectedName(role: Role) {
  const user = getFixtures().users[role];
  return user.fullName ?? user.email;
}

async function expectSidebarIdentity(page: Page, role: Role) {
  const footer = page.locator('[data-tour="user-profile"]');
  await expect(footer).toContainText(expectedName(role), { timeout: 20_000 });
  await expect(footer).toContainText(roleLabel[role]);
}

async function installReloadProbe(page: Page) {
  await page.evaluate(() => {
    const w = window as typeof window & {
      __ycDocumentLoadEvents?: number;
      __ycGlobalLoaderHits?: number;
    };
    w.__ycDocumentLoadEvents = 0;
    w.__ycGlobalLoaderHits = 0;

    const looksLikeGlobalLoader = () => {
      const bodyText = document.body.innerText || "";
      if (/Carregando autenticação|Carregando sistema/i.test(bodyText)) return true;
      return Boolean(document.querySelector('.h-screen.items-center.justify-center, .min-h-screen.items-center.justify-center'));
    };

    const observer = new MutationObserver(() => {
      if (looksLikeGlobalLoader()) w.__ycGlobalLoaderHits = (w.__ycGlobalLoaderHits ?? 0) + 1;
    });
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
    window.addEventListener("load", () => {
      w.__ycDocumentLoadEvents = (w.__ycDocumentLoadEvents ?? 0) + 1;
    });
  });
}

async function readReloadProbe(page: Page) {
  return page.evaluate(() => {
    const w = window as typeof window & {
      __ycAppMountCount?: number;
      __ycAppLayoutMountCount?: number;
      __ycDocumentLoadEvents?: number;
      __ycGlobalLoaderHits?: number;
    };
    return {
      appMounts: w.__ycAppMountCount ?? 0,
      layoutMounts: w.__ycAppLayoutMountCount ?? 0,
      documentLoads: w.__ycDocumentLoadEvents ?? 0,
      globalLoaderHits: w.__ycGlobalLoaderHits ?? 0,
    };
  });
}

async function clickSidebar(page: Page, label: string, expectedPath: RegExp) {
  await page.getByRole("link", { name: new RegExp(label, "i") }).first().click();
  await page.waitForURL((url) => expectedPath.test(url.pathname), { timeout: 20_000 });
  await expect(page.locator("body")).toBeVisible();
}

test.describe("Sessão/cache — sem reload global e sem vazamento A/B", () => {
  test("login A navega 5 telas sem reload, logout, login B sem dados de A e retorno à aba estável", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await loginAs(page, "owner");
    await expectSidebarIdentity(page, "owner");
    await installReloadProbe(page);
    const before = await readReloadProbe(page);

    await clickSidebar(page, "Dashboard", /^\/app$/);
    await clickSidebar(page, "Agenda", /^\/app\/agenda$/);
    await clickSidebar(page, "Pacientes", /^\/app\/pacientes$/);
    await clickSidebar(page, "Atendimento", /^\/app\/atendimento$/);
    await clickSidebar(page, "Finanças", /^\/app\/gestao\/financas$/);

    const afterNavigation = await readReloadProbe(page);
    expect(afterNavigation.documentLoads, "navegação interna disparou load full-document").toBe(before.documentLoads);
    expect(afterNavigation.appMounts, "App remontou durante navegação comum").toBe(before.appMounts);
    expect(afterNavigation.layoutMounts, "AppLayout remontou durante navegação comum").toBe(before.layoutMounts);
    expect(afterNavigation.globalLoaderHits, "loading global apareceu durante navegação comum").toBe(0);

    await logout(page);
    await loginAs(page, "admin");
    await expectSidebarIdentity(page, "admin");
    await expect(page.locator('[data-tour="user-profile"]')).not.toContainText(expectedName("owner"));

    const otherPage = await context.newPage();
    await otherPage.goto("/ajuda");
    await page.bringToFront();
    await expectSidebarIdentity(page, "admin");
    await expect(page.locator('[data-tour="user-profile"]')).not.toContainText(expectedName("owner"));

    await context.close();
  });
});