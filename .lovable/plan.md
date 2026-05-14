## Diagnóstico

A tela `/super-admin/recursos` já existe (`SuperAdminFeatureOverrides.tsx`) e a infraestrutura backend está pronta:

- Tabela `clinic_feature_overrides` (clinic_id, feature_key, enabled, reason, expires_at, created_by) com RLS para super admin.
- View `clinic_effective_features` que **já consolida plano + override e já ignora overrides expirados** (`expires_at IS NULL OR expires_at > now()`).
- Hook `useClinicFeatures` lê dessa view.
- Rotas dos módulos (Marketing, Convênios, Estoque, Comercial, Auditoria, Relatórios, Teleconsulta) já estão protegidas por `ProtectedFeatureRoute`, e a sidebar oculta os itens via `feature`.
- Auditoria via `logPlatformAction` já grava em `platform_audit_logs`.

O que **não está bom** hoje: textos em "meio inglês" (Override / Salvar override / Sem expiração / Overrides ativos), nenhum badge visual destacando override ativo no card do recurso, e nenhuma indicação de "expira em breve". Não há nada estrutural para refazer.

## Escopo do trabalho

**Apenas frontend, em `src/pages/super-admin/SuperAdminFeatureOverrides.tsx`:**

1. **Tradução completa** dos textos remanescentes:
   - `Criar / atualizar override` → `Criar / atualizar liberação manual`
   - `Salvar override` → `Salvar liberação manual`
   - `Overrides ativos` → `Liberações manuais ativas`
   - Vazio: `Nenhuma liberação manual ativa. A clínica está seguindo apenas as regras do plano.`
   - Linha do card: `Plano: liberado/bloqueado · Liberação manual: liberado/bloqueado` (remove "Override")
   - Tabela: colunas `Recurso`, `Tipo`, `Motivo`, `Expira em`
   - Botão remover: tooltip `Remover liberação manual` / `Remover bloqueio manual` (depende do `enabled`).
   - Toasts: `Liberação manual salva.`, `Liberação manual removida. A clínica voltou às regras do plano.`, `Erro ao salvar liberação manual.`, `Erro ao remover liberação manual.`
   - Status final dos cards: `Ativo` / `Inativo` (já está ok).
   - Sem expiração → `Sem expiração`.

2. **Validações no salvar**:
   - Clínica obrigatória (já valida).
   - Recurso obrigatório (já garantido pelo select).
   - **Motivo obrigatório** (hoje aceita vazio) — bloquear com toast `Informe o motivo da liberação manual.`

3. **Badges/indicação visual** nos cards de recurso:
   - Verde (`default`) quando `effective = true`, cinza (`outline`) quando `false` (já está).
   - Acrescentar segundo badge no card quando houver override ativo:
     - Roxo `Liberação manual ativa` se `ov.enabled = true`
     - Vermelho/âmbar `Bloqueio manual ativo` se `ov.enabled = false`
     - Âmbar `Expira em X dias` quando `expires_at` faltam ≤ 7 dias.
   - Filtra overrides exibidos para considerar apenas os **não expirados** (sem mexer em DB; tabela `Liberações manuais ativas` mostra só os com `expires_at IS NULL OR > now()`; expirados ficam ocultos — opcionalmente um collapsible "Expirados").

4. **Refresh automático** após salvar/remover (já chama `loadDetails`, manter).

5. **Ajustes pequenos** no formulário:
   - Label do switch já alterna texto — manter.
   - Adicionar texto auxiliar `Quando expirar, a clínica volta a respeitar o plano automaticamente.` abaixo do campo "Expira em".
   - `placeholder` do motivo em PT (já está).

## Fora de escopo (não mexer)

- Banco: tabelas e view já existem e atendem 100% dos critérios; criar `platform_resources` / `plan_resources` seria duplicação — o catálogo de recursos vive como flags `feature_*` na view e a lista canônica está em `OVERRIDE_FEATURES` no front. Documentar isso na própria página.
- Hook `useClinicFeatures`, `ProtectedFeatureRoute`, `FeatureGuard`: já funcionam e já são usados nos módulos listados — nada a mudar.
- Auditoria: `logPlatformAction` já grava as ações `feature_override.enable/disable/remove` em `platform_audit_logs` com `clinic_id`, `metadata` (incluindo `feature_key`, `enabled`, `expires_at`, `reason`) e `actor_user_id` — atende ao critério.

## Critérios de aceite atendidos depois do ajuste

Todos os 17 itens da lista do usuário continuam atendidos: a infra de gating já bloqueia rotas, sidebar e ações reais; a expiração já é respeitada pela view; RLS continua intacto; nenhum mock; auditoria registrada; e a tela fica 100% em português com indicação visual clara de overrides ativos.

## Detalhes técnicos

- Arquivo único alterado: `src/pages/super-admin/SuperAdminFeatureOverrides.tsx`.
- Helpers locais: `isExpiringSoon(date)`, `isExpired(date)`.
- Sem migrações novas, sem mudança de tipos, sem novos pacotes.