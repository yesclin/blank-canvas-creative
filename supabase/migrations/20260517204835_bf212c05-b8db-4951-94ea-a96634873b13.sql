
-- Foreign keys faltantes em inventory_movements
-- Verificado: 0 registros órfãos nas 3 colunas

ALTER TABLE public.inventory_movements
  ADD CONSTRAINT inventory_movements_appointment_id_fkey
  FOREIGN KEY (appointment_id) REFERENCES public.appointments(id)
  ON DELETE SET NULL;

ALTER TABLE public.inventory_movements
  ADD CONSTRAINT inventory_movements_patient_id_fkey
  FOREIGN KEY (patient_id) REFERENCES public.patients(id)
  ON DELETE SET NULL;

ALTER TABLE public.inventory_movements
  ADD CONSTRAINT inventory_movements_professional_id_fkey
  FOREIGN KEY (professional_id) REFERENCES public.professionals(id)
  ON DELETE SET NULL;

-- Índices para suportar as FKs (evita full scan em cascade/lookup)
CREATE INDEX IF NOT EXISTS idx_inventory_movements_appointment_id
  ON public.inventory_movements(appointment_id) WHERE appointment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_inventory_movements_patient_id
  ON public.inventory_movements(patient_id) WHERE patient_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_inventory_movements_professional_id
  ON public.inventory_movements(professional_id) WHERE professional_id IS NOT NULL;
