-- ================================================================
-- YESCLIN RLS POLICIES - PART 1: Enable RLS + Clinic-scoped tables
-- Pattern: clinic members can SELECT, admins can ALL
-- ================================================================

-- Enable RLS on all new tables
ALTER TABLE public.user_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_specialties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_authorized_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_authorized_procedures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_insurances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_clinical_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idle_alert_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.procedure_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_kits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_kit_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_consumption ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_record_tabs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_record_tab_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anamnesis_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anamnesis_template_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anamnesis_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_evolutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_record_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.odontograms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.odontogram_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.body_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.before_after_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interactive_map_annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.therapeutic_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_session_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_session_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treatment_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurance_procedures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurance_authorizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurance_fee_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurance_fee_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tiss_guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tiss_guide_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinic_channel_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinic_document_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinic_document_counter ENABLE ROW LEVEL SECURITY;

-- ==================== HELPER: user_professional_id ====================
CREATE OR REPLACE FUNCTION public.user_professional_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT id FROM public.professionals WHERE user_id = _user_id AND is_active = true LIMIT 1 $$;

-- ==================== POLICIES ====================
-- Pattern A: clinic-scoped read for all members, admin manages
-- Pattern B: clinical data - professionals can CRUD their own, admin can ALL, receptionist blocked

-- USER INVITATIONS
CREATE POLICY "Admins can manage invitations" ON public.user_invitations FOR ALL USING (is_clinic_admin(auth.uid(), clinic_id));
CREATE POLICY "Users can view invitations of their clinic" ON public.user_invitations FOR SELECT USING (clinic_id = user_clinic_id(auth.uid()));

-- PROFESSIONAL SPECIALTIES
CREATE POLICY "Users can view prof specialties of clinic" ON public.professional_specialties FOR SELECT
  USING (EXISTS(SELECT 1 FROM professionals p WHERE p.id = professional_id AND p.clinic_id = user_clinic_id(auth.uid())));
CREATE POLICY "Admins can manage prof specialties" ON public.professional_specialties FOR ALL
  USING (EXISTS(SELECT 1 FROM professionals p WHERE p.id = professional_id AND is_clinic_admin(auth.uid(), p.clinic_id)));

-- PROFESSIONAL SCHEDULES
CREATE POLICY "Users can view prof schedules of clinic" ON public.professional_schedules FOR SELECT USING (clinic_id = user_clinic_id(auth.uid()));
CREATE POLICY "Admins can manage prof schedules" ON public.professional_schedules FOR ALL USING (is_clinic_admin(auth.uid(), clinic_id));
CREATE POLICY "Professionals can manage own schedules" ON public.professional_schedules FOR ALL USING (professional_id = user_professional_id(auth.uid()));

-- PROFESSIONAL AUTHORIZED ROOMS
CREATE POLICY "Users can view prof rooms" ON public.professional_authorized_rooms FOR SELECT
  USING (EXISTS(SELECT 1 FROM professionals p WHERE p.id = professional_id AND p.clinic_id = user_clinic_id(auth.uid())));
CREATE POLICY "Admins can manage prof rooms" ON public.professional_authorized_rooms FOR ALL
  USING (EXISTS(SELECT 1 FROM professionals p WHERE p.id = professional_id AND is_clinic_admin(auth.uid(), p.clinic_id)));

-- PROFESSIONAL AUTHORIZED PROCEDURES
CREATE POLICY "Users can view prof procedures" ON public.professional_authorized_procedures FOR SELECT
  USING (EXISTS(SELECT 1 FROM professionals p WHERE p.id = professional_id AND p.clinic_id = user_clinic_id(auth.uid())));
CREATE POLICY "Admins can manage prof procedures" ON public.professional_authorized_procedures FOR ALL
  USING (EXISTS(SELECT 1 FROM professionals p WHERE p.id = professional_id AND is_clinic_admin(auth.uid(), p.clinic_id)));

-- PATIENT GUARDIANS
CREATE POLICY "Users can view patient guardians" ON public.patient_guardians FOR SELECT USING (clinic_id = user_clinic_id(auth.uid()));
CREATE POLICY "Users can insert patient guardians" ON public.patient_guardians FOR INSERT WITH CHECK (clinic_id = user_clinic_id(auth.uid()));
CREATE POLICY "Users can update patient guardians" ON public.patient_guardians FOR UPDATE USING (clinic_id = user_clinic_id(auth.uid()));
CREATE POLICY "Admins can delete patient guardians" ON public.patient_guardians FOR DELETE USING (is_clinic_admin(auth.uid(), clinic_id));

-- PATIENT INSURANCES
CREATE POLICY "Users can view patient insurances" ON public.patient_insurances FOR SELECT USING (clinic_id = user_clinic_id(auth.uid()));
CREATE POLICY "Users can insert patient insurances" ON public.patient_insurances FOR INSERT WITH CHECK (clinic_id = user_clinic_id(auth.uid()));
CREATE POLICY "Users can update patient insurances" ON public.patient_insurances FOR UPDATE USING (clinic_id = user_clinic_id(auth.uid()));
CREATE POLICY "Admins can delete patient insurances" ON public.patient_insurances FOR DELETE USING (is_clinic_admin(auth.uid(), clinic_id));

