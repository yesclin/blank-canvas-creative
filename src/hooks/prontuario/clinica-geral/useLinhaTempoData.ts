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
          .select('id, queixa_principal, historia_doenca_atual, created_by, created_at')
          .eq('patient_id', patientId)
          .eq('clinic_id', clinic.id)
          .order('created_at', { ascending: false }),

        // Evoluções
        supabase
          .from('patient_evolucoes')
          .select('id, tipo_atendimento, descricao_clinica, hipoteses_diagnosticas, profissional_id, created_at')
          .eq('patient_id', patientId)
          .eq('clinic_id', clinic.id)
          .order('created_at', { ascending: false }),

        // Exames Físicos
        supabase
          .from('patient_exames_fisicos')
          .select('id, pressao_sistolica, pressao_diastolica, frequencia_cardiaca, temperatura, peso, altura, observacoes, profissional_id, created_at')
          .eq('patient_id', patientId)
          .eq('clinic_id', clinic.id)
          .order('created_at', { ascending: false }),

        // Condutas
        supabase
          .from('patient_condutas')
          .select('id, solicitacao_exames, prescricoes, orientacoes, encaminhamentos, retorno_agendado, profissional_id, created_at')
          .eq('patient_id', patientId)
          .eq('clinic_id', clinic.id)
          .order('created_at', { ascending: false }),

        // Documentos
        supabase
          .from('patient_documentos')
          .select('id, titulo, categoria, observacoes, profissional_id, created_at')
          .eq('patient_id', patientId)
          .eq('clinic_id', clinic.id)
          .order('created_at', { ascending: false }),

        // Documentos Clínicos (receituário/atestado)
        supabase
          .from('documentos_clinicos')
          .select('id, tipo, conteudo_json, status, professional_id, created_at')
          .eq('patient_id', patientId)
          .eq('clinic_id', clinic.id)
          .order('created_at', { ascending: false }),
      ]);

      // Collect all professional IDs to fetch names
      const allProfessionalIds = new Set<string>();
      
      (anamnesesRes.data || []).forEach(a => a.created_by && allProfessionalIds.add(a.created_by));
      (evolucoesRes.data || []).forEach(e => e.profissional_id && allProfessionalIds.add(e.profissional_id));
      (examesFisicosRes.data || []).forEach(e => e.profissional_id && allProfessionalIds.add(e.profissional_id));
      (condutasRes.data || []).forEach(c => c.profissional_id && allProfessionalIds.add(c.profissional_id));
      (documentosRes.data || []).forEach(d => d.profissional_id && allProfessionalIds.add(d.profissional_id));
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

        // For anamneses, created_by is user_id directly
        (anamnesesRes.data || []).forEach(a => {
          if (a.created_by) userIds.push(a.created_by);
        });

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
        timelineEvents.push({
          id: `anamnese-${anamnese.id}`,
          tipo: 'anamnese',
          titulo: 'Anamnese',
          resumo: anamnese.queixa_principal || anamnese.historia_doenca_atual || undefined,
          detalhes: {
            queixa_principal: anamnese.queixa_principal,
            historia_doenca_atual: anamnese.historia_doenca_atual,
          },
          profissional_nome: anamnese.created_by ? profiles[anamnese.created_by] : undefined,
          created_at: anamnese.created_at,
        });
      });

      // Evoluções
      (evolucoesRes.data || []).forEach(evolucao => {
        const tipoLabel = evolucao.tipo_atendimento === 'consulta' ? 'Consulta' :
                          evolucao.tipo_atendimento === 'retorno' ? 'Retorno' :
                          evolucao.tipo_atendimento === 'procedimento' ? 'Procedimento' :
                          evolucao.tipo_atendimento === 'urgencia' ? 'Urgência' : 'Evolução';
        timelineEvents.push({
          id: `evolucao-${evolucao.id}`,
          tipo: 'evolucao',
          titulo: tipoLabel,
          resumo: evolucao.descricao_clinica || evolucao.hipoteses_diagnosticas || undefined,
          detalhes: {
            descricao_clinica: evolucao.descricao_clinica,
            hipoteses_diagnosticas: evolucao.hipoteses_diagnosticas,
          },
          profissional_nome: evolucao.profissional_id ? profiles[evolucao.profissional_id] : undefined,
          created_at: evolucao.created_at,
        });
      });

      // Exames Físicos
      (examesFisicosRes.data || []).forEach(exame => {
        const parts: string[] = [];
        if (exame.pressao_sistolica && exame.pressao_diastolica) {
          parts.push(`PA: ${exame.pressao_sistolica}/${exame.pressao_diastolica}`);
        }
        if (exame.frequencia_cardiaca) parts.push(`FC: ${exame.frequencia_cardiaca}`);
        if (exame.temperatura) parts.push(`T: ${exame.temperatura}°C`);
        const resumo = parts.join(' | ') || exame.observacoes || undefined;

        timelineEvents.push({
          id: `exame-${exame.id}`,
          tipo: 'exame_fisico',
          titulo: 'Exame Físico',
          resumo,
          detalhes: {
            pressao_arterial: exame.pressao_sistolica && exame.pressao_diastolica 
              ? `${exame.pressao_sistolica}/${exame.pressao_diastolica} mmHg` 
              : undefined,
            frequencia_cardiaca: exame.frequencia_cardiaca ? `${exame.frequencia_cardiaca} bpm` : undefined,
            temperatura: exame.temperatura ? `${exame.temperatura}°C` : undefined,
            peso: exame.peso ? `${exame.peso} kg` : undefined,
            altura: exame.altura ? `${exame.altura} cm` : undefined,
            observacoes: exame.observacoes,
          },
          profissional_nome: exame.profissional_id ? profiles[exame.profissional_id] : undefined,
          created_at: exame.created_at,
        });
      });

      // Condutas
      (condutasRes.data || []).forEach(conduta => {
        // Determine the main type based on what's filled
        let titulo = 'Plano / Conduta';
        let resumo: string | undefined;

        if (conduta.prescricoes) {
          titulo = 'Prescrição';
          resumo = conduta.prescricoes;
        } else if (conduta.solicitacao_exames) {
          titulo = 'Solicitação de Exames';
          resumo = conduta.solicitacao_exames;
        } else if (conduta.orientacoes) {
          titulo = 'Orientações';
          resumo = conduta.orientacoes;
        } else if (conduta.encaminhamentos) {
          titulo = 'Encaminhamento';
          resumo = conduta.encaminhamentos;
        } else if (conduta.retorno_agendado) {
          titulo = 'Retorno Agendado';
          resumo = conduta.retorno_agendado;
        }

        timelineEvents.push({
          id: `conduta-${conduta.id}`,
          tipo: 'conduta',
          titulo,
          resumo,
          detalhes: {
            solicitacao_exames: conduta.solicitacao_exames,
            prescricoes: conduta.prescricoes,
            orientacoes: conduta.orientacoes,
            encaminhamentos: conduta.encaminhamentos,
            retorno_agendado: conduta.retorno_agendado,
          },
          profissional_nome: conduta.profissional_id ? profiles[conduta.profissional_id] : undefined,
          created_at: conduta.created_at,
        });
      });

      // Documentos
      (documentosRes.data || []).forEach(doc => {
        const categoriaLabel = doc.categoria === 'laboratorio' ? 'Exame Laboratorial' :
                               doc.categoria === 'imagem' ? 'Exame de Imagem' :
                               doc.categoria === 'laudo' ? 'Laudo' :
                               doc.categoria === 'relatorio' ? 'Relatório' : 'Documento';
        timelineEvents.push({
          id: `documento-${doc.id}`,
          tipo: 'documento',
          titulo: doc.titulo || categoriaLabel,
          resumo: doc.observacoes || undefined,
          detalhes: {
            categoria: categoriaLabel,
            observacoes: doc.observacoes,
          },
          profissional_nome: doc.profissional_id ? profiles[doc.profissional_id] : undefined,
          created_at: doc.created_at,
        });
      });

      // Documentos Clínicos (Receituário / Atestado / Declaração / Relatório)
      const tipoLabels: Record<string, string> = { receituario: 'Receituário', atestado: 'Atestado', declaracao: 'Declaração', relatorio: 'Relatório' };
      (docClinicosRes.data || []).forEach(doc => {
        const conteudo = typeof doc.conteudo_json === 'string' ? JSON.parse(doc.conteudo_json) : doc.conteudo_json;
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
          titulo: `${tipoLabels[doc.tipo] || doc.tipo} ${doc.status === 'emitido' ? 'emitido' : doc.status === 'rascunho' ? '(rascunho)' : 'cancelado'}`,
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
