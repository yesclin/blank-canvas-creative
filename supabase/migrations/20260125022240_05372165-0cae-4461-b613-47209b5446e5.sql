-- =============================================
-- CADASTROS CLÍNICOS - MIGRAÇÃO COMPLETA
-- =============================================

-- 1. EXPANDIR TABELA DE MATERIAIS
-- Adicionar categoria e custo unitário
ALTER TABLE public.materials 
ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'descartavel',
ADD COLUMN IF NOT EXISTS unit_cost NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS description TEXT;

-- Criar índice para categoria
CREATE INDEX IF NOT EXISTS idx_materials_category ON public.materials(category);
CREATE INDEX IF NOT EXISTS idx_materials_clinic_active ON public.materials(clinic_id, is_active);

-- 2. EXPANDIR TABELA DE VÍNCULO PROCEDIMENTO-MATERIAL
-- Adicionar campo de unidade e regras de uso
ALTER TABLE public.procedure_materials
ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS unit TEXT NOT NULL DEFAULT 'unidade',
ADD COLUMN IF NOT EXISTS is_required BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS allow_manual_edit BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Atualizar clinic_id baseado no procedimento (para registros existentes)
UPDATE public.procedure_materials pm
SET clinic_id = p.clinic_id
FROM public.procedures p
WHERE pm.procedure_id = p.id AND pm.clinic_id IS NULL;

-- Tornar clinic_id NOT NULL após preenchimento
ALTER TABLE public.procedure_materials ALTER COLUMN clinic_id SET NOT NULL;

-- Criar índice para clinic_id
CREATE INDEX IF NOT EXISTS idx_procedure_materials_clinic ON public.procedure_materials(clinic_id);

-- 3. CRIAR TABELA DE KITS DE MATERIAIS
CREATE TABLE IF NOT EXISTS public.material_kits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para kits
CREATE INDEX IF NOT EXISTS idx_material_kits_clinic ON public.material_kits(clinic_id);
CREATE INDEX IF NOT EXISTS idx_material_kits_active ON public.material_kits(clinic_id, is_active);

-- 4. CRIAR TABELA DE ITENS DO KIT
CREATE TABLE IF NOT EXISTS public.material_kit_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kit_id UUID NOT NULL REFERENCES public.material_kits(id) ON DELETE CASCADE,
    material_id UUID NOT NULL REFERENCES public.materials(id) ON DELETE CASCADE,
    quantity NUMERIC(10,2) NOT NULL DEFAULT 1,
    unit TEXT NOT NULL DEFAULT 'unidade',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (kit_id, material_id)
);

-- Índices para itens do kit
CREATE INDEX IF NOT EXISTS idx_material_kit_items_kit ON public.material_kit_items(kit_id);
CREATE INDEX IF NOT EXISTS idx_material_kit_items_material ON public.material_kit_items(material_id);

-- 5. CRIAR TABELA DE VÍNCULO PROCEDIMENTO-KIT
CREATE TABLE IF NOT EXISTS public.procedure_kits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    procedure_id UUID NOT NULL REFERENCES public.procedures(id) ON DELETE CASCADE,
    kit_id UUID NOT NULL REFERENCES public.material_kits(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    is_required BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (procedure_id, kit_id)
);

-- Índices para vínculo procedimento-kit
CREATE INDEX IF NOT EXISTS idx_procedure_kits_clinic ON public.procedure_kits(clinic_id);
CREATE INDEX IF NOT EXISTS idx_procedure_kits_procedure ON public.procedure_kits(procedure_id);

-- 6. HABILITAR RLS EM TODAS AS NOVAS TABELAS
ALTER TABLE public.material_kits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_kit_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.procedure_kits ENABLE ROW LEVEL SECURITY;

-- 7. POLÍTICAS RLS PARA MATERIAL_KITS
CREATE POLICY "Users can view material kits from their clinic"
ON public.material_kits FOR SELECT
USING (clinic_id = user_clinic_id(auth.uid()));

CREATE POLICY "Admins can insert material kits"
ON public.material_kits FOR INSERT
WITH CHECK (is_clinic_admin(auth.uid(), clinic_id));

CREATE POLICY "Admins can update material kits"
ON public.material_kits FOR UPDATE
USING (is_clinic_admin(auth.uid(), clinic_id));

