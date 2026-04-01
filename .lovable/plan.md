
## Plano: Agendamento Público por Link da Clínica

### Fase 1 — Migração de Banco de Dados
Adicionar colunas às tabelas existentes:
- `clinics.slug` (text, UNIQUE, nullable inicialmente)
- `clinics.public_booking_enabled` (boolean, default false)
- `clinics.public_booking_settings` (jsonb, default '{}')
- `appointments.created_source` (text, default 'internal')
- `appointments.booking_reference` (text, nullable)
- `appointments.confirmation_token` (text, nullable)

Criar políticas RLS para acesso público (anon) limitado:
- SELECT em clinics (apenas slug, nome, logo, booking settings) onde public_booking_enabled = true
- SELECT em specialties ativas vinculadas à clínica pública
- SELECT em professionals ativos vinculados à clínica pública
- SELECT em professional_schedules para calcular disponibilidade
- SELECT em clinic_schedule_config
- SELECT em schedule_blocks (para excluir horários bloqueados)
- INSERT em appointments (com created_source = 'public_patient')
- INSERT/SELECT em patients (para lookup/criação)

### Fase 2 — Serviço Central de Disponibilidade Pública
- `src/services/publicAvailability.ts` — funções puras de cálculo de slots
- `src/hooks/usePublicProfessionalAvailability.ts` — hook React
- Considera: horários da clínica, horários do profissional, bloqueios, agendamentos existentes, duração, antecedência mín/máx

### Fase 3 — Páginas Públicas (6 rotas)
1. `/agendar/:clinicSlug` — landing page da clínica
2. `/agendar/:clinicSlug/especialidade` — seleção de especialidade
3. `/agendar/:clinicSlug/profissional` — seleção de profissional
4. `/agendar/:clinicSlug/horarios` — calendário + slots
5. `/agendar/:clinicSlug/dados` — formulário do paciente
6. `/agendar/:clinicSlug/confirmacao` — resumo e protocolo

Componentes: PublicBookingLayout, steps individuais, formulário, cards de confirmação

### Fase 4 — Configuração Interna
- Nova aba "Agendamento Online" em `/app/config/agenda`
- Ativar/desativar, selecionar especialidades, profissionais, antecedência, mensagens, status inicial
- Exibir link copiável

### Fase 5 — Integração
- Agendamento criado aparece normalmente em /app/agenda
- Compatível com drawer de detalhes, fluxo de status, prontuário

Devo prosseguir com a Fase 1 (migração)?
