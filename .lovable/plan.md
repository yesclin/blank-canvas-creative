## Objetivo
Impedir definitivamente que uma aba logada como usuário A aceite/restaure sessão do usuário B após atualização automática, reload do preview, retorno de aba ou perda de `sessionStorage`.

## Diagnóstico inicial
O ponto mais perigoso está no storage customizado do Supabase em `src/integrations/supabase/client.ts`:

- Foi criado um backup em `localStorage` por `tabId` para evitar logout quando o iframe/reload perde `sessionStorage`.
- Porém, quando não existe `expectedUserId` em `sessionStorage`, a função de migração tenta restaurar automaticamente a “única sessão YesClin” encontrada em `localStorage`.
- Isso resolve logout em alguns casos, mas abre o risco crítico: se a única sessão restante no navegador for de outro usuário, a aba pode hidratar como esse outro usuário.

Ou seja: o sistema está tentando recuperar sessão sem uma prova forte de identidade da aba.

## Plano de correção

1. **Bloquear restauração ambígua de sessão**
   - Remover a lógica que escolhe automaticamente “a única sessão” em `localStorage` quando `sessionStorage` foi perdido.
   - Regra nova: se a aba não consegue provar qual `userId` era esperado, não restaura nenhuma sessão.
   - Resultado esperado: no pior caso a pessoa fica no login, mas nunca entra como outro usuário.

2. **Criar vínculo persistente e seguro por aba**
   - Manter um `tabId` estável via `window.name`.
   - Criar um binding persistente por aba/projeto contendo o `expectedUserId` daquela aba.
   - O backup em `localStorage` só poderá ser usado quando:
     - a chave pertencer ao `tabId` atual;
     - existir binding esperado para esse mesmo `tabId`;
     - o `user.id` dentro do token/session bater exatamente com esse binding.

3. **Endurecer o adapter de storage do Supabase**
   - Em `getItem`, não devolver backup de `localStorage` se o usuário dentro da sessão não bater com o usuário esperado da aba.
   - Em `setItem`, salvar o binding do usuário autenticado junto com a sessão.
   - Em `removeItem`, limpar sessão e binding da aba atual.

4. **Corrigir limpeza de logout/login**
   - Garantir que logout intencional remova também a sessão Supabase da aba atual, não apenas caches auxiliares.
   - Antes de login novo, limpar a sessão Supabase atual da aba para impedir reaproveitamento de token antigo.
   - Ajustar fluxos de logout que hoje chamam `signOut()` sem limpar storage completo.

5. **Evitar `signOut` global em reautenticação clínica**
   - Em fluxos de assinatura/reautenticação (`signInWithPassword` usado para confirmar senha), se houver divergência de usuário, trocar `signOut()` por encerramento local/quarentena da sessão divergente.
   - Isso evita que uma validação de senha impacte outras abas/contas.

6. **Testes de guardrail**
   - Atualizar `src/test/session-cache-guardrails.test.ts` para cobrir:
     - não existe mais restauração por “única sessão encontrada”;
     - backup só hidrata se `tabId + expectedUserId + session.user.id` baterem;
     - `TOKEN_REFRESHED` não troca identidade;
     - mismatch chama quarentena e não aceita o novo usuário;
     - logout/login limpam storage da aba atual.

## Arquivos previstos
- `src/integrations/supabase/client.ts`
- `src/lib/authSessionIsolation.ts`
- `src/components/app/AuthSessionGuard.tsx` se necessário para alinhar limpeza/quarentena
- `src/hooks/useAuthIdentity.ts` se necessário para alinhar eventos de auth
- `src/pages/Login.tsx`
- `src/pages/AceitarConvite.tsx`
- `src/pages/CriarConta.tsx` se necessário
- `src/components/app/UserProfileFooter.tsx`
- `src/components/super-admin/SuperAdminLayout.tsx`
- `src/components/app/TrialExpiredBlocker.tsx`
- `src/hooks/useUnifiedDocumentSigning.ts`
- `src/hooks/useDocumentGovernance.ts`
- `src/test/session-cache-guardrails.test.ts`

## Critérios de aceite
- Uma aba nunca deve restaurar sessão de outro usuário quando `sessionStorage` some.
- `TOKEN_REFRESHED` nunca deve alterar `auth.uid()` aceito pela UI.
- Se houver mismatch de identidade, a sessão local deve ser bloqueada/quarentenada, não aceita.
- O sistema pode pedir login novamente se não houver vínculo confiável, mas nunca pode entrar em outra conta.
- Header/sidebar/layout não devem desmontar por troca de identidade espúria.
- O debug de auth deve continuar fora da interface normal.