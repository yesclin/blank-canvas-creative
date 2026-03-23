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

export interface ReportSection {
  key: string;
  title: string;
  content: string;
  visible: boolean;
  confidential?: boolean;
}

export interface RelatorioPsicologicoAggregated {
  patientName: string;
  patientBirthDate: string | null;
  patientGender: string | null;
  professionalName: string;
  professionalRegistration: string;
  periodStart: string;
  periodEnd: string;
  totalSessions: number;
  sessionDates: string[];
  queixaPrincipal: string;
  evolucaoPercebida: string[];
  tecnicasUtilizadas: string[];
  encaminhamentos: string[];
  objetivosTerapeuticos: string;
  metasCurto: string;
  metasMedio: string;
  metasLongo: string;
  abordagemTerapeutica: string;
  modalidade: string;
  riscosRegistrados: string[];
  observacoesConfidenciais: string[];
  riscoInterno: string[];
  // Intelligent analysis
  trendAnalysis: TrendAnalysis;
  riskAnalysis: RiskAnalysis;
  engagementAnalysis: EngagementAnalysis;
  techniqueAnalysis: TechniqueAnalysis;
}

// ─── Intelligent Analysis Types ───

interface TrendAnalysis {
  pattern: 'melhora' | 'estabilidade' | 'regressao' | 'insuficiente';
  lastValues: string[];
  description: string;
}

interface RiskAnalysis {
  hasHighRisk: boolean;
  highRiskCount: number;
  highRiskSessions: number[];
  currentLevel: string;
  description: string;
}

interface EngagementAnalysis {
  average: number;
  classification: 'alto' | 'medio' | 'baixo' | 'insuficiente';
  description: string;
}

interface TechniqueAnalysis {
  ranked: { technique: string; count: number }[];
  predominant: string[];
  description: string;
}

// ─── Analysis helpers ───

const EVOLUCAO_MAP: Record<string, number> = {
  melhorando: 1, estavel: 0, 'estável': 0, piorando: -1,
};

const RISCO_MAP: Record<string, number> = {
  ausente: 0, baixo: 1, moderado: 2, alto: 3,
};

const ENGAJAMENTO_MAP: Record<string, number> = {
  baixa: 1, baixo: 1, moderada: 2, moderado: 2, media: 2, 'média': 2, alta: 3, alto: 3, boa: 3,
};

function analyzeTrend(sessions: any[]): TrendAnalysis {
  const withEvol = sessions.filter(s => s.evolucao_caso);
  if (withEvol.length < 2) {
    return { pattern: 'insuficiente', lastValues: [], description: 'Dados insuficientes para análise de tendência.' };
  }

  const last3 = withEvol.slice(-3);
  const values = last3.map(s => s.evolucao_caso?.toLowerCase() || '');
  const mapped = values.map(v => EVOLUCAO_MAP[v] ?? 0);

  const avg = mapped.reduce((a, b) => a + b, 0) / mapped.length;

  let pattern: TrendAnalysis['pattern'];
  let description: string;

  if (avg > 0.3) {
    pattern = 'melhora';
    description = `Nas últimas ${last3.length} sessões avaliadas, observou-se uma tendência consistente de melhora no quadro clínico do(a) paciente.`;
  } else if (avg < -0.3) {
    pattern = 'regressao';
    description = `Nas últimas ${last3.length} sessões avaliadas, identificou-se uma tendência de regressão no quadro clínico, o que demanda atenção e possível revisão da estratégia terapêutica.`;
  } else {
    pattern = 'estabilidade';
    description = `Nas últimas ${last3.length} sessões avaliadas, o quadro clínico apresentou-se estável, sem variações significativas.`;
  }

  return { pattern, lastValues: values, description };
}

function analyzeRisk(sessions: any[]): RiskAnalysis {
  const highRiskSessions: number[] = [];
  let currentLevel = 'ausente';

  sessions.forEach((s: any) => {
    const level = s.risco_atual?.toLowerCase() || 'ausente';
    if (level === 'alto') {
      highRiskSessions.push(s.numero_sessao || 0);
    }
    currentLevel = level;
  });

  const hasHighRisk = highRiskSessions.length > 0;
  const highRiskCount = highRiskSessions.length;

  let description: string;
  if (highRiskCount >= 2) {
    description = `ATENÇÃO: Risco alto registrado em ${highRiskCount} sessões (sessões ${highRiskSessions.join(', ')}). A recorrência de risco elevado indica necessidade de monitoramento contínuo e possível encaminhamento complementar.`;
  } else if (highRiskCount === 1) {
    description = `Foi registrado risco alto em 1 sessão (sessão ${highRiskSessions[0]}). Recomenda-se monitoramento atento nas próximas sessões.`;
  } else {
    description = 'Não foram registrados episódios de risco alto durante o período avaliado.';
  }

  return { hasHighRisk, highRiskCount, highRiskSessions, currentLevel, description };
}

