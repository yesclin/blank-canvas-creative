
-- =============================================
-- Table: marketing_model_library
-- =============================================
CREATE TABLE public.marketing_model_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid REFERENCES public.clinics(id) ON DELETE CASCADE,
  title text NOT NULL,
  slug text NOT NULL,
  description text,
  category text NOT NULL,
  specialty_id uuid REFERENCES public.specialties(id) ON DELETE SET NULL,
  channel text NOT NULL DEFAULT 'instagram',
  occasion text,
  thumbnail_url text,
  preview_url text,
  external_provider text NOT NULL DEFAULT 'canva',
  external_url text NOT NULL,
  cta_label text,
  is_system boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  is_featured boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Unique slugs per clinic (allows same slug across clinics or system-level)
CREATE UNIQUE INDEX idx_marketing_model_library_clinic_slug
  ON public.marketing_model_library (clinic_id, slug)
  WHERE clinic_id IS NOT NULL;

CREATE UNIQUE INDEX idx_marketing_model_library_system_slug
  ON public.marketing_model_library (slug)
  WHERE clinic_id IS NULL AND is_system = true;

CREATE INDEX idx_marketing_model_library_category ON public.marketing_model_library (category);
CREATE INDEX idx_marketing_model_library_channel ON public.marketing_model_library (channel);
CREATE INDEX idx_marketing_model_library_active ON public.marketing_model_library (is_active, is_featured, sort_order);

ALTER TABLE public.marketing_model_library ENABLE ROW LEVEL SECURITY;

-- System models (clinic_id IS NULL) visible to any authenticated user
-- Clinic models visible only to clinic members
CREATE POLICY "Anyone can view system models"
  ON public.marketing_model_library FOR SELECT
  TO authenticated
  USING (
    (clinic_id IS NULL AND is_system = true)
    OR
    (clinic_id = user_clinic_id(auth.uid()))
  );

CREATE POLICY "Clinic admins can manage models"
  ON public.marketing_model_library FOR ALL
  TO authenticated
  USING (is_clinic_admin(auth.uid(), clinic_id))
  WITH CHECK (is_clinic_admin(auth.uid(), clinic_id));

-- =============================================
-- Table: marketing_model_clicks
-- =============================================
CREATE TABLE public.marketing_model_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  template_id uuid NOT NULL REFERENCES public.marketing_model_library(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_context text,
  specialty_id uuid REFERENCES public.specialties(id) ON DELETE SET NULL,
  clicked_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_marketing_model_clicks_template ON public.marketing_model_clicks (template_id);
CREATE INDEX idx_marketing_model_clicks_clinic ON public.marketing_model_clicks (clinic_id, clicked_at DESC);

ALTER TABLE public.marketing_model_clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own clicks"
  ON public.marketing_model_clicks FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND clinic_id = user_clinic_id(auth.uid())
  );

CREATE POLICY "Admins can view clinic clicks"
  ON public.marketing_model_clicks FOR SELECT
  TO authenticated
  USING (clinic_id = user_clinic_id(auth.uid()));

-- =============================================
-- Table: marketing_model_favorites
-- =============================================
CREATE TABLE public.marketing_model_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES public.marketing_model_library(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (template_id, user_id)
);

CREATE INDEX idx_marketing_model_favorites_user ON public.marketing_model_favorites (user_id);

ALTER TABLE public.marketing_model_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own favorites"
  ON public.marketing_model_favorites FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =============================================
