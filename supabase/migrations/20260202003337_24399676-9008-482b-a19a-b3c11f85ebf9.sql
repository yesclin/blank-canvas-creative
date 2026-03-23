-- =============================================
-- PRODUCT KITS - Kits baseados em produtos do estoque
-- =============================================

-- Tabela de definição de kits de produtos
CREATE TABLE public.product_kits (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para product_kits
CREATE INDEX idx_product_kits_clinic_id ON public.product_kits(clinic_id);
CREATE INDEX idx_product_kits_active ON public.product_kits(clinic_id, is_active);

-- Tabela de itens do kit (produtos)
CREATE TABLE public.product_kit_items (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    kit_id UUID NOT NULL REFERENCES public.product_kits(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    quantity NUMERIC NOT NULL DEFAULT 1 CHECK (quantity > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- Unique constraint para evitar duplicatas
    CONSTRAINT product_kit_items_unique UNIQUE (kit_id, product_id)
);

-- Índices para product_kit_items
CREATE INDEX idx_product_kit_items_kit_id ON public.product_kit_items(kit_id);
CREATE INDEX idx_product_kit_items_product_id ON public.product_kit_items(product_id);

-- Tabela de vínculo procedimento-kit
CREATE TABLE public.procedure_product_kits (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    procedure_id UUID NOT NULL REFERENCES public.procedures(id) ON DELETE CASCADE,
    kit_id UUID NOT NULL REFERENCES public.product_kits(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    is_required BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- Unique constraint para evitar duplicatas
    CONSTRAINT procedure_product_kits_unique UNIQUE (procedure_id, kit_id)
);

-- Índices para procedure_product_kits
CREATE INDEX idx_procedure_product_kits_procedure ON public.procedure_product_kits(procedure_id);
CREATE INDEX idx_procedure_product_kits_kit ON public.procedure_product_kits(kit_id);
CREATE INDEX idx_procedure_product_kits_clinic ON public.procedure_product_kits(clinic_id);

-- RLS Policies para product_kits
ALTER TABLE public.product_kits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view product kits from their clinic"
    ON public.product_kits FOR SELECT
    USING (clinic_id = public.user_clinic_id(auth.uid()));

CREATE POLICY "Admin users can insert product kits"
    ON public.product_kits FOR INSERT
    WITH CHECK (
        clinic_id = public.user_clinic_id(auth.uid())
        AND public.is_clinic_admin(auth.uid(), clinic_id)
    );

CREATE POLICY "Admin users can update product kits"
    ON public.product_kits FOR UPDATE
    USING (
        clinic_id = public.user_clinic_id(auth.uid())
        AND public.is_clinic_admin(auth.uid(), clinic_id)
    );

CREATE POLICY "Admin users can delete product kits"
    ON public.product_kits FOR DELETE
    USING (
        clinic_id = public.user_clinic_id(auth.uid())
        AND public.is_clinic_admin(auth.uid(), clinic_id)
    );

-- RLS Policies para product_kit_items
ALTER TABLE public.product_kit_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view product kit items from their clinic"
    ON public.product_kit_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.product_kits pk
            WHERE pk.id = kit_id
            AND pk.clinic_id = public.user_clinic_id(auth.uid())
        )
    );

CREATE POLICY "Admin users can insert product kit items"
    ON public.product_kit_items FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.product_kits pk
            WHERE pk.id = kit_id
            AND pk.clinic_id = public.user_clinic_id(auth.uid())
            AND public.is_clinic_admin(auth.uid(), pk.clinic_id)
        )
    );

CREATE POLICY "Admin users can update product kit items"
    ON public.product_kit_items FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.product_kits pk
            WHERE pk.id = kit_id
            AND pk.clinic_id = public.user_clinic_id(auth.uid())
            AND public.is_clinic_admin(auth.uid(), pk.clinic_id)
        )
    );

CREATE POLICY "Admin users can delete product kit items"
    ON public.product_kit_items FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.product_kits pk
            WHERE pk.id = kit_id
            AND pk.clinic_id = public.user_clinic_id(auth.uid())
            AND public.is_clinic_admin(auth.uid(), pk.clinic_id)
        )
    );

-- RLS Policies para procedure_product_kits
ALTER TABLE public.procedure_product_kits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view procedure product kits from their clinic"
    ON public.procedure_product_kits FOR SELECT
    USING (clinic_id = public.user_clinic_id(auth.uid()));

CREATE POLICY "Admin users can insert procedure product kits"
    ON public.procedure_product_kits FOR INSERT
    WITH CHECK (
        clinic_id = public.user_clinic_id(auth.uid())
        AND public.is_clinic_admin(auth.uid(), clinic_id)
    );

