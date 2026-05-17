
-- ============================================================
-- Hardening RLS: tabelas crm_*
-- Substitui policies FOR ALL por policies separadas e restritivas
-- ============================================================

-- Limpa policies antigas
DROP POLICY IF EXISTS clinic_isolation ON public.crm_leads;
DROP POLICY IF EXISTS clinic_isolation ON public.crm_followups;
DROP POLICY IF EXISTS clinic_isolation ON public.crm_opportunities;
DROP POLICY IF EXISTS clinic_isolation ON public.crm_opportunity_history;
DROP POLICY IF EXISTS clinic_isolation ON public.crm_quotes;
DROP POLICY IF EXISTS clinic_isolation ON public.crm_quote_items;
DROP POLICY IF EXISTS clinic_isolation ON public.crm_pipeline_stages;
DROP POLICY IF EXISTS clinic_isolation ON public.crm_loss_reasons;
DROP POLICY IF EXISTS clinic_isolation ON public.crm_goals;

-- ============================================================
-- Operacional: crm_leads, crm_followups, crm_opportunities,
--              crm_quotes, crm_quote_items
-- SELECT/INSERT/UPDATE: membros da clínica
-- DELETE: apenas owner/admin
-- ============================================================
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'crm_leads','crm_followups','crm_opportunities',
    'crm_quotes','crm_quote_items'
  ]
  LOOP
    EXECUTE format($f$
      CREATE POLICY crm_select_clinic ON public.%I
        FOR SELECT TO authenticated
        USING (clinic_id = public.get_user_clinic_id_for_rls());

      CREATE POLICY crm_insert_clinic ON public.%I
        FOR INSERT TO authenticated
        WITH CHECK (clinic_id = public.get_user_clinic_id_for_rls());

      CREATE POLICY crm_update_clinic ON public.%I
        FOR UPDATE TO authenticated
        USING (clinic_id = public.get_user_clinic_id_for_rls())
        WITH CHECK (clinic_id = public.get_user_clinic_id_for_rls());

      CREATE POLICY crm_delete_admin ON public.%I
        FOR DELETE TO authenticated
        USING (
          clinic_id = public.get_user_clinic_id_for_rls()
          AND public.is_clinic_admin(auth.uid(), clinic_id)
        );
    $f$, t, t, t, t);
  END LOOP;
END $$;

-- ============================================================
-- crm_opportunity_history (auditoria)
-- SELECT/INSERT: membros da clínica
-- UPDATE/DELETE: apenas owner/admin
-- ============================================================
CREATE POLICY crm_select_clinic ON public.crm_opportunity_history
  FOR SELECT TO authenticated
  USING (clinic_id = public.get_user_clinic_id_for_rls());

CREATE POLICY crm_insert_clinic ON public.crm_opportunity_history
  FOR INSERT TO authenticated
  WITH CHECK (clinic_id = public.get_user_clinic_id_for_rls());

CREATE POLICY crm_update_admin ON public.crm_opportunity_history
  FOR UPDATE TO authenticated
  USING (
    clinic_id = public.get_user_clinic_id_for_rls()
    AND public.is_clinic_admin(auth.uid(), clinic_id)
  )
  WITH CHECK (
    clinic_id = public.get_user_clinic_id_for_rls()
    AND public.is_clinic_admin(auth.uid(), clinic_id)
  );

CREATE POLICY crm_delete_admin ON public.crm_opportunity_history
  FOR DELETE TO authenticated
  USING (
    clinic_id = public.get_user_clinic_id_for_rls()
    AND public.is_clinic_admin(auth.uid(), clinic_id)
  );

-- ============================================================
-- Configurações estratégicas: crm_pipeline_stages, crm_loss_reasons
-- SELECT: membros da clínica
-- INSERT/UPDATE/DELETE: apenas owner/admin
-- ============================================================
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['crm_pipeline_stages','crm_loss_reasons']
  LOOP
    EXECUTE format($f$
      CREATE POLICY crm_select_clinic ON public.%I
        FOR SELECT TO authenticated
        USING (clinic_id = public.get_user_clinic_id_for_rls());

      CREATE POLICY crm_insert_admin ON public.%I
        FOR INSERT TO authenticated
        WITH CHECK (
          clinic_id = public.get_user_clinic_id_for_rls()
          AND public.is_clinic_admin(auth.uid(), clinic_id)
        );

      CREATE POLICY crm_update_admin ON public.%I
        FOR UPDATE TO authenticated
        USING (
          clinic_id = public.get_user_clinic_id_for_rls()
          AND public.is_clinic_admin(auth.uid(), clinic_id)
        )
        WITH CHECK (
          clinic_id = public.get_user_clinic_id_for_rls()
          AND public.is_clinic_admin(auth.uid(), clinic_id)
        );

      CREATE POLICY crm_delete_admin ON public.%I
        FOR DELETE TO authenticated
        USING (
          clinic_id = public.get_user_clinic_id_for_rls()
          AND public.is_clinic_admin(auth.uid(), clinic_id)
        );
    $f$, t, t, t, t);
  END LOOP;
END $$;

-- ============================================================
-- crm_goals (metas sensíveis)
-- TUDO restrito a owner/admin — recepcionista e profissional bloqueados
-- ============================================================
CREATE POLICY crm_select_admin ON public.crm_goals
  FOR SELECT TO authenticated
  USING (
    clinic_id = public.get_user_clinic_id_for_rls()
    AND public.is_clinic_admin(auth.uid(), clinic_id)
  );

CREATE POLICY crm_insert_admin ON public.crm_goals
  FOR INSERT TO authenticated
  WITH CHECK (
    clinic_id = public.get_user_clinic_id_for_rls()
    AND public.is_clinic_admin(auth.uid(), clinic_id)
  );

CREATE POLICY crm_update_admin ON public.crm_goals
  FOR UPDATE TO authenticated
  USING (
    clinic_id = public.get_user_clinic_id_for_rls()
    AND public.is_clinic_admin(auth.uid(), clinic_id)
  )
  WITH CHECK (
    clinic_id = public.get_user_clinic_id_for_rls()
    AND public.is_clinic_admin(auth.uid(), clinic_id)
  );

CREATE POLICY crm_delete_admin ON public.crm_goals
  FOR DELETE TO authenticated
  USING (
    clinic_id = public.get_user_clinic_id_for_rls()
    AND public.is_clinic_admin(auth.uid(), clinic_id)
  );
