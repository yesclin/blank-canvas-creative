
-- =============================================
-- ADD sale_price TO stock_products
-- =============================================
ALTER TABLE public.stock_products 
ADD COLUMN IF NOT EXISTS sale_price NUMERIC(12,2) DEFAULT 0;

-- Rename current_quantity to stock_quantity for clarity (create alias view)
-- Keep current_quantity but add stock_quantity as computed for compatibility

-- =============================================
-- PRODUCTS TABLE (Products for sale - separate from stock_products for materials)
-- =============================================
CREATE TABLE IF NOT EXISTS public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  sku TEXT,
  barcode TEXT,
  category TEXT,
  unit TEXT NOT NULL DEFAULT 'un',
  stock_quantity NUMERIC(12,3) NOT NULL DEFAULT 0,
  min_stock_quantity NUMERIC(12,3) DEFAULT 0,
  cost_price NUMERIC(12,2) DEFAULT 0,
  sale_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  supplier TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- RLS Policies (use IF NOT EXISTS pattern with DO block)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'Users can view products from their clinic') THEN
    CREATE POLICY "Users can view products from their clinic"
    ON public.products FOR SELECT
    USING (clinic_id IN (SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid()));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'Users can insert products in their clinic') THEN
    CREATE POLICY "Users can insert products in their clinic"
    ON public.products FOR INSERT
    WITH CHECK (clinic_id IN (SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid()));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'Users can update products in their clinic') THEN
    CREATE POLICY "Users can update products in their clinic"
    ON public.products FOR UPDATE
    USING (clinic_id IN (SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid()));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'Users can delete products in their clinic') THEN
    CREATE POLICY "Users can delete products in their clinic"
    ON public.products FOR DELETE
    USING (clinic_id IN (SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid()));
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_products_clinic_id ON public.products(clinic_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku) WHERE sku IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_barcode ON public.products(barcode) WHERE barcode IS NOT NULL;

-- =============================================
-- SALES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.sales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  sale_number TEXT,
  patient_id UUID REFERENCES public.patients(id),
  professional_id UUID REFERENCES public.professionals(id),
  sale_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(12,2) DEFAULT 0,
  discount_percent NUMERIC(5,2) DEFAULT 0,
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  payment_method TEXT,
  payment_status TEXT NOT NULL DEFAULT 'pendente',
  notes TEXT,
  transaction_id UUID,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT sales_payment_status_check CHECK (payment_status IN ('pendente', 'pago', 'parcial', 'cancelado'))
);

-- Enable RLS
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sales' AND policyname = 'Users can view sales from their clinic') THEN
    CREATE POLICY "Users can view sales from their clinic"
    ON public.sales FOR SELECT
    USING (clinic_id IN (SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid()));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sales' AND policyname = 'Users can insert sales in their clinic') THEN
    CREATE POLICY "Users can insert sales in their clinic"
    ON public.sales FOR INSERT
    WITH CHECK (clinic_id IN (SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid()));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sales' AND policyname = 'Users can update sales in their clinic') THEN
    CREATE POLICY "Users can update sales in their clinic"
    ON public.sales FOR UPDATE
    USING (clinic_id IN (SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid()));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sales' AND policyname = 'Users can delete sales in their clinic') THEN
    CREATE POLICY "Users can delete sales in their clinic"
    ON public.sales FOR DELETE
    USING (clinic_id IN (SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid()));
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sales_clinic_id ON public.sales(clinic_id);
CREATE INDEX IF NOT EXISTS idx_sales_patient_id ON public.sales(patient_id);
CREATE INDEX IF NOT EXISTS idx_sales_sale_date ON public.sales(sale_date DESC);
CREATE INDEX IF NOT EXISTS idx_sales_payment_status ON public.sales(payment_status);

-- =============================================
-- SALE_ITEMS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.sale_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  product_name TEXT NOT NULL,
  quantity NUMERIC(12,3) NOT NULL,
  unit_price NUMERIC(12,2) NOT NULL,
  discount_amount NUMERIC(12,2) DEFAULT 0,
  total_price NUMERIC(12,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sale_items' AND policyname = 'Users can view sale items from their clinic') THEN
    CREATE POLICY "Users can view sale items from their clinic"
    ON public.sale_items FOR SELECT
    USING (clinic_id IN (SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid()));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sale_items' AND policyname = 'Users can insert sale items in their clinic') THEN
    CREATE POLICY "Users can insert sale items in their clinic"
    ON public.sale_items FOR INSERT
    WITH CHECK (clinic_id IN (SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid()));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sale_items' AND policyname = 'Users can update sale items in their clinic') THEN
    CREATE POLICY "Users can update sale items in their clinic"
    ON public.sale_items FOR UPDATE
    USING (clinic_id IN (SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid()));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sale_items' AND policyname = 'Users can delete sale items in their clinic') THEN
    CREATE POLICY "Users can delete sale items in their clinic"
    ON public.sale_items FOR DELETE
    USING (clinic_id IN (SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid()));
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sale_items_clinic_id ON public.sale_items(clinic_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON public.sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product_id ON public.sale_items(product_id);

-- =============================================
-- ENHANCE stock_movements with tracking columns
-- =============================================
ALTER TABLE public.stock_movements 
ADD COLUMN IF NOT EXISTS previous_quantity NUMERIC(12,3),
ADD COLUMN IF NOT EXISTS new_quantity NUMERIC(12,3),
ADD COLUMN IF NOT EXISTS total_cost NUMERIC(12,2),
ADD COLUMN IF NOT EXISTS reference_type TEXT,
ADD COLUMN IF NOT EXISTS reference_id UUID;

-- =============================================
-- LINK SALES TO FINANCE_TRANSACTIONS (if not exists)
-- =============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_sales_transaction' AND table_name = 'sales'
  ) THEN
    ALTER TABLE public.sales 
    ADD CONSTRAINT fk_sales_transaction 
    FOREIGN KEY (transaction_id) REFERENCES public.finance_transactions(id) ON DELETE SET NULL;
  END IF;
END $$;

-- =============================================
-- FUNCTION: Update product stock on movements
-- =============================================
CREATE OR REPLACE FUNCTION public.update_product_stock_from_movement()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update products table if product exists there
  UPDATE public.products 
  SET 
    stock_quantity = COALESCE(NEW.new_quantity, stock_quantity + 
      CASE 
        WHEN NEW.movement_type IN ('entrada', 'devolucao') THEN NEW.quantity
        WHEN NEW.movement_type IN ('saida', 'venda') THEN -NEW.quantity
        ELSE 0
      END),
    updated_at = now()
  WHERE id = NEW.product_id;
  
  RETURN NEW;
END;
$$;

-- =============================================
-- TRIGGER: Auto-update timestamps for new tables
-- =============================================
DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_sales_updated_at ON public.sales;
CREATE TRIGGER update_sales_updated_at
BEFORE UPDATE ON public.sales
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
