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
import { logAudit } from '@/utils/auditLog';

export interface JudicialReportSection {
  key: string;
  title: string;
  content: string;
  visible: boolean;
  fixed?: boolean; // sections that cannot be edited (e.g. limitation of scope)
}

export interface RelatorioJudicialAggregated {
  patientName: string;
  patientBirthDate: string | null;
  professionalName: string;
  professionalRegistration: string;
  periodStart: string;
  periodEnd: string;
  totalSessions: number;
}

interface UseRelatorioJudicialDataResult {
  loading: boolean;
  saving: boolean;
  aggregateJudicialReportData: (
    patientId: string,
    periodStart: string,
    periodEnd: string,
  ) => Promise<{ sections: JudicialReportSection[]; aggregated: RelatorioJudicialAggregated } | null>;
  saveJudicialReport: (params: {
    patientId: string;
    sections: JudicialReportSection[];
    professionalName: string;
    patientName: string;
    finalidade: string;
    cienciaDeclarada: boolean;
  }) => Promise<string | null>;
}

export function useRelatorioJudicialData(): UseRelatorioJudicialDataResult {
  const { clinic } = useClinicData();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const aggregateJudicialReportData = useCallback(
    async (patientId: string, periodStart: string, periodEnd: string) => {
      if (!clinic?.id) return null;
      setLoading(true);

      try {
        // 1) Patient data
        const { data: patient } = await supabase
          .from('patients')
          .select('full_name, birth_date, cpf')
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

        // 3) Sessions in period (safe fields only - NO confidential notes)
        const { data: sessoes } = await supabase
          .from('sessoes_psicologia')
          .select('numero_sessao, data_sessao, tema_central, modalidade, abordagem_terapeutica, intervencoes_tags, evolucao_caso, adesao_terapeutica')
          .eq('patient_id', patientId)
          .eq('clinic_id', clinic.id)
          .gte('data_sessao', periodStart)
          .lte('data_sessao', periodEnd)
          .order('data_sessao', { ascending: true });

        const sessionsList = sessoes || [];

        const fmtDate = (d: string) => {
          try { return format(new Date(d), 'dd/MM/yyyy', { locale: ptBR }); } catch { return d; }
        };

        const aggregated: RelatorioJudicialAggregated = {
          patientName: patient.full_name || '',
          patientBirthDate: patient.birth_date,
          professionalName,
          professionalRegistration,
          periodStart,
          periodEnd,
          totalSessions: sessionsList.length,
        };

        // Derive technique summary
        const tecnicasSet = new Set<string>();
        const modalidades = new Set<string>();
        sessionsList.forEach((s: any) => {
          if (s.intervencoes_tags && Array.isArray(s.intervencoes_tags)) {
            s.intervencoes_tags.forEach((t: string) => tecnicasSet.add(t));
          }
          if (s.abordagem_terapeutica) tecnicasSet.add(s.abordagem_terapeutica);
          if (s.modalidade) modalidades.add(s.modalidade);
        });

        const modalidadeText = modalidades.size > 0
          ? Array.from(modalidades).join(', ')
          : '[Informar modalidade]';

        const tecnicasText = tecnicasSet.size > 0
          ? Array.from(tecnicasSet).join(', ')
          : '[Informar técnicas utilizadas]';

        // Frequency description
        let frequenciaText = '[Informar frequência das sessões]';
        if (sessionsList.length >= 2) {
          const first = new Date(sessionsList[0].data_sessao);
          const last = new Date(sessionsList[sessionsList.length - 1].data_sessao);
          const weeks = Math.max(1, Math.round((last.getTime() - first.getTime()) / (7 * 24 * 60 * 60 * 1000)));
          const perWeek = (sessionsList.length / weeks).toFixed(1);
          frequenciaText = `Aproximadamente ${perWeek} sessão(ões) por semana, totalizando ${sessionsList.length} sessões no período.`;
        }

        const sections: JudicialReportSection[] = [
          {
            key: 'identificacao',
            title: '1. Identificação',
            content: [
              `Nome: ${aggregated.patientName}`,
              aggregated.patientBirthDate ? `Data de Nascimento: ${fmtDate(aggregated.patientBirthDate)}` : '',
              'Documento: [Informar se autorizado]',
              `Profissional responsável: ${professionalName}`,
              professionalRegistration ? `CRP: ${professionalRegistration}` : '',
              `Período de acompanhamento: ${fmtDate(periodStart)} a ${fmtDate(periodEnd)}`,
              `Número total de sessões: ${aggregated.totalSessions}`,
            ].filter(Boolean).join('\n'),
            visible: true,
          },
          {
            key: 'finalidade',
            title: '2. Finalidade do Relatório',
            content: '[Este campo será preenchido com a finalidade declarada]',
            visible: true,
          },
          {
            key: 'descricao_acompanhamento',
            title: '3. Descrição do Acompanhamento',
            content: [
              `Frequência: ${frequenciaText}`,
              '',
              `Modalidade: ${modalidadeText}`,
              '',
              `Técnicas utilizadas: ${tecnicasText}`,
            ].join('\n'),
            visible: true,
          },
          {
            key: 'observacoes_tecnicas',
            title: '4. Observações Técnicas',
            content: '[Descreva as observações técnicas pertinentes ao acompanhamento, baseadas nos dados clínicos disponíveis. Não incluir informações confidenciais ou dados sensíveis.]',
            visible: true,
          },
          {
            key: 'limitacao_escopo',
            title: '5. Limitação de Escopo',
            content: 'Informa-se que o presente relatório refere-se exclusivamente ao acompanhamento psicológico realizado no período descrito, não se caracterizando como laudo pericial.',
            visible: true,
            fixed: true,
          },
          {
            key: 'conclusao_tecnica',
            title: '6. Conclusão Técnica',
            content: '[Apresente a conclusão técnica com base nos dados do acompanhamento psicológico.]',
            visible: true,
          },
        ];

        return { sections, aggregated };
      } catch (err) {
        console.error('Error aggregating judicial report data:', err);
        toast.error('Erro ao gerar dados do relatório judicial');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [clinic?.id],
  );

  const saveJudicialReport = useCallback(
    async (params: {
      patientId: string;
      sections: JudicialReportSection[];
      professionalName: string;
      patientName: string;
      finalidade: string;
      cienciaDeclarada: boolean;
    }): Promise<string | null> => {
      if (!clinic?.id) return null;
      if (!params.finalidade.trim()) {
        toast.error('A finalidade do relatório é obrigatória');
        return null;
      }
      if (!params.cienciaDeclarada) {
        toast.error('É necessário declarar ciência sobre a natureza do documento');
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

        // Audit log for judicial document emission
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user?.id) {
          await logAudit({
            clinicId: clinic.id,
            action: 'judicial_report_emitted',
            entityType: 'clinical_document',
            entityId: registered.id,
            metadata: {
              document_reference: docReference,
              finalidade: params.finalidade,
              patient_name: params.patientName,
              professional_name: params.professionalName,
            },
          });
        }

        toast.success(`Relatório Judicial registrado: ${docReference}`);
        return registered.id;
      } catch (err) {
        console.error('Error saving judicial report:', err);
        toast.error('Erro ao salvar relatório judicial');
        return null;
      } finally {
        setSaving(false);
      }
    },
    [clinic?.id],
  );

  return { loading, saving, aggregateJudicialReportData, saveJudicialReport };
}
