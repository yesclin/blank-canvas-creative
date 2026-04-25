-- =====================================================
-- TERMOS DE CONSENTIMENTO CLÍNICOS (POR ESPECIALIDADE)
-- =====================================================

CREATE TABLE public.clinical_consent_terms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE,
  specialty_id UUID REFERENCES public.specialties(id) ON DELETE SET NULL,
  professional_id UUID REFERENCES public.professionals(id) ON DELETE SET NULL,

  title TEXT NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  consent_type TEXT NOT NULL DEFAULT 'general',
  specialty_slug TEXT,

  version INTEGER NOT NULL DEFAULT 1,
  parent_term_id UUID REFERENCES public.clinical_consent_terms(id) ON DELETE SET NULL,
  based_on_system_term_id UUID REFERENCES public.clinical_consent_terms(id) ON DELETE SET NULL,

  is_active BOOLEAN NOT NULL DEFAULT true,
  is_system BOOLEAN NOT NULL DEFAULT false,
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_archived BOOLEAN NOT NULL DEFAULT false,

  requires_signature BOOLEAN NOT NULL DEFAULT true,
  requires_patient_name BOOLEAN NOT NULL DEFAULT true,
  requires_cpf BOOLEAN NOT NULL DEFAULT false,
  requires_ip BOOLEAN NOT NULL DEFAULT true,
  requires_geolocation BOOLEAN NOT NULL DEFAULT false,

  created_by UUID,
  updated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT clinical_consent_terms_system_or_clinic
    CHECK ((is_system = true AND clinic_id IS NULL) OR (is_system = false AND clinic_id IS NOT NULL))
);

CREATE INDEX idx_clinical_consent_terms_clinic ON public.clinical_consent_terms(clinic_id) WHERE clinic_id IS NOT NULL;
CREATE INDEX idx_clinical_consent_terms_specialty ON public.clinical_consent_terms(specialty_id) WHERE specialty_id IS NOT NULL;
CREATE INDEX idx_clinical_consent_terms_specialty_slug ON public.clinical_consent_terms(specialty_slug) WHERE specialty_slug IS NOT NULL;
CREATE INDEX idx_clinical_consent_terms_professional ON public.clinical_consent_terms(professional_id) WHERE professional_id IS NOT NULL;
CREATE INDEX idx_clinical_consent_terms_system ON public.clinical_consent_terms(is_system) WHERE is_system = true;

CREATE TABLE public.clinical_consent_acceptances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  specialty_id UUID REFERENCES public.specialties(id) ON DELETE SET NULL,
  professional_id UUID REFERENCES public.professionals(id) ON DELETE SET NULL,

  consent_term_id UUID REFERENCES public.clinical_consent_terms(id) ON DELETE SET NULL,
  consent_type TEXT NOT NULL DEFAULT 'general',

  term_title TEXT NOT NULL,
  term_content_snapshot TEXT NOT NULL,
  term_version INTEGER NOT NULL,

  patient_name_snapshot TEXT,
  patient_cpf_snapshot TEXT,
  signature_data TEXT,
  ip_address TEXT,
  user_agent TEXT,
  geo_location JSONB,

  status TEXT NOT NULL DEFAULT 'accepted',
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ,
  revoked_by UUID,
  revoke_reason TEXT,

  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT clinical_consent_acceptances_status_check
    CHECK (status IN ('pending','accepted','revoked'))
);

CREATE INDEX idx_clinical_consent_acceptances_patient ON public.clinical_consent_acceptances(patient_id);
CREATE INDEX idx_clinical_consent_acceptances_clinic_patient ON public.clinical_consent_acceptances(clinic_id, patient_id);
CREATE INDEX idx_clinical_consent_acceptances_term ON public.clinical_consent_acceptances(consent_term_id) WHERE consent_term_id IS NOT NULL;
CREATE INDEX idx_clinical_consent_acceptances_appointment ON public.clinical_consent_acceptances(appointment_id) WHERE appointment_id IS NOT NULL;

-- =====================================================
-- TRIGGERS
-- =====================================================

CREATE TRIGGER trg_clinical_consent_terms_updated_at
BEFORE UPDATE ON public.clinical_consent_terms
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.protect_system_consent_terms()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.is_system = true THEN
      RAISE EXCEPTION 'Termos do sistema não podem ser removidos';
    END IF;
    RETURN OLD;
  END IF;
  IF TG_OP = 'UPDATE' THEN
    IF OLD.is_system = true AND NEW.is_system = true THEN
      RAISE EXCEPTION 'Termos do sistema são imutáveis. Crie uma cópia personalizada.';
    END IF;
    RETURN NEW;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_protect_system_consent_terms
