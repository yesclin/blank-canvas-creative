import { spawnSync } from "node:child_process";
import { existsSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default async function globalSetup() {
  const envFile = resolve(__dirname, ".env.local");
  if (existsSync(envFile)) config({ path: envFile });

  // ---------------------------------------------------------------------------
  // Modo 1 — usuários já existentes (sem service role).
  // Ativado quando E2E_USE_EXISTING_USERS=1 ou quando os 4 env vars de A/B estão
  // presentes. Gera .fixtures.json sintético e pula o bootstrap.
  // ---------------------------------------------------------------------------
  const userAEmail = process.env.E2E_USER_A_EMAIL;
  const userAPass = process.env.E2E_USER_A_PASSWORD;
  const userBEmail = process.env.E2E_USER_B_EMAIL;
  const userBPass = process.env.E2E_USER_B_PASSWORD;
  const hasEnvUsers = !!(userAEmail && userAPass && userBEmail && userBPass);
  const useExisting = process.env.E2E_USE_EXISTING_USERS === "1" || hasEnvUsers;

  if (useExisting) {
    if (!hasEnvUsers) {
      throw new Error(
        "Modo E2E_USE_EXISTING_USERS exige E2E_USER_A_EMAIL/PASSWORD e E2E_USER_B_EMAIL/PASSWORD em e2e/.env.local",
      );
    }
    const fixtures = {
      mode: "existing-users",
      password: userAPass, // compat (fixtures.password é o default do loginAs por role)
      clinicId: "",
      clinicSlug: process.env.E2E_CLINIC_SLUG ?? "",
      patientId: "",
      professionalId: "",
      users: {
        // role=owner ↔ user A, role=admin ↔ user B (apenas slots — papéis reais
        // vêm do banco para esses usuários)
        owner: { id: "", email: userAEmail, password: userAPass },
        admin: { id: "", email: userBEmail, password: userBPass },
        professional: { id: "", email: userAEmail, password: userAPass },
        receptionist: { id: "", email: userBEmail, password: userBPass },
      },
    };
    writeFileSync(resolve(__dirname, ".fixtures.json"), JSON.stringify(fixtures, null, 2));
    console.log("[e2e] modo usuários existentes — bootstrap pulado");
    return;
  }

  // ---------------------------------------------------------------------------
  // Modo 2 — bootstrap completo via service_role.
  // ---------------------------------------------------------------------------
  if (!existsSync(envFile)) {
    throw new Error(`e2e/.env.local não encontrado. Veja e2e/README.md para criar.`);
  }
  const result = spawnSync("bun", ["run", resolve(__dirname, "bootstrap.ts")], {
    stdio: "inherit",
    env: process.env,
  });
  if (result.status !== 0) {
    throw new Error("Bootstrap E2E falhou. Verifique os logs acima.");
  }
}
