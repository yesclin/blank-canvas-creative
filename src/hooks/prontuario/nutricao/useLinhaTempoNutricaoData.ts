/**
 * NUTRIÇÃO - Linha do Tempo / Histórico
 * 
 * Hook para consolidar o histórico clínico nutricional do paciente.
 * Agrega dados de anamneses, avaliações, diagnósticos, planos e evoluções.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useClinicData } from '@/hooks/useClinicData';

export type TipoEventoNutricao = 
  | 'anamnese' 
  | 'avaliacao' 
  | 'diagnostico'
  | 'plano_alimentar' 
  | 'evolucao'
  | 'documento'
  | 'meta'
  | 'alerta';

export interface EventoTimelineNutricao {
  id: string;
  tipo: TipoEventoNutricao;
  titulo: string;
  resumo?: string;
  detalhes?: Record<string, unknown>;
  profissional_nome?: string;
  created_at: string;
  status?: string;
}

export const TIPO_EVENTO_NUTRICAO_CONFIG: Record<TipoEventoNutricao, {
  label: string;
  emoji: string;
}> = {
  anamnese: { label: 'Anamnese Nutricional', emoji: '📋' },
  avaliacao: { label: 'Avaliação Nutricional', emoji: '📊' },
  diagnostico: { label: 'Diagnóstico Nutricional', emoji: '🔍' },
  plano_alimentar: { label: 'Plano Alimentar', emoji: '🍽️' },
  evolucao: { label: 'Evolução', emoji: '📝' },
  documento: { label: 'Documento', emoji: '📄' },
  meta: { label: 'Meta Nutricional', emoji: '🎯' },
  alerta: { label: 'Alerta', emoji: '⚠️' },
};

/**
 * Hook para consolidar a linha do tempo nutricional
 */