BEFORE UPDATE OR DELETE ON public.clinical_consent_terms
FOR EACH ROW EXECUTE FUNCTION public.protect_system_consent_terms();

CREATE OR REPLACE FUNCTION public.protect_consent_acceptances()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF OLD.term_content_snapshot IS DISTINCT FROM NEW.term_content_snapshot
       OR OLD.term_title IS DISTINCT FROM NEW.term_title
       OR OLD.term_version IS DISTINCT FROM NEW.term_version
       OR OLD.signature_data IS DISTINCT FROM NEW.signature_data
       OR OLD.accepted_at IS DISTINCT FROM NEW.accepted_at
       OR OLD.patient_id IS DISTINCT FROM NEW.patient_id
       OR OLD.clinic_id IS DISTINCT FROM NEW.clinic_id THEN
      RAISE EXCEPTION 'Snapshot de aceite é imutável. Apenas revogação é permitida.';
    END IF;
  END IF;
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'Aceites de consentimento não podem ser removidos. Use revogação.';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_protect_consent_acceptances
BEFORE UPDATE OR DELETE ON public.clinical_consent_acceptances
FOR EACH ROW EXECUTE FUNCTION public.protect_consent_acceptances();

-- =====================================================
-- RLS
-- =====================================================
ALTER TABLE public.clinical_consent_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_consent_acceptances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members read clinic terms and system terms"
ON public.clinical_consent_terms
FOR SELECT
TO authenticated
USING (
  is_system = true
  OR (clinic_id IS NOT NULL AND clinic_id = public.user_clinic_id(auth.uid()))
);

CREATE POLICY "Owners/admins create clinic terms"
ON public.clinical_consent_terms
FOR INSERT
TO authenticated
WITH CHECK (
  is_system = false
  AND clinic_id IS NOT NULL
  AND clinic_id = public.user_clinic_id(auth.uid())
  AND public.is_clinic_admin(auth.uid(), clinic_id)
);

CREATE POLICY "Owners/admins update clinic terms"
ON public.clinical_consent_terms
FOR UPDATE
TO authenticated
USING (
  is_system = false
  AND clinic_id IS NOT NULL
  AND clinic_id = public.user_clinic_id(auth.uid())
  AND public.is_clinic_admin(auth.uid(), clinic_id)
)
WITH CHECK (
  is_system = false
  AND clinic_id IS NOT NULL
  AND clinic_id = public.user_clinic_id(auth.uid())
);

CREATE POLICY "Owners/admins delete clinic terms"
ON public.clinical_consent_terms
FOR DELETE
TO authenticated
USING (
  is_system = false
  AND clinic_id IS NOT NULL
  AND clinic_id = public.user_clinic_id(auth.uid())
  AND public.is_clinic_admin(auth.uid(), clinic_id)
  AND NOT EXISTS (
    SELECT 1 FROM public.clinical_consent_acceptances a
    WHERE a.consent_term_id = clinical_consent_terms.id
  )
);

CREATE POLICY "Clinic members read acceptances"
ON public.clinical_consent_acceptances
FOR SELECT
TO authenticated
USING (clinic_id = public.user_clinic_id(auth.uid()));

CREATE POLICY "Clinic members insert acceptances"
ON public.clinical_consent_acceptances
FOR INSERT
TO authenticated
WITH CHECK (clinic_id = public.user_clinic_id(auth.uid()));

CREATE POLICY "Clinic members revoke acceptances"
ON public.clinical_consent_acceptances
FOR UPDATE
TO authenticated
USING (clinic_id = public.user_clinic_id(auth.uid()))
WITH CHECK (clinic_id = public.user_clinic_id(auth.uid()));

