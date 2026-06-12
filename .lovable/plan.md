Plano para corrigir o carregamento repetido/tela branca ao clicar nos menus:

1. **Eliminar chamadas duplicadas de sessão/clínica/role**
   - Criar uma fonte única de “escopo ativo” da sessão: `authUserId`, `clinicId`, `role`, `professionalId`, `clinic`.
   - Usar esse escopo nos hooks que hoje repetem `getUser()`, `profiles`, `user_roles` e `clinics`.
   - Alvos principais: `useClinicData`, `usePermissions`, `useClinicFeatures`, `useClinicSubscription`, `useCurrentUser` e `UserViewModeBootstrap`.

2. **Parar o skeleton global em navegação comum**
   - Ajustar `ProtectedRoute` para só bloquear com skeleton no primeiro carregamento real.
   - Em troca de rota com dados já carregados, renderizar imediatamente a nova tela e deixar apenas loading local da página, sem “tela branca”.

3. **Reduzir invalidações/refetchs que disparam ao clicar**
   - Garantir `staleTime`, `gcTime`, `refetchOnMount: false`, `refetchOnWindowFocus: false` e `placeholderData` nas queries críticas de sessão, clínica, permissões, assinatura e features.
   - Evitar `invalidateQueries` amplo para `clinic-features`, `clinic-subscription` e `global-active-appointments` fora de eventos reais de troca de usuário/clínica.

4. **Corrigir duplicação no layout**
   - Remover chamadas repetidas de `useClinicSubscription()` no `AppLayout` e `SubscriptionGate` quando possível, compartilhando o mesmo resultado por contexto/query.
   - Evitar que `GlobalActiveAppointmentProvider` reconsulte clínica/permissões se o escopo já está disponível.

5. **Investigar e corrigir requests lentos/falhos por rota**
   - Medir as requests ao clicar em Agenda, Atendimento, Comercial e Configurações.
   - Se alguma query Supabase ainda estiver lenta, ajustar `.select(...)`, filtros por `clinic_id`, limites e índices via migration somente se necessário.

6. **Validar no navegador**
   - Testar navegação sequencial: Dashboard → Agenda → Atendimento → Comercial → Configurações → Agenda.
   - Confirmar que não há tela branca, não há loop de skeleton, e que Consulta/Retorno/Procedimento continuam carregando sem erro.

Resultado esperado: clique no menu troca de tela sem desmontar o shell, sem refazer sessão/clínica/role várias vezes e sem ficar preso em “carregando”.