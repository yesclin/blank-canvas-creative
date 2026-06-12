# Corrigir logout em reload do preview

## Problema
A cada mudança aplicada, o iframe do preview é recriado. Como `tabId` depende de `window.name` + `sessionStorage` (ambos zerados no novo iframe), a nova aba não encontra binding e o adapter `perTabAuthStorage` descarta o backup do `localStorage` por segurança — derruba o usuário em `/login`.

Isso também afeta usuários reais quando fecham/reabrem a aba ou quando o navegador descarta `sessionStorage`.

## Objetivo
Restaurar a sessão automaticamente quando for seguro (uma única identidade conhecida no navegador) sem reintroduzir o vazamento entre contas que motivou o isolamento atual.

## Mudanças

### 1. `src/integrations/supabase/client.ts`
Adicionar fallback controlado em `readTabBinding()` quando a aba nova não tem binding:

- Varrer `localStorage` por todas as chaves `yc.auth.bind.<ref>.*` desse mesmo `SUPABASE_PROJECT_REF`.
- Se **todas** apontam para o **mesmo `userId`** (= só existe uma identidade YesClin no navegador), adotar esse `userId` como binding da aba nova (gravar via `writeTabBinding`).
- Se houver divergência (mais de um userId), manter o comportamento atual: descartar o backup.

Também varrer chaves `yc.auth.<ref>.*` (storage de sessão) como backup secundário: se só existir sessão de um único `userId`, idem.

### 2. `src/lib/authSessionIsolation.ts`
- Em `clearAuthenticatedTab()` e `quarantineMismatchedAuthSession()`, ao limpar binding/sessão da aba atual, **também** remover todas as chaves `yc.auth.bind.<ref>.*` e `yc.auth.<ref>.*` órfãs de outras tabIds do mesmo projeto. Isso evita backups "fantasmas" persistindo após logout.

### 3. Atualizar guardrail de teste
`src/test/session-cache-guardrails.test.ts` proíbe a string `scopedSessions`. O fallback novo usa outro nome (ex.: `resolveSoleStoredIdentity`), portanto não viola a regra — confirmar e ajustar a asserção se necessário para refletir a nova lógica explicitamente (continuar bloqueando "escolher uma entre várias", permitir "única identidade conhecida").

## Como continua seguro
- Se duas contas já logaram no mesmo navegador, **não há** restauração silenciosa — vai para `/login` igual hoje.
- Logout (`clearAuthenticatedTab`) passa a apagar todos os bindings residuais, então uma conta nova não herda binding antigo.
- `quarantineMismatchedAuthSession` continua disparando `signOut({ scope: 'local' })` em qualquer divergência.

## Validação
1. Login no preview, aplicar uma mudança trivial, confirmar que **não desloga**.
2. Logout manual → backup some, próximo reload mantém em `/login`.
3. Simular dois `yc.auth.bind.*` com userIds diferentes em `localStorage` → reload não restaura (fica em `/login`).
4. Rodar `bunx vitest run src/test/session-cache-guardrails.test.ts`.
