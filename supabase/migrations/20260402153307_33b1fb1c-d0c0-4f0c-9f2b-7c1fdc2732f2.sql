
-- Reorder existing stages to make room for the new one
UPDATE public.crm_pipeline_stages SET sort_order = sort_order + 1 WHERE sort_order >= 4;

-- Insert "Pré-atendimento Enviado" stage for all clinics that have pipeline stages
INSERT INTO public.crm_pipeline_stages (clinic_id, name, sort_order, color, is_active)
SELECT DISTINCT clinic_id, 'Pré-atendimento Enviado', 4, '#F97316', true
FROM public.crm_pipeline_stages
WHERE NOT EXISTS (
  SELECT 1 FROM public.crm_pipeline_stages ps2 
  WHERE ps2.clinic_id = crm_pipeline_stages.clinic_id 
  AND ps2.name = 'Pré-atendimento Enviado'
);
