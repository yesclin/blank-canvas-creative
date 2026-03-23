-- =============================================================================
-- ODONTOGRAM MODULE - Digital Dental Chart
-- =============================================================================

-- Tooth status enum
CREATE TYPE public.tooth_status AS ENUM (
  'healthy',           -- Saudável
  'caries',            -- Cárie
  'restoration',       -- Restauração
  'extraction',        -- Extração indicada
  'missing',           -- Ausente
  'implant',           -- Implante
  'crown',             -- Coroa
  'endodontic',        -- Tratamento endodôntico
  'fracture',          -- Fratura
  'decay',             -- Lesão de cárie
  'sealant',           -- Selante
  'prosthesis',        -- Prótese
  'bridge',            -- Ponte
  'veneer',            -- Faceta
  'other'              -- Outro
);

-- 1. Main odontogram per patient (one active per patient)
CREATE TABLE public.odontograms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(clinic_id, patient_id)
);

-- 2. Individual teeth state (current state)
CREATE TABLE public.odontogram_teeth (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  odontogram_id UUID NOT NULL REFERENCES public.odontograms(id) ON DELETE CASCADE,
  tooth_code VARCHAR(3) NOT NULL, -- FDI notation: 11-18, 21-28, 31-38, 41-48 (permanent) or 51-55, 61-65, 71-75, 81-85 (deciduous)
  status public.tooth_status NOT NULL DEFAULT 'healthy',
  notes TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(odontogram_id, tooth_code)
);

-- 3. Historical records per appointment
CREATE TABLE public.odontogram_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  odontogram_tooth_id UUID NOT NULL REFERENCES public.odontogram_teeth(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  professional_id UUID NOT NULL REFERENCES public.professionals(id),
  procedure_id UUID REFERENCES public.procedures(id) ON DELETE SET NULL,
  status_applied public.tooth_status NOT NULL,
  surface VARCHAR(10), -- MODVL (Mesial, Oclusal, Distal, Vestibular, Lingual)
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_odontograms_patient ON public.odontograms(patient_id);
CREATE INDEX idx_odontograms_clinic ON public.odontograms(clinic_id);
CREATE INDEX idx_odontogram_teeth_odontogram ON public.odontogram_teeth(odontogram_id);
CREATE INDEX idx_odontogram_records_tooth ON public.odontogram_records(odontogram_tooth_id);
CREATE INDEX idx_odontogram_records_appointment ON public.odontogram_records(appointment_id);
CREATE INDEX idx_odontogram_records_created ON public.odontogram_records(created_at DESC);

-- Enable RLS
ALTER TABLE public.odontograms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.odontogram_teeth ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.odontogram_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies for odontograms
CREATE POLICY "Odontograms viewable by clinic members"
  ON public.odontograms FOR SELECT TO authenticated
  USING (clinic_id IN (SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Odontograms manageable by clinic members"
  ON public.odontograms FOR ALL TO authenticated
  USING (clinic_id IN (SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid()));

-- RLS Policies for teeth (via odontogram)
CREATE POLICY "Odontogram teeth viewable by clinic members"
  ON public.odontogram_teeth FOR SELECT TO authenticated
  USING (
    odontogram_id IN (
      SELECT id FROM public.odontograms 
      WHERE clinic_id IN (SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Odontogram teeth manageable by clinic members"
  ON public.odontogram_teeth FOR ALL TO authenticated
  USING (
    odontogram_id IN (
      SELECT id FROM public.odontograms 
      WHERE clinic_id IN (SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid())
    )
  );

-- RLS Policies for records
CREATE POLICY "Odontogram records viewable by clinic members"
  ON public.odontogram_records FOR SELECT TO authenticated
  USING (clinic_id IN (SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Odontogram records insertable by clinic members"
  ON public.odontogram_records FOR INSERT TO authenticated
  WITH CHECK (clinic_id IN (SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid()));

-- Trigger to update odontogram timestamp
CREATE OR REPLACE FUNCTION public.update_odontogram_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.odontograms 
  SET updated_at = now() 
  WHERE id = NEW.odontogram_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_odontogram_on_tooth_change
  AFTER INSERT OR UPDATE ON public.odontogram_teeth
  FOR EACH ROW
  EXECUTE FUNCTION public.update_odontogram_timestamp();

-- Comments
COMMENT ON TABLE public.odontograms IS 'Main odontogram record per patient - one active per clinic/patient';
COMMENT ON TABLE public.odontogram_teeth IS 'Current state of each tooth using FDI notation';
COMMENT ON TABLE public.odontogram_records IS 'Historical records of changes per appointment';
COMMENT ON COLUMN public.odontogram_teeth.tooth_code IS 'FDI notation: permanent 11-48, deciduous 51-85';
COMMENT ON COLUMN public.odontogram_records.surface IS 'Affected surfaces: M=Mesial, O=Oclusal, D=Distal, V=Vestibular, L=Lingual';