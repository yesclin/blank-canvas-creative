## Objetivo

Hoje a tela "Receber Pagamento" mostra **R$ 0,00** porque o valor do agendamento (`expected_value` / `amount_due`) só é preenchido quando um **Procedimento com preço** é selecionado. "Consulta" e "Retorno" existem apenas como `appointment_types` (tipos de evento), que não têm campo de preço.

A solução é deixar **Consulta** e **Retorno** já cadastradas como **Procedimentos** em toda clínica — sem preço definido — para que o dono/admin abra Configurações › Procedimentos, defina o valor (ex.: R$ 500,00), a duração, a especialidade etc., e a partir daí o valor flua automaticamente para o agendamento e para a tela de recebimento.

## Escopo

### 1. Banco de dados (migration)
- Inserir, para **toda clínica existente** que ainda não tenha, duas linhas em `public.procedures`:
  - `Consulta` — `duration_minutes = 30`, `price = NULL`, `is_active = true`, `allows_return = true`, `return_days = 30`.
  - `Retorno` — `duration_minutes = 20`, `price = NULL`, `is_active = true`, `allows_return = false`.
  - Inserção idempotente: usar `WHERE NOT EXISTS (SELECT 1 FROM procedures WHERE clinic_id = c.id AND lower(name) IN ('consulta','retorno'))` por nome, para não duplicar em clínicas que já criaram manualmente.
- Atualizar a função de provisionamento de clínica (mesma function que hoje semeia `appointment_types` em `20260515014919_…`) para também inserir esses dois procedimentos padrão no momento da criação da clínica. Sem preço — a clínica define.

### 2. UI — Configurações › Procedimentos
- Não muda fluxo: os dois procedimentos aparecem na listagem como qualquer outro, com badge "Sem preço definido" quando `price IS NULL`, para chamar atenção do usuário a configurar.
- Permitir edição normal (preço, duração, especialidade, descrição). Não bloquear exclusão — se a clínica quiser remover, pode.

### 3. UI — Agendamento
- Sem mudança estrutural. Quando a recepcionista escolher o procedimento "Consulta" (já com R$ 500 cadastrados), o efeito existente em `AppointmentDialog.tsx:299-301` preenche `expected_value`, e a tela "Receber Pagamento" passa a mostrar Previsto = R$ 500,00 e Pendente = R$ 500,00.

### 4. Aviso visual (pequeno)
- No diálogo "Receber Pagamento" (`AppointmentReceivePaymentDialog.tsx`), quando `amountExpected === 0`, exibir uma mensagem curta abaixo do bloco de resumo:
  > "Nenhum valor definido para este agendamento. Defina o preço no procedimento em Configurações › Procedimentos, ou digite o valor manualmente abaixo."
- O campo "Valor a receber agora" continua editável, então o usuário pode digitar 500 manualmente nessa cobrança específica se quiser.

## Detalhes técnicos

**Migration (resumo do SQL):**
```sql
-- Backfill clínicas existentes
INSERT INTO public.procedures (clinic_id, name, duration_minutes, allows_return, return_days, is_active)
SELECT c.id, 'Consulta', 30, true, 30, true
FROM public.clinics c
WHERE NOT EXISTS (
  SELECT 1 FROM public.procedures p
  WHERE p.clinic_id = c.id AND lower(p.name) = 'consulta'
);

INSERT INTO public.procedures (clinic_id, name, duration_minutes, allows_return, is_active)
SELECT c.id, 'Retorno', 20, false, true
FROM public.clinics c
WHERE NOT EXISTS (
  SELECT 1 FROM public.procedures p
  WHERE p.clinic_id = c.id AND lower(p.name) = 'retorno'
);

-- Atualizar a função seed_clinic_defaults (ou equivalente) para inserir
-- essas duas linhas no momento da criação de novas clínicas.
```

**Arquivos a editar:**
- `supabase/migrations/<nova>_seed_default_procedures.sql` — backfill + atualização da function de provisionamento.
- `src/components/agenda/AppointmentReceivePaymentDialog.tsx` — aviso quando `amountExpected === 0`.
- (Opcional) `src/pages/...Procedures...` — badge "Sem preço definido" na listagem. Confirmo o arquivo exato no momento da implementação.

**Não muda:**
- Estrutura da tabela `procedures` (price já é nullable).
- `appointment_types` — continua existindo para categorizar visualmente o evento na agenda.
- Lógica de cálculo financeira (`useAppointmentFinancialStatus`).

## Resultado para o usuário

1. Abre Configurações › Procedimentos → vê "Consulta" e "Retorno" já listadas.
2. Edita "Consulta", define R$ 500,00, salva.
3. Cria/abre um agendamento, seleciona procedimento "Consulta" → Valor previsto vira R$ 500,00.
4. Clica "Receber Pagamento" → Previsto: R$ 500,00, Pendente: R$ 500,00, campo já pré-preenchido com 500,00.
