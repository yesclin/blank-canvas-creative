import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useClinicData } from '@/hooks/useClinicData';
import { toast } from 'sonner';
import { logAppError } from '@/lib/logAppError';
import { newTraceId } from '@/lib/traceId';
import type { AestheticConsentRecord, ConsentType } from '@/components/prontuario/aesthetics/types';

/**
 * Tabela canônica de aceites de termos clínicos: `clinical_consent_acceptances`.
 * Este hook mapeia o shape histórico `AestheticConsentRecord` (term_content, term_version string)
 * para os campos reais (term_content_snapshot, term_version integer).
 */
const CONSENT_TABLE = 'clinical_consent_acceptances';

function parseTermVersion(v: string | number): number {
  if (typeof v === 'number') return Number.isFinite(v) ? v : 1;
  // Aceita "1", "1.2", "v2" etc. Pega o primeiro inteiro encontrado.
  const match = String(v).match(/\d+/);
  return match ? parseInt(match[0], 10) : 1;
}

function mapRowToRecord(row: any): AestheticConsentRecord & { procedure_id?: string; procedure_name?: string } {
  return {
    id: row.id,
    clinic_id: row.clinic_id,
    patient_id: row.patient_id,
    appointment_id: row.appointment_id ?? null,
    consent_type: row.consent_type as ConsentType,
    term_title: row.term_title,
    term_content: row.term_content_snapshot ?? '',
    term_version: row.term_version,
    accepted_at: row.accepted_at,
    ip_address: row.ip_address ?? null,
    user_agent: row.user_agent ?? null,
    signature_data: row.signature_data ?? null,
    created_by: row.created_by ?? null,
    procedure_id: row.procedure_id ?? undefined,
    procedure_name: row.procedure_name ?? undefined,
  };
}

// Default consent templates
export const DEFAULT_CONSENT_TEMPLATES: Record<ConsentType, { title: string; content: string; version: string }> = {
  toxin: {
    title: 'Termo de Consentimento - Toxina Botulínica',
    version: '1.2',
    content: `TERMO DE CONSENTIMENTO INFORMADO PARA APLICAÇÃO DE TOXINA BOTULÍNICA

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

Declaro que li, compreendi e concordo com as informações acima.`,
  },
  filler: {
    title: 'Termo de Consentimento - Preenchimento Facial',
    version: '1.2',
    content: `TERMO DE CONSENTIMENTO INFORMADO PARA PREENCHIMENTO FACIAL

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

Declaro que li, compreendi e concordo com as informações acima.`,
  },
  biostimulator: {
    title: 'Termo de Consentimento - Bioestimulador de Colágeno',
    version: '1.1',
    content: `TERMO DE CONSENTIMENTO INFORMADO PARA BIOESTIMULADOR DE COLÁGENO

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

Declaro que li, compreendi e concordo com as informações acima.`,
  },
  general: {
    title: 'Termo de Consentimento Geral - Procedimentos Estéticos',
    version: '1.0',
    content: `TERMO DE CONSENTIMENTO GERAL PARA PROCEDIMENTOS ESTÉTICOS

Eu, paciente abaixo identificado, declaro que fui devidamente informado(a) sobre os procedimentos estéticos que serão realizados.

Declaro estar ciente de que:
1. Todo procedimento estético possui riscos inerentes
2. Fui informado sobre alternativas de tratamento
3. Forneci todas as informações sobre minha saúde de forma verdadeira
4. Estou ciente das recomendações pré e pós-procedimento

Declaro que li, compreendi e concordo com as informações acima.`,
  },
};

export interface Procedure {
  id: string;
  name: string;
  specialty: string | null;
}

