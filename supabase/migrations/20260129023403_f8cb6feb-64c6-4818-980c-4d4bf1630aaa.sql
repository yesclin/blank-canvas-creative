-- Adicionar colunas de custo e margem na tabela sale_items
ALTER TABLE public.sale_items 
ADD COLUMN IF NOT EXISTS cost_price numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_cost numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS profit numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS margin_percent numeric DEFAULT 0;