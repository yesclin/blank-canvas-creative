import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { Page } from "@playwright/test";

export type Role = "owner" | "admin" | "professional" | "receptionist";

export interface E2EFixtures {
  clinicId: string;
  clinicSlug: string;
  patientId: string;
  professionalId: string;
  password: string;
  users: Record<Role, { id: string; email: string }>;
}

let cached: E2EFixtures | null = null;
export function getFixtures(): E2EFixtures {
  if (cached) return cached;
  const path = resolve(__dirname, ".fixtures.json");
  cached = JSON.parse(readFileSync(path, "utf8")) as E2EFixtures;
  return cached;
}

/**
 * Faz login pela UI (cobre o fluxo real do usuário).
 * Ajuste os seletores se a página de auth mudar.
 */
export async function loginAs(page: Page, role: Role) {
  const fx = getFixtures();
  const { email } = fx.users[role];

  await page.goto("/auth");
  await page.getByLabel(/e-?mail/i).fill(email);
  await page.getByLabel(/senha/i).fill(fx.password);
  await page.getByRole("button", { name: /entrar|login/i }).click();
  // espera redirect pós-login
  await page.waitForURL((url) => !url.pathname.startsWith("/auth"), { timeout: 20_000 });
}
