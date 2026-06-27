
-- ============= FASE 1: Fundação Financeira =============

-- 1. Expandir enum de status
ALTER TYPE public.transaction_status ADD VALUE IF NOT EXISTS 'previsto';
ALTER TYPE public.transaction_status ADD VALUE IF NOT EXISTS 'parcial';
ALTER TYPE public.transaction_status ADD VALUE IF NOT EXISTS 'vencido';
ALTER TYPE public.transaction_status ADD VALUE IF NOT EXISTS 'em_analise';
ALTER TYPE public.transaction_status ADD VALUE IF NOT EXISTS 'glosado';
ALTER TYPE public.transaction_status ADD VALUE IF NOT EXISTS 'repassado';
