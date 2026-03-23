/**
 * PILATES - Dados do Histórico / Linha do Tempo
 * 
 * Hook para consolidar todos os registros do paciente em uma
 * linha do tempo unificada: anamnese, avaliações, planos, sessões e documentos.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Tipos de registro na timeline
export const TIMELINE_TYPES = {
  anamnese_funcional_pilates: { label: 'Anamnese Funcional', icon: 'ClipboardList', color: 'bg-primary' },
  avaliacao_funcional_pilates: { label: 'Avaliação Funcional', icon: 'Activity', color: 'bg-blue-500' },
  avaliacao_postural_pilates: { label: 'Avaliação Postural', icon: 'User', color: 'bg-indigo-500' },
  plano_exercicios_pilates: { label: 'Plano de Exercícios', icon: 'Dumbbell', color: 'bg-green-500' },
  sessao_pilates: { label: 'Sessão', icon: 'Calendar', color: 'bg-orange-500' },
  documento_pilates: { label: 'Documento', icon: 'FileText', color: 'bg-gray-500' },
  alerta_funcional_pilates: { label: 'Alerta Funcional', icon: 'ShieldAlert', color: 'bg-destructive' },
} as const;

export type TimelineType = keyof typeof TIMELINE_TYPES;

export interface TimelineItem {
  id: string;
  type: TimelineType;
  title: string;
  subtitle?: string;
  description?: string;
  professional_name?: string | null;
  created_at: string;
  content: Record<string, unknown>;
}

interface UseHistoricoPilatesDataParams {
  patientId: string | null;
  clinicId: string | null;
}

export function useHistoricoPilatesData({ 
  patientId, 
  clinicId 
}: UseHistoricoPilatesDataParams) {
  // Buscar todos os registros de Pilates
  const timelineQuery = useQuery({
    queryKey: ['pilates-historico', patientId, clinicId],
    queryFn: async () => {
      if (!patientId || !clinicId) return [];

      const pilatesTypes = Object.keys(TIMELINE_TYPES);

      const { data, error } = await supabase
        .from('clinical_evolutions')
        .select(`
          id,
          evolution_type,
          content,
          created_at,
          professional_id,
          professionals:professional_id (
            full_name
          )
        `)
        .eq('patient_id', patientId)
        .eq('clinic_id', clinicId)
        .in('evolution_type', pilatesTypes)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((record): TimelineItem => {
        const content = record.content as Record<string, unknown> | null;
        const type = record.evolution_type as TimelineType;
        
        // Gerar título e subtítulo baseado no tipo
        let title: string = TIMELINE_TYPES[type]?.label || type;
        let subtitle: string | undefined;
        let description: string | undefined;

        switch (type) {
          case 'anamnese_funcional_pilates':
            title = 'Anamnese Funcional';
            subtitle = content?.queixa_principal as string | undefined;
            break;
          
          case 'avaliacao_funcional_pilates':
            title = 'Avaliação Funcional';
            const testes = content?.testes_funcionais as Record<string, unknown> | undefined;
            if (testes) {
              const testesList = Object.keys(testes).slice(0, 2).join(', ');
              subtitle = testesList ? `Testes: ${testesList}...` : undefined;
            }
            break;
          
          case 'avaliacao_postural_pilates':
            title = 'Avaliação Postural';
            const desvios = content?.desvios_posturais as string[] | undefined;
            if (desvios && desvios.length > 0) {
              subtitle = `${desvios.length} desvio(s) identificado(s)`;
            }
            break;
          
          case 'plano_exercicios_pilates':
            title = (content?.titulo as string) || 'Plano de Exercícios';
            const exercicios = content?.exercicios as unknown[] | undefined;
            if (exercicios) {
              subtitle = `${exercicios.length} exercício(s)`;
            }
            break;
          
          case 'sessao_pilates':
            title = 'Sessão de Pilates';
            const dataSessao = content?.data_sessao as string | undefined;
            if (dataSessao) {
              const date = new Date(dataSessao);
              subtitle = date.toLocaleDateString('pt-BR');
            }
            const respostaGeral = content?.resposta_geral as string | undefined;
            if (respostaGeral) {
              description = `Resposta: ${respostaGeral}`;
            }
            break;
          
          case 'documento_pilates':
            title = (content?.titulo as string) || 'Documento';
            const categoria = content?.categoria as string | undefined;
            if (categoria) {
              subtitle = categoria.replace(/_/g, ' ');
            }
            break;
          
          case 'alerta_funcional_pilates':
            title = (content?.titulo as string) || 'Alerta Funcional';
            const isActive = content?.is_active as boolean | undefined;
            subtitle = isActive ? 'Ativo' : 'Inativo';
            description = content?.descricao as string | undefined;
            break;
        }

        return {
          id: record.id,
          type,
          title,
          subtitle,
          description,
          professional_name: (record.professionals as { full_name: string } | null)?.full_name || null,
          created_at: record.created_at,
          content: content || {},
        };
      });
    },
    enabled: !!patientId && !!clinicId,
  });

  // Agrupar por mês/ano
  const groupedByMonth = (timelineQuery.data || []).reduce((acc, item) => {
    const date = new Date(item.created_at);
    const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!acc[monthYear]) {
      acc[monthYear] = [];
    }
    acc[monthYear].push(item);
    return acc;
  }, {} as Record<string, TimelineItem[]>);

  // Estatísticas
  const stats = {
    total: timelineQuery.data?.length || 0,
    byType: Object.keys(TIMELINE_TYPES).reduce((acc, type) => {
      acc[type as TimelineType] = (timelineQuery.data || []).filter(item => item.type === type).length;
      return acc;
    }, {} as Record<TimelineType, number>),
  };

  return {
    timeline: timelineQuery.data || [],
    groupedByMonth,
    stats,
    loading: timelineQuery.isLoading,
    error: timelineQuery.error,
  };
}
