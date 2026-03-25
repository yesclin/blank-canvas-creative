-- ================================================================
-- YESCLIN SCHEMA PART 3: Specialized, Financial, TISS, LGPD, Audit, Communication
-- ================================================================

-- ==================== SPECIALIZED MODULES ====================
CREATE TABLE IF NOT EXISTS public.odontograms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  professional_id UUID REFERENCES public.professionals(id),
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_odontograms_patient ON public.odontograms(patient_id);

CREATE TABLE IF NOT EXISTS public.odontogram_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  odontogram_id UUID NOT NULL REFERENCES public.odontograms(id) ON DELETE CASCADE,
  tooth_number INTEGER NOT NULL,
  surface TEXT,
  condition TEXT NOT NULL,
  procedure_id UUID REFERENCES public.procedures(id),
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.body_measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  professional_id UUID REFERENCES public.professionals(id),
  measurement_type TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_body_measurements_patient ON public.body_measurements(patient_id);

CREATE TABLE IF NOT EXISTS public.before_after_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  professional_id UUID REFERENCES public.professionals(id),
  category TEXT,
  before_media_id UUID REFERENCES public.clinical_media(id),
  after_media_id UUID REFERENCES public.clinical_media(id),
  notes TEXT,
  procedure_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.interactive_map_annotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  professional_id UUID REFERENCES public.professionals(id),
  map_type TEXT NOT NULL DEFAULT 'face',
  annotations JSONB NOT NULL DEFAULT '[]',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.therapeutic_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES public.professionals(id),
  specialty_id UUID REFERENCES public.specialties(id),
  title TEXT NOT NULL,
  description TEXT,
  goals JSONB DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'ativo',
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_therapeutic_plans_patient ON public.therapeutic_plans(patient_id);

CREATE TABLE IF NOT EXISTS public.recurring_session_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES public.professionals(id),
  procedure_id UUID REFERENCES public.procedures(id),
  total_sessions INTEGER NOT NULL,
  completed_sessions INTEGER NOT NULL DEFAULT 0,
  frequency TEXT,
  status TEXT NOT NULL DEFAULT 'ativo',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.recurring_session_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.recurring_session_plans(id) ON DELETE CASCADE,
  session_number INTEGER NOT NULL,
  appointment_id UUID REFERENCES public.appointments(id),
  status TEXT NOT NULL DEFAULT 'pendente',
  notes TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==================== FINANCIAL ====================
CREATE TABLE IF NOT EXISTS public.finance_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type public.transaction_type NOT NULL,
  color TEXT DEFAULT '#6B7280',
  is_system BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(clinic_id, name, type)
);

CREATE TABLE IF NOT EXISTS public.finance_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.finance_categories(id),
  patient_id UUID REFERENCES public.patients(id),
  professional_id UUID REFERENCES public.professionals(id),
  appointment_id UUID REFERENCES public.appointments(id),
  type public.transaction_type NOT NULL,
  status public.transaction_status NOT NULL DEFAULT 'pendente',
  description TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  payment_method TEXT,
  due_date DATE,
  paid_at TIMESTAMPTZ,
  reference_type TEXT,
  reference_id UUID,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_fin_tx_clinic ON public.finance_transactions(clinic_id);
CREATE INDEX IF NOT EXISTS idx_fin_tx_patient ON public.finance_transactions(patient_id);
CREATE INDEX IF NOT EXISTS idx_fin_tx_date ON public.finance_transactions(due_date);
CREATE INDEX IF NOT EXISTS idx_fin_tx_status ON public.finance_transactions(status);

CREATE TABLE IF NOT EXISTS public.treatment_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  total_amount NUMERIC(12,2) NOT NULL,
  paid_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_sessions INTEGER NOT NULL DEFAULT 1,
  used_sessions INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'ativo',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES public.patients(id),
  professional_id UUID REFERENCES public.professionals(id),
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  final_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  payment_method TEXT,
  status TEXT NOT NULL DEFAULT 'finalizada',
  notes TEXT,
  sold_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sales_clinic ON public.sales(clinic_id);
CREATE INDEX IF NOT EXISTS idx_sales_date ON public.sales(created_at);

CREATE TABLE IF NOT EXISTS public.sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  procedure_id UUID REFERENCES public.procedures(id),
  item_type TEXT NOT NULL DEFAULT 'product',
  quantity NUMERIC(12,2) NOT NULL DEFAULT 1,
  unit_price NUMERIC(12,2) NOT NULL,
  total_price NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==================== INSURANCE / TISS ====================
CREATE TABLE IF NOT EXISTS public.insurance_procedures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  insurance_id UUID NOT NULL REFERENCES public.insurances(id) ON DELETE CASCADE,
  procedure_id UUID NOT NULL REFERENCES public.procedures(id) ON DELETE CASCADE,
  tuss_code TEXT,
  authorized_price NUMERIC(12,2),
  requires_authorization BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(insurance_id, procedure_id)
);

