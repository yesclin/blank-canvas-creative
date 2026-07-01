## Objetivo
Centralizar TODA liberação de recursos (módulos, funções do prontuário, abas, modelos de anamnese/evolução/documento/procedimento/escala, especialidades) em uma única tabela `clinic_resources` vinculada ao `clinic_id`. Nada é global "por engano"; o prontuário só considera recursos explicitamente liberados para a clínica atual.

## Decisões assumidas (pode ajustar depois)
- **Migração de dados:** copiar tudo de `clinic_template_overrides` e `clinic_feature_overrides` para `clinic_resources`; manter as antigas como legado read-only por 1 release.
- **Estado inicial:** recursos oficiais (`is_system = true`) ficam liberados automaticamente via seed no primeiro acesso da clínica; customizados exigem liberação explícita. Isso evita quebrar clínicas existentes.

## Etapa 1 — Banco (migração única)

Nova tabela:
```text
clinic_resources
├─ id uuid PK
├─ clinic_id uuid NOT NULL → clinics(id) ON DELETE CASCADE
├─ resource_type text NOT NULL   -- module | prontuario_function | tab | anamnesis | evolution | plan | document | procedure | scale | specialty
├─ resource_key text NOT NULL    -- chave estável (slug/uuid do catálogo global)
├─ resource_id uuid              -- FK conceitual ao registro do catálogo (nullable p/ chaves lógicas)
├─ specialty_id uuid             -- FK specialties(id)
├─ specialty_slug text
├─ parent_specialty_slug text    -- p/ heranças (Quiropraxia → other_specialty → geral)
├─ enabled boolean NOT NULL DEFAULT true
├─ created_at / updated_at / updated_by
└─ UNIQUE (clinic_id, resource_type, resource_key)
```

- GRANTs completos + RLS:
  - Super Admin (`platform_admins`): full access.
  - Membros da clínica: `SELECT` apenas onde `clinic_id` está nas suas clínicas.
  - Ninguém mais escreve.
- Trigger `updated_at`.
- Função `seed_clinic_resources(_clinic_id uuid)` que popula recursos oficiais liberados na primeira vez.
- Função `get_clinic_resources(_clinic_id uuid)` (SECURITY DEFINER) para a tela do Super Admin.
- Backfill: INSERT ... SELECT a partir das duas tabelas antigas.

## Etapa 2 — Tela Super Admin > Recursos da Clínica

`ProntuarioLibrarySection.tsx`:
- Toda ação (individual, seleção, "todos visíveis", restaurar padrão) valida `clinicId`. Sem clínica → botões desabilitados + toast explicando.
- `writeOne` / bulk passam a gravar em `clinic_resources` (upsert por `clinic_id + resource_type + resource_key`).
- Ao trocar de clínica: chamar `seed_clinic_resources` uma vez e recarregar.
- Filtros e badges continuam iguais; a fonte de verdade muda para `clinic_resources`.

## Etapa 3 — Leitura no Prontuário

Ponto único: novo hook `useClinicEnabledResources(clinicId, resourceType)` que devolve `Set<resource_key>` com `enabled = true` para a clínica ativa.

Aplicar em:
- `useResolvedAnamnesisTemplate` — filtra `anamnesis_templates` pelo Set (respeitando herança `parent_specialty_slug` para Quiropraxia → geral).
- `useProntuarioConfig` — filtra `medical_record_tabs` e `medical_record_templates`.
- `useActiveMedicalRecordModules` / `useClinicFeatures` — passam a consultar `clinic_resources` (tipo `module` / `prontuario_function`).

Regra: se o recurso não está em `clinic_resources` com `enabled=true` para a `clinic_id` atual, **não aparece**, mesmo existindo no catálogo global.

## Etapa 4 — Legado

- Marcar `clinic_template_overrides` e `clinic_feature_overrides` como deprecated no comentário SQL.
- Remover escritas dessas tabelas do código.
- Deixar leitura desligada; próximo release remove.

## Detalhes técnicos
- Herança de especialidade custom: durante a leitura, se `specialty_slug = other_specialty` (ou aliases), unir Set desta specialty com Set de `geral` — mesma lógica que já existe no `useResolvedAnamnesisTemplate`, agora centralizada.
- `resource_key` convenção:
  - templates: `tpl:<uuid>`
  - abas: `tab:<slug>`
  - módulos: `mod:<key>`
  - funções: `fn:<key>`
  - escalas/procedimentos: `scale:<slug>` / `proc:<uuid>`
- Logs de auditoria: reaproveitar `platform_audit_logs` com `action = 'clinic_resource_toggle'` e payload do diff.

## Não incluso (fora de escopo desta rodada)
- Reescrever a UI de módulos do sistema — só migra fonte de dados.
- Remover fisicamente as tabelas antigas (fica pro próximo release).
