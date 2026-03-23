-- =============================================
-- CONFIGURAÇÃO DE ALERTAS DE MARGEM
-- =============================================

-- Adicionar configurações de alerta de margem na tabela clinics
ALTER TABLE public.clinics
ADD COLUMN IF NOT EXISTS margin_alert_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS margin_alert_min_percent NUMERIC(5,2) DEFAULT 20,
ADD COLUMN IF NOT EXISTS margin_alert_period_days INTEGER DEFAULT 30;

-- Adicionar comentários para documentação
COMMENT ON COLUMN public.clinics.margin_alert_enabled IS 'Habilita/desabilita alertas automáticos de margem';
COMMENT ON COLUMN public.clinics.margin_alert_min_percent IS 'Percentual mínimo de margem aceitável antes de gerar alerta';
COMMENT ON COLUMN public.clinics.margin_alert_period_days IS 'Período em dias para análise de margem';