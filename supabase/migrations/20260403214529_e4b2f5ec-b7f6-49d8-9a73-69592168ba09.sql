-- Assign specific template_type keys to legacy aesthetics templates
-- so they can be matched by the official catalog without name-based heuristics

UPDATE anamnesis_templates SET template_type = 'anamnese_geral_estetica'
WHERE name = 'Anamnese Estética Facial Geral' AND template_type = 'anamnese' AND specialty_id = (SELECT id FROM specialties WHERE slug = 'estetica' LIMIT 1);

UPDATE anamnesis_templates SET template_type = 'anamnese_toxina'
WHERE name = 'Plano de Aplicação de Toxina Botulínica' AND template_type = 'anamnese' AND specialty_id = (SELECT id FROM specialties WHERE slug = 'estetica' LIMIT 1);

UPDATE anamnesis_templates SET template_type = 'anamnese_preenchimento'
WHERE name = 'Plano de Preenchimento com Ácido Hialurônico' AND template_type = 'anamnese' AND specialty_id = (SELECT id FROM specialties WHERE slug = 'estetica' LIMIT 1);

UPDATE anamnesis_templates SET template_type = 'anamnese_bioestimulador'
WHERE name = 'Anamnese para Bioestimulador de Colágeno' AND template_type = 'anamnese' AND specialty_id = (SELECT id FROM specialties WHERE slug = 'estetica' LIMIT 1);

UPDATE anamnesis_templates SET template_type = 'anamnese_skinbooster'
WHERE name = 'Anamnese para Microagulhamento / Skinbooster / Revitalização' AND template_type = 'anamnese' AND specialty_id = (SELECT id FROM specialties WHERE slug = 'estetica' LIMIT 1);

UPDATE anamnesis_templates SET template_type = 'anamnese_combinados'
WHERE name = 'Anamnese para Procedimentos Estéticos Combinados' AND template_type = 'anamnese' AND specialty_id = (SELECT id FROM specialties WHERE slug = 'estetica' LIMIT 1);

UPDATE anamnesis_templates SET template_type = 'anamnese_corporal_legacy'
WHERE name = 'Avaliação Corporal Estética' AND template_type = 'anamnese' AND specialty_id = (SELECT id FROM specialties WHERE slug = 'estetica' LIMIT 1);