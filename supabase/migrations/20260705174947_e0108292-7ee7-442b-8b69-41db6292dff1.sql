-- Expand procedures with full configuration matrix (Fase 1 — schema)
-- All columns nullable / with safe defaults so legacy rows keep working.

DO $$ BEGIN
  CREATE TYPE public.procedure_type AS ENUM (
    'consulta','retorno','procedimento','sessao','pacote','avaliacao','acompanhamento','outro'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.procedure_charge_mode AS ENUM ('automatic','manual');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.procedure_commission_type AS ENUM ('none','fixed','percent');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.procedure_commission_trigger AS ENUM ('on_finish','on_payment');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.procedures
  -- Dados básicos
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS type public.procedure_type NOT NULL DEFAULT 'procedimento',
  ADD COLUMN IF NOT EXISTS color text,

  -- Agenda
  ADD COLUMN IF NOT EXISTS show_in_agenda boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS bookable_online boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS min_interval_minutes integer,
  ADD COLUMN IF NOT EXISTS allow_walkin boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS requires_specific_professional boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS requires_room boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS min_booking_notice_hours integer,
  ADD COLUMN IF NOT EXISTS max_booking_notice_days integer,
  ADD COLUMN IF NOT EXISTS charge_on_schedule boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS charge_on_finish boolean NOT NULL DEFAULT true,

  -- Sessões (complementa colunas já existentes)
  ADD COLUMN IF NOT EXISTS open_treatment boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS block_outside_interval boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS allow_cancel_without_losing_package boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS suggest_next_session boolean NOT NULL DEFAULT true,

  -- Financeiro
  ADD COLUMN IF NOT EXISTS particular_price numeric,
  ADD COLUMN IF NOT EXISTS insurance_price numeric,
  ADD COLUMN IF NOT EXISTS is_free boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS allow_discount boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS min_price numeric,
  ADD COLUMN IF NOT EXISTS allow_installments boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS max_installments integer DEFAULT 12,
  ADD COLUMN IF NOT EXISTS charge_mode public.procedure_charge_mode NOT NULL DEFAULT 'automatic',
  ADD COLUMN IF NOT EXISTS default_finance_category_id uuid REFERENCES public.finance_categories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS default_payment_method_id uuid REFERENCES public.payment_methods(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS cost_center text,
  ADD COLUMN IF NOT EXISTS commission_type public.procedure_commission_type NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS commission_value numeric,
  ADD COLUMN IF NOT EXISTS commission_trigger public.procedure_commission_trigger NOT NULL DEFAULT 'on_payment',

  -- Prontuário / atendimento
  ADD COLUMN IF NOT EXISTS requires_anamnesis boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS default_anamnesis_template_id uuid,
  ADD COLUMN IF NOT EXISTS requires_evolution boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS requires_signature boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS requires_before_after_photos boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS requires_consent_term boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS default_consent_term_id uuid,
  ADD COLUMN IF NOT EXISTS pre_procedure_care text,
  ADD COLUMN IF NOT EXISTS post_procedure_care text,
  ADD COLUMN IF NOT EXISTS contraindications text,
  ADD COLUMN IF NOT EXISTS possible_intercurrences text,

  -- Materiais / estoque
  ADD COLUMN IF NOT EXISTS auto_deduct_stock boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS allow_manual_stock_adjust boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS alert_when_no_stock boolean NOT NULL DEFAULT true,

  -- Profissionais
  ADD COLUMN IF NOT EXISTS restrict_to_authorized_professionals boolean NOT NULL DEFAULT false,

  -- Convênios
  ADD COLUMN IF NOT EXISTS accepts_insurance boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS requires_insurance_authorization boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS tuss_code text,
  ADD COLUMN IF NOT EXISTS tiss_code text;

CREATE INDEX IF NOT EXISTS idx_procedures_type ON public.procedures(clinic_id, type);
CREATE INDEX IF NOT EXISTS idx_procedures_show_in_agenda ON public.procedures(clinic_id, show_in_agenda) WHERE show_in_agenda = true;