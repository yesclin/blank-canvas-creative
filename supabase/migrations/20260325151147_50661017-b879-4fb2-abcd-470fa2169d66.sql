
-- ============================================================
-- MIGRATION 4: clinic_specialty_summary RPC
-- ============================================================

CREATE OR REPLACE FUNCTION public.clinic_specialty_summary(_clinic_id uuid)
  RETURNS jsonb
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
  SELECT COALESCE(jsonb_agg(row_data ORDER BY row_data->>'specialty_name'), '[]'::jsonb)
  FROM (
    SELECT jsonb_build_object(
      'specialty_id',          s.id,
      'specialty_name',        s.name,
      'specialty_slug',        s.slug,
      'is_active',             s.is_active,
      'tabs_count',            COALESCE(t.total, 0),
      'active_tabs_count',     COALESCE(t.active, 0),
      'templates_count',       COALESCE(a.total, 0),
      'active_templates_count', COALESCE(a.active, 0),
      'created_at',            s.created_at
    ) AS row_data
    FROM specialties s
    LEFT JOIN LATERAL (
      SELECT
        count(*)::int AS total,
        count(*) FILTER (WHERE is_active)::int AS active
      FROM medical_record_tabs
      WHERE clinic_id = _clinic_id AND specialty_id = s.id
    ) t ON true
    LEFT JOIN LATERAL (
      SELECT
        count(*)::int AS total,
        count(*) FILTER (WHERE is_active)::int AS active
      FROM anamnesis_templates
      WHERE clinic_id = _clinic_id AND specialty_id = s.id
    ) a ON true
    WHERE s.clinic_id = _clinic_id
  ) sub;
$$;
