-- ================================================================
-- YESCLIN RLS POLICIES - PART 2: Clinical, Financial, TISS, LGPD, Audit
-- ================================================================

-- MEDICAL RECORD TABS
CREATE POLICY "Users can view mr tabs" ON public.medical_record_tabs FOR SELECT USING (clinic_id = user_clinic_id(auth.uid()));
CREATE POLICY "Admins can manage mr tabs" ON public.medical_record_tabs FOR ALL USING (is_clinic_admin(auth.uid(), clinic_id));

-- MEDICAL RECORD TAB FIELDS
CREATE POLICY "Users can view mr tab fields" ON public.medical_record_tab_fields FOR SELECT
  USING (EXISTS(SELECT 1 FROM medical_record_tabs t WHERE t.id = tab_id AND t.clinic_id = user_clinic_id(auth.uid())));
CREATE POLICY "Admins can manage mr tab fields" ON public.medical_record_tab_fields FOR ALL
  USING (EXISTS(SELECT 1 FROM medical_record_tabs t WHERE t.id = tab_id AND is_clinic_admin(auth.uid(), t.clinic_id)));

-- ANAMNESIS TEMPLATES
CREATE POLICY "Users can view anamnesis templates" ON public.anamnesis_templates FOR SELECT USING (clinic_id = user_clinic_id(auth.uid()));
CREATE POLICY "Admins can manage anamnesis templates" ON public.anamnesis_templates FOR ALL USING (is_clinic_admin(auth.uid(), clinic_id));

-- ANAMNESIS TEMPLATE VERSIONS
CREATE POLICY "Users can view template versions" ON public.anamnesis_template_versions FOR SELECT
  USING (EXISTS(SELECT 1 FROM anamnesis_templates t WHERE t.id = template_id AND t.clinic_id = user_clinic_id(auth.uid())));
CREATE POLICY "Admins can manage template versions" ON public.anamnesis_template_versions FOR ALL
  USING (EXISTS(SELECT 1 FROM anamnesis_templates t WHERE t.id = template_id AND is_clinic_admin(auth.uid(), t.clinic_id)));

-- ANAMNESIS RECORDS (clinical - professionals only)
CREATE POLICY "Clinic users can view anamnesis records" ON public.anamnesis_records FOR SELECT USING (clinic_id = user_clinic_id(auth.uid()));
CREATE POLICY "Professionals can insert anamnesis" ON public.anamnesis_records FOR INSERT WITH CHECK (clinic_id = user_clinic_id(auth.uid()) AND professional_id = user_professional_id(auth.uid()));
CREATE POLICY "Professionals can update own draft anamnesis" ON public.anamnesis_records FOR UPDATE USING (clinic_id = user_clinic_id(auth.uid()) AND professional_id = user_professional_id(auth.uid()) AND status = 'rascunho');
CREATE POLICY "Admins can manage anamnesis records" ON public.anamnesis_records FOR ALL USING (is_clinic_admin(auth.uid(), clinic_id));

-- CLINICAL EVOLUTIONS (clinical - professionals only, immutable after signing)
CREATE POLICY "Clinic users can view evolutions" ON public.clinical_evolutions FOR SELECT USING (clinic_id = user_clinic_id(auth.uid()));
CREATE POLICY "Professionals can insert evolutions" ON public.clinical_evolutions FOR INSERT WITH CHECK (clinic_id = user_clinic_id(auth.uid()) AND professional_id = user_professional_id(auth.uid()));
CREATE POLICY "Professionals can update own draft evolutions" ON public.clinical_evolutions FOR UPDATE USING (clinic_id = user_clinic_id(auth.uid()) AND professional_id = user_professional_id(auth.uid()) AND status = 'rascunho');
CREATE POLICY "Admins can view all evolutions" ON public.clinical_evolutions FOR SELECT USING (is_clinic_admin(auth.uid(), clinic_id));

