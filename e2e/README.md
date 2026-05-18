# Testes E2E — Sistema de Clínicas

Stack: **Playwright** + **Supabase real** (projeto `yfljqgmbnplkdjfhvunq`).

> ⚠️ Os testes criam/manipulam dados reais em uma clínica de teste isolada. Nunca aponte para o projeto Supabase de produção sem reler o `bootstrap.ts`.

## Pré-requisitos

1. **Credenciais locais** — crie `e2e/.env.local` (já no `.gitignore`):

   ```env
   E2E_BASE_URL=http://localhost:8080
   E2E_SUPABASE_URL=https://yfljqgmbnplkdjfhvunq.supabase.co
   E2E_SUPABASE_ANON_KEY=<anon key>
   E2E_SUPABASE_SERVICE_ROLE_KEY=<service role key — NUNCA commitar>

   # Identidade da clínica/usuários de teste (gerados pelo bootstrap)
   E2E_CLINIC_SLUG=e2e-clinic
   E2E_PASSWORD=E2E!Test#2026

   E2E_OWNER_EMAIL=e2e-owner@example.test
   E2E_ADMIN_EMAIL=e2e-admin@example.test
   E2E_PROFESSIONAL_EMAIL=e2e-pro@example.test
   E2E_RECEPTIONIST_EMAIL=e2e-recep@example.test
   ```

   O `service_role_key` está em **Supabase Dashboard → Settings → API**. Use-o apenas localmente — nunca em código de cliente.

2. **Servidor de dev rodando** em `http://localhost:8080` (ou ajuste `E2E_BASE_URL`).

3. **Browsers do Playwright** (1 vez):

   ```bash
   bunx playwright install chromium
   ```

## Bootstrap dos dados de teste

Roda automaticamente antes da suíte (via `globalSetup`). Para executar manualmente:

```bash
bun run e2e/bootstrap.ts
```

O script é **idempotente**:
- Cria (ou reaproveita) 4 `auth.users` confirmados (owner, admin, professional, receptionist).
- Cria/garante 1 `clinic` slug `e2e-clinic` com plano Pro.
- Cria/garante `clinic_users` ligando cada usuário ao seu role.
- Cria 1 profissional vinculado ao usuário `professional`.
- Cria 1 serviço, 1 paciente fixture, 1 produto de estoque com saldo.

Resultado fica registrado em `e2e/.fixtures.json` para os specs lerem (IDs estáveis).

## Rodar

```bash
bunx playwright test            # todos
bunx playwright test login      # filtra por nome
bunx playwright test --ui       # modo UI interativo
bunx playwright show-report     # ver último relatório HTML
```

## Estrutura

```
e2e/
  bootstrap.ts          # cria/sincroniza dados de teste via service_role
  global-setup.ts       # chamado pelo Playwright antes de qualquer spec
  fixtures.ts           # helpers de login + leitura de .fixtures.json
  .fixtures.json        # gerado pelo bootstrap (gitignored)
  specs/
    01-login.spec.ts                       ✅ implementado
    02-patient-registration.spec.ts        ⏳ próxima entrega
    03-appointment-scheduling.spec.ts      ⏳
    04-start-attendance.spec.ts            ⏳
    05-evolution-anamnesis.spec.ts         ⏳
    06-document-signature.spec.ts          ⏳
    07-finance-transaction.spec.ts         ⏳
    08-sale-with-stock.spec.ts             ⏳
    09-public-booking.spec.ts              ⏳
    10-teleconsultation.spec.ts            ⏳
```

## Limpeza

Os dados de teste permanecem entre execuções (bootstrap idempotente).
Para zerar manualmente, execute no Supabase SQL Editor:

```sql
-- ATENÇÃO: apaga a clínica de teste inteira
DELETE FROM clinics WHERE slug = 'e2e-clinic';
DELETE FROM auth.users WHERE email LIKE 'e2e-%@example.test';
```