function analyzeEngagement(sessions: any[]): EngagementAnalysis {
  const values = sessions
    .map(s => ENGAJAMENTO_MAP[s.adesao_terapeutica?.toLowerCase() || ''] ?? null)
    .filter((v): v is number => v !== null);

  if (values.length === 0) {
    return { average: 0, classification: 'insuficiente', description: 'Sem dados de engajamento registrados no período.' };
  }

  const average = values.reduce((a, b) => a + b, 0) / values.length;
  const rounded = Math.round(average * 10) / 10;

  let classification: EngagementAnalysis['classification'];
  let description: string;

  if (average >= 2.5) {
    classification = 'alto';
    description = `O(A) paciente apresentou nível de engajamento alto (média ${rounded}/3) ao longo das ${values.length} sessões avaliadas, demonstrando adesão consistente ao processo terapêutico.`;
  } else if (average >= 1.5) {
    classification = 'medio';
    description = `O engajamento terapêutico foi classificado como médio (média ${rounded}/3) no período, com ${values.length} sessões avaliadas. Sugere-se reforçar a aliança terapêutica.`;
  } else {
    classification = 'baixo';
    description = `O engajamento terapêutico apresentou-se baixo (média ${rounded}/3), o que pode indicar necessidade de revisão da abordagem ou das estratégias motivacionais.`;
  }

  return { average: rounded, classification, description };
}

function analyzeTechniques(sessions: any[]): TechniqueAnalysis {
  const freq: Record<string, number> = {};
  sessions.forEach((s: any) => {
    if (s.intervencoes_tags && Array.isArray(s.intervencoes_tags)) {
      s.intervencoes_tags.forEach((t: string) => {
        freq[t] = (freq[t] || 0) + 1;
      });
    }
  });

  const ranked = Object.entries(freq)
    .map(([technique, count]) => ({ technique, count }))
    .sort((a, b) => b.count - a.count);

  const predominant = ranked.slice(0, 3).map(r => r.technique);

  let description: string;
  if (ranked.length === 0) {
    description = 'Não foram registradas técnicas de intervenção no período.';
  } else {
    const topStr = ranked.slice(0, 3)
      .map(r => `${r.technique} (${r.count}x)`)
      .join(', ');
    description = `As técnicas predominantes no período foram: ${topStr}. Ao todo, ${ranked.length} técnica(s) diferente(s) foram empregadas em ${sessions.length} sessão(ões).`;
  }

  return { ranked, predominant, description };
}

// ─── Hook ───

interface UseRelatorioPsicologicoDataResult {
  loading: boolean;
  saving: boolean;
  aggregateReportData: (
    patientId: string,
    periodStart: string,
    periodEnd: string,
    includeConfidential: boolean,
  ) => Promise<{ sections: ReportSection[]; aggregated: RelatorioPsicologicoAggregated } | null>;
  saveReport: (params: {
    patientId: string;
    sections: ReportSection[];
    professionalName: string;
    patientName: string;
  }) => Promise<string | null>;
}