-- CLINICAL ALERTS
CREATE POLICY "Users can view clinical alerts" ON public.clinical_alerts FOR SELECT USING (clinic_id = user_clinic_id(auth.uid()));
CREATE POLICY "Users can insert clinical alerts" ON public.clinical_alerts FOR INSERT WITH CHECK (clinic_id = user_clinic_id(auth.uid()));
CREATE POLICY "Users can update clinical alerts" ON public.clinical_alerts FOR UPDATE USING (clinic_id = user_clinic_id(auth.uid()));
CREATE POLICY "Admins can delete clinical alerts" ON public.clinical_alerts FOR DELETE USING (is_clinic_admin(auth.uid(), clinic_id));

-- CLINICAL MEDIA
CREATE POLICY "Clinic users can view clinical media" ON public.clinical_media FOR SELECT USING (clinic_id = user_clinic_id(auth.uid()));
CREATE POLICY "Users can insert clinical media" ON public.clinical_media FOR INSERT WITH CHECK (clinic_id = user_clinic_id(auth.uid()));
CREATE POLICY "Admins can manage clinical media" ON public.clinical_media FOR ALL USING (is_clinic_admin(auth.uid(), clinic_id));

-- CLINICAL DOCUMENTS
CREATE POLICY "Clinic users can view clinical docs" ON public.clinical_documents FOR SELECT USING (clinic_id = user_clinic_id(auth.uid()));
CREATE POLICY "Professionals can insert clinical docs" ON public.clinical_documents FOR INSERT WITH CHECK (clinic_id = user_clinic_id(auth.uid()) AND professional_id = user_professional_id(auth.uid()));
CREATE POLICY "Professionals can update own draft docs" ON public.clinical_documents FOR UPDATE USING (clinic_id = user_clinic_id(auth.uid()) AND professional_id = user_professional_id(auth.uid()) AND status = 'rascunho');
CREATE POLICY "Admins can manage clinical docs" ON public.clinical_documents FOR ALL USING (is_clinic_admin(auth.uid(), clinic_id));

-- PUBLIC: anyone can validate a document by validation_code
CREATE POLICY "Public can validate documents" ON public.clinical_documents FOR SELECT TO anon USING (validation_code IS NOT NULL);

-- MEDICAL RECORD SIGNATURES (append-only)
CREATE POLICY "Clinic users can view signatures" ON public.medical_record_signatures FOR SELECT USING (clinic_id = user_clinic_id(auth.uid()));
CREATE POLICY "Users can insert signatures" ON public.medical_record_signatures FOR INSERT WITH CHECK (clinic_id = user_clinic_id(auth.uid()));

-- ODONTOGRAMS
CREATE POLICY "Clinic users can view odontograms" ON public.odontograms FOR SELECT USING (clinic_id = user_clinic_id(auth.uid()));
CREATE POLICY "Users can insert odontograms" ON public.odontograms FOR INSERT WITH CHECK (clinic_id = user_clinic_id(auth.uid()));
CREATE POLICY "Users can update odontograms" ON public.odontograms FOR UPDATE USING (clinic_id = user_clinic_id(auth.uid()));
CREATE POLICY "Admins can manage odontograms" ON public.odontograms FOR ALL USING (is_clinic_admin(auth.uid(), clinic_id));

-- ODONTOGRAM RECORDS
CREATE POLICY "Clinic users can view odontogram records" ON public.odontogram_records FOR SELECT
  USING (EXISTS(SELECT 1 FROM odontograms o WHERE o.id = odontogram_id AND o.clinic_id = user_clinic_id(auth.uid())));
CREATE POLICY "Users can insert odontogram records" ON public.odontogram_records FOR INSERT
  WITH CHECK (EXISTS(SELECT 1 FROM odontograms o WHERE o.id = odontogram_id AND o.clinic_id = user_clinic_id(auth.uid())));
CREATE POLICY "Admins can manage odontogram records" ON public.odontogram_records FOR ALL
  USING (EXISTS(SELECT 1 FROM odontograms o WHERE o.id = odontogram_id AND is_clinic_admin(auth.uid(), o.clinic_id)));

-- BODY MEASUREMENTS, BEFORE/AFTER, MAPS, THERAPEUTIC PLANS, SESSIONS
CREATE POLICY "Clinic view body measurements" ON public.body_measurements FOR SELECT USING (clinic_id = user_clinic_id(auth.uid()));
CREATE POLICY "Users insert body measurements" ON public.body_measurements FOR INSERT WITH CHECK (clinic_id = user_clinic_id(auth.uid()));
CREATE POLICY "Admins manage body measurements" ON public.body_measurements FOR ALL USING (is_clinic_admin(auth.uid(), clinic_id));

