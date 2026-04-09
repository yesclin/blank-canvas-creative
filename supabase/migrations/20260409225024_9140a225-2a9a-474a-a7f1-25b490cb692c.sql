
ALTER TABLE public.anamnesis_templates DISABLE TRIGGER trg_protect_system_locked;

-- Archive the template
UPDATE public.anamnesis_templates
SET system_locked = false, is_system = false, is_active = false, archived = true, is_default = false
WHERE id = '8e9fabf7-e78c-4872-a643-681b92e55c3f';

-- Transfer default to the advanced facial template
UPDATE public.anamnesis_templates
SET is_default = true
WHERE id = 'b3f309e3-77bf-46ae-8689-cece3c25328d';

ALTER TABLE public.anamnesis_templates ENABLE TRIGGER trg_protect_system_locked;
