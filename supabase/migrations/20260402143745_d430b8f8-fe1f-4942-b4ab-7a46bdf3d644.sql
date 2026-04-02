
-- Seed default pipeline stages for existing clinics
INSERT INTO crm_pipeline_stages (clinic_id, name, sort_order, color, is_active)
SELECT c.id, s.name, s.sort_order, s.color, true
FROM clinics c
CROSS JOIN (VALUES
  ('Novo Lead', 1, '#3B82F6'),
  ('Em Contato', 2, '#06B6D4'),
  ('Qualificado', 3, '#10B981'),
  ('Orçamento Enviado', 4, '#F59E0B'),
  ('Em Negociação', 5, '#8B5CF6'),
  ('Fechado', 6, '#22C55E'),
  ('Perdido', 7, '#EF4444')
) AS s(name, sort_order, color)
WHERE NOT EXISTS (
  SELECT 1 FROM crm_pipeline_stages ps WHERE ps.clinic_id = c.id
);

-- Seed default loss reasons for existing clinics
INSERT INTO crm_loss_reasons (clinic_id, name, is_active)
SELECT c.id, r.name, true
FROM clinics c
CROSS JOIN (VALUES
  ('Preço'),
  ('Concorrência'),
  ('Sem interesse'),
  ('Sem retorno'),
  ('Desistiu do procedimento'),
  ('Mudou de cidade'),
  ('Outro')
) AS r(name)
WHERE NOT EXISTS (
  SELECT 1 FROM crm_loss_reasons lr WHERE lr.clinic_id = c.id
);