CREATE POLICY "Clinic view before after" ON public.before_after_records FOR SELECT USING (clinic_id = user_clinic_id(auth.uid()));
CREATE POLICY "Users insert before after" ON public.before_after_records FOR INSERT WITH CHECK (clinic_id = user_clinic_id(auth.uid()));
CREATE POLICY "Admins manage before after" ON public.before_after_records FOR ALL USING (is_clinic_admin(auth.uid(), clinic_id));

CREATE POLICY "Clinic view map annotations" ON public.interactive_map_annotations FOR SELECT USING (clinic_id = user_clinic_id(auth.uid()));
CREATE POLICY "Users insert map annotations" ON public.interactive_map_annotations FOR INSERT WITH CHECK (clinic_id = user_clinic_id(auth.uid()));
CREATE POLICY "Users update map annotations" ON public.interactive_map_annotations FOR UPDATE USING (clinic_id = user_clinic_id(auth.uid()));
CREATE POLICY "Admins manage map annotations" ON public.interactive_map_annotations FOR ALL USING (is_clinic_admin(auth.uid(), clinic_id));

CREATE POLICY "Clinic view therapeutic plans" ON public.therapeutic_plans FOR SELECT USING (clinic_id = user_clinic_id(auth.uid()));
CREATE POLICY "Users insert therapeutic plans" ON public.therapeutic_plans FOR INSERT WITH CHECK (clinic_id = user_clinic_id(auth.uid()));
CREATE POLICY "Users update therapeutic plans" ON public.therapeutic_plans FOR UPDATE USING (clinic_id = user_clinic_id(auth.uid()));
CREATE POLICY "Admins manage therapeutic plans" ON public.therapeutic_plans FOR ALL USING (is_clinic_admin(auth.uid(), clinic_id));

CREATE POLICY "Clinic view session plans" ON public.recurring_session_plans FOR SELECT USING (clinic_id = user_clinic_id(auth.uid()));
CREATE POLICY "Users insert session plans" ON public.recurring_session_plans FOR INSERT WITH CHECK (clinic_id = user_clinic_id(auth.uid()));
CREATE POLICY "Users update session plans" ON public.recurring_session_plans FOR UPDATE USING (clinic_id = user_clinic_id(auth.uid()));
CREATE POLICY "Admins manage session plans" ON public.recurring_session_plans FOR ALL USING (is_clinic_admin(auth.uid(), clinic_id));

CREATE POLICY "Clinic view session entries" ON public.recurring_session_entries FOR SELECT
  USING (EXISTS(SELECT 1 FROM recurring_session_plans p WHERE p.id = plan_id AND p.clinic_id = user_clinic_id(auth.uid())));
CREATE POLICY "Users insert session entries" ON public.recurring_session_entries FOR INSERT
  WITH CHECK (EXISTS(SELECT 1 FROM recurring_session_plans p WHERE p.id = plan_id AND p.clinic_id = user_clinic_id(auth.uid())));
CREATE POLICY "Users update session entries" ON public.recurring_session_entries FOR UPDATE
  USING (EXISTS(SELECT 1 FROM recurring_session_plans p WHERE p.id = plan_id AND p.clinic_id = user_clinic_id(auth.uid())));

-- FINANCIAL
CREATE POLICY "Users can view finance categories" ON public.finance_categories FOR SELECT USING (clinic_id = user_clinic_id(auth.uid()));
CREATE POLICY "Admins can manage finance categories" ON public.finance_categories FOR ALL USING (is_clinic_admin(auth.uid(), clinic_id));

CREATE POLICY "Users can view finance transactions" ON public.finance_transactions FOR SELECT USING (clinic_id = user_clinic_id(auth.uid()));
CREATE POLICY "Users can insert finance transactions" ON public.finance_transactions FOR INSERT WITH CHECK (clinic_id = user_clinic_id(auth.uid()));
CREATE POLICY "Users can update finance transactions" ON public.finance_transactions FOR UPDATE USING (clinic_id = user_clinic_id(auth.uid()));
CREATE POLICY "Admins can manage finance transactions" ON public.finance_transactions FOR ALL USING (is_clinic_admin(auth.uid(), clinic_id));

