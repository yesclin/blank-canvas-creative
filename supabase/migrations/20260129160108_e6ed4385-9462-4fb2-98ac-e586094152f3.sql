-- Criar tabela de vínculo entre procedimentos e produtos do estoque
CREATE TABLE public.procedure_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  procedure_id UUID NOT NULL REFERENCES public.procedures(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity NUMERIC(10, 3) NOT NULL DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(procedure_id, product_id)
);

-- Índices para performance
CREATE INDEX idx_procedure_products_clinic_id ON public.procedure_products(clinic_id);
CREATE INDEX idx_procedure_products_procedure_id ON public.procedure_products(procedure_id);
CREATE INDEX idx_procedure_products_product_id ON public.procedure_products(product_id);

-- Habilitar RLS
ALTER TABLE public.procedure_products ENABLE ROW LEVEL SECURITY;

-- Política de leitura: usuários da clínica podem ler
CREATE POLICY "Clinic users can view procedure products"
ON public.procedure_products
FOR SELECT
USING (clinic_id = (SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid()));

-- Política de inserção
CREATE POLICY "Clinic users can insert procedure products"
ON public.procedure_products
FOR INSERT
WITH CHECK (clinic_id = (SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid()));

-- Política de atualização
CREATE POLICY "Clinic users can update procedure products"
ON public.procedure_products
FOR UPDATE
USING (clinic_id = (SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid()));

-- Política de deleção
CREATE POLICY "Clinic users can delete procedure products"
ON public.procedure_products
FOR DELETE
USING (clinic_id = (SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid()));

-- Trigger para atualizar updated_at
CREATE TRIGGER update_procedure_products_updated_at
BEFORE UPDATE ON public.procedure_products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();