-- =============================================
-- MÓDULO CONVÊNIOS AVANÇADO - TISS, GUIAS E REPASSES
-- =============================================

-- 1. Vínculo de Paciente com Convênio (carteirinha)
CREATE TABLE IF NOT EXISTS public.patient_insurances (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    insurance_id UUID NOT NULL REFERENCES public.insurances(id) ON DELETE CASCADE,
    card_number TEXT NOT NULL,
    valid_until DATE,
    holder_type TEXT NOT NULL DEFAULT 'titular' CHECK (holder_type IN ('titular', 'dependente')),
    holder_name TEXT,
    holder_cpf TEXT,
    is_primary BOOLEAN NOT NULL DEFAULT true,
    is_active BOOLEAN NOT NULL DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Regras de Repasse por Convênio/Procedimento
CREATE TABLE IF NOT EXISTS public.insurance_fee_rules (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    insurance_id UUID NOT NULL REFERENCES public.insurances(id) ON DELETE CASCADE,
    procedure_id UUID REFERENCES public.procedures(id) ON DELETE CASCADE,
    professional_id UUID REFERENCES public.professionals(id) ON DELETE SET NULL,
    fee_type TEXT NOT NULL DEFAULT 'percentage' CHECK (fee_type IN ('percentage', 'fixed')),
    fee_value NUMERIC(10,2) NOT NULL,
    payment_deadline_days INTEGER DEFAULT 30,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Tipos de Guia TISS
CREATE TYPE public.tiss_guide_type AS ENUM (
    'consulta',
    'sp_sadt',
    'internacao',
    'honorarios',
    'outras_despesas'
);

CREATE TYPE public.tiss_guide_status AS ENUM (
    'rascunho',
    'aberta',
    'enviada',
    'aprovada',
    'aprovada_parcial',
    'negada',
    'cancelada'
);

-- 4. Guias TISS
CREATE TABLE IF NOT EXISTS public.tiss_guides (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE RESTRICT,
    insurance_id UUID NOT NULL REFERENCES public.insurances(id) ON DELETE RESTRICT,
    professional_id UUID REFERENCES public.professionals(id) ON DELETE SET NULL,
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
    patient_insurance_id UUID REFERENCES public.patient_insurances(id) ON DELETE SET NULL,
    
    -- Identificação da Guia
    guide_type public.tiss_guide_type NOT NULL DEFAULT 'consulta',
    guide_number TEXT NOT NULL,
    main_authorization_number TEXT,
    
    -- Datas
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    service_date DATE NOT NULL DEFAULT CURRENT_DATE,
    valid_until DATE,
    
    -- Status e Workflow
    status public.tiss_guide_status NOT NULL DEFAULT 'rascunho',
    
    -- Valores
    total_requested NUMERIC(10,2) DEFAULT 0,
    total_approved NUMERIC(10,2) DEFAULT 0,
    total_glosa NUMERIC(10,2) DEFAULT 0,
    
    -- Informações do Beneficiário (snapshot)
    beneficiary_card_number TEXT,
    beneficiary_name TEXT,
    beneficiary_card_validity DATE,
    
    -- Informações do Contratado/Prestador
    contractor_code TEXT,
    contractor_name TEXT,
    cnes_code TEXT,
    
    -- Dados para XML TISS (estrutura preparada)
    tiss_version TEXT DEFAULT '4.00.00',
    xml_data JSONB DEFAULT '{}',
    
    -- Observações
    notes TEXT,
    rejection_reason TEXT,
    
    -- Auditoria
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    submitted_at TIMESTAMP WITH TIME ZONE,
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. Itens/Procedimentos da Guia TISS
CREATE TABLE IF NOT EXISTS public.tiss_guide_items (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    guide_id UUID NOT NULL REFERENCES public.tiss_guides(id) ON DELETE CASCADE,
    procedure_id UUID REFERENCES public.procedures(id) ON DELETE SET NULL,
    
    -- Código do Procedimento (TUSS/CBHPM)
    procedure_code TEXT,
    procedure_description TEXT NOT NULL,
    
    -- Quantidades e Valores
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_value NUMERIC(10,2) NOT NULL DEFAULT 0,
    total_value NUMERIC(10,2) NOT NULL DEFAULT 0,
    
    -- Aprovação
    approved_quantity INTEGER,
    approved_value NUMERIC(10,2),
    glosa_value NUMERIC(10,2) DEFAULT 0,
    glosa_code TEXT,
    glosa_reason TEXT,
    
    -- Informações Adicionais
    execution_date DATE,
    start_time TIME,
    end_time TIME,
    pathway TEXT,
    technique TEXT,
    
    -- Ordem
    item_order INTEGER NOT NULL DEFAULT 1,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6. Histórico de Alterações das Guias (Audit Log)
CREATE TABLE IF NOT EXISTS public.tiss_guide_history (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    guide_id UUID NOT NULL REFERENCES public.tiss_guides(id) ON DELETE CASCADE,
    
    action TEXT NOT NULL,
    previous_status TEXT,
    new_status TEXT,
    changes JSONB DEFAULT '{}',
    notes TEXT,
    
    performed_by UUID REFERENCES auth.users(id),
    performed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 7. Cálculo de Repasses (gerado a partir das guias aprovadas)
CREATE TYPE public.fee_calculation_status AS ENUM (
    'pendente',
    'calculado',
    'pago',
    'cancelado'
);

CREATE TABLE IF NOT EXISTS public.insurance_fee_calculations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    guide_id UUID REFERENCES public.tiss_guides(id) ON DELETE SET NULL,
    insurance_id UUID NOT NULL REFERENCES public.insurances(id) ON DELETE RESTRICT,
    professional_id UUID REFERENCES public.professionals(id) ON DELETE SET NULL,
    patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
    
    -- Valores
    gross_value NUMERIC(10,2) NOT NULL DEFAULT 0,
    professional_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
    clinic_net_value NUMERIC(10,2) NOT NULL DEFAULT 0,
    
    -- Detalhes do cálculo
    fee_type TEXT NOT NULL DEFAULT 'percentage',
    fee_percentage NUMERIC(5,2),
    fee_fixed_value NUMERIC(10,2),
    
    -- Status e Datas
    status public.fee_calculation_status NOT NULL DEFAULT 'pendente',
    service_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_due_date DATE,
    payment_date DATE,
    
    -- Referências
    reference_period TEXT,
    notes TEXT,
    
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 8. Adicionar campos extras na tabela insurances (se não existirem)
DO $$ BEGIN
    ALTER TABLE public.insurances 
    ADD COLUMN IF NOT EXISTS tiss_code TEXT,
    ADD COLUMN IF NOT EXISTS allowed_guide_types TEXT[] DEFAULT ARRAY['consulta', 'sp_sadt'],
    ADD COLUMN IF NOT EXISTS default_fee_type TEXT DEFAULT 'percentage',
    ADD COLUMN IF NOT EXISTS default_fee_value NUMERIC(10,2),
    ADD COLUMN IF NOT EXISTS default_payment_deadline_days INTEGER DEFAULT 30;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- =============================================
-- ÍNDICES PARA PERFORMANCE
-- =============================================

CREATE INDEX IF NOT EXISTS idx_patient_insurances_patient ON public.patient_insurances(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_insurances_insurance ON public.patient_insurances(insurance_id);
CREATE INDEX IF NOT EXISTS idx_patient_insurances_clinic ON public.patient_insurances(clinic_id);

CREATE INDEX IF NOT EXISTS idx_tiss_guides_clinic ON public.tiss_guides(clinic_id);
CREATE INDEX IF NOT EXISTS idx_tiss_guides_patient ON public.tiss_guides(patient_id);
CREATE INDEX IF NOT EXISTS idx_tiss_guides_insurance ON public.tiss_guides(insurance_id);
CREATE INDEX IF NOT EXISTS idx_tiss_guides_status ON public.tiss_guides(status);
CREATE INDEX IF NOT EXISTS idx_tiss_guides_guide_number ON public.tiss_guides(guide_number);

CREATE INDEX IF NOT EXISTS idx_tiss_guide_items_guide ON public.tiss_guide_items(guide_id);
CREATE INDEX IF NOT EXISTS idx_tiss_guide_history_guide ON public.tiss_guide_history(guide_id);

CREATE INDEX IF NOT EXISTS idx_fee_calculations_clinic ON public.insurance_fee_calculations(clinic_id);
CREATE INDEX IF NOT EXISTS idx_fee_calculations_professional ON public.insurance_fee_calculations(professional_id);
CREATE INDEX IF NOT EXISTS idx_fee_calculations_insurance ON public.insurance_fee_calculations(insurance_id);
CREATE INDEX IF NOT EXISTS idx_fee_calculations_status ON public.insurance_fee_calculations(status);

-- =============================================
-- RLS POLICIES
-- =============================================

-- Patient Insurances
ALTER TABLE public.patient_insurances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view patient insurances from their clinic"
ON public.patient_insurances FOR SELECT
USING (clinic_id = user_clinic_id(auth.uid()));

CREATE POLICY "Users can insert patient insurances in their clinic"
ON public.patient_insurances FOR INSERT
WITH CHECK (clinic_id = user_clinic_id(auth.uid()));

CREATE POLICY "Users can update patient insurances in their clinic"
ON public.patient_insurances FOR UPDATE
USING (clinic_id = user_clinic_id(auth.uid()));

CREATE POLICY "Users can delete patient insurances in their clinic"
ON public.patient_insurances FOR DELETE
USING (clinic_id = user_clinic_id(auth.uid()));

-- Insurance Fee Rules
ALTER TABLE public.insurance_fee_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view fee rules from their clinic"
ON public.insurance_fee_rules FOR SELECT
USING (clinic_id = user_clinic_id(auth.uid()));

CREATE POLICY "Admins can manage fee rules"
ON public.insurance_fee_rules FOR ALL
USING (is_clinic_admin(auth.uid(), clinic_id));

-- TISS Guides
ALTER TABLE public.tiss_guides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view guides from their clinic"
ON public.tiss_guides FOR SELECT
USING (clinic_id = user_clinic_id(auth.uid()));

CREATE POLICY "Users can insert guides in their clinic"
ON public.tiss_guides FOR INSERT
WITH CHECK (clinic_id = user_clinic_id(auth.uid()));

CREATE POLICY "Users can update guides in their clinic"
ON public.tiss_guides FOR UPDATE
USING (clinic_id = user_clinic_id(auth.uid()));

-- Guias NÃO podem ser deletadas (somente canceladas)
-- Não criar policy de DELETE

-- TISS Guide Items
ALTER TABLE public.tiss_guide_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view guide items from their clinic"
ON public.tiss_guide_items FOR SELECT
USING (clinic_id = user_clinic_id(auth.uid()));

CREATE POLICY "Users can insert guide items in their clinic"
ON public.tiss_guide_items FOR INSERT
WITH CHECK (clinic_id = user_clinic_id(auth.uid()));

CREATE POLICY "Users can update guide items in their clinic"
ON public.tiss_guide_items FOR UPDATE
USING (clinic_id = user_clinic_id(auth.uid()));

-- TISS Guide History (Audit Log)
ALTER TABLE public.tiss_guide_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view guide history from their clinic"
ON public.tiss_guide_history FOR SELECT
USING (clinic_id = user_clinic_id(auth.uid()));

CREATE POLICY "System can insert guide history"
ON public.tiss_guide_history FOR INSERT
WITH CHECK (clinic_id = user_clinic_id(auth.uid()));

-- Fee Calculations
ALTER TABLE public.insurance_fee_calculations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view fee calculations from their clinic"
ON public.insurance_fee_calculations FOR SELECT
USING (clinic_id = user_clinic_id(auth.uid()));

CREATE POLICY "Admins can manage fee calculations"
ON public.insurance_fee_calculations FOR ALL
USING (is_clinic_admin(auth.uid(), clinic_id));

-- =============================================
-- TRIGGERS PARA AUDITORIA
-- =============================================

-- Trigger para registrar histórico de guias
CREATE OR REPLACE FUNCTION public.log_tiss_guide_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        INSERT INTO public.tiss_guide_history (
            clinic_id,
            guide_id,
            action,
            previous_status,
            new_status,
            changes,
            performed_by
        ) VALUES (
            NEW.clinic_id,
            NEW.id,
            'update',
            OLD.status::TEXT,
            NEW.status::TEXT,
            jsonb_build_object(
                'old', row_to_json(OLD),
                'new', row_to_json(NEW)
            ),
            NEW.updated_by
        );
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO public.tiss_guide_history (
            clinic_id,
            guide_id,
            action,
            new_status,
            performed_by
        ) VALUES (
            NEW.clinic_id,
            NEW.id,
            'create',
            NEW.status::TEXT,
            NEW.created_by
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER tiss_guide_audit_trigger
AFTER INSERT OR UPDATE ON public.tiss_guides
FOR EACH ROW EXECUTE FUNCTION public.log_tiss_guide_changes();

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_convenios_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_patient_insurances_updated_at
BEFORE UPDATE ON public.patient_insurances
FOR EACH ROW EXECUTE FUNCTION public.update_convenios_updated_at();

CREATE TRIGGER update_insurance_fee_rules_updated_at
BEFORE UPDATE ON public.insurance_fee_rules
FOR EACH ROW EXECUTE FUNCTION public.update_convenios_updated_at();

CREATE TRIGGER update_tiss_guides_updated_at
BEFORE UPDATE ON public.tiss_guides
FOR EACH ROW EXECUTE FUNCTION public.update_convenios_updated_at();

CREATE TRIGGER update_tiss_guide_items_updated_at
BEFORE UPDATE ON public.tiss_guide_items
FOR EACH ROW EXECUTE FUNCTION public.update_convenios_updated_at();

CREATE TRIGGER update_fee_calculations_updated_at
BEFORE UPDATE ON public.insurance_fee_calculations
FOR EACH ROW EXECUTE FUNCTION public.update_convenios_updated_at();