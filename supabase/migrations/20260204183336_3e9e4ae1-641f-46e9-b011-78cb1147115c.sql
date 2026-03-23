-- =============================================================
-- PERMISSION TEMPLATES: Define default permissions per role
-- =============================================================

-- Clear existing templates to start fresh
DELETE FROM public.permission_templates;

-- =============================================
-- OWNER: Full access to everything
-- =============================================
INSERT INTO public.permission_templates (role, module, actions, restrictions)
VALUES
  ('owner', 'dashboard', ARRAY['view', 'create', 'edit', 'delete', 'export']::app_action[], '{}'),
  ('owner', 'agenda', ARRAY['view', 'create', 'edit', 'delete', 'export']::app_action[], '{}'),
  ('owner', 'atendimento', ARRAY['view', 'create', 'edit', 'delete', 'export']::app_action[], '{}'),
  ('owner', 'pacientes', ARRAY['view', 'create', 'edit', 'delete', 'export']::app_action[], '{}'),
  ('owner', 'prontuario', ARRAY['view', 'create', 'edit', 'delete', 'export']::app_action[], '{}'),
  ('owner', 'comunicacao', ARRAY['view', 'create', 'edit', 'delete', 'export']::app_action[], '{}'),
  ('owner', 'financeiro', ARRAY['view', 'create', 'edit', 'delete', 'export']::app_action[], '{}'),
  ('owner', 'meu_financeiro', ARRAY['view', 'export']::app_action[], '{}'),
  ('owner', 'convenios', ARRAY['view', 'create', 'edit', 'delete', 'export']::app_action[], '{}'),
  ('owner', 'estoque', ARRAY['view', 'create', 'edit', 'delete', 'export']::app_action[], '{}'),
  ('owner', 'relatorios', ARRAY['view', 'export']::app_action[], '{}'),
  ('owner', 'configuracoes', ARRAY['view', 'create', 'edit', 'delete', 'export']::app_action[], '{}');

-- =============================================
-- ADMIN: Full access (similar to owner but can't manage users)
-- =============================================
INSERT INTO public.permission_templates (role, module, actions, restrictions)
VALUES
  ('admin', 'dashboard', ARRAY['view', 'create', 'edit', 'delete', 'export']::app_action[], '{}'),
  ('admin', 'agenda', ARRAY['view', 'create', 'edit', 'delete', 'export']::app_action[], '{}'),
  ('admin', 'atendimento', ARRAY['view', 'create', 'edit', 'delete', 'export']::app_action[], '{}'),
  ('admin', 'pacientes', ARRAY['view', 'create', 'edit', 'delete', 'export']::app_action[], '{}'),
  ('admin', 'prontuario', ARRAY['view', 'create', 'edit', 'delete', 'export']::app_action[], '{}'),
  ('admin', 'comunicacao', ARRAY['view', 'create', 'edit', 'delete', 'export']::app_action[], '{}'),
  ('admin', 'financeiro', ARRAY['view', 'create', 'edit', 'delete', 'export']::app_action[], '{}'),
  ('admin', 'meu_financeiro', ARRAY['view', 'export']::app_action[], '{}'),
  ('admin', 'convenios', ARRAY['view', 'create', 'edit', 'delete', 'export']::app_action[], '{}'),
  ('admin', 'estoque', ARRAY['view', 'create', 'edit', 'delete', 'export']::app_action[], '{}'),
  ('admin', 'relatorios', ARRAY['view', 'export']::app_action[], '{}'),
  ('admin', 'configuracoes', ARRAY['view', 'create', 'edit', 'delete', 'export']::app_action[], '{}');

-- =============================================
-- PROFISSIONAL: Clinical modules only, limited to own data
-- Dashboard: only own stats
-- Agenda: only own schedule  
-- Pacientes: only patients they have attended
-- Prontuário/Atendimento: full access
-- Meu Financeiro: view own financial data
-- NO: Configurações, Finanças global, Relatórios admin, Estoque, Marketing
-- =============================================
INSERT INTO public.permission_templates (role, module, actions, restrictions)
VALUES
  ('profissional', 'dashboard', ARRAY['view']::app_action[], '{"own_data_only": true}'),
  ('profissional', 'agenda', ARRAY['view', 'create', 'edit']::app_action[], '{"own_data_only": true}'),
  ('profissional', 'atendimento', ARRAY['view', 'create', 'edit']::app_action[], '{}'),
  ('profissional', 'pacientes', ARRAY['view', 'create', 'edit']::app_action[], '{"own_data_only": true}'),
  ('profissional', 'prontuario', ARRAY['view', 'create', 'edit']::app_action[], '{}'),
  ('profissional', 'meu_financeiro', ARRAY['view', 'export']::app_action[], '{}');

-- =============================================
-- RECEPCIONISTA: Front-desk operations only (no clinical access)
-- Agenda: view all professionals, create/edit appointments
-- Pacientes: cadastral data only (no clinical)
-- Atendimento: check-in, confirm, manage queue
-- Convênios: view for insurance info
-- NO: Prontuário (clinical content), Finanças, Relatórios, Config, Estoque
-- =============================================
INSERT INTO public.permission_templates (role, module, actions, restrictions)
VALUES
  ('recepcionista', 'dashboard', ARRAY['view']::app_action[], '{"limited_stats": true}'),
  ('recepcionista', 'agenda', ARRAY['view', 'create', 'edit']::app_action[], '{}'),
  ('recepcionista', 'atendimento', ARRAY['view', 'create']::app_action[], '{"no_clinical_access": true}'),
  ('recepcionista', 'pacientes', ARRAY['view', 'create', 'edit']::app_action[], '{"no_clinical_access": true}'),
  ('recepcionista', 'convenios', ARRAY['view']::app_action[], '{}');