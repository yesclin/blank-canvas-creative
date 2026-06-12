Plano para corrigir o erro de login Supabase:

1. Ajustar variáveis do cliente Supabase
- Atualizar `src/integrations/supabase/client.ts` para aceitar `VITE_SUPABASE_ANON_KEY` e manter fallback para `VITE_SUPABASE_PUBLISHABLE_KEY`, já que o projeto atualmente tem `VITE_SUPABASE_PUBLISHABLE_KEY` no `.env` e não tem `VITE_SUPABASE_ANON_KEY`.
- Validar em runtime se `SUPABASE_URL` e chave anon/publishable existem, não estão vazias e a URL é uma URL Supabase válida.
- Registrar no console diagnósticos claros: `SUPABASE_URL ausente`, `ANON_KEY ausente`, `projeto/ref divergente`, `network timeout`, `Auth error`.

2. Melhorar mensagem e diagnóstico no login
- Em `src/pages/Login.tsx`, trocar a mensagem genérica atual por uma mensagem mais clara para timeout/rede:
  `Não foi possível conectar ao servidor. Verifique internet ou configuração do Supabase.`
- Manter mensagens separadas para credenciais inválidas, usuário bloqueado/inativo e email não confirmado.
- Logar no console o tipo do erro sem expor senha/token.

3. Não destruir sessão em erro de conexão
- Alterar o fluxo do `handleLogin` para não limpar toda a sessão antes de tentar autenticar.
- Limpar/quarentenar sessão apenas em casos intencionais: logout, troca real de usuário autenticado, perfil sem vínculo/inativo ou sessão divergente confirmada.
- Em erro de timeout/network/CORS/configuração, preservar a sessão atual e não trocar usuário.

4. Testes de verificação
- Verificar a tela `/login` em preview.
- Testar endpoints Supabase: REST responde 401 (normal) e Auth health/settings/token indicam se há timeout de serviço.
- Testar login com usuário válido no preview, recarregar a página e tentar logout/login novamente.
- Registrar no console a causa final se falhar: variável ausente, CORS/network timeout ou erro Auth.

Observação importante: já confirmei que o `.env` aponta para `https://yfljqgmbnplkdjfhvunq.supabase.co` e a chave publishable/anon corresponde ao ref `yfljqgmbnplkdjfhvunq`. Porém os endpoints Auth `/auth/v1/health` e `/auth/v1/settings` estão dando timeout, enquanto REST responde; se o serviço Auth do Supabase continuar indisponível, o código vai diagnosticar corretamente, mas a autenticação só volta quando o Auth do Supabase responder.