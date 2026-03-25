-- =============================================
-- INSURANCES: Add missing columns
-- =============================================
ALTER TABLE public.insurances
  ADD COLUMN IF NOT EXISTS code text,
  ADD COLUMN IF NOT EXISTS tiss_code text,
  ADD COLUMN IF NOT EXISTS requires_authorization boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS return_allowed boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS return_days integer NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS allowed_guide_types text[] DEFAULT ARRAY['consulta','sadt'],
  ADD COLUMN IF NOT EXISTS default_fee_type text DEFAULT 'percentage',
  ADD COLUMN IF NOT EXISTS default_fee_value numeric DEFAULT 50,
  ADD COLUMN IF NOT EXISTS default_payment_deadline_days integer DEFAULT 30,
  ADD COLUMN IF NOT EXISTS notes text;

-- =============================================
-- PATIENT_INSURANCES: Add missing columns
-- =============================================
ALTER TABLE public.patient_insurances
  ADD COLUMN IF NOT EXISTS holder_type text DEFAULT 'titular',
  ADD COLUMN IF NOT EXISTS holder_name text,
  ADD COLUMN IF NOT EXISTS holder_cpf text,
  ADD COLUMN IF NOT EXISTS is_primary boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notes text;

-- =============================================
-- TISS_GUIDES: Add missing columns for full TISS support
-- =============================================
ALTER TABLE public.tiss_guides
  ADD COLUMN IF NOT EXISTS issue_date date DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS service_date date,
  ADD COLUMN IF NOT EXISTS total_requested numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_approved numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_glosa numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS beneficiary_card_number text,
  ADD COLUMN IF NOT EXISTS beneficiary_name text,
  ADD COLUMN IF NOT EXISTS tiss_version text DEFAULT '4.00.00',
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS patient_insurance_id uuid REFERENCES public.patient_insurances(id);

-- =============================================
-- TISS_GUIDE_ITEMS: Add missing columns
-- =============================================
ALTER TABLE public.tiss_guide_items
  ADD COLUMN IF NOT EXISTS procedure_code text,
  ADD COLUMN IF NOT EXISTS approved_quantity integer,
  ADD COLUMN IF NOT EXISTS approved_value numeric,
  ADD COLUMN IF NOT EXISTS glosa_value numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS glosa_code text,
  ADD COLUMN IF NOT EXISTS glosa_reason text,
  ADD COLUMN IF NOT EXISTS execution_date date,
  ADD COLUMN IF NOT EXISTS item_order integer DEFAULT 1;

-- =============================================
-- INSURANCE_FEE_RULES: Add clinic_id and flat columns
-- =============================================
ALTER TABLE public.insurance_fee_rules
  ADD COLUMN IF NOT EXISTS clinic_id uuid REFERENCES public.clinics(id),
  ADD COLUMN IF NOT EXISTS fee_type text DEFAULT 'percentage',
  ADD COLUMN IF NOT EXISTS fee_value numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_deadline_days integer DEFAULT 30,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS professional_id uuid REFERENCES public.professionals(id),
  ADD COLUMN IF NOT EXISTS procedure_id uuid REFERENCES public.procedures(id);

-- Backfill clinic_id from insurance for fee_rules
UPDATE public.insurance_fee_rules fr
SET clinic_id = i.clinic_id
FROM public.insurances i
WHERE fr.insurance_id = i.id AND fr.clinic_id IS NULL;

-- =============================================
-- INSURANCE_FEE_CALCULATIONS: Add missing columns
-- =============================================
ALTER TABLE public.insurance_fee_calculations
  ADD COLUMN IF NOT EXISTS guide_id uuid REFERENCES public.tiss_guides(id),
  ADD COLUMN IF NOT EXISTS clinic_net_value numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fee_type text,
  ADD COLUMN IF NOT EXISTS fee_percentage numeric,
  ADD COLUMN IF NOT EXISTS fee_fixed_value numeric,
  ADD COLUMN IF NOT EXISTS payment_due_date date,
  ADD COLUMN IF NOT EXISTS reference_period text,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- =============================================
-- RLS policies
-- =============================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'insurance_fee_rules' AND policyname = 'Users can insert fee rules'
  ) THEN
    CREATE POLICY "Users can insert fee rules"
      ON public.insurance_fee_rules FOR INSERT TO authenticated
      WITH CHECK (clinic_id = user_clinic_id(auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'insurance_fee_rules' AND policyname = 'Users can update fee rules'
  ) THEN
    CREATE POLICY "Users can update fee rules"
      ON public.insurance_fee_rules FOR UPDATE TO authenticated
      USING (clinic_id = user_clinic_id(auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'insurance_fee_calculations' AND policyname = 'Users can update fee calcs'
  ) THEN
    CREATE POLICY "Users can update fee calcs"
      ON public.insurance_fee_calculations FOR UPDATE TO authenticated
      USING (clinic_id = user_clinic_id(auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'insurance_procedures' AND policyname = 'Users can insert ins procedures'
  ) THEN
    CREATE POLICY "Users can insert ins procedures"
      ON public.insurance_procedures FOR INSERT TO authenticated
      WITH CHECK (EXISTS (
        SELECT 1 FROM insurances i
        WHERE i.id = insurance_procedures.insurance_id
        AND i.clinic_id = user_clinic_id(auth.uid())
      ));
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tiss_guides_clinic_id ON public.tiss_guides(clinic_id);
CREATE INDEX IF NOT EXISTS idx_tiss_guides_insurance_id ON public.tiss_guides(insurance_id);
CREATE INDEX IF NOT EXISTS idx_tiss_guides_patient_id ON public.tiss_guides(patient_id);
CREATE INDEX IF NOT EXISTS idx_tiss_guide_items_guide_id ON public.tiss_guide_items(guide_id);
CREATE INDEX IF NOT EXISTS idx_insurance_fee_rules_clinic_id ON public.insurance_fee_rules(clinic_id);