CREATE TABLE IF NOT EXISTS public.insurance_authorizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  insurance_id UUID NOT NULL REFERENCES public.insurances(id),
  patient_id UUID NOT NULL REFERENCES public.patients(id),
  procedure_id UUID REFERENCES public.procedures(id),
  authorization_number TEXT,
  status TEXT NOT NULL DEFAULT 'pendente',
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  authorized_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ins_auth_clinic ON public.insurance_authorizations(clinic_id);

CREATE TABLE IF NOT EXISTS public.insurance_fee_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  insurance_id UUID NOT NULL REFERENCES public.insurances(id) ON DELETE CASCADE,
  rule_type TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.insurance_fee_calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  insurance_id UUID NOT NULL REFERENCES public.insurances(id),
  appointment_id UUID REFERENCES public.appointments(id),
  procedure_id UUID REFERENCES public.procedures(id),
  calculated_amount NUMERIC(12,2) NOT NULL,
  approved_amount NUMERIC(12,2),
  gloss_amount NUMERIC(12,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'calculado',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tiss_guides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id),
  insurance_id UUID NOT NULL REFERENCES public.insurances(id),
  professional_id UUID NOT NULL REFERENCES public.professionals(id),
  appointment_id UUID REFERENCES public.appointments(id),
  guide_type public.tiss_guide_type NOT NULL,
  guide_number TEXT,
  authorization_number TEXT,
  status public.tiss_guide_status NOT NULL DEFAULT 'rascunho',
  data JSONB NOT NULL DEFAULT '{}',
  total_amount NUMERIC(12,2),
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tiss_guides_clinic ON public.tiss_guides(clinic_id);
CREATE INDEX IF NOT EXISTS idx_tiss_guides_patient ON public.tiss_guides(patient_id);

CREATE TABLE IF NOT EXISTS public.tiss_guide_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id UUID NOT NULL REFERENCES public.tiss_guides(id) ON DELETE CASCADE,
  procedure_id UUID REFERENCES public.procedures(id),
  tuss_code TEXT,
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(12,2),
  total_price NUMERIC(12,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==================== COMMUNICATION ====================
CREATE TABLE IF NOT EXISTS public.message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'whatsapp',
  content TEXT NOT NULL,
  variables JSONB DEFAULT '[]',
  category TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  trigger_event TEXT NOT NULL,
  conditions JSONB DEFAULT '{}',
  action_type TEXT NOT NULL,
  action_config JSONB NOT NULL DEFAULT '{}',
  template_id UUID REFERENCES public.message_templates(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.message_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES public.patients(id),
  template_id UUID REFERENCES public.message_templates(id),
  channel TEXT NOT NULL,
  recipient TEXT NOT NULL,
  content TEXT,
  status TEXT NOT NULL DEFAULT 'enviado',
  error_message TEXT,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_message_logs_clinic ON public.message_logs(clinic_id);

CREATE TABLE IF NOT EXISTS public.clinic_channel_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  channel TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(clinic_id, channel)
);

-- ==================== LGPD / CONSENT ====================
CREATE TABLE IF NOT EXISTS public.consent_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  term_type TEXT NOT NULL DEFAULT 'tratamento',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.patient_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  term_id UUID NOT NULL REFERENCES public.consent_terms(id),
  status public.consent_status NOT NULL DEFAULT 'pending',
  granted_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  ip_address TEXT,
  signature_data TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_patient_consents_patient ON public.patient_consents(patient_id);

-- ==================== AUDIT / ACCESS LOGS ====================
CREATE TABLE IF NOT EXISTS public.access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_access_logs_clinic ON public.access_logs(clinic_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_user ON public.access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_date ON public.access_logs(created_at);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  user_id UUID,
  table_name TEXT NOT NULL,
  record_id UUID,
  action TEXT NOT NULL,
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_clinic ON public.audit_logs(clinic_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table ON public.audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_date ON public.audit_logs(created_at);

-- ==================== DOCUMENT SETTINGS ====================
CREATE TABLE IF NOT EXISTS public.clinic_document_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  header_text TEXT,
  footer_text TEXT,
  logo_position TEXT DEFAULT 'left',
  show_professional_info BOOLEAN NOT NULL DEFAULT true,
  show_clinic_info BOOLEAN NOT NULL DEFAULT true,
  custom_css TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(clinic_id, document_type)
);

CREATE TABLE IF NOT EXISTS public.clinic_document_counter (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  current_number INTEGER NOT NULL DEFAULT 0,
  prefix TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(clinic_id, document_type)
);