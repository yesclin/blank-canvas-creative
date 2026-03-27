
-- Create modelos_documento table for document templates (receituario, atestado, etc.)
CREATE TABLE public.modelos_documento (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  nome text NOT NULL,
  tipo text NOT NULL DEFAULT 'receituario',
  cabecalho_personalizado text,
  texto_padrao text,
  rodape text,
  is_default boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.modelos_documento ENABLE ROW LEVEL SECURITY;

-- Admins (owner/admin) can manage all document models
CREATE POLICY "Admins can manage document models"
  ON public.modelos_documento
  FOR ALL
  TO authenticated
  USING (is_clinic_admin(auth.uid(), clinic_id))
  WITH CHECK (is_clinic_admin(auth.uid(), clinic_id));

-- All clinic users can view document models
CREATE POLICY "Users can view document models"
  ON public.modelos_documento
  FOR SELECT
  TO authenticated
  USING (clinic_id = user_clinic_id(auth.uid()));
