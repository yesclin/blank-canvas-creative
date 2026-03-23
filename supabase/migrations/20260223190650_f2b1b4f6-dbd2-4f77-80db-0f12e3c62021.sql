
-- Therapeutic goals for psychology
CREATE TABLE public.therapeutic_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id),
  professional_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL DEFAULT 'media' CHECK (priority IN ('baixa', 'media', 'alta')),
  status TEXT NOT NULL DEFAULT 'ativa' CHECK (status IN ('ativa', 'concluida', 'pausada', 'arquivada')),
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  is_measurable BOOLEAN NOT NULL DEFAULT false,
  success_indicator TEXT,
  review_date DATE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Goal progress history
CREATE TABLE public.therapeutic_goal_updates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  goal_id UUID NOT NULL REFERENCES public.therapeutic_goals(id) ON DELETE CASCADE,
  sessao_id UUID,
  previous_progress INTEGER NOT NULL,
  new_progress INTEGER NOT NULL,
  observation TEXT,
  updated_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.therapeutic_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.therapeutic_goal_updates ENABLE ROW LEVEL SECURITY;

-- RLS policies for therapeutic_goals
CREATE POLICY "Users can view goals from their clinic"
  ON public.therapeutic_goals FOR SELECT
  USING (clinic_id = public.get_user_clinic(auth.uid()));

CREATE POLICY "Users can insert goals in their clinic"
  ON public.therapeutic_goals FOR INSERT
  WITH CHECK (clinic_id = public.get_user_clinic(auth.uid()));

CREATE POLICY "Users can update goals in their clinic"
  ON public.therapeutic_goals FOR UPDATE
  USING (clinic_id = public.get_user_clinic(auth.uid()));

-- RLS policies for therapeutic_goal_updates
CREATE POLICY "Users can view goal updates from their clinic"
  ON public.therapeutic_goal_updates FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.therapeutic_goals g 
    WHERE g.id = goal_id AND g.clinic_id = public.get_user_clinic(auth.uid())
  ));

CREATE POLICY "Users can insert goal updates"
  ON public.therapeutic_goal_updates FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.therapeutic_goals g 
    WHERE g.id = goal_id AND g.clinic_id = public.get_user_clinic(auth.uid())
  ));

-- Indexes
CREATE INDEX idx_therapeutic_goals_patient ON public.therapeutic_goals(patient_id, clinic_id);
CREATE INDEX idx_therapeutic_goal_updates_goal ON public.therapeutic_goal_updates(goal_id);

-- Auto-update timestamp
CREATE TRIGGER update_therapeutic_goals_updated_at
  BEFORE UPDATE ON public.therapeutic_goals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_clinical_module_timestamp();