CREATE POLICY "Admins can delete material kits"
ON public.material_kits FOR DELETE
USING (is_clinic_admin(auth.uid(), clinic_id));

-- 8. POLÍTICAS RLS PARA MATERIAL_KIT_ITEMS
CREATE POLICY "Users can view kit items from their clinic"
ON public.material_kit_items FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.material_kits mk
        WHERE mk.id = kit_id AND mk.clinic_id = user_clinic_id(auth.uid())
    )
);

CREATE POLICY "Admins can manage kit items"
ON public.material_kit_items FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.material_kits mk
        WHERE mk.id = kit_id AND is_clinic_admin(auth.uid(), mk.clinic_id)
    )
);

-- 9. POLÍTICAS RLS PARA PROCEDURE_KITS
CREATE POLICY "Users can view procedure kits from their clinic"
ON public.procedure_kits FOR SELECT
USING (clinic_id = user_clinic_id(auth.uid()));

CREATE POLICY "Admins can insert procedure kits"
ON public.procedure_kits FOR INSERT
WITH CHECK (is_clinic_admin(auth.uid(), clinic_id));

CREATE POLICY "Admins can update procedure kits"
ON public.procedure_kits FOR UPDATE
USING (is_clinic_admin(auth.uid(), clinic_id));

CREATE POLICY "Admins can delete procedure kits"
ON public.procedure_kits FOR DELETE
USING (is_clinic_admin(auth.uid(), clinic_id));

-- 10. POLÍTICAS RLS PARA PROCEDURE_MATERIALS (atualizar para incluir clinic_id)
DROP POLICY IF EXISTS "Users can view procedure materials from their clinic" ON public.procedure_materials;
DROP POLICY IF EXISTS "Admins can manage procedure materials" ON public.procedure_materials;

CREATE POLICY "Users can view procedure materials from their clinic"
ON public.procedure_materials FOR SELECT
USING (clinic_id = user_clinic_id(auth.uid()));

CREATE POLICY "Admins can insert procedure materials"
ON public.procedure_materials FOR INSERT
WITH CHECK (is_clinic_admin(auth.uid(), clinic_id));

CREATE POLICY "Admins can update procedure materials"
ON public.procedure_materials FOR UPDATE
USING (is_clinic_admin(auth.uid(), clinic_id));

CREATE POLICY "Admins can delete procedure materials"
ON public.procedure_materials FOR DELETE
USING (is_clinic_admin(auth.uid(), clinic_id));

-- 11. FUNÇÃO PARA CALCULAR CUSTO ESTIMADO DO PROCEDIMENTO
CREATE OR REPLACE FUNCTION public.calculate_procedure_cost(p_procedure_id UUID)
RETURNS NUMERIC AS $$
DECLARE
    total_cost NUMERIC := 0;
    material_cost NUMERIC := 0;
    kit_cost NUMERIC := 0;
BEGIN
    -- Custo dos materiais diretos
    SELECT COALESCE(SUM(pm.quantity * COALESCE(m.unit_cost, 0)), 0)
    INTO material_cost
    FROM public.procedure_materials pm
    JOIN public.materials m ON m.id = pm.material_id
    WHERE pm.procedure_id = p_procedure_id;
    
    -- Custo dos kits
    SELECT COALESCE(SUM(
        pk.quantity * (
            SELECT COALESCE(SUM(mki.quantity * COALESCE(m.unit_cost, 0)), 0)
            FROM public.material_kit_items mki
            JOIN public.materials m ON m.id = mki.material_id
            WHERE mki.kit_id = pk.kit_id
        )
    ), 0)
    INTO kit_cost
    FROM public.procedure_kits pk
    WHERE pk.procedure_id = p_procedure_id;
    
    total_cost := material_cost + kit_cost;
    
    RETURN total_cost;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 12. TRIGGER PARA ATUALIZAR updated_at
CREATE OR REPLACE FUNCTION public.update_material_kits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_material_kits_updated_at ON public.material_kits;
CREATE TRIGGER update_material_kits_updated_at
    BEFORE UPDATE ON public.material_kits
    FOR EACH ROW
    EXECUTE FUNCTION public.update_material_kits_updated_at();