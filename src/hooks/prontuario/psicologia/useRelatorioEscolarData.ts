import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useClinicData } from '@/hooks/useClinicData';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  generateHash,
  getNextDocumentNumber,
  buildDocumentReference,
  registerClinicalDocument,
} from '@/utils/documentControl';

export interface SchoolReportSection {
  key: string;
  title: string;
  content: string;
  visible: boolean;
}

export interface RelatorioEscolarAggregated {
  patientName: string;
  patientBirthDate: string | null;
  escola: string;
  serie: string;
  professionalName: string;
  professionalRegistration: string;
  periodStart: string;
  periodEnd: string;
  totalSessions: number;
  queixaPrincipal: string;
}

interface UseRelatorioEscolarDataResult {
  loading: boolean;
  saving: boolean;
  aggregateSchoolReportData: (
    patientId: string,
    periodStart: string,
    periodEnd: string,
  ) => Promise<{ sections: SchoolReportSection[]; aggregated: RelatorioEscolarAggregated } | null>;
  saveSchoolReport: (params: {
    patientId: string;
    sections: SchoolReportSection[];
    professionalName: string;
    patientName: string;
    autorizacaoResponsavel: boolean;
    dataAutorizacao: string;
  }) => Promise<string | null>;
}

export function useRelatorioEscolarData(): UseRelatorioEscolarDataResult {
  const { clinic } = useClinicData();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const aggregateSchoolReportData = useCallback(
    async (patientId: string, periodStart: string, periodEnd: string) => {
      if (!clinic?.id) return null;
      setLoading(true);

      try {
        // 1) Patient data
        const { data: patient } = await supabase
          .from('patients')
          .select('full_name, birth_date, gender, notes')
          .eq('id', patientId)
          .eq('clinic_id', clinic.id)
          .single();

        if (!patient) throw new Error('Paciente não encontrado');

        // 2) Current professional
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData?.user?.id;
        let professionalName = '';
        let professionalRegistration = '';
        if (userId) {
          const { data: prof } = await supabase
            .from('professionals')
            .select('full_name, registration_number')
            .eq('user_id', userId)
            .eq('clinic_id', clinic.id)
            .eq('is_active', true)
            .single();
          if (prof) {
            professionalName = prof.full_name || '';
            professionalRegistration = prof.registration_number || '';
          }
        }

        // 3) Sessions in period (only safe fields)
        const { data: sessoes } = await supabase
          .from('sessoes_psicologia')
          .select('numero_sessao, data_sessao, tema_central, humor_paciente, emocoes_predominantes, evolucao_caso, adesao_terapeutica')
          .eq('patient_id', patientId)
          .eq('clinic_id', clinic.id)
          .gte('data_sessao', periodStart)
          .lte('data_sessao', periodEnd)
          .order('data_sessao', { ascending: true });

        const sessionsList = sessoes || [];

        // 4) Anamnese (for queixa)
        const { data: anamneses } = await supabase
          .from('patient_anamnese_psicologia')
          .select('queixa_principal')
          .eq('patient_id', patientId)
          .eq('clinic_id', clinic.id)
          .eq('is_current', true)
          .limit(1);

        const anamnese = anamneses?.[0] || null;

        const fmtDate = (d: string) => {
          try { return format(new Date(d), 'dd/MM/yyyy', { locale: ptBR }); } catch { return d; }
        };

        const aggregated: RelatorioEscolarAggregated = {
          patientName: patient.full_name || '',
          patientBirthDate: patient.birth_date,
          escola: '',
          serie: '',
          professionalName,
          professionalRegistration,
          periodStart,
          periodEnd,
          totalSessions: sessionsList.length,
          queixaPrincipal: anamnese?.queixa_principal || '',
        };

        // Analyze behavioral patterns from sessions (safe data only)
        const humorSet = new Set<string>();
        const emocoesSet = new Set<string>();
        sessionsList.forEach((s: any) => {
          if (s.humor_paciente) humorSet.add(s.humor_paciente);
          if (s.emocoes_predominantes && Array.isArray(s.emocoes_predominantes)) {
            s.emocoes_predominantes.forEach((e: string) => emocoesSet.add(e));
          }
        });

        // Build school-appropriate sections (NO sensitive data)
        const sections: SchoolReportSection[] = [
          {
            key: 'identificacao',
            title: '1. Identificação',
            content: [
              `Nome da criança/adolescente: ${aggregated.patientName}`,
              aggregated.patientBirthDate ? `Data de Nascimento: ${fmtDate(aggregated.patientBirthDate)}` : '',
              'Escola: [Informar]',
              'Série/Ano: [Informar]',
              `Profissional responsável: ${professionalName}`,
              professionalRegistration ? `CRP: ${professionalRegistration}` : '',
              `Período de acompanhamento: ${fmtDate(periodStart)} a ${fmtDate(periodEnd)}`,
            ].filter(Boolean).join('\n'),
            visible: true,
          },
          {
            key: 'motivo_encaminhamento',
            title: '2. Motivo do Encaminhamento',
            content: aggregated.queixaPrincipal || '[Descreva o motivo do encaminhamento ou queixa inicial apresentada pela família ou escola]',
            visible: true,
          },
          {
            key: 'observacoes_comportamentais',
            title: '3. Observações Comportamentais',
            content: [
              'Atenção e Concentração:',
              '[Descreva as observações sobre atenção e concentração da criança durante as sessões]',
              '',
              'Organização:',
              '[Descreva as observações sobre organização e planejamento]',
              '',
              'Interação Social:',
              '[Descreva as observações sobre interação com pares e adultos]',
              '',
              'Regulação Emocional:',
              '[Descreva as observações sobre capacidade de regulação emocional]',
            ].join('\n'),
            visible: true,
          },
          {
            key: 'aspectos_emocionais',
            title: '4. Aspectos Emocionais',
            content: [
              'Ansiedade:',
              '[Descreva observações relacionadas à ansiedade em contexto escolar]',
              '',
              'Autoestima:',
              '[Descreva observações sobre autoestima e autoconceito]',
              '',
              'Segurança Emocional:',
              '[Descreva observações sobre segurança emocional e vínculo]',
            ].join('\n'),
            visible: true,
          },
          {
            key: 'orientacoes_escola',
            title: '5. Orientações à Escola',
            content: [
              'Com base no acompanhamento psicológico realizado, sugerem-se as seguintes orientações ao ambiente escolar:',
              '',
              '• [Orientação 1]',
              '• [Orientação 2]',
              '• [Orientação 3]',
              '',
              'Observação: Estas orientações visam apoiar o desenvolvimento da criança/adolescente no ambiente escolar e devem ser adaptadas conforme a realidade da instituição.',
            ].join('\n'),
            visible: true,
          },
          {
            key: 'consideracoes_finais',
            title: '6. Considerações Finais',
            content: `${aggregated.patientName} encontra-se em acompanhamento psicológico desde ${fmtDate(periodStart)}, tendo realizado ${aggregated.totalSessions} sessão(ões) no período avaliado. O acompanhamento continua em andamento e a família está ciente das orientações fornecidas à escola.`,
            visible: true,
          },
        ];

        return { sections, aggregated };
      } catch (err) {
        console.error('Error aggregating school report data:', err);
        toast.error('Erro ao gerar dados do relatório escolar');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [clinic?.id],
  );

  const saveSchoolReport = useCallback(
    async (params: {
      patientId: string;
      sections: SchoolReportSection[];
      professionalName: string;
      patientName: string;
      autorizacaoResponsavel: boolean;
      dataAutorizacao: string;
    }): Promise<string | null> => {
      if (!clinic?.id) return null;
      if (!params.autorizacaoResponsavel) {
        toast.error('Autorização do responsável é obrigatória');
        return null;
      }

      setSaving(true);
      try {
        const visibleSections = params.sections.filter(s => s.visible);
        const contentString = visibleSections.map(s => `${s.title}\n${s.content}`).join('\n\n');
        const docHash = await generateHash(contentString);

        const seqNum = await getNextDocumentNumber(clinic.id);
        const docReference = buildDocumentReference('relatorio', seqNum);

        const registered = await registerClinicalDocument({
          clinicId: clinic.id,
          patientId: params.patientId,
          documentType: 'relatorio',
          documentReference: docReference,
          documentHash: docHash,
          patientName: params.patientName,
          professionalName: params.professionalName,
        });

        toast.success(`Relatório Escolar registrado: ${docReference}`);
        return registered.id;
      } catch (err) {
        console.error('Error saving school report:', err);
        toast.error('Erro ao salvar relatório escolar');
        return null;
      } finally {
        setSaving(false);
      }
    },
    [clinic?.id],
  );

  return { loading, saving, aggregateSchoolReportData, saveSchoolReport };
}
