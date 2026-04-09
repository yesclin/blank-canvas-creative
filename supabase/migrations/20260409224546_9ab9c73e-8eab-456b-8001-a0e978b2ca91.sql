
ALTER TABLE public.anamnesis_templates DISABLE TRIGGER trg_protect_system_locked;

UPDATE public.anamnesis_templates
SET system_locked = false, is_system = false, is_active = false, archived = true
WHERE id = '248168ac-eb45-474b-b734-fd26eb8c32d4';

ALTER TABLE public.anamnesis_templates ENABLE TRIGGER trg_protect_system_locked;
