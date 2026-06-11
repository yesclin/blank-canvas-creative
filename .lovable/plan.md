# Correção: nomes das clínicas aparecem como "—" em Assinaturas

## Causa raiz

A página `SuperAdminSubscriptions.tsx` faz:

```ts
supabase.from('clinic_subscriptions')
  .select('*, clinics(name), subscription_plans(name, slug)')
```

A tabela `public.clinics` tem apenas **uma** policy de SELECT:

```
"Users can view their own clinic"  USING (id = user_clinic_id(auth.uid()))
```

Ou seja, o usuário logado (Platform Admin) só consegue ler a própria clínica. Para todas as outras assinaturas, o embed `clinics(name)` volta `null` e o componente renderiza `'—'`. Por isso só a linha da clínica "Yesclin" (a do próprio admin logado) aparece com nome — todas as outras ficam como traço.

Não é bug de UI nem do componente; é RLS.

## Correção proposta

Adicionar uma policy de SELECT em `public.clinics` que permita Platform Admins lerem todas as clínicas, sem afetar a isolação atual de usuários comuns.

### Migration

```sql
CREATE POLICY "Platform admins can view all clinics"
ON public.clinics
FOR SELECT
TO authenticated
USING (public.is_platform_admin(auth.uid()));
```

`is_platform_admin` já existe e é `SECURITY DEFINER`, então não há risco de recursão. Usuários comuns continuam restritos à própria clínica via a policy existente; policies em RLS são aditivas (OR), e essa nova só concede leitura a quem está em `platform_admins`.

## Validação

1. Logar como Platform Admin → `/super-admin/assinaturas` deve mostrar o nome real de cada clínica em vez de "—".
2. Logar como usuário comum de uma clínica → continuar enxergando apenas a própria clínica em qualquer query a `clinics` (sem vazamento).
3. Conferir `/super-admin/clinicas` continua funcionando normalmente.

## Fora de escopo

- Nada de mudanças visuais, de negócio ou em outras telas.
- Não mexer no fluxo de autenticação/sessão que foi estabilizado nas iterações anteriores.
