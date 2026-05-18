import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

export default async function globalSetup() {
  const envFile = resolve(__dirname, ".env.local");
  if (!existsSync(envFile)) {
    throw new Error(
      `e2e/.env.local não encontrado. Veja e2e/README.md para criar.`,
    );
  }
  const result = spawnSync("bun", ["run", resolve(__dirname, "bootstrap.ts")], {
    stdio: "inherit",
    env: process.env,
  });
  if (result.status !== 0) {
    throw new Error("Bootstrap E2E falhou. Verifique os logs acima.");
  }
}