CREATE POLICY "Admin users can update procedure product kits"
    ON public.procedure_product_kits FOR UPDATE
    USING (
        clinic_id = public.user_clinic_id(auth.uid())
        AND public.is_clinic_admin(auth.uid(), clinic_id)
    );

CREATE POLICY "Admin users can delete procedure product kits"
    ON public.procedure_product_kits FOR DELETE
    USING (
        clinic_id = public.user_clinic_id(auth.uid())
        AND public.is_clinic_admin(auth.uid(), clinic_id)
    );

-- Trigger para atualizar updated_at
CREATE TRIGGER update_product_kits_updated_at
    BEFORE UPDATE ON public.product_kits
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- FUNÇÃO: Calcular custo total de um kit de produtos
-- =============================================
CREATE OR REPLACE FUNCTION public.calculate_product_kit_cost(p_kit_id uuid)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    total_cost NUMERIC := 0;
BEGIN
    SELECT COALESCE(SUM(pki.quantity * COALESCE(p.cost_price, 0)), 0)
    INTO total_cost
    FROM public.product_kit_items pki
    JOIN public.products p ON p.id = pki.product_id
    WHERE pki.kit_id = p_kit_id
      AND p.is_active = true;
    
    RETURN total_cost;
END;
$function$;

-- =============================================
-- FUNÇÃO: Calcular custo total de procedimento incluindo kits
-- =============================================
CREATE OR REPLACE FUNCTION public.calculate_procedure_total_cost(p_procedure_id uuid)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    products_cost NUMERIC := 0;
    kits_cost NUMERIC := 0;
    total_cost NUMERIC := 0;
BEGIN
    -- Custo de produtos individuais vinculados
    SELECT COALESCE(SUM(pp.quantity * COALESCE(p.cost_price, 0)), 0)
    INTO products_cost
    FROM public.procedure_products pp
    JOIN public.products p ON p.id = pp.product_id
    WHERE pp.procedure_id = p_procedure_id
      AND p.is_active = true;
    
    -- Custo de kits vinculados
    SELECT COALESCE(SUM(
        ppk.quantity * public.calculate_product_kit_cost(ppk.kit_id)
    ), 0)
    INTO kits_cost
    FROM public.procedure_product_kits ppk
    JOIN public.product_kits pk ON pk.id = ppk.kit_id
    WHERE ppk.procedure_id = p_procedure_id
      AND pk.is_active = true;
    
    total_cost := products_cost + kits_cost;
    
    RETURN total_cost;
END;
$function$;