-- Trigger: updated_at
-- =============================================
CREATE TRIGGER update_marketing_model_library_updated_at
  BEFORE UPDATE ON public.marketing_model_library
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- Seeds: System models
-- =============================================
INSERT INTO public.marketing_model_library (title, slug, description, category, channel, occasion, is_system, is_active, is_featured, sort_order, external_url, external_provider, thumbnail_url) VALUES
-- Aniversário
('Feliz Aniversário - Paciente', 'aniversario-paciente', 'Card elegante para parabenizar pacientes no dia do aniversário', 'aniversario', 'whatsapp', 'aniversário', true, true, true, 1, 'https://www.canva.com/design/DAGcQ2example1/edit', 'canva', 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400&h=300&fit=crop'),
('Aniversário - Stories Instagram', 'aniversario-stories', 'Story animado para aniversário de paciente', 'aniversario', 'instagram', 'aniversário', true, true, false, 2, 'https://www.canva.com/design/DAGcQ2example2/edit', 'canva', 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=400&h=300&fit=crop'),

-- Pós-consulta
('Feedback Pós-Consulta', 'pos-consulta-feedback', 'Mensagem de cuidado pós-atendimento com orientações', 'pos-consulta', 'whatsapp', NULL, true, true, true, 3, 'https://www.canva.com/design/DAGcQ2example3/edit', 'canva', 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400&h=300&fit=crop'),
('Cuidados Pós-Procedimento', 'pos-procedimento-cuidados', 'Infográfico com cuidados após procedimento estético', 'pos-consulta', 'instagram', NULL, true, true, false, 4, 'https://www.canva.com/design/DAGcQ2example4/edit', 'canva', 'https://images.unsplash.com/photo-1559757175-7cb057fda06e?w=400&h=300&fit=crop'),

-- Reativação
('Sentimos sua falta', 'reativacao-saudade', 'Mensagem de reativação para pacientes inativos', 'reativacao', 'whatsapp', NULL, true, true, true, 5, 'https://www.canva.com/design/DAGcQ2example5/edit', 'canva', 'https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?w=400&h=300&fit=crop'),
('Retorne à Clínica - Post', 'reativacao-retorne', 'Post para redes sociais convidando pacientes a retornarem', 'reativacao', 'instagram', NULL, true, true, false, 6, 'https://www.canva.com/design/DAGcQ2example6/edit', 'canva', 'https://images.unsplash.com/photo-1551076805-e1869033e561?w=400&h=300&fit=crop'),

-- Promoção
('Promoção Especial', 'promocao-especial', 'Card promocional elegante para divulgar ofertas', 'promocao', 'instagram', NULL, true, true, true, 7, 'https://www.canva.com/design/DAGcQ2example7/edit', 'canva', 'https://images.unsplash.com/photo-1607082349566-187342175e2f?w=400&h=300&fit=crop'),
('Desconto Exclusivo - WhatsApp', 'promocao-desconto-whatsapp', 'Mensagem de desconto exclusivo para pacientes fiéis', 'promocao', 'whatsapp', NULL, true, true, false, 8, 'https://www.canva.com/design/DAGcQ2example8/edit', 'canva', 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=300&fit=crop'),

-- Institucional
('Apresentação da Clínica', 'institucional-apresentacao', 'Post institucional apresentando a equipe e serviços', 'institucional', 'instagram', NULL, true, true, true, 9, 'https://www.canva.com/design/DAGcQ2example9/edit', 'canva', 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=400&h=300&fit=crop'),
('Novo Profissional na Equipe', 'institucional-novo-profissional', 'Anúncio de novo profissional na clínica', 'institucional', 'instagram', NULL, true, true, false, 10, 'https://www.canva.com/design/DAGcQ2example10/edit', 'canva', 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400&h=300&fit=crop'),

-- Lembrete
('Lembrete de Consulta', 'lembrete-consulta', 'Lembrete amigável de consulta agendada', 'lembrete', 'whatsapp', NULL, true, true, true, 11, 'https://www.canva.com/design/DAGcQ2example11/edit', 'canva', 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=400&h=300&fit=crop'),
('Lembrete de Retorno', 'lembrete-retorno', 'Lembrete de consulta de retorno/acompanhamento', 'lembrete', 'whatsapp', NULL, true, true, false, 12, 'https://www.canva.com/design/DAGcQ2example12/edit', 'canva', 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=300&fit=crop'),

-- Captação
('Convite para Primeira Consulta', 'captacao-primeira-consulta', 'Material de captação para novos pacientes', 'captacao', 'instagram', NULL, true, true, true, 13, 'https://www.canva.com/design/DAGcQ2example13/edit', 'canva', 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&h=300&fit=crop'),
('Depoimento de Paciente', 'captacao-depoimento', 'Template para compartilhar depoimentos de pacientes', 'captacao', 'instagram', NULL, true, true, false, 14, 'https://www.canva.com/design/DAGcQ2example14/edit', 'canva', 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=300&fit=crop'),

-- Datas comemorativas
('Dia das Mães', 'data-dia-maes', 'Homenagem para o Dia das Mães', 'datas-comemorativas', 'instagram', 'dia das mães', true, true, true, 15, 'https://www.canva.com/design/DAGcQ2example15/edit', 'canva', 'https://images.unsplash.com/photo-1462275646964-a0e3c11f18a6?w=400&h=300&fit=crop'),
('Natal e Boas Festas', 'data-natal', 'Card de Natal e boas festas para pacientes', 'datas-comemorativas', 'whatsapp', 'natal', true, true, false, 16, 'https://www.canva.com/design/DAGcQ2example16/edit', 'canva', 'https://images.unsplash.com/photo-1512389142860-9c449e58a814?w=400&h=300&fit=crop'),
('Dia do Médico', 'data-dia-medico', 'Homenagem ao Dia do Médico', 'datas-comemorativas', 'instagram', 'dia do médico', true, true, false, 17, 'https://www.canva.com/design/DAGcQ2example17/edit', 'canva', 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=400&h=300&fit=crop'),
('Ano Novo', 'data-ano-novo', 'Mensagem de Ano Novo para pacientes', 'datas-comemorativas', 'instagram', 'ano novo', true, true, false, 18, 'https://www.canva.com/design/DAGcQ2example18/edit', 'canva', 'https://images.unsplash.com/photo-1467810563316-b5476525c0f9?w=400&h=300&fit=crop');
