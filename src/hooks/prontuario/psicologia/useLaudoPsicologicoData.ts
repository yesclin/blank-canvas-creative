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

export interface LaudoSection {
  key: string;
  title: string;
  content: string;
  visible: boolean;
  editable: boolean;
}

export interface InstrumentoExtraido {
  nome: string;
  tipo: string;
  resultado: string;
  interpretacao: string;
}

export interface AvaliacaoPsicodiagnostico {
  id: string;
  createdAt: string;
  templateName: string;
  responses: Record<string, any>;
}

export interface LaudoAggregated {
  patientName: string;
  patientBirthDate: string | null;
  patientDocument: string | null;
  professionalName: string;
  professionalRegistration: string;
  finalidade: string;
  demandaFormal: string;
  perguntaAvaliativa: string;
  contextoSolicitacao: string;
  solicitante: string;
  instrumentos: InstrumentoExtraido[];
  hipotesePrincipal: string;
  hipotesesSecundarias: string;
  fundamentacaoInstrumentos: string;
  referencialTeorico: string;
  limitacoesProcesso: string;
  conclusaoParcial: string;
  encaminhamentos: string[];
  numSessoesPrevistas: string;
  avaliacaoId: string;
}

const LIMITACAO_TECNICA_TEXTO = `Este laudo foi elaborado com base em dados obtidos por meio de instrumentos psicológicos padronizados e validados pelo Sistema de Avaliação de Testes Psicológicos (SATEPSI/CFP), observação clínica e entrevista. Os resultados refletem o funcionamento psicológico do(a) avaliando(a) no momento da avaliação, podendo sofrer alterações em função de fatores contextuais, desenvolvimentais ou clínicos. Este documento não substitui avaliação pericial quando necessária, devendo ser interpretado por profissional habilitado.`;

function extractInstrumentos(responses: Record<string, any>): InstrumentoExtraido[] {
  const instrumentos: InstrumentoExtraido[] = [];
  for (let i = 1; i <= 5; i++) {
    const nome = responses[`pd_instrumento_${i}_nome`];
    if (nome && String(nome).trim()) {
      instrumentos.push({
        nome: String(nome).trim(),
        tipo: responses[`pd_instrumento_${i}_tipo`] || '',
        resultado: responses[`pd_instrumento_${i}_resultado`] || '',
        interpretacao: responses[`pd_instrumento_${i}_interpretacao`] || '',
      });
    }
  }
  return instrumentos;
}

interface UseLaudoPsicologicoDataResult {
  loading: boolean;
  saving: boolean;
  loadingAvaliacoes: boolean;
  avaliacoes: AvaliacaoPsicodiagnostico[];
  fetchAvaliacoes: (patientId: string) => Promise<void>;
  buildLaudo: (avaliacaoId: string, patientId: string) => Promise<{ sections: LaudoSection[]; aggregated: LaudoAggregated } | null>;
  saveLaudo: (params: {
    patientId: string;
    sections: LaudoSection[];
    professionalName: string;
    patientName: string;
    avaliacaoId: string;
    isDraft: boolean;
  }) => Promise<string | null>;
}