CREATE POLICY "Users can view treatment packages" ON public.treatment_packages FOR SELECT USING (clinic_id = user_clinic_id(auth.uid()));
CREATE POLICY "Users can insert treatment packages" ON public.treatment_packages FOR INSERT WITH CHECK (clinic_id = user_clinic_id(auth.uid()));
CREATE POLICY "Users can update treatment packages" ON public.treatment_packages FOR UPDATE USING (clinic_id = user_clinic_id(auth.uid()));
CREATE POLICY "Admins can manage treatment packages" ON public.treatment_packages FOR ALL USING (is_clinic_admin(auth.uid(), clinic_id));

CREATE POLICY "Users can view sales" ON public.sales FOR SELECT USING (clinic_id = user_clinic_id(auth.uid()));
CREATE POLICY "Users can insert sales" ON public.sales FOR INSERT WITH CHECK (clinic_id = user_clinic_id(auth.uid()));
CREATE POLICY "Users can update sales" ON public.sales FOR UPDATE USING (clinic_id = user_clinic_id(auth.uid()));
CREATE POLICY "Admins can manage sales" ON public.sales FOR ALL USING (is_clinic_admin(auth.uid(), clinic_id));

CREATE POLICY "Users can view sale items" ON public.sale_items FOR SELECT
  USING (EXISTS(SELECT 1 FROM sales s WHERE s.id = sale_id AND s.clinic_id = user_clinic_id(auth.uid())));
CREATE POLICY "Users can insert sale items" ON public.sale_items FOR INSERT
  WITH CHECK (EXISTS(SELECT 1 FROM sales s WHERE s.id = sale_id AND s.clinic_id = user_clinic_id(auth.uid())));

-- INSURANCE / TISS
CREATE POLICY "Users can view ins procedures" ON public.insurance_procedures FOR SELECT
  USING (EXISTS(SELECT 1 FROM insurances i WHERE i.id = insurance_id AND i.clinic_id = user_clinic_id(auth.uid())));
CREATE POLICY "Admins can manage ins procedures" ON public.insurance_procedures FOR ALL
  USING (EXISTS(SELECT 1 FROM insurances i WHERE i.id = insurance_id AND is_clinic_admin(auth.uid(), i.clinic_id)));

CREATE POLICY "Users can view ins authorizations" ON public.insurance_authorizations FOR SELECT USING (clinic_id = user_clinic_id(auth.uid()));
CREATE POLICY "Users can insert ins authorizations" ON public.insurance_authorizations FOR INSERT WITH CHECK (clinic_id = user_clinic_id(auth.uid()));
CREATE POLICY "Admins can manage ins authorizations" ON public.insurance_authorizations FOR ALL USING (is_clinic_admin(auth.uid(), clinic_id));

CREATE POLICY "Users can view ins fee rules" ON public.insurance_fee_rules FOR SELECT
  USING (EXISTS(SELECT 1 FROM insurances i WHERE i.id = insurance_id AND i.clinic_id = user_clinic_id(auth.uid())));
CREATE POLICY "Admins can manage ins fee rules" ON public.insurance_fee_rules FOR ALL
  USING (EXISTS(SELECT 1 FROM insurances i WHERE i.id = insurance_id AND is_clinic_admin(auth.uid(), i.clinic_id)));

CREATE POLICY "Users can view ins fee calcs" ON public.insurance_fee_calculations FOR SELECT USING (clinic_id = user_clinic_id(auth.uid()));
CREATE POLICY "Users can insert ins fee calcs" ON public.insurance_fee_calculations FOR INSERT WITH CHECK (clinic_id = user_clinic_id(auth.uid()));
CREATE POLICY "Admins can manage ins fee calcs" ON public.insurance_fee_calculations FOR ALL USING (is_clinic_admin(auth.uid(), clinic_id));

