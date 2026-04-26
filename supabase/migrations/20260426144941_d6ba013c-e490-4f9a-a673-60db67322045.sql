-- 1) Garante coluna sort_order já existente; insere/atualiza os 3 planos definitivos.
INSERT INTO public.subscription_plans (
  slug, name, description, price_monthly, price_yearly,
  max_professionals, max_patients, max_specialties, max_appointments_monthly, max_whatsapp_instances,
  feature_whatsapp, feature_teleconsulta, feature_crm, feature_marketing, feature_automations,
  feature_inventory, feature_insurances, feature_advanced_reports, feature_audit,
  feature_odontogram, feature_facial_map, feature_priority_support,
  is_active, sort_order
) VALUES
  ('essencial', 'Essencial',
    'Plano básico para consultórios e profissionais autônomos.',
    97.00, 970.00,
    2, 500, 2, 300, 1,
    true,  true,  false, false, false,
    true,  false, false, false,
    true,  true,  false,
    true, 1),
  ('profissional', 'Profissional',
    'Plano para clínicas em crescimento, com convênios e relatórios gerenciais.',
    297.00, 2970.00,
    5, 1500, 4, 1500, 1,
    true,  true,  false, false, false,
    true,  true,  false, false,
    true,  true,  false,
    true, 2),
  ('clinica', 'Clínica',
    'Plano completo para operações multi-profissionais com CRM, marketing e auditoria.',
    597.00, 5970.00,
    NULL, NULL, NULL, NULL, 3,
    true,  true,  true,  true,  true,
    true,  true,  true,  true,
    true,  true,  true,
    true, 3)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_monthly = EXCLUDED.price_monthly,
  price_yearly = EXCLUDED.price_yearly,
  max_professionals = EXCLUDED.max_professionals,
  max_patients = EXCLUDED.max_patients,
  max_specialties = EXCLUDED.max_specialties,
  max_appointments_monthly = EXCLUDED.max_appointments_monthly,
  max_whatsapp_instances = EXCLUDED.max_whatsapp_instances,
  feature_whatsapp = EXCLUDED.feature_whatsapp,
  feature_teleconsulta = EXCLUDED.feature_teleconsulta,
  feature_crm = EXCLUDED.feature_crm,
  feature_marketing = EXCLUDED.feature_marketing,
  feature_automations = EXCLUDED.feature_automations,
  feature_inventory = EXCLUDED.feature_inventory,
  feature_insurances = EXCLUDED.feature_insurances,
  feature_advanced_reports = EXCLUDED.feature_advanced_reports,
  feature_audit = EXCLUDED.feature_audit,
  feature_odontogram = EXCLUDED.feature_odontogram,
  feature_facial_map = EXCLUDED.feature_facial_map,
  feature_priority_support = EXCLUDED.feature_priority_support,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

-- 2) Desativa planos antigos (não remove para preservar assinaturas históricas).
UPDATE public.subscription_plans
SET is_active = false, updated_at = now()
WHERE slug IN ('starter', 'pro', 'enterprise');

-- 3) Atualiza a view: odontograma e mapa facial passam a ser sempre TRUE
--    (recursos liberados pela especialidade ativa, não pelo plano).
CREATE OR REPLACE VIEW public.clinic_effective_features AS
SELECT
  c.id AS clinic_id,
  s.id AS subscription_id,
  s.plan_id,
  s.status AS subscription_status,
  p.slug AS plan_slug,
  p.name AS plan_name,
  COALESCE((SELECT o.enabled FROM clinic_feature_overrides o
            WHERE o.clinic_id = c.id AND o.feature_key = 'whatsapp'
              AND (o.expires_at IS NULL OR o.expires_at > now())),
           p.feature_whatsapp) AS feature_whatsapp,
  COALESCE((SELECT o.enabled FROM clinic_feature_overrides o
            WHERE o.clinic_id = c.id AND o.feature_key = 'teleconsulta'
              AND (o.expires_at IS NULL OR o.expires_at > now())),
           p.feature_teleconsulta) AS feature_teleconsulta,
  COALESCE((SELECT o.enabled FROM clinic_feature_overrides o
            WHERE o.clinic_id = c.id AND o.feature_key = 'crm'
              AND (o.expires_at IS NULL OR o.expires_at > now())),
           p.feature_crm) AS feature_crm,
  COALESCE((SELECT o.enabled FROM clinic_feature_overrides o
            WHERE o.clinic_id = c.id AND o.feature_key = 'marketing'
              AND (o.expires_at IS NULL OR o.expires_at > now())),
           p.feature_marketing) AS feature_marketing,
  COALESCE((SELECT o.enabled FROM clinic_feature_overrides o
            WHERE o.clinic_id = c.id AND o.feature_key = 'automations'
              AND (o.expires_at IS NULL OR o.expires_at > now())),
           p.feature_automations) AS feature_automations,
  COALESCE((SELECT o.enabled FROM clinic_feature_overrides o
            WHERE o.clinic_id = c.id AND o.feature_key = 'inventory'
              AND (o.expires_at IS NULL OR o.expires_at > now())),
           p.feature_inventory) AS feature_inventory,
  COALESCE((SELECT o.enabled FROM clinic_feature_overrides o
            WHERE o.clinic_id = c.id AND o.feature_key = 'insurances'
              AND (o.expires_at IS NULL OR o.expires_at > now())),
           p.feature_insurances) AS feature_insurances,
  COALESCE((SELECT o.enabled FROM clinic_feature_overrides o
            WHERE o.clinic_id = c.id AND o.feature_key = 'advanced_reports'
              AND (o.expires_at IS NULL OR o.expires_at > now())),
           p.feature_advanced_reports) AS feature_advanced_reports,
  COALESCE((SELECT o.enabled FROM clinic_feature_overrides o
            WHERE o.clinic_id = c.id AND o.feature_key = 'audit'
              AND (o.expires_at IS NULL OR o.expires_at > now())),
           p.feature_audit) AS feature_audit,
  -- Recursos clínicos: liberados pela ESPECIALIDADE ativa, não pelo plano.
  TRUE AS feature_odontogram,
  TRUE AS feature_facial_map,
  COALESCE((SELECT o.enabled FROM clinic_feature_overrides o
            WHERE o.clinic_id = c.id AND o.feature_key = 'priority_support'
              AND (o.expires_at IS NULL OR o.expires_at > now())),
           p.feature_priority_support) AS feature_priority_support,
  p.max_professionals,
  p.max_patients,
  p.max_specialties,
  p.max_appointments_monthly,
  p.max_whatsapp_instances
FROM public.clinics c
LEFT JOIN public.clinic_subscriptions s ON s.clinic_id = c.id
LEFT JOIN public.subscription_plans p ON p.id = s.plan_id;