export function useLaudoPsicologicoData(): UseLaudoPsicologicoDataResult {
  const { clinic } = useClinicData();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingAvaliacoes, setLoadingAvaliacoes] = useState(false);
  const [avaliacoes, setAvaliacoes] = useState<AvaliacaoPsicodiagnostico[]>([]);

  const fetchAvaliacoes = useCallback(async (patientId: string) => {
    if (!clinic?.id) return;
    setLoadingAvaliacoes(true);
    try {
      const { data } = await supabase
        .from('anamnesis_records')
        .select('id, created_at, responses, anamnesis_templates!inner(name)')
        .eq('patient_id', patientId)
        .eq('clinic_id', clinic.id)
        .like('anamnesis_templates.name', '%Avaliação Psicológica%')
        .order('created_at', { ascending: false });

      const records = (data || []).map((r: any) => ({
        id: r.id,
        createdAt: r.created_at,
        templateName: r.anamnesis_templates?.name || '',
        responses: (r.responses || {}) as Record<string, any>,
      }));

      // Filter only those with at least one instrument
      const withInstruments = records.filter(r => extractInstrumentos(r.responses).length > 0);
      setAvaliacoes(withInstruments);
    } catch (err) {
      console.error('Error fetching avaliacoes:', err);
      toast.error('Erro ao buscar avaliações');
    } finally {
      setLoadingAvaliacoes(false);
    }
  }, [clinic?.id]);

  const buildLaudo = useCallback(async (avaliacaoId: string, patientId: string) => {
    if (!clinic?.id) return null;
    setLoading(true);
    try {
      // Patient
      const { data: patient } = await supabase
        .from('patients')
        .select('full_name, birth_date, gender, cpf')
        .eq('id', patientId)
        .eq('clinic_id', clinic.id)
        .single();
      if (!patient) throw new Error('Paciente não encontrado');

      // Professional
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

      // Get the anamnesis record
      const avaliacao = avaliacoes.find(a => a.id === avaliacaoId);
      if (!avaliacao) throw new Error('Avaliação não encontrada');

      const r = avaliacao.responses;
      const instrumentos = extractInstrumentos(r);

      const encaminhamentos: string[] = [];
      if (r.pd_encaminhamento_medico === 'Sim') encaminhamentos.push('Encaminhamento médico');
      if (r.pd_encaminhamento_psicopedagogico === 'Sim') encaminhamentos.push('Encaminhamento psicopedagógico');
      if (r.pd_encaminhamento_psiquiatrico === 'Sim') encaminhamentos.push('Encaminhamento psiquiátrico');
      if (r.pd_orientacoes_gerais) encaminhamentos.push(r.pd_orientacoes_gerais);

      const fmtDate = (d: string | null) => {
        if (!d) return '';
        try { return format(new Date(d), 'dd/MM/yyyy', { locale: ptBR }); } catch { return d; }
      };

      const aggregated: LaudoAggregated = {
        patientName: patient.full_name || '',
        patientBirthDate: patient.birth_date,
        patientDocument: (patient as any).cpf || null,
        professionalName,
        professionalRegistration,
        finalidade: r.pd_finalidade_avaliacao || 'Não informada',
        demandaFormal: r.pd_motivo_encaminhamento || '',
        perguntaAvaliativa: r.pd_pergunta_avaliativa || '',
        contextoSolicitacao: r.pd_contexto_solicitacao || '',
        solicitante: r.pd_solicitante || '',
        instrumentos,
        hipotesePrincipal: r.pd_hipotese_principal || '',
        hipotesesSecundarias: r.pd_hipoteses_secundarias || '',
        fundamentacaoInstrumentos: r.pd_fundamentacao_instrumentos || '',
        referencialTeorico: r.pd_referencial_teorico || '',
        limitacoesProcesso: r.pd_limitacoes_processo || '',
        conclusaoParcial: r.pd_conclusao || '',
        encaminhamentos,
        numSessoesPrevistas: r.pd_num_sessoes_previstas || '',
        avaliacaoId,
      };

      // Build sections
      const sections: LaudoSection[] = [
        {
          key: 'identificacao',
          title: '1. Identificação',
          content: [
            `Nome: ${aggregated.patientName}`,
            aggregated.patientBirthDate ? `Data de Nascimento: ${fmtDate(aggregated.patientBirthDate)}` : '',
            aggregated.patientDocument ? `CPF: ${aggregated.patientDocument}` : '',
            `Psicólogo(a) Responsável: ${professionalName}`,
            professionalRegistration ? `CRP: ${professionalRegistration}` : '',
            `Finalidade da Avaliação: ${aggregated.finalidade}`,
          ].filter(Boolean).join('\n'),
          visible: true,
          editable: true,
        },
        {
          key: 'demanda',
          title: '2. Descrição da Demanda',
          content: [
            aggregated.solicitante ? `Solicitante: ${aggregated.solicitante}` : '',
            aggregated.demandaFormal ? `\n${aggregated.demandaFormal}` : '',
            aggregated.perguntaAvaliativa ? `\nPergunta avaliativa: ${aggregated.perguntaAvaliativa}` : '',
            aggregated.contextoSolicitacao ? `\nContexto: ${aggregated.contextoSolicitacao}` : '',
          ].filter(Boolean).join('\n'),
          visible: true,
          editable: true,
        },
        {
          key: 'procedimentos',
          title: '3. Procedimentos Utilizados',
          content: [
            aggregated.numSessoesPrevistas ? `Sessões previstas: ${aggregated.numSessoesPrevistas}` : '',
            '',
            'Instrumentos aplicados:',
            ...instrumentos.map((inst, i) => `${i + 1}. ${inst.nome}${inst.tipo ? ` (${inst.tipo})` : ''}`),
          ].filter(Boolean).join('\n'),
          visible: true,
          editable: true,
        },
        {
          key: 'analise_resultados',
          title: '4. Análise dos Resultados',
          content: instrumentos.map((inst, i) => [
            `${i + 1}. ${inst.nome}`,
            inst.resultado ? `   Resultado: ${inst.resultado}` : '',
            inst.interpretacao ? `   Interpretação: ${inst.interpretacao}` : '',
          ].filter(Boolean).join('\n')).join('\n\n'),
          visible: true,
          editable: true,
        },
        {
          key: 'discussao',
          title: '5. Discussão Técnica',
          content: [
            aggregated.hipotesePrincipal ? `Hipótese principal:\n${aggregated.hipotesePrincipal}` : '',
            aggregated.hipotesesSecundarias ? `\nHipóteses secundárias:\n${aggregated.hipotesesSecundarias}` : '',
            aggregated.referencialTeorico ? `\nReferencial teórico:\n${aggregated.referencialTeorico}` : '',
            aggregated.fundamentacaoInstrumentos ? `\nFundamentação nos instrumentos:\n${aggregated.fundamentacaoInstrumentos}` : '',
          ].filter(Boolean).join('\n'),
          visible: true,
          editable: true,
        },
        {
          key: 'conclusao',
          title: '6. Conclusão',
          content: aggregated.conclusaoParcial || '[Preencha a conclusão do laudo]',
          visible: true,
          editable: true,
        },
        {
          key: 'encaminhamentos',
          title: '7. Encaminhamentos',
          content: aggregated.encaminhamentos.length > 0
            ? aggregated.encaminhamentos.map(e => `• ${e}`).join('\n')
            : 'Sem encaminhamentos registrados.',
          visible: aggregated.encaminhamentos.length > 0,
          editable: true,
        },
        {
          key: 'limitacao_tecnica',
          title: '8. Limitação Técnica',
          content: LIMITACAO_TECNICA_TEXTO,
          visible: true,
          editable: false,
        },
      ];

      return { sections, aggregated };
    } catch (err) {
      console.error('Error building laudo:', err);
      toast.error('Erro ao gerar dados do laudo');
      return null;
    } finally {
      setLoading(false);
    }
  }, [clinic?.id, avaliacoes]);

  const saveLaudo = useCallback(async (params: {
    patientId: string;
    sections: LaudoSection[];
    professionalName: string;
    patientName: string;
    avaliacaoId: string;
    isDraft: boolean;
  }): Promise<string | null> => {
    if (!clinic?.id) return null;
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
        sourceRecordId: params.avaliacaoId,
      });

      toast.success(`Laudo ${params.isDraft ? 'salvo como rascunho' : 'registrado'}: ${docReference}`);
      return registered.id;
    } catch (err) {
      console.error('Error saving laudo:', err);
      toast.error('Erro ao salvar laudo');
      return null;
    } finally {
      setSaving(false);
    }
  }, [clinic?.id]);

  return { loading, saving, loadingAvaliacoes, avaliacoes, fetchAvaliacoes, buildLaudo, saveLaudo };
}
