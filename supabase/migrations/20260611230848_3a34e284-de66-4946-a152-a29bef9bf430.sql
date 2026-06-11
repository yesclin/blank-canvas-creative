
-- 1) Renomear template_type dos modelos legados de Estética para as chaves oficiais do catálogo
UPDATE public.anamnesis_templates SET template_type = 'anamnese_toxina', updated_at = now()
WHERE is_system = true AND template_type IN ('anamnese', NULL) AND name ILIKE 'Plano de Aplicação de Toxina%';

UPDATE public.anamnesis_templates SET template_type = 'anamnese_preenchimento', updated_at = now()
WHERE is_system = true AND template_type IN ('anamnese', NULL) AND name ILIKE 'Plano de Preenchimento%';

UPDATE public.anamnesis_templates SET template_type = 'anamnese_bioestimulador', updated_at = now()
WHERE is_system = true AND template_type IN ('anamnese', NULL) AND name ILIKE 'Anamnese para Bioestimulador%';

UPDATE public.anamnesis_templates SET template_type = 'anamnese_skinbooster', updated_at = now()
WHERE is_system = true AND template_type IN ('anamnese', NULL) AND name ILIKE 'Anamnese para Microagulhamento%';

UPDATE public.anamnesis_templates SET template_type = 'anamnese_combinados', updated_at = now()
WHERE is_system = true AND template_type IN ('anamnese', NULL) AND name ILIKE 'Anamnese para Procedimentos Estéticos Combinados%';

-- "Anamnese Estética Facial Geral" e "Avaliação Corporal Estética" são modelos legados standard
-- (não-avançados). Mantém renderização padrão (template_type permanece 'anamnese') mas
-- desativa para forçar uso dos modelos avançados (YesClin) quando existirem na mesma especialidade.
-- Não arquivamos diretamente porque o trigger protect_system_anamnesis_templates bloqueia.
-- Em vez disso, vamos garantir que os modelos avançados existam — eles aparecerão lado a lado.

-- 2) Provisionar modelos avançados oficiais (Facial, Pele, Capilar, Corporal) para toda clínica
-- com especialidade estética que ainda não os tenha. Estrutura inicial vazia: o renderer
-- dinâmico (ADVANCED_TEMPLATE_MAP) provê a UI no frontend a partir do template_type.
DO $$
DECLARE
  v_specialty_id uuid;
  v_clinic_id uuid;
  v_template_id uuid;
  v_version_id uuid;

  -- (template_type, name, description, icon)
  v_models text[][] := ARRAY[
    ARRAY['anamnese_estetica_facial', 'Anamnese Estética Facial - YesClin',
          'Avaliação facial com Fitzpatrick, Baumann, acne, discromia e hiperpigmentação periocular', 'Sparkles'],
    ARRAY['anamnese_pele_avaliacao', 'Anamnese Pele e Avaliação Facial - YesClin',
          'Avaliação dermatológica com escalas de cicatrizes, rosácea, discromia e Glogau', 'ScanFace'],
    ARRAY['anamnese_capilar', 'Anamnese Capilar - YesClin',
          'Avaliação capilar com displasias, escalas de Savin e Norwood-Hamilton, tricoscopia', 'Scissors'],
    ARRAY['anamnese_corporal_avancada', 'Anamnese Corporal - YesClin',
          'Avaliação corporal com IMC, adipometria, perimetria, celulite, estrias e diástase', 'User']
  ];
  v_model text[];
BEGIN
  FOR v_clinic_id, v_specialty_id IN
    SELECT DISTINCT c.id, s.id
    FROM public.clinics c
    JOIN public.specialties s ON s.clinic_id = c.id
    WHERE (s.slug = 'estetica' OR s.name ILIKE '%estét%' OR s.name ILIKE '%harmoni%')
      AND s.is_active = true
  LOOP
    FOREACH v_model SLICE 1 IN ARRAY v_models
    LOOP
      -- Pula se já existir um template com esse template_type para essa clínica/especialidade
      IF NOT EXISTS (
        SELECT 1 FROM public.anamnesis_templates
        WHERE clinic_id = v_clinic_id
          AND specialty_id = v_specialty_id
          AND template_type = v_model[1]
      ) THEN
        INSERT INTO public.anamnesis_templates (
          clinic_id, specialty_id, name, description, icon,
          is_active, is_default, is_system, system_locked, archived,
          campos, fields, template_type
        ) VALUES (
          v_clinic_id, v_specialty_id, v_model[2], v_model[3], v_model[4],
          true, false, true, true, false,
          '[]'::jsonb, '[]'::jsonb, v_model[1]
        ) RETURNING id INTO v_template_id;

        INSERT INTO public.anamnesis_template_versions (template_id, version, version_number, structure, fields)
        VALUES (v_template_id, 1, 1, '[]'::jsonb, '[]'::jsonb)
        RETURNING id INTO v_version_id;

        UPDATE public.anamnesis_templates
        SET current_version_id = v_version_id
        WHERE id = v_template_id;
      END IF;
    END LOOP;
  END LOOP;
END;
$$;

-- 3) Reforço: garantir que TODO template do sistema esteja ativo, não arquivado e bloqueado
UPDATE public.anamnesis_templates
SET system_locked = true, is_active = true, archived = false, updated_at = now()
WHERE is_system = true
  AND (system_locked = false OR is_active = false OR archived = true);
