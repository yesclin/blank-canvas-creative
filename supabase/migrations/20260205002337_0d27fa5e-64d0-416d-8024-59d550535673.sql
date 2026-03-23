-- =====================================================
-- REFATORAÇÃO: Criar entidade pai FacialMap conforme especificação
-- =====================================================

-- 1. Criar tabela facial_maps (entidade pai)
CREATE TABLE public.facial_maps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  professional_id UUID REFERENCES public.professionals(id) ON DELETE SET NULL,
  map_type TEXT NOT NULL DEFAULT 'general' CHECK (map_type IN ('general', 'toxin')),
  general_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Adicionar coluna facial_map_id na tabela de pontos
ALTER TABLE public.facial_map_applications 
ADD COLUMN facial_map_id UUID REFERENCES public.facial_maps(id) ON DELETE CASCADE;

-- 3. Criar tabela facial_map_images (vinculada ao mapa, não ao paciente diretamente)
CREATE TABLE public.facial_map_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  facial_map_id UUID NOT NULL REFERENCES public.facial_maps(id) ON DELETE CASCADE,
  image_type TEXT NOT NULL CHECK (image_type IN ('before', 'after')),
  image_url TEXT NOT NULL,
  image_date DATE,
  view_angle TEXT DEFAULT 'frontal' CHECK (view_angle IN ('frontal', 'left_profile', 'right_profile', 'left_45', 'right_45')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Adicionar coluna facial_map_id na tabela de consentimentos
ALTER TABLE public.aesthetic_consent_records 
ADD COLUMN facial_map_id UUID REFERENCES public.facial_maps(id) ON DELETE SET NULL;

-- 5. Enable RLS
ALTER TABLE public.facial_maps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facial_map_images ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies para facial_maps
CREATE POLICY "Users can view facial maps of their clinic" 
ON public.facial_maps FOR SELECT 
USING (
  clinic_id IN (
    SELECT clinic_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can create facial maps for their clinic" 
ON public.facial_maps FOR INSERT 
WITH CHECK (
  clinic_id IN (
    SELECT clinic_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can update facial maps of their clinic" 
ON public.facial_maps FOR UPDATE 
USING (
  clinic_id IN (
    SELECT clinic_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can delete facial maps of their clinic" 
ON public.facial_maps FOR DELETE 
USING (
  clinic_id IN (
    SELECT clinic_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- 7. RLS Policies para facial_map_images
CREATE POLICY "Users can view facial map images of their clinic" 
ON public.facial_map_images FOR SELECT 
USING (
  clinic_id IN (
    SELECT clinic_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can create facial map images for their clinic" 
ON public.facial_map_images FOR INSERT 
WITH CHECK (
  clinic_id IN (
    SELECT clinic_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can update facial map images of their clinic" 
ON public.facial_map_images FOR UPDATE 
USING (
  clinic_id IN (
    SELECT clinic_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can delete facial map images of their clinic" 
ON public.facial_map_images FOR DELETE 
USING (
  clinic_id IN (
    SELECT clinic_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- 8. Indexes para performance
CREATE INDEX idx_facial_maps_patient ON public.facial_maps(patient_id);
CREATE INDEX idx_facial_maps_appointment ON public.facial_maps(appointment_id);
CREATE INDEX idx_facial_maps_clinic ON public.facial_maps(clinic_id);
CREATE INDEX idx_facial_map_images_map ON public.facial_map_images(facial_map_id);
CREATE INDEX idx_facial_map_applications_map ON public.facial_map_applications(facial_map_id);

-- 9. Trigger para updated_at
CREATE TRIGGER update_facial_maps_updated_at
BEFORE UPDATE ON public.facial_maps
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_facial_map_images_updated_at
BEFORE UPDATE ON public.facial_map_images
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();