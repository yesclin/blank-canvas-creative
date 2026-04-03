
## Plano de Implementação — Fluxo de Sessão Clínica Integrado

### Fase 1: Schema do Banco de Dados
Criar tabela `appointment_sessions` para rastrear pausas/retomadas e armazenar resumo final:
- `appointment_id` (FK → appointments)
- `paused_at`, `resumed_at` (arrays de timestamps para múltiplas pausas)
- `total_paused_seconds` (tempo total em pausa)
- `session_summary` (JSON com resumo consolidado)
- `session_notes` (observações finais)

Adicionar campo `paused_at` na tabela `appointments` para indicar se está pausado.

### Fase 2: Hook de Sessão (`useSessionTimer`)
- Cronômetro que calcula tempo desde `started_at`
- Subtrai tempo em pausa
- Suporta pause/resume
- Exibe tempo formatado HH:MM:SS

### Fase 3: Melhorar AppointmentDetailDrawer
- Adicionar cronômetro visível quando `em_atendimento`
- Adicionar botões "Pausar" e "Retomar"
- Status visual: agendado → chegou → em atendimento → pausado → finalizado
- Melhorar seção de histórico com pausas

### Fase 4: Hook de Resumo da Sessão (`useSessionSummary`)
- Ao finalizar, consolidar tudo vinculado ao `appointment_id`:
  - Anamneses, evoluções, mídias, produtos, termos, alertas
- Salvar resumo estruturado em `appointment_sessions.session_summary`

### Fase 5: Modal de Resumo do Atendimento
- Novo componente `AppointmentSummaryModal`
- Layout limpo com seções: cabeçalho, clínico, operacional
- Acessível da agenda para atendimentos finalizados
- Botão "Ver Resumo" no drawer

### Fase 6: Integração
- Agenda: refletir status pausado
- Drawer: mostrar resumo quando finalizado
- Prontuário: manter contexto de sessão ativa (já existe via `useActiveAppointment`)

### O que NÃO será alterado
- Fluxo de navegação ao prontuário (já funciona)
- Lógica de especialidade ativa (já funciona)
- Outras especialidades
- Pipeline de salvamento existente
