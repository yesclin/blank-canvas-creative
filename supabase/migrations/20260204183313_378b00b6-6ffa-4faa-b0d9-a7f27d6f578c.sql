-- Add missing module values to the app_module enum
ALTER TYPE public.app_module ADD VALUE IF NOT EXISTS 'atendimento';
ALTER TYPE public.app_module ADD VALUE IF NOT EXISTS 'meu_financeiro';