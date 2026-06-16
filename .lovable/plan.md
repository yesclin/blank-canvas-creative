
## Diagnóstico

Encontrei **170 chamadas a `supabase.auth.getUser()` espalhadas em 116 arquivos** (hooks de CRUD, formulários, mutações). Cada uma delas faz uma **chamada de rede ao servidor de Auth do Supabase** para revalidar o JWT, e em quase todos os casos é seguida por **outra query a `profiles`** só para descobrir o `clinic_id`.

Resultado prático para o usuário: cada clique que dispara uma query/mutação faz **2–3 round-trips extras** antes da query "real" começar. Isso:
- atrasa toda ação no app (sensação de "está demorando"),
- consome Edge Functions / quota de Auth desnecessariamente,
- e em navegação rápida gera filas de requests redundantes.

Top ofensores: `useUserManagement` (7), `useAnamnesisTemplatesV2` (5), `useKanbanOpportunities`/`useConversions` (4), e dezenas de hooks com 2–3 chamadas cada (CRMs, prontuário, estoque, financeiro, agenda).

Já existe a infraestrutura certa — `useActiveClinicScope` mantém `{ userId, clinicId, role }` em cache React Query (staleTime 5 min) e `AuthIdentityProvider` mantém o `userId` validado. **Os hooks simplesmente não estão usando.**

## Objetivo

1. **Zero** `supabase.auth.getUser()` em hooks de dados durante navegação/uso normal.
2. **Pré-carregar** as estruturas estáveis (specialties, procedures, professionals, rooms, payment methods, insurances, clinic data, permissions) logo após login, em paralelo, e mantê-las em cache.
3. Manter `getUser()` apenas onde é semanticamente necessário: login, troca de senha, validação de identidade, edge function callers.

## Mudanças

### 1. Novo helper `useClinicContext` (src/hooks/useClinicContext.ts)
Wrapper fino sobre `useActiveClinicScope` que devolve `{ userId, clinicId, role, isReady }` já validado. Substitui o padrão `getClinicId()` local em todos os hooks.

Também exporta uma versão imperativa `getCachedClinicContext(queryClient)` que lê o cache do React Query para uso em **mutations** (que não podem chamar hooks), eliminando o `await supabase.auth.getUser()` dentro de `mutationFn`.

### 2. Refactor em lote dos hooks
Substituir o padrão:
```ts
async function getClinicId() {
  const { data: { user } } = await supabase.auth.getUser();
  const { data } = await supabase.from("profiles").select("clinic_id")...
  return data.clinic_id;
}
```
por leitura do cache (`getCachedClinicContext` em mutations / `useClinicContext` em queries). Hooks alvo (prioridade alta — mais usados na navegação):
- Agenda: `useAppointments`, `useAgendaRealData`, `useProfessionalSchedules`
- Pacientes: `usePatients`, `usePatientSegments`, `usePreRegistration`
- Prontuário (clinica-geral, aesthetics, psicologia, nutricao, fisioterapia): todos os `use*Data.ts`
- Comercial / CRM: `useLeads`, `useQuotes`, `useOpportunities`, `useKanbanOpportunities`, `useConversions`, `useFollowups`, `useCommercialStats`, `useCommercialGoals`, `usePipelineStages`, `useCrmOptions`
- Estoque/Cadastros: `useInventoryItems`, `useInventoryBatches`, `useInventoryMovements`, `useProducts`, `useMaterialsCRUD`, `useMaterialKitsCRUD`, `useProductKitsCRUD`, `useProceduresCRUD`, `useProcedureProductsCRUD`, `useProcedureMaterialsCRUD`, `useProcedureKitsCRUD`, `useProcedureConsumption*`, `useProcedureCostCalculation`, `useStockMovements`, `useStockPredictionAlerts`, `useProcedureStockValidation`
- Financeiro: `useFinanceTransactions`, `useReceiveAppointmentPayment`, `usePaymentMethods`, `useSales`
- Convênios: `useConveniosData`, `useTissGuideGeneration`
- Comunicação: `useMessageQueue`
- LGPD: `useConsentFlow`, `useAuditService`, `usePatientConsents`, `useAccessLogs`, `useLgpdEnforcement`
- Documentos: `useUnifiedDocumentSigning`, `useDocumentGovernance`, `useInstitutionalPdf`, `useClinicalDocumentFlow`, `useClinicalEvolutionFlow`, `useAnamnesisTemplates*`, `useAnamnesisModels`, `useAppointmentImages`, `useMedicalRecordFiles`, `useProfessionalSignature`, `useClinicalScales`
- Onboarding: `useOnboarding`
- Users: `useUserManagement`, `useClinicUsers`, `useUserAuditLogs`, `usePlatformAdmin`

