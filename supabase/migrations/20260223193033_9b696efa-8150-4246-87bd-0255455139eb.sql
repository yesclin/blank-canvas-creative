
-- Add scale-based goal columns to therapeutic_goals
ALTER TABLE public.therapeutic_goals
ADD COLUMN IF NOT EXISTS goal_type text NOT NULL DEFAULT 'livre',
ADD COLUMN IF NOT EXISTS scale_name text,
ADD COLUMN IF NOT EXISTS initial_score integer,
ADD COLUMN IF NOT EXISTS target_score integer,
ADD COLUMN IF NOT EXISTS current_score integer;

-- Add constraint for goal_type
ALTER TABLE public.therapeutic_goals
ADD CONSTRAINT therapeutic_goals_goal_type_check CHECK (goal_type IN ('livre', 'escala'));

-- Add score tracking to goal_updates for scale-based goals
ALTER TABLE public.therapeutic_goal_updates
ADD COLUMN IF NOT EXISTS score_value integer;
