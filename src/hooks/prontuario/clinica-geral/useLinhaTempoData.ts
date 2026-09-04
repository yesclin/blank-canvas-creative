import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useClinicData } from '@/hooks/useClinicData';
import type { EventoTimeline } from '@/components/prontuario/clinica-geral/LinhaTempoBlock';

interface UseLinhaTempoDataResult {
  eventos: EventoTimeline[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook para consolidar o histórico clínico do paciente
 * 
 * Agrega dados de:
 * - Anamneses
 * - Evoluções
 * - Exames Físicos
 * - Planos / Condutas
 * - Documentos
 */
export function useLinhaTempoData(patientId: string | null): UseLinhaTempoDataResult {
  const { clinic } = useClinicData();
  const [eventos, setEventos] = useState<EventoTimeline[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTimeline = useCallback(async () => {
    if (!patientId || !clinic?.id) {
      setEventos([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch all data sources in parallel
      const [
        anamnesesRes,
        evolucoesRes,
        examesFisicosRes,
        condutasRes,
        documentosRes,
        docClinicosRes,
      ] = await Promise.all([
        // Anamneses
        supabase
          .from('patient_anamneses')
          .select('id, data, professional_id, created_at')
          .eq('patient_id', patientId)
          .eq('clinic_id', clinic.id)
          .order('created_at', { ascending: false }),

        // Evoluções
        supabase
          .from('patient_evolucoes')
          .select('id, data, notes, professional_id, created_at')
          .eq('patient_id', patientId)
          .eq('clinic_id', clinic.id)
          .order('created_at', { ascending: false }),

        // Exames Físicos
        supabase
          .from('patient_exames_fisicos')
          .select('id, data, notes, professional_id, created_at')
          .eq('patient_id', patientId)
          .eq('clinic_id', clinic.id)
          .order('created_at', { ascending: false }),

        // Condutas
        supabase
          .from('patient_condutas')
          .select('id, descricao, tipo, data, professional_id, created_at')
          .eq('patient_id', patientId)
          .eq('clinic_id', clinic.id)
          .order('created_at', { ascending: false }),

        // Documentos
        supabase
          .from('patient_documentos')
          .select('id, titulo, tipo, conteudo, professional_id, created_at')
          .eq('patient_id', patientId)
          .eq('clinic_id', clinic.id)
          .order('created_at', { ascending: false }),

        // Documentos Clínicos (receituário/atestado)
        supabase
          .from('documentos_clinicos')
          .select('id, tipo, titulo, conteudo, status, professional_id, created_at')
          .eq('patient_id', patientId)
          .eq('clinic_id', clinic.id)
          .order('created_at', { ascending: false }),
      ]);

      // Collect all professional IDs to fetch names
      const allProfessionalIds = new Set<string>();
      
      (anamnesesRes.data || []).forEach(a => a.professional_id && allProfessionalIds.add(a.professional_id));
      (evolucoesRes.data || []).forEach(e => e.professional_id && allProfessionalIds.add(e.professional_id));
      (examesFisicosRes.data || []).forEach(e => e.professional_id && allProfessionalIds.add(e.professional_id));
      (condutasRes.data || []).forEach(c => c.professional_id && allProfessionalIds.add(c.professional_id));
      (documentosRes.data || []).forEach(d => d.professional_id && allProfessionalIds.add(d.professional_id));
      (docClinicosRes.data || []).forEach(d => d.professional_id && allProfessionalIds.add(d.professional_id));

      // Fetch professional names
      let profiles: Record<string, string> = {};
      if (allProfessionalIds.size > 0) {
        // Get user_ids from professionals
        const { data: professionalsData } = await supabase
          .from('professionals')
          .select('id, user_id')
          .in('id', Array.from(allProfessionalIds));

        const userIds = (professionalsData || [])
          .map(p => p.user_id)
          .filter(Boolean) as string[];

        if (userIds.length > 0) {
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('user_id, full_name')
            .in('user_id', [...new Set(userIds)]);

          // Map user_id -> name
          const userToName: Record<string, string> = {};
          (profilesData || []).forEach(p => {
            if (p.user_id && p.full_name) {
              userToName[p.user_id] = p.full_name;
            }
          });

          // Map professional_id -> name
          (professionalsData || []).forEach(prof => {
            if (prof.id && prof.user_id && userToName[prof.user_id]) {
              profiles[prof.id] = userToName[prof.user_id];
            }
          });

          // For anamneses, map user_id directly
          Object.assign(profiles, userToName);
        }
      }

      // Transform all data to timeline events
      const timelineEvents: EventoTimeline[] = [];

      // Anamneses
      (anamnesesRes.data || []).forEach(anamnese => {
        const payload = (anamnese.data || {}) as Record<string, any>;
        timelineEvents.push({
          id: `anamnese-${anamnese.id}`,
          tipo: 'anamnese',
          titulo: 'Anamnese',
          resumo: payload.queixa_principal || payload.historia_doenca_atual || undefined,
          detalhes: {
            queixa_principal: payload.queixa_principal,
            historia_doenca_atual: payload.historia_doenca_atual,
          },
          profissional_nome: anamnese.professional_id ? profiles[anamnese.professional_id] : undefined,
          created_at: anamnese.created_at,
        });
      });

      // Evoluções
      (evolucoesRes.data || []).forEach(evolucao => {
        const d = (evolucao.data || {}) as Record<string, any>;
        const tipoLabel = d.tipo_atendimento === 'consulta' ? 'Consulta' :
                          d.tipo_atendimento === 'retorno' ? 'Retorno' :
                          d.tipo_atendimento === 'procedimento' ? 'Procedimento' :
                          d.tipo_atendimento === 'urgencia' ? 'Urgência' : 'Evolução';
        timelineEvents.push({
          id: `evolucao-${evolucao.id}`,
          tipo: 'evolucao',
          titulo: tipoLabel,
          resumo: d.descricao_clinica || d.hipoteses_diagnosticas || evolucao.notes || undefined,
          detalhes: {
            descricao_clinica: d.descricao_clinica,
            hipoteses_diagnosticas: d.hipoteses_diagnosticas,
          },
          profissional_nome: evolucao.professional_id ? profiles[evolucao.professional_id] : undefined,
          created_at: evolucao.created_at,
        });
      });

      // Exames Físicos
      (examesFisicosRes.data || []).forEach(exame => {
        const d = (exame.data || {}) as Record<string, any>;
        const parts: string[] = [];
        if (d.pressao_sistolica && d.pressao_diastolica) {
          parts.push(`PA: ${d.pressao_sistolica}/${d.pressao_diastolica}`);
        }
        if (d.frequencia_cardiaca) parts.push(`FC: ${d.frequencia_cardiaca}`);
        if (d.temperatura) parts.push(`T: ${d.temperatura}°C`);
        const resumo = parts.join(' | ') || d.observacoes || exame.notes || undefined;

        timelineEvents.push({
          id: `exame-${exame.id}`,
          tipo: 'exame_fisico',
          titulo: 'Exame Físico',
          resumo,
          detalhes: {
            pressao_arterial: d.pressao_sistolica && d.pressao_diastolica
              ? `${d.pressao_sistolica}/${d.pressao_diastolica} mmHg`
              : undefined,
            frequencia_cardiaca: d.frequencia_cardiaca ? `${d.frequencia_cardiaca} bpm` : undefined,
            temperatura: d.temperatura ? `${d.temperatura}°C` : undefined,
            peso: d.peso ? `${d.peso} kg` : undefined,
            altura: d.altura ? `${d.altura} cm` : undefined,
            observacoes: d.observacoes ?? exame.notes,
          },
          profissional_nome: exame.professional_id ? profiles[exame.professional_id] : undefined,
          created_at: exame.created_at,
        });
      });

      // Condutas
      (condutasRes.data || []).forEach(conduta => {
        const d = (conduta.data || {}) as Record<string, any>;
        const tipoLabels: Record<string, string> = {
          prescricao: 'Prescrição',
          solicitacao_exames: 'Solicitação de Exames',
          orientacoes: 'Orientações',
          encaminhamento: 'Encaminhamento',
          retorno: 'Retorno Agendado',
        };
        let titulo = tipoLabels[conduta.tipo || ''] || 'Plano / Conduta';
        let resumo: string | undefined = conduta.descricao || undefined;

        if (!resumo) {
          if (d.prescricoes) { titulo = 'Prescrição'; resumo = d.prescricoes; }
          else if (d.solicitacao_exames) { titulo = 'Solicitação de Exames'; resumo = d.solicitacao_exames; }
          else if (d.orientacoes) { titulo = 'Orientações'; resumo = d.orientacoes; }
          else if (d.encaminhamentos) { titulo = 'Encaminhamento'; resumo = d.encaminhamentos; }
          else if (d.retorno_agendado) { titulo = 'Retorno Agendado'; resumo = d.retorno_agendado; }
        }

        timelineEvents.push({
          id: `conduta-${conduta.id}`,
          tipo: 'conduta',
          titulo,
          resumo,
          detalhes: {
            descricao: conduta.descricao,
            solicitacao_exames: d.solicitacao_exames,
            prescricoes: d.prescricoes,
            orientacoes: d.orientacoes,
            encaminhamentos: d.encaminhamentos,
            retorno_agendado: d.retorno_agendado,
          },
          profissional_nome: conduta.professional_id ? profiles[conduta.professional_id] : undefined,
          created_at: conduta.created_at,
        });
      });

      // Documentos
      (documentosRes.data || []).forEach(doc => {
        const conteudo = (doc.conteudo || {}) as Record<string, any>;
        const categoriaLabel = doc.tipo === 'laboratorio' ? 'Exame Laboratorial' :
                               doc.tipo === 'imagem' ? 'Exame de Imagem' :
                               doc.tipo === 'laudo' ? 'Laudo' :
                               doc.tipo === 'relatorio' ? 'Relatório' : 'Documento';
        timelineEvents.push({
          id: `documento-${doc.id}`,
          tipo: 'documento',
          titulo: doc.titulo || categoriaLabel,
          resumo: conteudo.observacoes || undefined,
          detalhes: {
            categoria: categoriaLabel,
            observacoes: conteudo.observacoes,
          },
          profissional_nome: doc.professional_id ? profiles[doc.professional_id] : undefined,
          created_at: doc.created_at,
        });
      });

      // Documentos Clínicos (Receituário / Atestado / Declaração / Relatório)
      const docTipoLabels: Record<string, string> = { receituario: 'Receituário', atestado: 'Atestado', declaracao: 'Declaração', relatorio: 'Relatório' };
      (docClinicosRes.data || []).forEach(doc => {
        const conteudo = (typeof doc.conteudo === 'string' ? JSON.parse(doc.conteudo) : doc.conteudo) as Record<string, any> | null;
        let resumo: string | undefined;
        if (doc.tipo === 'receituario' && conteudo?.medicamentos?.length) {
          resumo = conteudo.medicamentos.map((m: any) => m.nome).join(', ');
        } else if (doc.tipo === 'atestado' && conteudo?.dias) {
          resumo = `${conteudo.dias} dia(s) de afastamento`;
        } else if (doc.tipo === 'relatorio' && conteudo?.titulo_relatorio) {
          resumo = conteudo.titulo_relatorio;
        }
        const tipoTimeline = (['receituario','atestado','declaracao','relatorio'].includes(doc.tipo) ? doc.tipo : 'receituario') as any;
        timelineEvents.push({
          id: `doc-clinico-${doc.id}`,
          tipo: tipoTimeline,
          titulo: `${docTipoLabels[doc.tipo] || doc.tipo} ${doc.status === 'emitido' ? 'emitido' : doc.status === 'rascunho' ? '(rascunho)' : 'cancelado'}`,
          resumo,
          detalhes: { status: doc.status },
          profissional_nome: doc.professional_id ? profiles[doc.professional_id] : undefined,
          created_at: doc.created_at,
        });
      });

      // Sort all events by date descending
      timelineEvents.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setEventos(timelineEvents);

    } catch (err) {
      console.error('Error fetching timeline:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar histórico');
    } finally {
      setLoading(false);
    }
  }, [patientId, clinic?.id]);

  useEffect(() => {
    let cancelled = false;
    fetchTimeline().then(() => {
      if (cancelled) return; // Prevent stale updates
    });
    return () => { cancelled = true; };
  }, [fetchTimeline]);

  return {
    eventos,
    loading,
    error,
    refetch: fetchTimeline,
  };
}
