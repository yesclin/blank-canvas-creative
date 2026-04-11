
-- Add appointment_id to all clinical tables that lack it
-- All columns are nullable to preserve backward compatibility with existing data

-- Clínica Geral
ALTER TABLE public.patient_anamneses ADD COLUMN IF NOT EXISTS appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL;
ALTER TABLE public.patient_condutas ADD COLUMN IF NOT EXISTS appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL;
ALTER TABLE public.patient_diagnosticos ADD COLUMN IF NOT EXISTS appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL;
ALTER TABLE public.patient_exames_fisicos ADD COLUMN IF NOT EXISTS appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL;
ALTER TABLE public.patient_documentos ADD COLUMN IF NOT EXISTS appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL;
ALTER TABLE public.patient_prescricoes ADD COLUMN IF NOT EXISTS appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL;
ALTER TABLE public.documentos_clinicos ADD COLUMN IF NOT EXISTS appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL;
ALTER TABLE public.patient_consents ADD COLUMN IF NOT EXISTS appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL;

-- Cross-specialty
ALTER TABLE public.body_measurements ADD COLUMN IF NOT EXISTS appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL;
ALTER TABLE public.clinical_alerts ADD COLUMN IF NOT EXISTS appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL;
ALTER TABLE public.clinical_documents ADD COLUMN IF NOT EXISTS appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL;
ALTER TABLE public.clinical_media ADD COLUMN IF NOT EXISTS appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL;
ALTER TABLE public.before_after_records ADD COLUMN IF NOT EXISTS appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL;
ALTER TABLE public.facial_maps ADD COLUMN IF NOT EXISTS appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL;
ALTER TABLE public.interactive_map_annotations ADD COLUMN IF NOT EXISTS appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL;
ALTER TABLE public.odontograms ADD COLUMN IF NOT EXISTS appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL;

-- Psicologia
ALTER TABLE public.patient_anamnese_psicologia ADD COLUMN IF NOT EXISTS appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL;
ALTER TABLE public.sessoes_psicologia ADD COLUMN IF NOT EXISTS appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL;
ALTER TABLE public.instrumentos_psicologicos ADD COLUMN IF NOT EXISTS appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL;
ALTER TABLE public.plano_terapeutico_psicologia ADD COLUMN IF NOT EXISTS appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL;
ALTER TABLE public.psychology_diagnostic_hypotheses ADD COLUMN IF NOT EXISTS appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL;

-- Create indexes for efficient querying by appointment
CREATE INDEX IF NOT EXISTS idx_patient_anamneses_appointment_id ON public.patient_anamneses(appointment_id);
CREATE INDEX IF NOT EXISTS idx_patient_condutas_appointment_id ON public.patient_condutas(appointment_id);
CREATE INDEX IF NOT EXISTS idx_patient_diagnosticos_appointment_id ON public.patient_diagnosticos(appointment_id);
CREATE INDEX IF NOT EXISTS idx_patient_exames_fisicos_appointment_id ON public.patient_exames_fisicos(appointment_id);
CREATE INDEX IF NOT EXISTS idx_patient_documentos_appointment_id ON public.patient_documentos(appointment_id);
CREATE INDEX IF NOT EXISTS idx_patient_prescricoes_appointment_id ON public.patient_prescricoes(appointment_id);
CREATE INDEX IF NOT EXISTS idx_documentos_clinicos_appointment_id ON public.documentos_clinicos(appointment_id);
CREATE INDEX IF NOT EXISTS idx_patient_consents_appointment_id ON public.patient_consents(appointment_id);
CREATE INDEX IF NOT EXISTS idx_body_measurements_appointment_id ON public.body_measurements(appointment_id);
CREATE INDEX IF NOT EXISTS idx_clinical_alerts_appointment_id ON public.clinical_alerts(appointment_id);
CREATE INDEX IF NOT EXISTS idx_clinical_documents_appointment_id ON public.clinical_documents(appointment_id);
CREATE INDEX IF NOT EXISTS idx_clinical_media_appointment_id ON public.clinical_media(appointment_id);
CREATE INDEX IF NOT EXISTS idx_before_after_records_appointment_id ON public.before_after_records(appointment_id);
CREATE INDEX IF NOT EXISTS idx_facial_maps_appointment_id ON public.facial_maps(appointment_id);
CREATE INDEX IF NOT EXISTS idx_interactive_map_annotations_appointment_id ON public.interactive_map_annotations(appointment_id);
CREATE INDEX IF NOT EXISTS idx_odontograms_appointment_id ON public.odontograms(appointment_id);
CREATE INDEX IF NOT EXISTS idx_patient_anamnese_psicologia_appointment_id ON public.patient_anamnese_psicologia(appointment_id);
CREATE INDEX IF NOT EXISTS idx_sessoes_psicologia_appointment_id ON public.sessoes_psicologia(appointment_id);
CREATE INDEX IF NOT EXISTS idx_instrumentos_psicologicos_appointment_id ON public.instrumentos_psicologicos(appointment_id);
CREATE INDEX IF NOT EXISTS idx_plano_terapeutico_psicologia_appointment_id ON public.plano_terapeutico_psicologia(appointment_id);
CREATE INDEX IF NOT EXISTS idx_psychology_diagnostic_hypotheses_appointment_id ON public.psychology_diagnostic_hypotheses(appointment_id);
