
-- 1. Activate all real psychology templates
UPDATE anamnesis_templates
SET is_active = true
WHERE id IN (
  '7faaabba-b593-4087-9d48-06b5c44a3b06', -- Adulto
  'c22780aa-a76a-4164-83c5-2440fb8c7582', -- Infantil
  'aae6e0f0-4995-4afd-ba48-fdaed5b68a24', -- Terapia de Casal
  '43a62fbd-d294-4fe9-88a6-0bdab12dbc64', -- Terapia Familiar
  '80a88bc0-987b-48e9-935b-720427b607ef', -- Avaliação Psicológica
  '2637ce94-1d88-4da7-b281-2cc0530a29c4'  -- Psiquiátrica Integrada
);

-- 2. Set Adulto as default
UPDATE anamnesis_templates
SET is_default = true
WHERE id = '7faaabba-b593-4087-9d48-06b5c44a3b06';

-- 3. Remove default from wrong templates
UPDATE anamnesis_templates
SET is_default = false
WHERE id IN (
  '5bbc6e4e-a81f-4517-a99f-3227880c9311', -- Clínica Geral placeholder
  '834c4827-c083-44e3-842b-d15a490fa8fc'  -- Empty Psicologia placeholder
);

-- 4. Deactivate the broken/empty placeholders for psychology
UPDATE anamnesis_templates
SET is_active = false, archived = true
WHERE id IN (
  '5bbc6e4e-a81f-4517-a99f-3227880c9311', -- "Anamnese Padrão – Clínica Geral" wrongly linked to psicologia
  '834c4827-c083-44e3-842b-d15a490fa8fc'  -- "Anamnese Padrão - Psicologia" with empty structure
);