export function useAestheticConsent(patientId: string | null) {
  const { clinic } = useClinicData();
  const queryClient = useQueryClient();

  const queryKey = ['aesthetic-consent', patientId];

  // Fetch consent records
  const { data: consents = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!patientId || !clinic?.id) return [];

      const { data, error } = await supabase
        .from(CONSENT_TABLE)
        .select('*')
        .eq('clinic_id', clinic.id)
        .eq('patient_id', patientId)
        .order('accepted_at', { ascending: false });

      if (error) {
        logAppError(error, {
          screen: 'Prontuário',
          component: 'useAestheticConsent',
          action: 'fetchConsents',
          patientId,
          clinicId: clinic.id,
          extra: { table: CONSENT_TABLE },
        });
        throw error;
      }

      return (data || []).map(mapRowToRecord);
    },
    enabled: !!patientId && !!clinic?.id,
  });

  // Fetch available procedures for the clinic
  const { data: procedures = [] } = useQuery({
    queryKey: ['procedures', clinic?.id],
    queryFn: async () => {
      if (!clinic?.id) return [];

      const { data, error } = await supabase
        .from('procedures')
        .select('id, name, specialty')
        .eq('clinic_id', clinic.id)
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.error('Error fetching procedures:', error);
        return [];
      }

      return data as Procedure[];
    },
    enabled: !!clinic?.id,
  });

  // Check if consent exists for a specific type
  const hasConsentForType = (type: ConsentType): boolean => {
    return consents.some(c => c.consent_type === type);
  };

  // Get latest consent for type
  const getLatestConsentForType = (type: ConsentType): AestheticConsentRecord | undefined => {
    return consents.find(c => c.consent_type === type);
  };

  // Get consents by procedure
  const getConsentsForProcedure = (procedureId: string) => {
    return consents.filter(c => (c as any).procedure_id === procedureId);
  };

  // Create consent record
  const createConsentMutation = useMutation({
    mutationFn: async (data: {
      consent_type: ConsentType;
      appointment_id?: string;
      procedure_id?: string;
      procedure_name?: string;
      signature_data?: string;
      custom_content?: string;
      /** Trace ID opcional vindo do componente para correlação ponta-a-ponta. */
      trace_id?: string;
    }) => {
      // Trace ID único do aceite — reusa o do componente se fornecido.
      const traceId = data.trace_id || newTraceId('consent');

      // Validações de campos obrigatórios — falham com mensagem específica antes do insert.
      const missing: string[] = [];
      if (!clinic?.id) missing.push('clinic_id');
      if (!patientId) missing.push('patient_id');
      if (!data.consent_type) missing.push('consent_type');
      if (!data.signature_data) missing.push('signature_data');

      const template = DEFAULT_CONSENT_TEMPLATES[data.consent_type];
      const termContent = data.custom_content || template?.content;
      if (!template?.title) missing.push('term_title');
      if (!termContent) missing.push('term_content');

      if (missing.length > 0) {
        const msg = `Campo obrigatório ausente: ${missing.join(', ')}`;
        console.warn('[useAestheticConsent] validation failed', {
          trace_id: traceId,
          missing,
          patient_id: patientId,
          clinic_id: clinic?.id,
        });
        toast.error(msg);
        throw new Error(msg);
      }

      const { data: userData } = await supabase.auth.getUser();
      const termVersion = parseTermVersion(template.version);

      const payload = {
        clinic_id: clinic!.id,
        patient_id: patientId!,
        appointment_id: data.appointment_id || null,
        consent_type: data.consent_type,
        term_title: template.title,
        term_content_snapshot: termContent,
        term_version: termVersion,
        signature_data: data.signature_data || null,
        procedure_id: data.procedure_id || null,
        procedure_name: data.procedure_name || null,
        ip_address: null,
        user_agent: navigator.userAgent,
        status: 'accepted',
        accepted_at: new Date().toISOString(),
        created_by: userData.user?.id ?? null,
      };

      console.info('[useAestheticConsent] insert payload', {
        trace_id: traceId,
        table: CONSENT_TABLE,
        clinic_id: payload.clinic_id,
        patient_id: payload.patient_id,
        appointment_id: payload.appointment_id,
        consent_type: payload.consent_type,
        procedure_id: payload.procedure_id,
        term_version: payload.term_version,
        signature_length: payload.signature_data?.length ?? 0,
        has_signature: !!payload.signature_data,
        user_id: payload.created_by,
      });

      const { data: result, error } = await supabase
        .from(CONSENT_TABLE)
        .insert(payload)
        .select()
        .single();

      if (error) {
        logAppError(error, {
          screen: 'Prontuário',
          component: 'useAestheticConsent',
          action: 'createConsent',
          traceId,
          patientId,
          appointmentId: data.appointment_id ?? null,
          clinicId: clinic?.id ?? null,
          userId: userData.user?.id ?? null,
          extra: {
            trace_id: traceId,
            table: CONSENT_TABLE,
            consent_type: data.consent_type,
            procedure_id: data.procedure_id,
            term_version: termVersion,
            signature_length: payload.signature_data?.length ?? 0,
            supabase_code: (error as any)?.code,
            supabase_details: (error as any)?.details,
            supabase_hint: (error as any)?.hint,
          },
        });
        // Anexa trace_id ao erro propagado para o componente registrar/exibir
        (error as any).traceId = traceId;
        throw error;
      }

      console.info('[useAestheticConsent] consent created', {
        trace_id: traceId,
        consent_id: result?.id,
        consent_type: data.consent_type,
      });

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Termo aceito e assinado com sucesso');
    },
    onError: (error: any) => {
      const friendly = error?.message?.startsWith('Campo obrigatório')
        ? error.message
        : error?.message || 'Erro ao registrar consentimento';
      // Evita duplicar toast quando a validação já mostrou.
      if (!error?.message?.startsWith('Campo obrigatório')) {
        toast.error(friendly);
      }
    },
  });

  // Get version history for a consent type
  const getVersionHistory = (type: ConsentType) => {
    return consents
      .filter(c => c.consent_type === type)
      .sort((a, b) => new Date(b.accepted_at).getTime() - new Date(a.accepted_at).getTime());
  };

  return {
    consents,
    procedures,
    isLoading,
    hasConsentForType,
    getLatestConsentForType,
    getConsentsForProcedure,
    getVersionHistory,
    createConsent: createConsentMutation.mutateAsync,
    isCreating: createConsentMutation.isPending,
    templates: DEFAULT_CONSENT_TEMPLATES,
  };
}