-- =============================================
-- FUNÇÃO: Processar consumo de kit durante execução do procedimento
-- =============================================
CREATE OR REPLACE FUNCTION public.process_product_kit_consumption(
    p_appointment_id uuid,
    p_kit_id uuid,
    p_kit_quantity integer DEFAULT 1
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_appointment RECORD;
    v_clinic_id UUID;
    v_procedure_id UUID;
    v_professional_id UUID;
    v_patient_id UUID;
    v_user_id UUID;
    v_user_clinic_id UUID;
    v_now TIMESTAMPTZ := now();
    
    v_kit_item RECORD;
    v_previous_qty NUMERIC;
    v_new_qty NUMERIC;
    v_unit_cost NUMERIC;
    v_item_quantity NUMERIC;
    
    v_processed_count INT := 0;
    v_total_cost NUMERIC := 0;
    v_kit_name TEXT;
BEGIN
    -- Validate input
    IF p_appointment_id IS NULL OR p_kit_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Parâmetros inválidos');
    END IF;

    -- Get current user
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Não autenticado');
    END IF;

    -- Get appointment details
    SELECT 
        id, clinic_id, procedure_id, professional_id, patient_id
    INTO v_appointment
    FROM public.appointments
    WHERE id = p_appointment_id;

    IF v_appointment IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Agendamento não encontrado');
    END IF;

    v_clinic_id := v_appointment.clinic_id;
    v_procedure_id := v_appointment.procedure_id;
    v_professional_id := v_appointment.professional_id;
    v_patient_id := v_appointment.patient_id;

    -- Tenant isolation
    v_user_clinic_id := public.user_clinic_id(v_user_id);
    IF v_user_clinic_id IS NULL OR v_user_clinic_id <> v_clinic_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'Acesso negado');
    END IF;

    -- Get kit name
    SELECT name INTO v_kit_name
    FROM public.product_kits
    WHERE id = p_kit_id AND clinic_id = v_clinic_id AND is_active = true;

    IF v_kit_name IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Kit não encontrado ou inativo');
    END IF;

    -- Process each product in the kit
    FOR v_kit_item IN 
        SELECT 
            pki.product_id,
            pki.quantity,
            p.name as product_name,
            p.stock_quantity,
            p.cost_price,
            p.unit
        FROM public.product_kit_items pki
        JOIN public.products p ON p.id = pki.product_id
        WHERE pki.kit_id = p_kit_id
          AND p.is_active = true
    LOOP
        -- Calculate quantity (item qty * kit qty)
        v_item_quantity := v_kit_item.quantity * p_kit_quantity;
        v_unit_cost := COALESCE(v_kit_item.cost_price, 0);
        
        -- Get current stock with lock
        SELECT stock_quantity INTO v_previous_qty
        FROM public.products
        WHERE id = v_kit_item.product_id
        FOR UPDATE;

        v_previous_qty := COALESCE(v_previous_qty, 0);
        v_new_qty := v_previous_qty - v_item_quantity;

        -- Create stock movement
        INSERT INTO public.stock_movements (
            clinic_id,
            product_id,
            movement_type,
            quantity,
            previous_quantity,
            new_quantity,
            unit_cost,
            total_cost,
            reason,
            reference_type,
            reference_id,
            notes,
            created_by,
            created_at
        ) VALUES (
            v_clinic_id,
            v_kit_item.product_id,
            'saida',
            v_item_quantity,
            v_previous_qty,
            v_new_qty,
            v_unit_cost,
            v_item_quantity * v_unit_cost,
            'PROCEDURE_KIT_USE',
            'procedure_kit_execution',
            p_appointment_id::TEXT,
            'Kit: ' || v_kit_name || ' - Produto: ' || v_kit_item.product_name,
            v_user_id,
            v_now
        );

        -- Record in material_consumption
        INSERT INTO public.material_consumption (
            clinic_id,
            appointment_id,
            procedure_id,
            material_id,
            professional_id,
            patient_id,
            quantity,
            unit,
            unit_cost,
            total_cost,
            consumption_type,
            source,
            consumed_at,
            created_by
        ) VALUES (
            v_clinic_id,
            p_appointment_id,
            v_procedure_id,
            v_kit_item.product_id,
            v_professional_id,
            v_patient_id,
            v_item_quantity,
            COALESCE(v_kit_item.unit, 'un'),
            v_unit_cost,
            v_item_quantity * v_unit_cost,
            'automatic',
            'kit',
            v_now,
            v_user_id
        );

        -- Update product stock
        UPDATE public.products
        SET stock_quantity = v_new_qty, updated_at = v_now
        WHERE id = v_kit_item.product_id;

        v_processed_count := v_processed_count + 1;
        v_total_cost := v_total_cost + (v_item_quantity * v_unit_cost);
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Kit processado com sucesso',
        'kit_name', v_kit_name,
        'processed_count', v_processed_count,
        'total_cost', v_total_cost,
        'appointment_id', p_appointment_id
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$function$;

