-- ============================================================
-- Performance: avaliar predicados de RLS 1x por statement
-- (padrão recomendado pelo Supabase: envolver funções em SELECT)
-- Regras de negócio inalteradas.
-- ============================================================

-- ---------- professional_specialties ----------
DROP POLICY IF EXISTS "Admins can manage prof specialties" ON public.professional_specialties;
CREATE POLICY "Admins can manage prof specialties"
ON public.professional_specialties
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.professionals p
    WHERE p.id = professional_specialties.professional_id
      AND public.is_clinic_admin((SELECT auth.uid()), p.clinic_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.professionals p
    WHERE p.id = professional_specialties.professional_id
      AND public.is_clinic_admin((SELECT auth.uid()), p.clinic_id)
  )
);

DROP POLICY IF EXISTS "Users can view prof specialties of clinic" ON public.professional_specialties;
CREATE POLICY "Users can view prof specialties of clinic"
ON public.professional_specialties
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.professionals p
    WHERE p.id = professional_specialties.professional_id
      AND p.clinic_id = (SELECT public.user_clinic_id((SELECT auth.uid())))
  )
);

-- ---------- specialties ----------
DROP POLICY IF EXISTS "Admins can manage specialties" ON public.specialties;
CREATE POLICY "Admins can manage specialties"
ON public.specialties
FOR ALL
TO authenticated
USING (public.is_clinic_admin((SELECT auth.uid()), clinic_id))
WITH CHECK (public.is_clinic_admin((SELECT auth.uid()), clinic_id));

DROP POLICY IF EXISTS "Users can view specialties of their clinic" ON public.specialties;
CREATE POLICY "Users can view specialties of their clinic"
ON public.specialties
FOR SELECT
TO authenticated
USING (
  clinic_id IS NULL
  OR clinic_id = (SELECT public.user_clinic_id((SELECT auth.uid())))
);

ANALYZE public.professional_specialties;
ANALYZE public.specialties;
ANALYZE public.professionals;