Onde a mutação precisa do `user.id` (auditoria, `created_by`), usar o `userId` já em cache em vez de `getUser()`.

### 3. Pré-carregamento pós-login
Adicionar em `loadPostLoginContext` (já existe no fluxo de login) `queryClient.prefetchQuery` em paralelo para o conjunto **estável** de dados que o app usa em quase toda tela:
- `["clinic-data", userId, clinicId]`
- `["specialties", clinicId]`
- `["procedures", clinicId]`
- `["professionals", clinicId]`
- `["rooms", clinicId]`
- `["payment-methods", clinicId]`
- `["insurances", clinicId]`
- `["permissions", userId, clinicId]`

Todos com `staleTime: 5 min` (já é o padrão). Assim, ao abrir Agenda/Pacientes/Atendimento pela primeira vez, **nada de loading global** — os dados já estão no cache.

### 4. Manter `getUser()` apenas onde faz sentido
- `Login.tsx`, `RedefinirSenha.tsx`, `CriarConta.tsx`, `AceitarConvite.tsx`
- `useAuthIdentity.ts` (única fonte de verdade já existente)
- `authSessionRecovery.ts`, `authSessionIsolation.ts`
- Edge function callers que precisam revalidar antes de assinar um documento (`useUnifiedDocumentSigning`, `useProfessionalSignature`) — **só no momento do clique de assinar**, não em queries.

### 5. Guarda contra regressão
Adicionar regra ESLint (`no-restricted-syntax`) que avisa quando `supabase.auth.getUser()` é usado fora dos arquivos da whitelist acima (`src/lib/auth*`, `src/hooks/useAuthIdentity.ts`, páginas de auth).

## Validação

- Console: nenhum `auth/v1/user` em cliques de menu (verificar Network).
- 1 transição = 1 skeleton (do Suspense lazy) → conteúdo. Sem segundo loading.
- Tests existentes em `src/test/session-cache-guardrails.test.ts` continuam passando.
- Smoke manual via Playwright: login → Dashboard → Agenda → Pacientes → Atendimento → Configurações → Financeiro, contando requests para `/auth/v1/user` (esperado: 1, durante o login).

## Detalhes técnicos

- `getCachedClinicContext(queryClient)` lê `queryClient.getQueryData(["active-clinic-scope", userId, supportKey])`. Se ausente, faz fallback para `queryClient.fetchQuery` da mesma chave (não chama `getUser()` — usa `useAuthIdentity` via um ref global atualizado pelo provider). Lança erro claro `"Contexto de clínica não inicializado"` apenas se ainda não houve login.
- Prefetch pós-login fica atrás de `Promise.allSettled` para não bloquear o redirect se uma das queries falhar.
- Refactor é mecânico e pode ser feito em PR único — risco baixo, comportamento equivalente (mesma `clinic_id` resolvida, só que do cache).

## Fora de escopo

- Não mexer em RLS / Supabase / migrations.
- Não alterar UI/UX.
- Não tocar em `AuthProvider`, `ProtectedRoute`, `AppLayout` (já estabilizados em ciclos anteriores).
