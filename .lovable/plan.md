## Causa raiz do duplo carregamento

Não é a página clicada — é a **cadeia de identidade** que sofre um "reset" cerca de 1 s depois de cada navegação. Sequência observada:

1. Usuário clica no menu → React Router troca a rota → Suspense mostra `PageSkeleton` enquanto o chunk lazy carrega → conteúdo aparece com dados do cache (1º "loading").
2. Logo em seguida, `supabase.auth.onAuthStateChange` dispara `INITIAL_SESSION`/`TOKEN_REFRESHED` (e o `resolve()` do `AuthIdentityProvider` também conclui). Isso faz:
   - `AuthIdentityProvider.applyUserId(...)` reaplicar o **mesmo** userId, mas, na primeira passagem (`prevUserId === undefined`), o ramo `isInitial` não dispara reset; nas passagens seguintes alguns caminhos chamam `emitIdentityChanged` e `clearReactQueryCache` mesmo sem troca real de usuário.
   - `AuthSessionGuard` tem **uma segunda** assinatura de `onAuthStateChange` que também chama `hardReset` → `clearReactQueryCache(qc)` → `cancelQueries()` + `resetQueries({type:"active"})`. Isso reseta TODAS as queries ativas da tela recém-aberta.
   - `useActiveClinicScope` e `useClinicData` escutam `yesclin:identity-changed` e chamam `invalidateQueries`, recarregando profile/clínica/permissões mesmo quando o usuário não mudou.
3. `PermissionsProvider.fetchPermissions` usa `useCallback([fetchPermissionsOnce, scope, scopeLoading])`. Como `scope` vem de `query.data ?? EMPTY` (referência nova a cada refetch), o `useEffect([fetchPermissions])` re-executa, chama a RPC `get_user_all_permissions` outra vez e, no caminho de reset do listener `yesclin:identity-changed`, faz `setState({isLoading:true})` → `ProtectedRoute` cai no skeleton (2º "loading").

Resultado: tela aparece → ~1 s depois um reset global tira o conteúdo → quando profile/clinic/permissions reassentam, a tela volta.

## Correções (estruturais, não cosméticas)

Arquivos e mudanças mínimas, mantendo todas as garantias atuais de troca real de usuário/logout:

### 1. `src/hooks/useAuthIdentity.ts`
- Em `applyUserId`, só emitir `yesclin:identity-changed` e chamar `clearReactQueryCache` quando `prevUserId && prevUserId !== nextUserId` ou em logout real. Quando `prevUserId === nextUserId` (refresh/getUser confirmando o mesmo user), retornar cedo sem efeito colateral.
- No listener `onIdentityChanged`, não chamar `resolve()` em `setTimeout(0)` se o `detail.next` for igual ao `userIdRef.current` (evita ping-pong).
- Tratar `INITIAL_SESSION`/`SIGNED_IN`/`USER_UPDATED` como no-op quando o userId já é o atual.

### 2. `src/components/app/AuthSessionGuard.tsx`
- Manter como guard de segurança, mas **remover** o `clearReactQueryCache` quando o evento for `INITIAL_SESSION` com o mesmo user, ou quando `prev === newUserId`. `hardReset` só roda em logout real, troca real de user ou quarentena de mismatch.
- Não chamar `emitIdentityChanged` quando a identidade não mudou (atualmente `hardReset` sempre emite).

### 3. `src/hooks/usePermissions.tsx`
- Trocar a dependência do `useCallback` de `scope` por primitivos: `[fetchPermissionsOnce, scope.userId, scope.clinicId, scope.role, scopeLoading]`. Assim, refetchs do `useActiveClinicScope` que devolvem o mesmo conteúdo (referência nova) não recriam `fetchPermissions` nem re-executam o `useEffect`.
- No listener `yesclin:identity-changed`, só fazer `setState({isLoading:true,...})` quando `detail.next !== state.role's userId` (comparar com `activeUserIdRef.current`). Caso contrário, ignorar.
- Remover o `bootTimeout` global de 10 s quando `state.role` já existe (evita recriação a cada re-render).

### 4. `src/hooks/useActiveClinicScope.ts`
- No listener `yesclin:identity-changed`, comparar `detail.prev`/`detail.next` antes de `invalidateQueries`. Se forem iguais (ou ambos nulos), ignorar.
- `select` da query: devolver objeto memoizado por `(userId, clinicId, role, …)` para que a referência de `scope` só mude quando o conteúdo mudar (estabiliza consumidores).

### 5. `src/hooks/useClinicData.ts`
- Mesma proteção no listener: só invalida `["clinic-data"]` se o `detail.next` for diferente do `userId` atual ou se o evento for `yesclin:support-session-changed` real.

### 6. `src/lib/queryClientDiagnostics.ts`
- Adicionar guard `if (!reason.includes("logout") && !reason.includes("mismatch") && !reason.includes("user-switch")) return;` em `clearReactQueryCache` (defensa em profundidade).
- Manter `hardClearReactQueryCache` intacto para logout.

### 7. Logs de diagnóstico temporários (DEV-only)
Adicionar `console.log("[DOUBLE_LOAD_DEBUG] …")` em:
- `AuthIdentityProvider.applyUserId` mostrando `{prev,next,reason,willResetCache}`.
- `AuthSessionGuard` mostrando `{event,prev,newUserId,willHardReset}`.
- `useActiveClinicScope` listener com `{prev,next,willInvalidate}`.
- `useClinicData` listener com `{prev,next,willInvalidate}`.
- `PermissionsProvider.fetchPermissions` com `{reason:"effect-run", scopeUserId, role}` e no caminho do listener `{reason:"identity-listener", willReset}`.
- `ProtectedRoute` já loga `GLOBAL LOADING ON/OFF`; manter.

Com esses logs, o segundo `GLOBAL LOADING ON` após o clique deve mostrar a origem exata (qual provider iniciou o reset).

## Critérios de aceite

- Clicar em qualquer item do menu: 1 transição → 1 skeleton (do `Suspense` do chunk lazy) → conteúdo. **Nunca** um segundo skeleton ~1 s depois.
- Console em DEV mostra **um** `GLOBAL LOADING ON` por navegação (do `Suspense`), seguido de `GLOBAL LOADING OFF`. Nenhum `clearReactQueryCache` é registrado em cliques normais.
- Network: nenhum refetch automático de `profiles`, `user_roles`, `clinics`, `get_user_all_permissions` ao trocar de rota dentro do `staleTime` (5 min).
- Logout real continua limpando cache completamente.
- Troca real de usuário (login com outra conta) continua disparando reset (testado via `yesclin:identity-changed` com `next !== prev`).
- StrictMode mantido; comportamento idêntico em build de produção.

## Riscos / pontos de atenção

- `AuthSessionGuard` e `AuthIdentityProvider` mantêm assinaturas paralelas de `onAuthStateChange` — ambas precisam aplicar os mesmos guards "no-op quando user é o mesmo", senão uma fica chamando a outra via `emitIdentityChanged`.
- Memoizar `scope` exige estabilizar também o objeto `EMPTY` (já é constante) e evitar spreads desnecessários.
- Após validar com os logs, remover os `[DOUBLE_LOAD_DEBUG]` antes de fechar a tarefa.
