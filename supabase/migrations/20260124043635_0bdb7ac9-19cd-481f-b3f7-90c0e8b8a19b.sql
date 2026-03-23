-- Adicionar coluna de meta mensal na tabela clinics
ALTER TABLE public.clinics ADD COLUMN IF NOT EXISTS monthly_goal NUMERIC(12,2) DEFAULT 80000;

-- Adicionar coluna expected_value na appointments se não existir
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS expected_value NUMERIC(12,2) DEFAULT 0;

-- Comentário explicativo
COMMENT ON COLUMN public.clinics.monthly_goal IS 'Meta de faturamento mensal da clínica';
COMMENT ON COLUMN public.appointments.expected_value IS 'Valor esperado/previsto do atendimento';