-- =====================================================
-- SEEDS — Termos padrão do sistema (Estética)
-- =====================================================
INSERT INTO public.clinical_consent_terms (
  clinic_id, specialty_slug, title, description, content, consent_type,
  version, is_system, is_default, is_active,
  requires_signature, requires_patient_name, requires_cpf, requires_ip, requires_geolocation
) VALUES
(NULL, 'estetica',
 'Termo de Consentimento - Toxina Botulínica',
 'Termo padrão para procedimentos com toxina botulínica.',
 'TERMO DE CONSENTIMENTO INFORMADO PARA APLICAÇÃO DE TOXINA BOTULÍNICA

Eu, paciente abaixo identificado, declaro que fui devidamente informado(a) sobre o procedimento de aplicação de toxina botulínica, seus benefícios, riscos e alternativas.

INDICAÇÕES:
O procedimento é indicado para suavização de rugas dinâmicas faciais, tratamento de hiperidrose e outras condições médicas.

PROCEDIMENTO:
A toxina botulínica será injetada nos músculos previamente definidos, causando relaxamento temporário da musculatura tratada.

EFEITOS ESPERADOS:
O início do efeito ocorre entre 48-72 horas após a aplicação, com resultado máximo em 15-30 dias. A duração média é de 4-6 meses.

RISCOS E COMPLICAÇÕES POSSÍVEIS:
- Dor, edema e equimose no local da aplicação
- Cefaleia transitória
- Ptose palpebral ou assimetria temporária
- Reações alérgicas (raras)

RECOMENDAÇÕES PÓS-PROCEDIMENTO:
- Não massagear a área tratada por 4 horas
- Evitar atividades físicas intensas por 24 horas
- Não deitar por 4 horas após o procedimento

Declaro que li, compreendi e concordo com as informações acima.',
 'toxin', 1, true, true, true, true, true, true, true, false),

(NULL, 'estetica',
 'Termo de Consentimento - Preenchimento Facial',
 'Termo padrão para procedimentos de preenchimento facial.',
 'TERMO DE CONSENTIMENTO INFORMADO PARA PREENCHIMENTO FACIAL

Eu, paciente abaixo identificado, declaro que fui devidamente informado(a) sobre o procedimento de preenchimento facial com ácido hialurônico ou similar.

INDICAÇÕES:
Restauração de volume, harmonização facial, tratamento de sulcos e rugas estáticas.

PROCEDIMENTO:
O preenchedor será injetado nas áreas previamente definidas, proporcionando volume e sustentação aos tecidos.

RESULTADOS ESPERADOS:
Resultado imediato com melhora progressiva em até 30 dias. Duração média de 12-18 meses dependendo do produto e área tratada.

RISCOS E COMPLICAÇÕES POSSÍVEIS:
- Edema, equimose e dor local
- Assimetria
- Nódulos ou granulomas
- Infecção local
- Necrose tecidual (rara)
- Embolia vascular (muito rara)

RECOMENDAÇÕES PÓS-PROCEDIMENTO:
- Aplicar gelo nas primeiras 24 horas
- Evitar exposição solar intensa por 48 horas
- Evitar maquiagem por 12 horas

Declaro que li, compreendi e concordo com as informações acima.',
 'filler', 1, true, true, true, true, true, true, true, false),

(NULL, 'estetica',
 'Termo de Consentimento - Bioestimulador de Colágeno',
 'Termo padrão para aplicação de bioestimuladores de colágeno.',
 'TERMO DE CONSENTIMENTO INFORMADO PARA BIOESTIMULADOR DE COLÁGENO

Eu, paciente abaixo identificado, declaro que fui devidamente informado(a) sobre o procedimento de aplicação de bioestimulador de colágeno.

INDICAÇÕES:
Estímulo à produção de colágeno, melhora da qualidade da pele, tratamento de flacidez cutânea.

PROCEDIMENTO:
O bioestimulador será injetado na derme ou subdérmico, estimulando a produção natural de colágeno pelo organismo.

RESULTADOS ESPERADOS:
Resultado progressivo em 60-90 dias, com melhora contínua. Podem ser necessárias múltiplas sessões. Duração média de 18-24 meses.

RISCOS E COMPLICAÇÕES POSSÍVEIS:
- Edema, equimose e dor local
- Nódulos (especialmente se técnica incorreta)
- Assimetria
- Hipersensibilidade

RECOMENDAÇÕES PÓS-PROCEDIMENTO:
- Massagear a área conforme orientação por 5-7 dias
- Evitar atividades físicas intensas por 24 horas
- Hidratação adequada

Declaro que li, compreendi e concordo com as informações acima.',
 'biostimulator', 1, true, true, true, true, true, true, true, false),

(NULL, 'estetica',
 'Termo de Consentimento Geral - Procedimentos Estéticos',
 'Termo geral aplicável a qualquer procedimento estético.',
 'TERMO DE CONSENTIMENTO GERAL PARA PROCEDIMENTOS ESTÉTICOS

Eu, paciente abaixo identificado, declaro que fui devidamente informado(a) sobre os procedimentos estéticos que serão realizados.

Declaro estar ciente de que:
1. Todo procedimento estético possui riscos inerentes
2. Fui informado sobre alternativas de tratamento
3. Forneci todas as informações sobre minha saúde de forma verdadeira
4. Estou ciente das recomendações pré e pós-procedimento

Declaro que li, compreendi e concordo com as informações acima.',
 'general', 1, true, true, true, true, true, false, true, false);