export function useLinhaTempoNutricaoData(patientId: string | null) {
  const { clinic } = useClinicData();
  const [eventos, setEventos] = useState<EventoTimelineNutricao[]>([]);
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
      // Buscar dados em paralelo
      const [
        evolucoesRes,
        documentosRes,
        alertasRes,
      ] = await Promise.all([
        // Evoluções nutricionais (tabela clinical_evolutions)
        supabase
          .from('clinical_evolutions')
          .select('id, evolution_type, content, notes, next_steps, status, professional_id, created_at')
          .eq('patient_id', patientId)
          .eq('clinic_id', clinic.id)
          .eq('specialty', 'nutricao')
          .order('created_at', { ascending: false }),

        // Documentos
        supabase
          .from('patient_documentos')
          .select('id, titulo, categoria, observacoes, profissional_id, created_at')
          .eq('patient_id', patientId)
          .eq('clinic_id', clinic.id)
          .order('created_at', { ascending: false }),

        // Alertas nutricionais
        supabase
          .from('clinical_alerts')
          .select('id, title, description, alert_type, severity, is_active, created_by, created_at')
          .eq('patient_id', patientId)
          .eq('clinic_id', clinic.id)
          .in('alert_type', ['alergia_alimentar', 'restricao_alimentar', 'risco_nutricional', 'intolerancia', 'allergy'])
          .order('created_at', { ascending: false }),
      ]);

      // Coletar IDs de profissionais para buscar nomes
      const allProfessionalIds = new Set<string>();
      const allUserIds = new Set<string>();

      (evolucoesRes.data || []).forEach(e => e.professional_id && allProfessionalIds.add(e.professional_id));
      (documentosRes.data || []).forEach(d => d.profissional_id && allProfessionalIds.add(d.profissional_id));
      (alertasRes.data || []).forEach(a => a.created_by && allUserIds.add(a.created_by));

      // Buscar nomes dos profissionais
      let profiles: Record<string, string> = {};
      
      if (allProfessionalIds.size > 0) {
        const { data: professionalsData } = await supabase
          .from('professionals')
          .select('id, user_id')
          .in('id', Array.from(allProfessionalIds));

        const userIds = (professionalsData || [])
          .map(p => p.user_id)
          .filter(Boolean) as string[];

        userIds.forEach(id => allUserIds.add(id));

        if (allUserIds.size > 0) {
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('user_id, full_name')
            .in('user_id', Array.from(allUserIds));

          const userToName: Record<string, string> = {};
          (profilesData || []).forEach(p => {
            if (p.user_id && p.full_name) {
              userToName[p.user_id] = p.full_name;
            }
          });

          (professionalsData || []).forEach(prof => {
            if (prof.id && prof.user_id && userToName[prof.user_id]) {
              profiles[prof.id] = userToName[prof.user_id];
            }
          });

          Object.assign(profiles, userToName);
        }
      }

      // Transformar dados em eventos da timeline
      const timelineEvents: EventoTimelineNutricao[] = [];

      // Evoluções - categorizar por tipo
      (evolucoesRes.data || []).forEach(evolucao => {
        const content = evolucao.content as Record<string, unknown> || {};
        const tipoRegistro = content.tipo_registro as string;
        
        let tipo: TipoEventoNutricao = 'evolucao';
        let titulo = 'Evolução';
        let resumo: string | undefined;

        // Identificar tipo pelo conteúdo
        if (tipoRegistro === 'anamnese_nutricional' || content.habitos_alimentares) {
          tipo = 'anamnese';
          titulo = 'Anamnese Nutricional';
          resumo = content.objetivo_consulta as string || content.queixa_principal as string;
        } else if (tipoRegistro === 'avaliacao_nutricional' || content.peso_kg || content.imc) {
          tipo = 'avaliacao';
          titulo = 'Avaliação Nutricional';
          const peso = content.peso_kg as number;
          const imc = content.imc as number;
          if (peso && imc) {
            resumo = `Peso: ${peso} kg | IMC: ${imc.toFixed(1)}`;
          }
        } else if (tipoRegistro === 'diagnostico_nutricional' || content.diagnostico_principal) {
          tipo = 'diagnostico';
          titulo = 'Diagnóstico Nutricional';
          resumo = content.diagnostico_principal as string;
        } else if (tipoRegistro === 'plano_alimentar' || content.objetivo || content.refeicoes) {
          tipo = 'plano_alimentar';
          titulo = 'Plano Alimentar';
          resumo = content.objetivo as string;
        } else if (tipoRegistro === 'meta_nutricional' || content.tipo_meta) {
          tipo = 'meta';
          titulo = 'Meta Nutricional';
          resumo = content.descricao as string;
        } else if (tipoRegistro === 'avaliacao_clinica' || content.exames_laboratoriais) {
          tipo = 'avaliacao';
          titulo = 'Avaliação Clínica / Bioquímica';
          resumo = evolucao.notes || undefined;
        } else {
          // Evolução padrão
          const tipoConsulta = content.tipo_consulta as string;
          if (tipoConsulta === 'primeira_consulta') titulo = 'Primeira Consulta';
          else if (tipoConsulta === 'retorno') titulo = 'Retorno';
          else if (tipoConsulta === 'acompanhamento') titulo = 'Acompanhamento';
          
          resumo = content.queixa_principal as string || evolucao.notes || undefined;
        }

        timelineEvents.push({
          id: `evolucao-${evolucao.id}`,
          tipo,
          titulo,
          resumo,
          detalhes: content,
          profissional_nome: evolucao.professional_id ? profiles[evolucao.professional_id] : undefined,
          created_at: evolucao.created_at,
          status: evolucao.status,
        });
      });

      // Documentos
      (documentosRes.data || []).forEach(doc => {
        const categoriaLabel = doc.categoria === 'exame' ? 'Exame Laboratorial' :
                               doc.categoria === 'laudo' ? 'Laudo' :
                               doc.categoria === 'relatorio' ? 'Relatório' : 'Documento';
        timelineEvents.push({
          id: `documento-${doc.id}`,
          tipo: 'documento',
          titulo: doc.titulo || categoriaLabel,
          resumo: doc.observacoes || undefined,
          detalhes: { categoria: categoriaLabel },
          profissional_nome: doc.profissional_id ? profiles[doc.profissional_id] : undefined,
          created_at: doc.created_at,
        });
      });

      // Alertas
      (alertasRes.data || []).forEach(alerta => {
        timelineEvents.push({
          id: `alerta-${alerta.id}`,
          tipo: 'alerta',
          titulo: alerta.title,
          resumo: alerta.description || undefined,
          detalhes: {
            tipo: alerta.alert_type,
            severidade: alerta.severity,
          },
          profissional_nome: alerta.created_by ? profiles[alerta.created_by] : undefined,
          created_at: alerta.created_at,
          status: alerta.is_active ? 'ativo' : 'resolvido',
        });
      });

      // Ordenar por data decrescente
      timelineEvents.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setEventos(timelineEvents);

    } catch (err) {
      console.error('Error fetching nutrition timeline:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar histórico');
    } finally {
      setLoading(false);
    }
  }, [patientId, clinic?.id]);

  useEffect(() => {
    fetchTimeline();
  }, [fetchTimeline]);

  return {
    eventos,
    loading,
    error,
    refetch: fetchTimeline,
  };
}
