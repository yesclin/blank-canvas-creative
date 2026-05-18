import { expect, test } from "@playwright/test";
import { getFixtures, loginAs, logout, type Role } from "../fixtures";

const roleLabel: Record<Role, string> = {
  owner: "Proprietário",
  admin: "Administrador",
  professional: "Profissional",
  receptionist: "Recepcionista",
};

async function expectSidebarIdentity(page: import("@playwright/test").Page, role: Role) {
  const fx = getFixtures();
  const expectedName = fx.users[role].fullName ?? fx.users[role].email;
  const footer = page.locator('[data-tour="user-profile"]');
  await expect(footer).toContainText(expectedName, { timeout: 20_000 });
  await expect(footer).toContainText(roleLabel[role]);
}

test.describe("Auth — isolamento de identidade entre sessões", () => {
  test("não reutiliza sidebar/profile/role entre login A, login B e retorno ao A", async ({ page }) => {
    await loginAs(page, "owner");
    await expectSidebarIdentity(page, "owner");

    await logout(page);

    await loginAs(page, "admin");
    await expectSidebarIdentity(page, "admin");
    await expect(page.locator('[data-tour="user-profile"]')).not.toContainText(
      getFixtures().users.owner.fullName ?? getFixtures().users.owner.email,
    );

    await logout(page);

    await loginAs(page, "owner");
    await expectSidebarIdentity(page, "owner");
    await expect(page.locator('[data-tour="user-profile"]')).not.toContainText(
      getFixtures().users.admin.fullName ?? getFixtures().users.admin.email,
    );

    await page.reload();
    await expectSidebarIdentity(page, "owner");
  });

  test("duas abas não misturam identidade visual", async ({ browser }) => {
    const ownerContext = await browser.newContext();
    const adminContext = await browser.newContext();
    const ownerPage = await ownerContext.newPage();
    const adminPage = await adminContext.newPage();

    await loginAs(ownerPage, "owner");
    await loginAs(adminPage, "admin");

    await expectSidebarIdentity(ownerPage, "owner");
    await expectSidebarIdentity(adminPage, "admin");
    await expect(ownerPage.locator('[data-tour="user-profile"]')).not.toContainText(
      getFixtures().users.admin.fullName ?? getFixtures().users.admin.email,
    );
    await expect(adminPage.locator('[data-tour="user-profile"]')).not.toContainText(
      getFixtures().users.owner.fullName ?? getFixtures().users.owner.email,
    );

    await ownerContext.close();
    await adminContext.close();
  });

  test("falha na query de permissões não reaproveita usuário anterior", async ({ page }) => {
    await loginAs(page, "owner");
    await expectSidebarIdentity(page, "owner");
    await logout(page);

    await page.route("**/rest/v1/rpc/get_user_all_permissions**", (route) =>
      route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ message: "forced e2e failure" }) }),
    );

    await loginAs(page, "admin");
    await expect(page.locator('[data-tour="user-profile"]')).not.toContainText(
      getFixtures().users.owner.fullName ?? getFixtures().users.owner.email,
    );
  });
});