-- PATIENT CLINICAL FLAGS
CREATE POLICY "Users can view patient flags" ON public.patient_clinical_flags FOR SELECT USING (clinic_id = user_clinic_id(auth.uid()));
CREATE POLICY "Users can insert patient flags" ON public.patient_clinical_flags FOR INSERT WITH CHECK (clinic_id = user_clinic_id(auth.uid()));
CREATE POLICY "Users can update patient flags" ON public.patient_clinical_flags FOR UPDATE USING (clinic_id = user_clinic_id(auth.uid()));
CREATE POLICY "Admins can delete patient flags" ON public.patient_clinical_flags FOR DELETE USING (is_clinic_admin(auth.uid(), clinic_id));

-- APPOINTMENT TYPES & STATUSES & RULES
CREATE POLICY "Users can view appt types" ON public.appointment_types FOR SELECT USING (clinic_id = user_clinic_id(auth.uid()));
CREATE POLICY "Admins can manage appt types" ON public.appointment_types FOR ALL USING (is_clinic_admin(auth.uid(), clinic_id));
CREATE POLICY "Users can view appt statuses" ON public.appointment_statuses FOR SELECT USING (clinic_id = user_clinic_id(auth.uid()));
CREATE POLICY "Admins can manage appt statuses" ON public.appointment_statuses FOR ALL USING (is_clinic_admin(auth.uid(), clinic_id));
CREATE POLICY "Users can view appt rules" ON public.appointment_rules FOR SELECT USING (clinic_id = user_clinic_id(auth.uid()));
CREATE POLICY "Admins can manage appt rules" ON public.appointment_rules FOR ALL USING (is_clinic_admin(auth.uid(), clinic_id));
CREATE POLICY "Users can view idle settings" ON public.idle_alert_settings FOR SELECT USING (clinic_id = user_clinic_id(auth.uid()));
CREATE POLICY "Admins can manage idle settings" ON public.idle_alert_settings FOR ALL USING (is_clinic_admin(auth.uid(), clinic_id));

-- APPOINTMENT EVENTS
CREATE POLICY "Users can view appt events" ON public.appointment_events FOR SELECT USING (clinic_id = user_clinic_id(auth.uid()));
CREATE POLICY "Users can insert appt events" ON public.appointment_events FOR INSERT WITH CHECK (clinic_id = user_clinic_id(auth.uid()));

-- PRODUCTS
CREATE POLICY "Users can view products" ON public.products FOR SELECT USING (clinic_id = user_clinic_id(auth.uid()));
CREATE POLICY "Admins can manage products" ON public.products FOR ALL USING (is_clinic_admin(auth.uid(), clinic_id));

-- PROCEDURE PRODUCTS
CREATE POLICY "Users can view proc products" ON public.procedure_products FOR SELECT
  USING (EXISTS(SELECT 1 FROM procedures p WHERE p.id = procedure_id AND p.clinic_id = user_clinic_id(auth.uid())));
CREATE POLICY "Admins can manage proc products" ON public.procedure_products FOR ALL
  USING (EXISTS(SELECT 1 FROM procedures p WHERE p.id = procedure_id AND is_clinic_admin(auth.uid(), p.clinic_id)));

-- STOCK MOVEMENTS
CREATE POLICY "Users can view stock movements" ON public.stock_movements FOR SELECT USING (clinic_id = user_clinic_id(auth.uid()));
CREATE POLICY "Users can insert stock movements" ON public.stock_movements FOR INSERT WITH CHECK (clinic_id = user_clinic_id(auth.uid()));
CREATE POLICY "Admins can manage stock movements" ON public.stock_movements FOR ALL USING (is_clinic_admin(auth.uid(), clinic_id));

-- PRODUCT KITS
CREATE POLICY "Users can view product kits" ON public.product_kits FOR SELECT USING (clinic_id = user_clinic_id(auth.uid()));
CREATE POLICY "Admins can manage product kits" ON public.product_kits FOR ALL USING (is_clinic_admin(auth.uid(), clinic_id));

-- PRODUCT KIT ITEMS
CREATE POLICY "Users can view kit items" ON public.product_kit_items FOR SELECT
  USING (EXISTS(SELECT 1 FROM product_kits k WHERE k.id = kit_id AND k.clinic_id = user_clinic_id(auth.uid())));
CREATE POLICY "Admins can manage kit items" ON public.product_kit_items FOR ALL
  USING (EXISTS(SELECT 1 FROM product_kits k WHERE k.id = kit_id AND is_clinic_admin(auth.uid(), k.clinic_id)));

-- MATERIAL CONSUMPTION
CREATE POLICY "Users can view material consumption" ON public.material_consumption FOR SELECT USING (clinic_id = user_clinic_id(auth.uid()));
CREATE POLICY "Users can insert material consumption" ON public.material_consumption FOR INSERT WITH CHECK (clinic_id = user_clinic_id(auth.uid()));
CREATE POLICY "Admins can manage material consumption" ON public.material_consumption FOR ALL USING (is_clinic_admin(auth.uid(), clinic_id));