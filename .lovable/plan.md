## Problema

A aba **Anamnese Estética** mostra "Nenhum modelo de anamnese disponível" porque, na clínica **Flor de Beleza** (especialidade Estética/Harmonização Facial `ff7d74f8`), todos os 7 modelos de sistema da estética estão com `archived = true` e `is_active = false`:

- Anamnese Estética Facial Geral
- Anamnese para Bioestimulador de Colágeno
- Anamnese para Microagulhamento / Skinbooster
- Anamnese para Procedimentos Estéticos Combinados
- Avaliação Corporal Estética
- Plano de Aplicação de Toxina Botulínica
- Plano de Preenchimento com Ácido Hialurônico

Os modelos têm `current_version_id` e `structure` válidos (conteúdo completo) — só estão arquivados. Os modelos de Nutrição da mesma clínica continuam ativos, então o problema é específico dos modelos importados/criados para Estética.

## Causa raiz

Dois fatores contribuem para o "somem sozinhos":

1. A função `reset_anamnesis_templates` arquiva **todos** os templates da clínica cujo `system_locked = false`. Os modelos de sistema da estética nesta clínica estão com `system_locked = false`, então foram arquivados na primeira vez que alguém usou "Restaurar/Resetar modelos".
2. A função `ensure_system_templates_integrity` (que restauraria automaticamente templates de sistema com estrutura válida) só existe — não é chamada em lugar nenhum, então nunca executa.

## Plano

### 1. Migração: restaurar modelos e blindar sistema

Em uma migração nova:

- **Reativar** todos os `anamnesis_templates` com `is_system = true`, `archived = true`, `current_version_id` apontando para uma versão com `structure` não-vazia → `archived = false, is_active = true`.
- **Marcar `system_locked = true`** em todos os templates `is_system = true` (assim `reset_anamnesis_templates` nunca mais arquiva os modelos oficiais).
- **Ajustar `reset_anamnesis_templates`** para nunca arquivar `is_system = true` (defesa em profundidade, mesmo se `system_locked` for alterado por engano).
- **Adicionar trigger `BEFORE UPDATE`** em `anamnesis_templates` que bloqueia (`RAISE EXCEPTION`) qualquer tentativa de setar `archived = true` ou `is_active = false` em template `is_system = true` que tenha versão válida. Isso garante que nunca mais "somem sozinhos".

### 2. Frontend: fallback resiliente quando lista vier vazia

Em `AnamneseEsteticaBlock.tsx` (bloco de mensagem "Nenhum modelo de anamnese disponível"):

- Trocar a tela vazia por um estado de erro acionável com botão **"Restaurar modelos padrão"** que chama uma RPC `restore_system_anamnesis_templates(p_clinic_id, p_specialty_id)` (criada na mesma migração) para reativar instantaneamente os modelos de sistema da especialidade atual.
- Após sucesso, invalidar a query `['anamnesis-templates-v2']` para recarregar.

Isso dá ao usuário um botão de auto-recuperação caso algum cenário futuro arquive os modelos.

### 3. Validar

- Reabrir o prontuário da Eva → a aba Anamnese Estética deve listar os 7 modelos.
- Trocar de especialidade (Nutrição) → continuar mostrando os 6 modelos nutricionais.
- Tentar `UPDATE anamnesis_templates SET archived=true WHERE is_system=true` no SQL editor → deve falhar com exceção.

## Arquivos afetados

- `supabase/migrations/<nova>.sql` — restauração + `system_locked` + trigger de proteção + RPC `restore_system_anamnesis_templates`.
- `src/components/prontuario/aesthetics/AnamneseEsteticaBlock.tsx` — estado vazio com botão de restauração.
- `src/hooks/useAnamnesisTemplatesV2.ts` (opcional) — exportar mutação `restoreSystemTemplates` para o botão.

## Notas técnicas

- Não mexer no `useAnamnesisTemplatesV2` query (filtro por `specialty_id` está correto).
- O `specialtyId` na URL (`ff7d74f8…`) é o correto para "Flor de Beleza" — não há ambiguidade de especialidade duplicada na mesma clínica.
- A migração precisa do `SET search_path TO 'public', 'extensions'` para o trigger/função, conforme padrão do projeto.
