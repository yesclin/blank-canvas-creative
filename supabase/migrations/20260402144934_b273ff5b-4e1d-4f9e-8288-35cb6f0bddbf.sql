
-- Add missing columns to crm_quotes
ALTER TABLE public.crm_quotes
  ADD COLUMN IF NOT EXISTS lead_id uuid REFERENCES public.crm_leads(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS terms_text text,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS rejected_at timestamptz,
  ADD COLUMN IF NOT EXISTS converted_at timestamptz,
  ADD COLUMN IF NOT EXISTS discount_percent numeric(5,2) DEFAULT 0;

-- Add missing columns to crm_quote_items
ALTER TABLE public.crm_quote_items
  ADD COLUMN IF NOT EXISTS specialty_id uuid REFERENCES public.specialties(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS professional_id uuid REFERENCES public.professionals(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS package_id uuid;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_crm_quotes_lead_id ON public.crm_quotes(lead_id);
CREATE INDEX IF NOT EXISTS idx_crm_quotes_status ON public.crm_quotes(status);
CREATE INDEX IF NOT EXISTS idx_crm_quote_items_quote_id ON public.crm_quote_items(quote_id);

-- Function to generate sequential quote number per clinic
CREATE OR REPLACE FUNCTION public.generate_quote_number(p_clinic_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
  v_number text;
BEGIN
  SELECT COUNT(*) + 1 INTO v_count
  FROM crm_quotes
  WHERE clinic_id = p_clinic_id;
  
  v_number := 'ORC-' || LPAD(v_count::text, 5, '0');
  RETURN v_number;
END;
$$;
