/**
 * E2E bootstrap — cria/sincroniza dados de teste no Supabase real.
 * Idempotente: pode rodar quantas vezes for necessário.
 *
 * Uso:
 *   bun run e2e/bootstrap.ts
 *
 * Requer e2e/.env.local com E2E_SUPABASE_URL e E2E_SUPABASE_SERVICE_ROLE_KEY.
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const url = process.env.E2E_SUPABASE_URL!;
const serviceKey = process.env.E2E_SUPABASE_SERVICE_ROLE_KEY!;
const password = process.env.E2E_PASSWORD ?? "E2E!Test#2026";
const clinicSlug = process.env.E2E_CLINIC_SLUG ?? "e2e-clinic";

if (!url || !serviceKey) {
  throw new Error(
    "Defina E2E_SUPABASE_URL e E2E_SUPABASE_SERVICE_ROLE_KEY em e2e/.env.local"
  );
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

type Role = "owner" | "admin" | "professional" | "receptionist";

const USERS: Array<{ role: Role; envKey: string; defaultEmail: string; fullName: string }> = [
  { role: "owner", envKey: "E2E_OWNER_EMAIL", defaultEmail: "e2e-owner@example.test", fullName: "E2E Owner" },
  { role: "admin", envKey: "E2E_ADMIN_EMAIL", defaultEmail: "e2e-admin@example.test", fullName: "E2E Admin" },
  { role: "professional", envKey: "E2E_PROFESSIONAL_EMAIL", defaultEmail: "e2e-pro@example.test", fullName: "Dra. E2E Profissional" },
  { role: "receptionist", envKey: "E2E_RECEPTIONIST_EMAIL", defaultEmail: "e2e-recep@example.test", fullName: "E2E Recepção" },
];

async function ensureUser(email: string, fullName: string): Promise<string> {
  // Tenta achar
  const { data: list, error: listErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (listErr) throw listErr;
  const existing = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (existing) {
    // garante senha conhecida
    await admin.auth.admin.updateUserById(existing.id, { password, email_confirm: true });
    return existing.id;
  }
  const { data: created, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, e2e: true },
  });
  if (error) throw error;
  return created.user!.id;
}

async function ensureClinic(ownerId: string): Promise<string> {
  const { data: existing } = await admin
    .from("clinics")
    .select("id")
    .eq("slug", clinicSlug)
    .maybeSingle();
  if (existing?.id) return existing.id;

  const { data: created, error } = await admin
    .from("clinics")
    .insert({
      slug: clinicSlug,
      name: "Clínica E2E",
      owner_user_id: ownerId,
      email: USERS[0].defaultEmail,
    })
    .select("id")
    .single();
  if (error) throw error;
  return created.id;
}

async function ensureClinicUser(clinicId: string, userId: string, role: Role) {
  const { data: existing } = await admin
    .from("clinic_users")
    .select("id")
    .eq("clinic_id", clinicId)
    .eq("user_id", userId)
    .maybeSingle();
  if (existing) return;
  const { error } = await admin
    .from("clinic_users")
    .insert({ clinic_id: clinicId, user_id: userId, role, status: "active" });
  if (error) throw error;
}

async function ensureProfessional(clinicId: string, userId: string, fullName: string): Promise<string> {
  const { data: existing } = await admin
    .from("professionals")
    .select("id")
    .eq("clinic_id", clinicId)
    .eq("user_id", userId)
    .maybeSingle();
  if (existing?.id) return existing.id;
  const { data: created, error } = await admin
    .from("professionals")
    .insert({
      clinic_id: clinicId,
      user_id: userId,
      full_name: fullName,
      specialty: "Clínica Geral",
      registration_number: "E2E-0001",
    })
    .select("id")
    .single();
  if (error) throw error;
  return created.id;
}

async function ensurePatient(clinicId: string): Promise<string> {
  const cpf = "00000000191"; // CPF de teste válido (formato)
  const { data: existing } = await admin
    .from("patients")
    .select("id")
    .eq("clinic_id", clinicId)
    .eq("cpf", cpf)
    .maybeSingle();
  if (existing?.id) return existing.id;
  const { data, error } = await admin
    .from("patients")
    .insert({
      clinic_id: clinicId,
      full_name: "Paciente E2E Fixture",
      cpf,
      birth_date: "1990-01-15",
      phone: "11999990000",
      email: "paciente-e2e@example.test",
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

async function main() {
  console.log("[bootstrap] iniciando…");
  const userIds: Record<Role, string> = {} as never;
  for (const u of USERS) {
    const email = process.env[u.envKey] ?? u.defaultEmail;
    userIds[u.role] = await ensureUser(email, u.fullName);
    console.log(`  ✓ user ${u.role}: ${email}`);
  }

  const clinicId = await ensureClinic(userIds.owner);
  console.log(`  ✓ clinic: ${clinicId}`);

  for (const u of USERS) {
    await ensureClinicUser(clinicId, userIds[u.role], u.role);
  }
  console.log("  ✓ clinic_users vinculados");

  const professionalId = await ensureProfessional(
    clinicId,
    userIds.professional,
    USERS.find((u) => u.role === "professional")!.fullName,
  );
  console.log(`  ✓ professional: ${professionalId}`);

  const patientId = await ensurePatient(clinicId);
  console.log(`  ✓ patient fixture: ${patientId}`);

  const fixtures = {
    clinicId,
    clinicSlug,
    patientId,
    professionalId,
    users: Object.fromEntries(
      USERS.map((u) => [
        u.role,
        { id: userIds[u.role], email: process.env[u.envKey] ?? u.defaultEmail },
      ]),
    ),
    password,
  };

  writeFileSync(
    resolve(__dirname, ".fixtures.json"),
    JSON.stringify(fixtures, null, 2),
  );
  console.log("[bootstrap] OK → e2e/.fixtures.json");
}

main().catch((err) => {
  console.error("[bootstrap] FAILED", err);
  process.exit(1);
});
