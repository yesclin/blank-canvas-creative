-- =============================================
-- 1. TABELA DE CONSUMO DE MATERIAIS
-- =============================================
CREATE TABLE IF NOT EXISTS public.material_consumption (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
    procedure_id UUID REFERENCES public.procedures(id) ON DELETE SET NULL,
    material_id UUID NOT NULL REFERENCES public.materials(id) ON DELETE CASCADE,
    kit_id UUID REFERENCES public.material_kits(id) ON DELETE SET NULL,
    professional_id UUID REFERENCES public.professionals(id) ON DELETE SET NULL,
    patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
    quantity NUMERIC(10,2) NOT NULL DEFAULT 1,
    unit VARCHAR(50) NOT NULL DEFAULT 'unidade',
    unit_cost NUMERIC(10,2) DEFAULT 0,
    total_cost NUMERIC(10,2) GENERATED ALWAYS AS (quantity * unit_cost) STORED,
    consumption_type VARCHAR(20) NOT NULL DEFAULT 'automatic' CHECK (consumption_type IN ('automatic', 'manual', 'adjustment')),
    source VARCHAR(20) NOT NULL DEFAULT 'procedure' CHECK (source IN ('procedure', 'kit', 'extra')),
    notes TEXT,
    consumed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_material_consumption_clinic ON public.material_consumption(clinic_id);
CREATE INDEX IF NOT EXISTS idx_material_consumption_appointment ON public.material_consumption(appointment_id);
CREATE INDEX IF NOT EXISTS idx_material_consumption_material ON public.material_consumption(material_id);
CREATE INDEX IF NOT EXISTS idx_material_consumption_date ON public.material_consumption(consumed_at);
CREATE INDEX IF NOT EXISTS idx_material_consumption_procedure ON public.material_consumption(procedure_id);
CREATE INDEX IF NOT EXISTS idx_material_consumption_professional ON public.material_consumption(professional_id);

-- =============================================
-- 2. CONFIGURAÇÃO DE BAIXA AUTOMÁTICA
-- =============================================
ALTER TABLE public.clinics 
ADD COLUMN IF NOT EXISTS auto_material_consumption BOOLEAN DEFAULT false;

-- =============================================
-- 3. TABELA DE ALERTAS DE ESTOQUE
-- =============================================
CREATE TABLE IF NOT EXISTS public.stock_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    material_id UUID NOT NULL REFERENCES public.materials(id) ON DELETE CASCADE,
    alert_type VARCHAR(30) NOT NULL CHECK (alert_type IN ('low_stock', 'out_of_stock', 'insufficient')),
    current_quantity NUMERIC(10,2) DEFAULT 0,
    min_quantity NUMERIC(10,2) DEFAULT 0,
    required_quantity NUMERIC(10,2),
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
    is_resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stock_alerts_clinic ON public.stock_alerts(clinic_id);
CREATE INDEX IF NOT EXISTS idx_stock_alerts_material ON public.stock_alerts(material_id);
CREATE INDEX IF NOT EXISTS idx_stock_alerts_unresolved ON public.stock_alerts(clinic_id, is_resolved) WHERE is_resolved = false;

-- =============================================
-- 4. ADICIONAR CAMPO DE QUANTIDADE ATUAL NO MATERIAL
-- =============================================
ALTER TABLE public.materials 
ADD COLUMN IF NOT EXISTS current_stock NUMERIC(10,2) DEFAULT 0;

-- =============================================
-- 5. RLS POLICIES
-- =============================================

-- Material Consumption
ALTER TABLE public.material_consumption ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view material consumption from their clinic"
ON public.material_consumption
FOR SELECT
TO authenticated
USING (clinic_id = public.user_clinic_id(auth.uid()));

CREATE POLICY "Admins can insert material consumption"
ON public.material_consumption
FOR INSERT
TO authenticated
WITH CHECK (
    clinic_id = public.user_clinic_id(auth.uid())
);

CREATE POLICY "Admins can update material consumption"
ON public.material_consumption
FOR UPDATE
TO authenticated
USING (
    clinic_id = public.user_clinic_id(auth.uid()) 
    AND public.is_clinic_admin(auth.uid(), clinic_id)
);

CREATE POLICY "Admins can delete material consumption"
ON public.material_consumption
FOR DELETE
TO authenticated
USING (
    clinic_id = public.user_clinic_id(auth.uid()) 
    AND public.is_clinic_admin(auth.uid(), clinic_id)
);

-- Stock Alerts
ALTER TABLE public.stock_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view stock alerts from their clinic"
ON public.stock_alerts
FOR SELECT
TO authenticated
USING (clinic_id = public.user_clinic_id(auth.uid()));

CREATE POLICY "System can insert stock alerts"
ON public.stock_alerts
FOR INSERT
TO authenticated
WITH CHECK (clinic_id = public.user_clinic_id(auth.uid()));

CREATE POLICY "Admins can update stock alerts"
ON public.stock_alerts
FOR UPDATE
TO authenticated
USING (
    clinic_id = public.user_clinic_id(auth.uid()) 
    AND public.is_clinic_admin(auth.uid(), clinic_id)
);

-- =============================================
-- 6. FUNÇÃO PARA PROCESSAR CONSUMO DE MATERIAIS
-- =============================================
CREATE OR REPLACE FUNCTION public.process_material_consumption(
    p_appointment_id UUID,
    p_materials JSONB DEFAULT '[]'::JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_clinic_id UUID;
    v_procedure_id UUID;
    v_professional_id UUID;
    v_patient_id UUID;
    v_user_id UUID;
    v_auto_consumption BOOLEAN;
    v_material JSONB;
    v_consumed_count INT := 0;
    v_alerts_count INT := 0;
    v_total_cost NUMERIC := 0;
BEGIN
    -- Get appointment details
    SELECT 
        a.clinic_id, 
        a.procedure_id, 
        a.professional_id,
        a.patient_id
    INTO v_clinic_id, v_procedure_id, v_professional_id, v_patient_id
    FROM public.appointments a
    WHERE a.id = p_appointment_id;
    
    IF v_clinic_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Atendimento não encontrado');
    END IF;
    
    -- Get current user
    v_user_id := auth.uid();
    
    -- Check if auto consumption is enabled
    SELECT auto_material_consumption INTO v_auto_consumption
    FROM public.clinics
    WHERE id = v_clinic_id;
    
    IF NOT COALESCE(v_auto_consumption, false) THEN
        RETURN jsonb_build_object(
            'success', true, 
            'message', 'Baixa automática desativada',
            'consumed_count', 0,
            'total_cost', 0
        );
    END IF;
    
    -- Process each material from the JSON array
    FOR v_material IN SELECT * FROM jsonb_array_elements(p_materials)
    LOOP
        -- Insert consumption record
        INSERT INTO public.material_consumption (
            clinic_id,
            appointment_id,
            procedure_id,
            material_id,
            kit_id,
            professional_id,
            patient_id,
            quantity,
            unit,
            unit_cost,
            consumption_type,
            source,
            created_by
        )
        SELECT
            v_clinic_id,
            p_appointment_id,
            v_procedure_id,
            (v_material->>'material_id')::UUID,
            NULLIF(v_material->>'kit_id', '')::UUID,
            v_professional_id,
            v_patient_id,
            (v_material->>'quantity')::NUMERIC,
            COALESCE(v_material->>'unit', 'unidade'),
            COALESCE((v_material->>'unit_cost')::NUMERIC, 0),
            COALESCE(v_material->>'consumption_type', 'automatic'),
            COALESCE(v_material->>'source', 'procedure'),
            v_user_id;
            
        v_consumed_count := v_consumed_count + 1;
        v_total_cost := v_total_cost + (COALESCE((v_material->>'quantity')::NUMERIC, 0) * COALESCE((v_material->>'unit_cost')::NUMERIC, 0));
        
        -- Update material stock (decrease)
        UPDATE public.materials
        SET current_stock = current_stock - (v_material->>'quantity')::NUMERIC
        WHERE id = (v_material->>'material_id')::UUID
        AND is_active = true;
        
        -- Check for low stock and create alert if needed
        INSERT INTO public.stock_alerts (
            clinic_id,
            material_id,
            alert_type,
            current_quantity,
            min_quantity,
            required_quantity,
            appointment_id
        )
        SELECT
            v_clinic_id,
            m.id,
            CASE 
                WHEN m.current_stock - (v_material->>'quantity')::NUMERIC <= 0 THEN 'out_of_stock'
                WHEN m.current_stock - (v_material->>'quantity')::NUMERIC < m.min_quantity THEN 'low_stock'
                ELSE NULL
            END,
            m.current_stock - (v_material->>'quantity')::NUMERIC,
            m.min_quantity,
            (v_material->>'quantity')::NUMERIC,
            p_appointment_id
        FROM public.materials m
        WHERE m.id = (v_material->>'material_id')::UUID
        AND (
            m.current_stock - (v_material->>'quantity')::NUMERIC <= 0 
            OR m.current_stock - (v_material->>'quantity')::NUMERIC < m.min_quantity
        );
        
        IF FOUND THEN
            v_alerts_count := v_alerts_count + 1;
        END IF;
    END LOOP;
    
    RETURN jsonb_build_object(
        'success', true,
        'consumed_count', v_consumed_count,
        'alerts_count', v_alerts_count,
        'total_cost', v_total_cost
    );
END;
$$;