export function useRelatorioPsicologicoData(): UseRelatorioPsicologicoDataResult {
  const { clinic } = useClinicData();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const aggregateReportData = useCallback(
    async (
      patientId: string,
      periodStart: string,
      periodEnd: string,
      includeConfidential: boolean,
    ) => {
      if (!clinic?.id) return null;
      setLoading(true);

      try {
        // 1) Patient data
        const { data: patient } = await supabase
          .from('patients')
          .select('full_name, birth_date, gender')
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

        // 3) Sessions in period
        const { data: sessoes } = await supabase
          .from('sessoes_psicologia')
          .select('*')
          .eq('patient_id', patientId)
          .eq('clinic_id', clinic.id)
          .gte('data_sessao', periodStart)
          .lte('data_sessao', periodEnd)
          .order('data_sessao', { ascending: true });

        const sessionsList = sessoes || [];

        // 4) Anamnese (current)
        const { data: anamneses } = await supabase
          .from('patient_anamnese_psicologia')
          .select('*')
          .eq('patient_id', patientId)
          .eq('clinic_id', clinic.id)
          .eq('is_current', true)
          .limit(1);

        const anamnese = anamneses?.[0] || null;

        // 5) Plano terapêutico (current)
        const { data: planos } = await supabase
          .from('plano_terapeutico_psicologia')
          .select('*')
          .eq('patient_id', patientId)
          .eq('clinic_id', clinic.id)
          .eq('is_current', true)
          .limit(1);

        const plano = planos?.[0] || null;

        // ─── Intelligent Analysis ───
        const trendAnalysis = analyzeTrend(sessionsList);
        const riskAnalysis = analyzeRisk(sessionsList);
        const engagementAnalysis = analyzeEngagement(sessionsList);
        const techniqueAnalysis = analyzeTechniques(sessionsList);

        // Basic aggregation
        const evolucaoSet = new Set<string>();
        const tecnicasSet = new Set<string>();
        const encaminhamentosSet = new Set<string>();
        const sessionDates: string[] = [];
        const observacoesConf: string[] = [];
        const riscoInterno: string[] = [];
        const riscosReg: string[] = [];

        sessionsList.forEach((s: any) => {
          sessionDates.push(s.data_sessao);
          if (s.evolucao_caso) evolucaoSet.add(s.evolucao_caso);
          if (s.intervencoes_tags && Array.isArray(s.intervencoes_tags)) {
            s.intervencoes_tags.forEach((t: string) => tecnicasSet.add(t));
          }
          if (s.encaminhamentos_tags && Array.isArray(s.encaminhamentos_tags)) {
            s.encaminhamentos_tags.forEach((e: string) => {
              if (e !== 'Nenhum') encaminhamentosSet.add(e);
            });
          }
          if (s.risco_atual && s.risco_atual !== 'ausente') {
            riscosReg.push(`Sessão ${s.numero_sessao || '?'}: Risco ${s.risco_atual}`);
          }
          if (s.observacoes_terapeuta) observacoesConf.push(s.observacoes_terapeuta);
          if (s.risco_interno) riscoInterno.push(s.risco_interno);
        });

        const aggregated: RelatorioPsicologicoAggregated = {
          patientName: patient.full_name || '',
          patientBirthDate: patient.birth_date,
          patientGender: patient.gender,
          professionalName,
          professionalRegistration,
          periodStart,
          periodEnd,
          totalSessions: sessionsList.length,
          sessionDates,
          queixaPrincipal: anamnese?.queixa_principal || 'Não informada na anamnese.',
          evolucaoPercebida: Array.from(evolucaoSet),
          tecnicasUtilizadas: Array.from(tecnicasSet),
          encaminhamentos: Array.from(encaminhamentosSet),
          objetivosTerapeuticos: plano?.objetivos_terapeuticos || '',
          metasCurto: plano?.metas_curto_prazo || '',
          metasMedio: plano?.metas_medio_prazo || '',
          metasLongo: plano?.metas_longo_prazo || '',
          abordagemTerapeutica: anamnese?.abordagem_terapeutica || plano?.estrategias_intervencao || '',
          modalidade: anamnese?.modalidade || 'presencial',
          riscosRegistrados: riscosReg,
          observacoesConfidenciais: observacoesConf,
          riscoInterno,
          trendAnalysis,
          riskAnalysis,
          engagementAnalysis,
          techniqueAnalysis,
        };

        const fmtDate = (d: string) => {
          try { return format(new Date(d), 'dd/MM/yyyy', { locale: ptBR }); } catch { return d; }
        };

        // ─── Build sections with intelligent text ───
        const sections: ReportSection[] = [
          {
            key: 'identificacao',
            title: '1. Identificação',
            content: [
              `Nome: ${aggregated.patientName}`,
              aggregated.patientBirthDate ? `Data de Nascimento: ${fmtDate(aggregated.patientBirthDate)}` : '',
              aggregated.patientGender ? `Sexo: ${aggregated.patientGender}` : '',
              `Período do Relatório: ${fmtDate(periodStart)} a ${fmtDate(periodEnd)}`,
              `Total de Sessões no Período: ${aggregated.totalSessions}`,
              `Modalidade: ${aggregated.modalidade === 'presencial' ? 'Presencial' : aggregated.modalidade === 'online' ? 'Online' : aggregated.modalidade}`,
            ].filter(Boolean).join('\n'),
            visible: true,
          },
          {
            key: 'motivo',
            title: '2. Motivo do Atendimento',
            content: aggregated.queixaPrincipal,
            visible: true,
          },
          {
            key: 'processo',
            title: '3. Processo Terapêutico',
            content: [
              aggregated.abordagemTerapeutica ? `Abordagem: ${aggregated.abordagemTerapeutica}` : '',
              aggregated.objetivosTerapeuticos ? `\nObjetivos Terapêuticos:\n${aggregated.objetivosTerapeuticos}` : '',
              aggregated.metasCurto ? `\nMetas de Curto Prazo:\n${aggregated.metasCurto}` : '',
              aggregated.metasMedio ? `\nMetas de Médio Prazo:\n${aggregated.metasMedio}` : '',
              aggregated.metasLongo ? `\nMetas de Longo Prazo:\n${aggregated.metasLongo}` : '',
            ].filter(Boolean).join('\n'),
            visible: true,
          },
          {
            key: 'evolucao',
            title: '4. Evolução Observada',
            content: trendAnalysis.description + (
              engagementAnalysis.classification !== 'insuficiente'
                ? `\n\n${engagementAnalysis.description}`
                : ''
            ),
            visible: true,
          },
          {
            key: 'tecnicas',
            title: '5. Técnicas Predominantes',
            content: techniqueAnalysis.description,
            visible: true,
          },
          {
            key: 'avaliacao',
            title: '6. Avaliação Clínica',
            content: [
              riskAnalysis.description,
              includeConfidential && aggregated.observacoesConfidenciais.length > 0
                ? `\n\nObservações do Terapeuta:\n${aggregated.observacoesConfidenciais.map(o => `• ${o}`).join('\n')}`
                : '',
            ].filter(Boolean).join('\n'),
            visible: true,
            confidential: includeConfidential,
          },
          {
            key: 'encaminhamentos',
            title: '7. Encaminhamentos',
            content: aggregated.encaminhamentos.length > 0
              ? aggregated.encaminhamentos.map(e => `• ${e}`).join('\n')
              : 'Sem encaminhamentos registrados no período.',
            visible: aggregated.encaminhamentos.length > 0,
          },
          {
            key: 'conclusao',
            title: '8. Conclusão',
            content: buildConclusion(aggregated, fmtDate),
            visible: true,
          },
        ];

        return { sections, aggregated };
      } catch (err) {
        console.error('Error aggregating report data:', err);
        toast.error('Erro ao gerar dados do relatório');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [clinic?.id],
  );

  const saveReport = useCallback(
    async (params: {
      patientId: string;
      sections: ReportSection[];
      professionalName: string;
      patientName: string;
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
        });

        toast.success(`Relatório registrado: ${docReference}`);
        return registered.id;
      } catch (err) {
        console.error('Error saving report:', err);
        toast.error('Erro ao salvar relatório');
        return null;
      } finally {
        setSaving(false);
      }
    },
    [clinic?.id],
  );

  return { loading, saving, aggregateReportData, saveReport };
}