-- =============================================
-- Atualizar a função principal para incluir kits
-- =============================================
CREATE OR REPLACE FUNCTION public.process_procedure_product_consumption(p_appointment_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_appointment RECORD;
  v_clinic_id UUID;
  v_procedure_id UUID;
  v_professional_id UUID;
  v_patient_id UUID;
  v_user_id UUID;
  v_user_clinic_id UUID;
  v_now TIMESTAMPTZ := now();
  
  v_product RECORD;
  v_proc_product RECORD;
  v_proc_kit RECORD;
  v_kit_result JSONB;
  v_previous_qty NUMERIC;
  v_new_qty NUMERIC;
  v_unit_cost NUMERIC;
  
  v_processed_count INT := 0;
  v_total_cost NUMERIC := 0;
  v_alerts_count INT := 0;
BEGIN
  -- Validate input
  IF p_appointment_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'ID do agendamento inválido');
  END IF;

  -- Get current user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Não autenticado');
  END IF;

  -- Get appointment details
  SELECT 
    id, clinic_id, procedure_id, professional_id, patient_id, status
  INTO v_appointment
  FROM public.appointments
  WHERE id = p_appointment_id;

  IF v_appointment IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Agendamento não encontrado');
  END IF;

  v_clinic_id := v_appointment.clinic_id;
  v_procedure_id := v_appointment.procedure_id;
  v_professional_id := v_appointment.professional_id;
  v_patient_id := v_appointment.patient_id;

  -- Tenant isolation check
  v_user_clinic_id := public.user_clinic_id(v_user_id);
  IF v_user_clinic_id IS NULL OR v_user_clinic_id <> v_clinic_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Acesso negado');
  END IF;

  -- Check if procedure exists
  IF v_procedure_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', true, 
      'message', 'Agendamento sem procedimento vinculado',
      'processed_count', 0,
      'total_cost', 0
    );
  END IF;

  -- Check if already processed
  IF EXISTS (
    SELECT 1 FROM public.stock_movements 
    WHERE reference_type IN ('procedure_execution', 'procedure_kit_execution')
    AND reference_id = p_appointment_id::TEXT
    LIMIT 1
  ) THEN
    SELECT COALESCE(procedure_cost, 0) INTO v_total_cost
    FROM public.appointments WHERE id = p_appointment_id;
    
    RETURN jsonb_build_object(
      'success', true, 
      'message', 'Consumo já processado anteriormente',
      'processed_count', 0,
      'total_cost', v_total_cost
    );
  END IF;

  -- =============================================
  -- PROCESS INDIVIDUAL PRODUCTS
  -- =============================================
  FOR v_proc_product IN 
    SELECT 
      pp.product_id,
      pp.quantity,
      pp.notes,
      p.name as product_name,
      p.stock_quantity,
      p.cost_price,
      p.min_stock_quantity,
      p.unit
    FROM public.procedure_products pp
    JOIN public.products p ON p.id = pp.product_id
    WHERE pp.procedure_id = v_procedure_id
      AND p.is_active = true
  LOOP
    v_unit_cost := COALESCE(v_proc_product.cost_price, 0);
    
    SELECT stock_quantity INTO v_previous_qty
    FROM public.products
    WHERE id = v_proc_product.product_id
    FOR UPDATE;

    v_previous_qty := COALESCE(v_previous_qty, 0);
    v_new_qty := v_previous_qty - COALESCE(v_proc_product.quantity, 0);

    INSERT INTO public.stock_movements (
      clinic_id, product_id, movement_type, quantity, previous_quantity, new_quantity,
      unit_cost, total_cost, reason, reference_type, reference_id, notes, created_by, created_at
    ) VALUES (
      v_clinic_id, v_proc_product.product_id, 'saida', v_proc_product.quantity, v_previous_qty, v_new_qty,
      v_unit_cost, COALESCE(v_proc_product.quantity, 0) * v_unit_cost, 'PROCEDURE_USE', 'procedure_execution',
      p_appointment_id::TEXT, 'Consumo automático - Produto: ' || COALESCE(v_proc_product.product_name, 'N/A'),
      v_user_id, v_now
    );

    INSERT INTO public.material_consumption (
      clinic_id, appointment_id, procedure_id, material_id, professional_id, patient_id,
      quantity, unit, unit_cost, total_cost, consumption_type, source, consumed_at, created_by
    ) VALUES (
      v_clinic_id, p_appointment_id, v_procedure_id, v_proc_product.product_id, v_professional_id, v_patient_id,
      v_proc_product.quantity, COALESCE(v_proc_product.unit, 'un'), v_unit_cost,
      COALESCE(v_proc_product.quantity, 0) * v_unit_cost, 'automatic', 'procedure', v_now, v_user_id
    );

    UPDATE public.products
    SET stock_quantity = v_new_qty, updated_at = v_now
    WHERE id = v_proc_product.product_id;

    v_processed_count := v_processed_count + 1;
    v_total_cost := v_total_cost + (COALESCE(v_proc_product.quantity, 0) * v_unit_cost);

    IF v_new_qty <= 0 OR v_new_qty < COALESCE(v_proc_product.min_stock_quantity, 0) THEN
      v_alerts_count := v_alerts_count + 1;
    END IF;
  END LOOP;

  -- =============================================
  -- PROCESS KITS LINKED TO PROCEDURE
  -- =============================================
  FOR v_proc_kit IN 
    SELECT ppk.kit_id, ppk.quantity
    FROM public.procedure_product_kits ppk
    JOIN public.product_kits pk ON pk.id = ppk.kit_id
    WHERE ppk.procedure_id = v_procedure_id
      AND pk.is_active = true
  LOOP
    v_kit_result := public.process_product_kit_consumption(
      p_appointment_id, 
      v_proc_kit.kit_id, 
      v_proc_kit.quantity
    );
    
    IF (v_kit_result->>'success')::boolean THEN
      v_processed_count := v_processed_count + COALESCE((v_kit_result->>'processed_count')::int, 0);
      v_total_cost := v_total_cost + COALESCE((v_kit_result->>'total_cost')::numeric, 0);
    END IF;
  END LOOP;

  -- Store the historical cost on the appointment
  UPDATE public.appointments
  SET procedure_cost = v_total_cost
  WHERE id = p_appointment_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Consumo de produtos e kits processado com sucesso',
    'processed_count', v_processed_count,
    'total_cost', v_total_cost,
    'alerts_count', v_alerts_count,
    'appointment_id', p_appointment_id
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$function$;