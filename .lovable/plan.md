# Reorganizar Tipo de Atendimento × Procedimento

## Comportamento desejado no Novo Agendamento

- O campo **Procedimento** só aparece quando **Tipo de Atendimento = Procedimento**.
- Para **Consulta**, **Retorno** e **Encaixe**, a duração e o valor previsto vêm direto do cadastro do tipo (Configurações › Tipos de Atendimento), sem precisar selecionar procedimento.
- Para **Procedimento**, mantém o fluxo atual: aparece o seletor de procedimento e o valor/duração vêm do procedimento escolhido.

## Mudanças

### 1. Banco de dados (migração)
- Adicionar duas colunas em `appointment_types`:
  - `default_price numeric(10,2) NULL`
  - `default_specialty_id uuid NULL` (opcional, para Consulta puxar a especialidade do profissional, mas sem obrigatoriedade)
- Garantir que toda clínica tem os 4 tipos: `consulta`, `retorno`, `procedimento`, `encaixe` (insert idempotente; já existem `consulta` e `retorno` para clínicas atuais — apenas adicionar `procedimento` e `encaixe` onde faltarem).
- Atualizar `handle_new_user` para seedar os 4 tipos em clínicas novas (com `default_price = NULL`).
- Remover o seed anterior de "Consulta"/"Retorno" como linhas em `procedures` (migração da resposta anterior), já que o preço agora mora em `appointment_types`. Manter apagamento só das linhas seed que não foram editadas (preço NULL e sem uso em agendamentos), para não destruir dados de quem já configurou.

### 2. Configurações › Tipos de Atendimento (nova tela ou seção)
- Lista os 4 tipos da clínica com colunas: Nome, Duração padrão (min), Valor padrão (R$), Cor, Ativo.
- Cada linha editável (dialog simples): duração, preço, cor.
- Acesso: owner/admin (mesma regra de Procedimentos).
- Badge "Sem preço definido" quando `default_price IS NULL`.

### 3. `AppointmentDialog.tsx`
- Carregar `appointment_types` da clínica via hook `useAppointmentTypes`.
- Esconder o bloco "Procedimento" (linhas ~500–550) quando `watchAppointmentType !== 'procedimento'`.
- Novo `useEffect` que reage a `watchAppointmentType`:
  - Se for `consulta`/`retorno`/`encaixe`: localizar o `appointment_type` pelo `slug`, preencher `duration_minutes` e `expected_value` (se `default_price` definido); limpar `procedure_id` para `"none"`.
  - Se for `procedimento`: manter o `useEffect` atual que reage ao `procedure_id`.
- Manter o aviso âmbar no `AppointmentReceivePaymentDialog` quando `amountExpected === 0` (já implementado).

### 4. Roteamento e navegação
- Adicionar item "Tipos de Atendimento" na sidebar de Configurações ao lado de "Procedimentos".

## Detalhes técnicos

- Migração: `ALTER TABLE public.appointment_types ADD COLUMN default_price numeric(10,2);` + `ADD COLUMN default_specialty_id uuid;`.
- RLS de `appointment_types` já existe (3 policies); apenas conferir que `UPDATE` é permitido a owner/admin da clínica.
- Hook `useAppointmentTypes` já retorna a lista; adicionar mutation `updateAppointmentType({ id, duration_minutes, default_price, color })`.
- Schema do form em `AppointmentDialog`: `procedure_id` continua opcional — quando tipo ≠ procedimento, sempre `"none"`.

## Fora de escopo

- Não mexe na lógica de pacotes, convênio, faturamento ou pagamento.
- Não mexe no fluxo clínico (prontuário/atendimento).
