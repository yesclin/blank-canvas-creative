-- =============================================
-- MÓDULO GESTÃO - YESCLIN
-- Controle de Estoque, Financeiro e Convênios
-- =============================================

-- 1. CONTROLE DE ESTOQUE
-- =============================================

-- Categorias de produtos
CREATE TABLE public.stock_categories (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Produtos do estoque
CREATE TABLE public.stock_products (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.stock_categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    unit TEXT NOT NULL DEFAULT 'un', -- un, ml, caixa, etc
    current_quantity NUMERIC(10,2) NOT NULL DEFAULT 0,
    min_quantity NUMERIC(10,2) NOT NULL DEFAULT 0,
    avg_cost NUMERIC(10,2),
    supplier TEXT,
    expiration_date DATE,
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Movimentações de estoque
CREATE TABLE public.stock_movements (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.stock_products(id) ON DELETE CASCADE,
    movement_type TEXT NOT NULL CHECK (movement_type IN ('entrada', 'saida', 'ajuste')),
    quantity NUMERIC(10,2) NOT NULL,
    reason TEXT NOT NULL, -- compra, uso, perda, ajuste
    procedure_id UUID REFERENCES public.procedures(id) ON DELETE SET NULL,
    professional_id UUID REFERENCES public.professionals(id) ON DELETE SET NULL,
    unit_cost NUMERIC(10,2),
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. FINANCEIRO OPERACIONAL
-- =============================================

-- Categorias financeiras
CREATE TABLE public.finance_categories (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('entrada', 'saida')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Transações financeiras
CREATE TABLE public.finance_transactions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.finance_categories(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('entrada', 'saida', 'ajuste')),
    description TEXT NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    payment_method TEXT, -- dinheiro, pix, credito, debito, convenio
    origin TEXT, -- consulta, procedimento, pacote, outros
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
    patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
    professional_id UUID REFERENCES public.professionals(id) ON DELETE SET NULL,
    insurance_id UUID REFERENCES public.insurances(id) ON DELETE SET NULL,
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Pacotes de tratamento
CREATE TABLE public.treatment_packages (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    procedure_id UUID REFERENCES public.procedures(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    total_sessions INTEGER NOT NULL,
    used_sessions INTEGER NOT NULL DEFAULT 0,
    total_amount NUMERIC(10,2) NOT NULL,
    paid_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    payment_method TEXT,
    status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'finalizado', 'cancelado', 'vencido')),
    valid_until DATE,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. CONVÊNIOS (Configurações e Regras)
-- =============================================

-- Adicionar campos extras na tabela insurances existente (se não existirem)
ALTER TABLE public.insurances 
ADD COLUMN IF NOT EXISTS code TEXT,
ADD COLUMN IF NOT EXISTS requires_authorization BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS return_allowed BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS return_days INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Procedimentos cobertos por convênio
CREATE TABLE public.insurance_procedures (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    insurance_id UUID NOT NULL REFERENCES public.insurances(id) ON DELETE CASCADE,
    procedure_id UUID NOT NULL REFERENCES public.procedures(id) ON DELETE CASCADE,
    covered_value NUMERIC(10,2),
    requires_authorization BOOLEAN DEFAULT false,
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(insurance_id, procedure_id)
);

-- Autorizações de convênio
CREATE TABLE public.insurance_authorizations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    insurance_id UUID NOT NULL REFERENCES public.insurances(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    procedure_id UUID REFERENCES public.procedures(id) ON DELETE SET NULL,
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
    authorization_number TEXT NOT NULL,
    authorization_date DATE NOT NULL DEFAULT CURRENT_DATE,
    valid_until DATE,
    status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovada', 'negada', 'utilizada')),
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =============================================
-- RLS POLICIES
-- =============================================

-- Enable RLS
ALTER TABLE public.stock_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treatment_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurance_procedures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurance_authorizations ENABLE ROW LEVEL SECURITY;

-- Stock Categories Policies
CREATE POLICY "Users can view stock categories from their clinic" ON public.stock_categories
FOR SELECT USING (clinic_id = public.user_clinic_id(auth.uid()));

CREATE POLICY "Users can insert stock categories in their clinic" ON public.stock_categories
FOR INSERT WITH CHECK (clinic_id = public.user_clinic_id(auth.uid()));

CREATE POLICY "Users can update stock categories in their clinic" ON public.stock_categories
FOR UPDATE USING (clinic_id = public.user_clinic_id(auth.uid()));

CREATE POLICY "Users can delete stock categories in their clinic" ON public.stock_categories
FOR DELETE USING (clinic_id = public.user_clinic_id(auth.uid()));

-- Stock Products Policies
CREATE POLICY "Users can view stock products from their clinic" ON public.stock_products
FOR SELECT USING (clinic_id = public.user_clinic_id(auth.uid()));

CREATE POLICY "Users can insert stock products in their clinic" ON public.stock_products
FOR INSERT WITH CHECK (clinic_id = public.user_clinic_id(auth.uid()));

CREATE POLICY "Users can update stock products in their clinic" ON public.stock_products
FOR UPDATE USING (clinic_id = public.user_clinic_id(auth.uid()));

CREATE POLICY "Users can delete stock products in their clinic" ON public.stock_products
FOR DELETE USING (clinic_id = public.user_clinic_id(auth.uid()));

-- Stock Movements Policies
CREATE POLICY "Users can view stock movements from their clinic" ON public.stock_movements
FOR SELECT USING (clinic_id = public.user_clinic_id(auth.uid()));

CREATE POLICY "Users can insert stock movements in their clinic" ON public.stock_movements
FOR INSERT WITH CHECK (clinic_id = public.user_clinic_id(auth.uid()));

-- Finance Categories Policies
CREATE POLICY "Users can view finance categories from their clinic" ON public.finance_categories
FOR SELECT USING (clinic_id = public.user_clinic_id(auth.uid()));

CREATE POLICY "Users can insert finance categories in their clinic" ON public.finance_categories
FOR INSERT WITH CHECK (clinic_id = public.user_clinic_id(auth.uid()));

CREATE POLICY "Users can update finance categories in their clinic" ON public.finance_categories
FOR UPDATE USING (clinic_id = public.user_clinic_id(auth.uid()));

CREATE POLICY "Users can delete finance categories in their clinic" ON public.finance_categories
FOR DELETE USING (clinic_id = public.user_clinic_id(auth.uid()));

-- Finance Transactions Policies
CREATE POLICY "Users can view finance transactions from their clinic" ON public.finance_transactions
FOR SELECT USING (clinic_id = public.user_clinic_id(auth.uid()));

CREATE POLICY "Users can insert finance transactions in their clinic" ON public.finance_transactions
FOR INSERT WITH CHECK (clinic_id = public.user_clinic_id(auth.uid()));

CREATE POLICY "Users can update finance transactions in their clinic" ON public.finance_transactions
FOR UPDATE USING (clinic_id = public.user_clinic_id(auth.uid()));

CREATE POLICY "Users can delete finance transactions in their clinic" ON public.finance_transactions
FOR DELETE USING (clinic_id = public.user_clinic_id(auth.uid()));

-- Treatment Packages Policies
CREATE POLICY "Users can view treatment packages from their clinic" ON public.treatment_packages
FOR SELECT USING (clinic_id = public.user_clinic_id(auth.uid()));

CREATE POLICY "Users can insert treatment packages in their clinic" ON public.treatment_packages
FOR INSERT WITH CHECK (clinic_id = public.user_clinic_id(auth.uid()));

CREATE POLICY "Users can update treatment packages in their clinic" ON public.treatment_packages
FOR UPDATE USING (clinic_id = public.user_clinic_id(auth.uid()));

CREATE POLICY "Users can delete treatment packages in their clinic" ON public.treatment_packages
FOR DELETE USING (clinic_id = public.user_clinic_id(auth.uid()));

-- Insurance Procedures Policies
CREATE POLICY "Users can view insurance procedures from their clinic" ON public.insurance_procedures
FOR SELECT USING (clinic_id = public.user_clinic_id(auth.uid()));

CREATE POLICY "Users can insert insurance procedures in their clinic" ON public.insurance_procedures
FOR INSERT WITH CHECK (clinic_id = public.user_clinic_id(auth.uid()));

CREATE POLICY "Users can update insurance procedures in their clinic" ON public.insurance_procedures
FOR UPDATE USING (clinic_id = public.user_clinic_id(auth.uid()));

CREATE POLICY "Users can delete insurance procedures in their clinic" ON public.insurance_procedures
FOR DELETE USING (clinic_id = public.user_clinic_id(auth.uid()));

-- Insurance Authorizations Policies
CREATE POLICY "Users can view insurance authorizations from their clinic" ON public.insurance_authorizations
FOR SELECT USING (clinic_id = public.user_clinic_id(auth.uid()));

CREATE POLICY "Users can insert insurance authorizations in their clinic" ON public.insurance_authorizations
FOR INSERT WITH CHECK (clinic_id = public.user_clinic_id(auth.uid()));

CREATE POLICY "Users can update insurance authorizations in their clinic" ON public.insurance_authorizations
FOR UPDATE USING (clinic_id = public.user_clinic_id(auth.uid()));

CREATE POLICY "Users can delete insurance authorizations in their clinic" ON public.insurance_authorizations
FOR DELETE USING (clinic_id = public.user_clinic_id(auth.uid()));

-- =============================================
-- TRIGGERS
-- =============================================

-- Update timestamps
CREATE TRIGGER update_stock_categories_updated_at BEFORE UPDATE ON public.stock_categories
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_stock_products_updated_at BEFORE UPDATE ON public.stock_products
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_finance_categories_updated_at BEFORE UPDATE ON public.finance_categories
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_finance_transactions_updated_at BEFORE UPDATE ON public.finance_transactions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_treatment_packages_updated_at BEFORE UPDATE ON public.treatment_packages
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_insurance_procedures_updated_at BEFORE UPDATE ON public.insurance_procedures
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_insurance_authorizations_updated_at BEFORE UPDATE ON public.insurance_authorizations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- FUNCTION: Atualizar estoque automaticamente
-- =============================================

CREATE OR REPLACE FUNCTION public.update_stock_quantity()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.movement_type = 'entrada' THEN
        UPDATE public.stock_products 
        SET current_quantity = current_quantity + NEW.quantity
        WHERE id = NEW.product_id;
    ELSIF NEW.movement_type = 'saida' THEN
        UPDATE public.stock_products 
        SET current_quantity = current_quantity - NEW.quantity
        WHERE id = NEW.product_id;
    ELSIF NEW.movement_type = 'ajuste' THEN
        UPDATE public.stock_products 
        SET current_quantity = NEW.quantity
        WHERE id = NEW.product_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_update_stock_quantity
AFTER INSERT ON public.stock_movements
FOR EACH ROW EXECUTE FUNCTION public.update_stock_quantity();