CREATE POLICY "Users can view tiss guides" ON public.tiss_guides FOR SELECT USING (clinic_id = user_clinic_id(auth.uid()));
CREATE POLICY "Users can insert tiss guides" ON public.tiss_guides FOR INSERT WITH CHECK (clinic_id = user_clinic_id(auth.uid()));
CREATE POLICY "Users can update tiss guides" ON public.tiss_guides FOR UPDATE USING (clinic_id = user_clinic_id(auth.uid()));
CREATE POLICY "Admins can manage tiss guides" ON public.tiss_guides FOR ALL USING (is_clinic_admin(auth.uid(), clinic_id));

CREATE POLICY "Users can view tiss items" ON public.tiss_guide_items FOR SELECT
  USING (EXISTS(SELECT 1 FROM tiss_guides g WHERE g.id = guide_id AND g.clinic_id = user_clinic_id(auth.uid())));
CREATE POLICY "Users can insert tiss items" ON public.tiss_guide_items FOR INSERT
  WITH CHECK (EXISTS(SELECT 1 FROM tiss_guides g WHERE g.id = guide_id AND g.clinic_id = user_clinic_id(auth.uid())));

-- COMMUNICATION
CREATE POLICY "Users can view message templates" ON public.message_templates FOR SELECT USING (clinic_id = user_clinic_id(auth.uid()));
CREATE POLICY "Admins can manage message templates" ON public.message_templates FOR ALL USING (is_clinic_admin(auth.uid(), clinic_id));

CREATE POLICY "Users can view automation rules" ON public.automation_rules FOR SELECT USING (clinic_id = user_clinic_id(auth.uid()));
CREATE POLICY "Admins can manage automation rules" ON public.automation_rules FOR ALL USING (is_clinic_admin(auth.uid(), clinic_id));

CREATE POLICY "Users can view message logs" ON public.message_logs FOR SELECT USING (clinic_id = user_clinic_id(auth.uid()));
CREATE POLICY "Users can insert message logs" ON public.message_logs FOR INSERT WITH CHECK (clinic_id = user_clinic_id(auth.uid()));

CREATE POLICY "Users can view channel integrations" ON public.clinic_channel_integrations FOR SELECT USING (clinic_id = user_clinic_id(auth.uid()));
CREATE POLICY "Admins can manage channel integrations" ON public.clinic_channel_integrations FOR ALL USING (is_clinic_admin(auth.uid(), clinic_id));

-- LGPD / CONSENT
CREATE POLICY "Users can view consent terms" ON public.consent_terms FOR SELECT USING (clinic_id = user_clinic_id(auth.uid()));
CREATE POLICY "Admins can manage consent terms" ON public.consent_terms FOR ALL USING (is_clinic_admin(auth.uid(), clinic_id));

CREATE POLICY "Users can view patient consents" ON public.patient_consents FOR SELECT USING (clinic_id = user_clinic_id(auth.uid()));
CREATE POLICY "Users can insert patient consents" ON public.patient_consents FOR INSERT WITH CHECK (clinic_id = user_clinic_id(auth.uid()));

-- AUDIT / ACCESS LOGS (append-only, admin-viewable)
CREATE POLICY "Admins can view access logs" ON public.access_logs FOR SELECT USING (is_clinic_admin(auth.uid(), clinic_id));
CREATE POLICY "Users can insert access logs" ON public.access_logs FOR INSERT WITH CHECK (clinic_id = user_clinic_id(auth.uid()));

CREATE POLICY "Admins can view audit logs" ON public.audit_logs FOR SELECT USING (is_clinic_admin(auth.uid(), clinic_id));
CREATE POLICY "System can insert audit logs" ON public.audit_logs FOR INSERT WITH CHECK (clinic_id = user_clinic_id(auth.uid()));

-- DOCUMENT SETTINGS
CREATE POLICY "Users can view doc settings" ON public.clinic_document_settings FOR SELECT USING (clinic_id = user_clinic_id(auth.uid()));
CREATE POLICY "Admins can manage doc settings" ON public.clinic_document_settings FOR ALL USING (is_clinic_admin(auth.uid(), clinic_id));

CREATE POLICY "Users can view doc counter" ON public.clinic_document_counter FOR SELECT USING (clinic_id = user_clinic_id(auth.uid()));
CREATE POLICY "Admins can manage doc counter" ON public.clinic_document_counter FOR ALL USING (is_clinic_admin(auth.uid(), clinic_id));