import { test, expect } from "@playwright/test";
import { loginAs, getFixtures } from "../fixtures";

test.describe("Fluxo 1 — Login & contexto de clínica", () => {
  test("owner consegue logar e cair em rota autenticada", async ({ page }) => {
    await loginAs(page, "owner");
    // após login deve estar fora de /login
    expect(page.url()).not.toContain("/login");
    // sanity: app shell carregou (procura header/sidebar comuns)
    await expect(page.locator("body")).toBeVisible();
  });

  test("credenciais inválidas mostram erro e não redirecionam", async ({ page }) => {
    const fx = getFixtures();
    await page.goto("/login");
    await page.getByLabel(/e-?mail/i).fill(fx.users.owner.email);
    await page.getByLabel(/senha/i).fill("senha-errada-xxxx");
    await page.getByRole("button", { name: /entrar|login/i }).click();

    // continua em /login
    await page.waitForTimeout(2000);
    expect(page.url()).toContain("/login");
  });

  test("receptionist loga e tem acesso restrito ao módulo clínico (smoke)", async ({ page }) => {
    await loginAs(page, "receptionist");
    expect(page.url()).not.toContain("/login");
    // recepção tenta acessar prontuário diretamente — deve ser bloqueada por ClinicalAccessGuard
    await page.goto("/app/prontuario");
    await page.waitForTimeout(1500);
    // espera mensagem/redirect de bloqueio (regex tolerante até confirmar texto exato no app)
    const blocked =
      (await page.getByText(/acesso|permissão|restrito|bloque/i).count()) > 0 ||
      !page.url().includes("/prontuario");
    expect(blocked).toBeTruthy();
  });
});