// ─── Conclusion builder ───

function buildConclusion(agg: RelatorioPsicologicoAggregated, fmtDate: (d: string) => string): string {
  const parts: string[] = [];

  parts.push(
    `O(A) paciente ${agg.patientName} realizou ${agg.totalSessions} sessão(ões) de acompanhamento psicológico no período de ${fmtDate(agg.periodStart)} a ${fmtDate(agg.periodEnd)}.`
  );

  // Trend conclusion
  switch (agg.trendAnalysis.pattern) {
    case 'melhora':
      parts.push('Observou-se evolução positiva ao longo do processo terapêutico, com indicadores de melhora consistente.');
      break;
    case 'regressao':
      parts.push('Foi identificada tendência de regressão no quadro clínico, sendo recomendada reavaliação das estratégias terapêuticas.');
      break;
    case 'estabilidade':
      parts.push('O quadro clínico manteve-se estável durante o período avaliado.');
      break;
    default:
      parts.push('O processo terapêutico segue em acompanhamento.');
  }

  // Engagement conclusion
  if (agg.engagementAnalysis.classification === 'alto') {
    parts.push('A adesão ao tratamento foi satisfatória.');
  } else if (agg.engagementAnalysis.classification === 'baixo') {
    parts.push('A adesão ao tratamento apresentou-se aquém do desejável, sendo recomendado trabalho motivacional.');
  }

  // Risk flag
  if (agg.riskAnalysis.highRiskCount >= 2) {
    parts.push('Destaca-se a recorrência de episódios de risco alto, que demandam atenção especializada.');
  }

  return parts.join(' ');
}
