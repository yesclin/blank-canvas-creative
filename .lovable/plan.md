# Pegar o valor do procedimento no momento do pagamento

## O problema

Olhando o agendamento da Eva Maria Lopes no banco:
- `procedure_id` está corretamente vinculado a "Consulta" (R$ 35,00 já cadastrado em Procedimentos)
- mas `amount_expected = 0` no agendamento

Isso acontece porque o agendamento foi criado **antes** do preço ser cadastrado no procedimento. Como o `amount_expected` é gravado no momento do save (snapshot), ele continua zerado mesmo depois que o usuário cadastra o preço. O card e o diálogo de pagamento leem só esse campo, então mostram R$ 0,00.

## O que vou ajustar

### 1. Fallback de leitura (corrige o caso atual da Eva e qualquer agendamento legado)
- `useAppointmentFinancialStatus.ts`: quando `amount_expected` e `expected_value` forem 0/nulos, usar `appointment.procedure?.price` como valor previsto.
- `useAppointmentPreviewData.ts`: mesmo fallback para o preview/card lateral.
- Resultado: o drawer e o diálogo "Receber Pagamento" passam a mostrar R$ 35,00 (ou o que estiver no procedimento) sem precisar reabrir/reagendar.

### 2. Gravar o preço no save (evita o problema em agendamentos novos)
- `useAppointmentsCreate` / `useAppointmentsUpdate` (ou onde o insert/update é montado): antes de enviar para o Supabase, se `expected_value`/`amount_expected` estiver vazio e existir `procedure_id`, buscar o `price` do procedimento e usar como `amount_expected`.
- Assim, agendamento novo já nasce com o valor certo travado.

### 3. Backfill (opcional, mas recomendado) — migração SQL
- `UPDATE appointments a SET amount_expected = p.price, expected_value = p.price` onde `a.amount_expected IS NULL OR a.amount_expected = 0`, juntando com `procedures p ON p.id = a.procedure_id` e `p.price IS NOT NULL AND p.price > 0`.
- O trigger `sync_appointment_financial` já recalcula `amount_due` e `payment_status` no update.

## Arquivos afetados
- `src/hooks/useAppointmentFinancialStatus.ts`
- `src/hooks/useAppointmentPreviewData.ts`
- `src/hooks/useAppointmentsCreate.ts` e `src/hooks/useAppointmentsUpdate.ts` (ajuste no payload)
- nova migração de backfill

## Validação
1. Abrir o card da Eva Maria Lopes → Previsto deve mostrar R$ 35,00 e Pendente R$ 35,00.
2. Clicar em "Receber Pagamento" → o aviso amarelo some, "Valor a receber agora" já vem com 35,00.
3. Criar agendamento novo do tipo Consulta na clínica que tem o preço cadastrado → drawer mostra valor correto sem editar nada.
4. Numa clínica sem preço cadastrado no procedimento → segue mostrando R$ 0,00 + aviso pedindo para configurar (comportamento atual, correto).
