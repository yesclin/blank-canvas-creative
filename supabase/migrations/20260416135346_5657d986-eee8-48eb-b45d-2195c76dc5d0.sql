
ALTER TABLE public.professional_signatures
  ADD COLUMN IF NOT EXISTS signature_width integer DEFAULT 200,
  ADD COLUMN IF NOT EXISTS signature_scale numeric(3,2) DEFAULT 1.00,
  ADD COLUMN IF NOT EXISTS signature_alignment text DEFAULT 'center',
  ADD COLUMN IF NOT EXISTS signature_offset_x integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS signature_offset_y integer DEFAULT 0;
