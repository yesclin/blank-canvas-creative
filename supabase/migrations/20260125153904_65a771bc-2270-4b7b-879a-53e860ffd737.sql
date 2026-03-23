-- Create table for professional-specific schedule configurations
CREATE TABLE public.professional_schedule_config (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
    use_clinic_default BOOLEAN NOT NULL DEFAULT true,
    working_days JSONB DEFAULT '{}',
    default_duration_minutes INTEGER DEFAULT 30,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(professional_id)
);

-- Enable Row Level Security
ALTER TABLE public.professional_schedule_config ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view professional schedules in their clinic"
ON public.professional_schedule_config
FOR SELECT
USING (
    clinic_id IN (
        SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Admins can manage professional schedules"
ON public.professional_schedule_config
FOR ALL
USING (
    clinic_id IN (
        SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid()
    )
    AND EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND clinic_id = professional_schedule_config.clinic_id
        AND role IN ('owner', 'admin')
    )
);

-- Add professional_id to schedule_blocks for per-professional blocks
ALTER TABLE public.schedule_blocks
ADD COLUMN IF NOT EXISTS professional_id UUID REFERENCES public.professionals(id) ON DELETE CASCADE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_professional_schedule_config_clinic 
ON public.professional_schedule_config(clinic_id);

CREATE INDEX IF NOT EXISTS idx_professional_schedule_config_professional 
ON public.professional_schedule_config(professional_id);

CREATE INDEX IF NOT EXISTS idx_schedule_blocks_professional 
ON public.schedule_blocks(professional_id);

-- Create trigger for updated_at
CREATE TRIGGER update_professional_schedule_config_updated_at
BEFORE UPDATE ON public.professional_schedule_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();