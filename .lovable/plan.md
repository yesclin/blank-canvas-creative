# Valor de Consulta/Retorno/Encaixe vem de Procedimentos

Mudança de fonte: o preço deixa de ficar em "Tipos de Atendimento" e volta para **Configurações › Procedimentos**. Ao escolher *Consulta*, *Retorno* ou *Encaixe* no agendamento, o sistema busca o procedimento de mesmo nome e preenche **valor + duração** automaticamente, vinculando também o `procedure_id` para que o card de detalhes mostre tudo corretamente.

## O que muda para o usuário

1. **Configurações › Procedimentos** passa a ser o lugar único para definir o valor de Consulta, Retorno, Encaixe e demais procedimentos.
2. Esses três aparecerão pré-cadastrados (sem preço) para o owner/admin apenas preencher o valor e a duração.
3. No diálogo "Novo Agendamento":
   - Selecionou *Consulta* → puxa preço e duração do procedimento "Consulta" da clínica.
   - Selecionou *Retorno* → idem para "Retorno".
   - Selecionou *Encaixe* → idem para "Encaixe".
   - Selecionou *Procedimento* → continua mostrando o seletor de procedimentos como hoje.
4. O card de detalhes do agendamento (drawer lateral) passa a mostrar o valor correto em **Previsto / Pendente** (hoje vem R$ 0,00 porque o `procedure_id` ficava `none`).
5. A seção "Valor padrão (R$)" dentro de Configurações › Agenda › Tipos & Status é **removida** (volta a ser só nome, duração, cor, ativo) para não haver duas fontes da verdade.

## Detalhes técnicos

### 1. Banco
- **Migração**: re-seed idempotente em `procedures` para cada clínica existente, inserindo (se não existirem) os 3 registros: `Consulta`, `Retorno`, `Encaixe` — com `price = NULL`, `duration_minutes` default (30/30/15), `is_active = true`, marcando uma coluna nova `is_system = true` para travar exclusão.
- Atualizar `handle_new_user` para que novas clínicas já recebam esses 3 procedimentos do sistema.
- Remover (ou deprecar via DROP COLUMN) `appointment_types.default_price` e `default_specialty_id` — não são mais usados.

### 2. Hook `useAppointmentTypes`
- Remover campo `default_price` do tipo e das mutations.

### 3. `AppointmentTypesCard.tsx`
- Remover input "Valor padrão (R$)" e a coluna correspondente da listagem.

### 4. `AppointmentDialog.tsx`
- Substituir o `useEffect` atual (que lê `appointment_types.default_price`) por uma busca em `procedures`:
  - Mapeamento `consulta → "Consulta"`, `retorno → "Retorno"`, `encaixe → "Encaixe"`.
  - `const proc = procedures.find(p => p.name.trim().toLowerCase() === labelMap[type])`.
  - Se achou: `setValue("procedure_id", proc.id)`, `setValue("expected_value", proc.price ?? 0)`, `setValue("duration_minutes", String(proc.duration_minutes))`.
  - Se `proc.price` é null/0 → manter expected_value = 0 e exibir aviso inline pedindo para configurar o preço em Configurações › Procedimentos.
- O seletor visual de procedimento permanece **oculto** para tipos não-procedimento (já está assim), mas o `procedure_id` é setado por baixo.

### 5. `AppointmentReceivePaymentDialog.tsx`
- Ajustar a mensagem de alerta (quando `amountExpected === 0`) para apontar somente para "Configurações › Procedimentos" (hoje cita "ex.: Consulta, Retorno", manter).

### 6. Card de detalhes (drawer)
- Como agora `procedure_id` é gravado, o nome do procedimento já aparece corretamente e o valor previsto vem do `amount_expected` calculado no insert/update do agendamento. Sem mudanças adicionais previstas, apenas validar visualmente.

## Arquivos afetados
- nova migração SQL (seed + remoção de colunas + update trigger)
- `src/hooks/useAppointmentTypes.ts`
- `src/components/config/atendimento/AppointmentTypesCard.tsx`
- `src/components/agenda/AppointmentDialog.tsx`
- `src/components/agenda/AppointmentReceivePaymentDialog.tsx` (texto)

## Validação
1. Abrir Configurações › Procedimentos → definir R$ 150 em "Consulta".
2. Criar novo agendamento, escolher tipo *Consulta* → campo "Valor Esperado" deve preencher 150 automaticamente.
3. Salvar → abrir o drawer do agendamento → Previsto/Pendente devem mostrar R$ 150,00.
4. Repetir para Retorno e Encaixe.
