-- Temporarily disable the specialty validation trigger to allow archiving all templates
ALTER TABLE anamnesis_templates DISABLE TRIGGER validate_template_specialty;

-- Archive all remaining non-archived templates (including system ones)
UPDATE anamnesis_templates 
SET is_active = false, 
    archived = true, 
    archived_at = now(), 
    is_default = false 
WHERE archived = false;

-- Re-enable the trigger
ALTER TABLE anamnesis_templates ENABLE TRIGGER validate_template_specialty;