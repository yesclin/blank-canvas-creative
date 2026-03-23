/**
 * FISIOTERAPIA - Dados do Histórico / Linha do Tempo
 * 
 * Hook para consolidar todos os registros clínicos do paciente
 * em uma linha do tempo cronológica.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type HistoricoEntryType = 
  | 'anamnese'
  | 'avaliacao_funcional'
  | 'avaliacao_dor'
  | 'diagnostico_funcional'
  | 'plano_terapeutico'
  | 'sessao'
  | 'exercicios_prescritos'
  | 'documento'
  | 'alerta';

export interface HistoricoEntry {
  id: string;
  type: HistoricoEntryType;
  title: string;
  subtitle?: string;
  description?: string;
  date: string;
  professional_name?: string;
  metadata?: Record<string, unknown>;
}

interface UseHistoricoFisioterapiaDataParams {
  patientId: string | null;
  clinicId: string | null;
}

const TYPE_LABELS: Record<HistoricoEntryType, string> = {
  anamnese: 'Anamnese',
  avaliacao_funcional: 'Avaliação Funcional',
  avaliacao_dor: 'Avaliação de Dor',
  diagnostico_funcional: 'Diagnóstico Funcional',
  plano_terapeutico: 'Plano Terapêutico',
  sessao: 'Sessão de Fisioterapia',
  exercicios_prescritos: 'Exercícios Prescritos',
  documento: 'Documento',
  alerta: 'Alerta Funcional',
};

export function getHistoricoTypeLabel(type: HistoricoEntryType): string {
  return TYPE_LABELS[type] || type;
}

export function useHistoricoFisioterapiaData({
  patientId,
  clinicId,
}: UseHistoricoFisioterapiaDataParams) {
  const historicoQuery = useQuery({
    queryKey: ['fisioterapia-historico', patientId, clinicId],
    queryFn: async () => {
      if (!patientId || !clinicId) return [];

      // Buscar todas as evoluções clínicas de fisioterapia
      const { data, error } = await supabase
        .from('clinical_evolutions')
        .select(`
          id,
          evolution_type,
          content,
          created_at,
          updated_at,
          professional_id,
          professionals:professional_id (
            full_name
          )
        `)
        .eq('patient_id', patientId)
        .eq('clinic_id', clinicId)
        .in('evolution_type', [
          'anamnese_fisioterapia',
          'avaliacao_funcional_fisio',
          'avaliacao_dor_fisio',
          'diagnostico_funcional_fisio',
          'plano_terapeutico_fisio',
          'sessao_fisioterapia',
          'exercicios_prescritos_fisio',
          'documento_fisioterapia',
          'alerta_funcional_fisio',
        ])
        .order('created_at', { ascending: false });

      if (error) throw error;

      const entries: HistoricoEntry[] = (data || []).map((record) => {
        const content = record.content as Record<string, unknown> | null;
        const professionalName = (record.professionals as { full_name: string } | null)?.full_name;
        
        // Mapear tipo
        let type: HistoricoEntryType = 'sessao';
        let title = '';
        let subtitle = '';
        let description = '';

        switch (record.evolution_type) {
          case 'anamnese_fisioterapia':
            type = 'anamnese';
            title = 'Anamnese';
            subtitle = (content?.queixa_principal as string) || '';
            description = (content?.historia_doenca_atual as string) || '';
            break;

          case 'avaliacao_funcional_fisio':
            type = 'avaliacao_funcional';
            title = 'Avaliação Funcional';
            subtitle = (content?.observacoes as string) || '';
            break;

          case 'avaliacao_dor_fisio':
            type = 'avaliacao_dor';
            title = 'Avaliação de Dor';
            const intensidade = content?.intensidade as number;
            subtitle = intensidade !== undefined ? `Intensidade: ${intensidade}/10` : '';
            description = (content?.localizacao as string) || '';
            break;

          case 'diagnostico_funcional_fisio':
            type = 'diagnostico_funcional';
            title = 'Diagnóstico Funcional';
            subtitle = (content?.cid_principal as string) || '';
            description = (content?.descricao_funcional as string) || '';
            break;

          case 'plano_terapeutico_fisio':
            type = 'plano_terapeutico';
            title = 'Plano Terapêutico';
            const objetivos = content?.objetivos as string[];
            subtitle = objetivos?.length ? `${objetivos.length} objetivo(s)` : '';
            description = (content?.orientacoes as string) || '';
            break;

          case 'sessao_fisioterapia':
            type = 'sessao';
            const numero = content?.numero_sessao as number;
            title = numero ? `Sessão #${numero}` : 'Sessão';
            subtitle = (content?.tecnicas_utilizadas as string[])?.join(', ') || '';
            description = (content?.observacoes as string) || '';
            break;

          case 'exercicios_prescritos_fisio':
            type = 'exercicios_prescritos';
            title = 'Prescrição de Exercícios';
            const exercicios = content?.exercicios as unknown[];
            subtitle = exercicios?.length ? `${exercicios.length} exercício(s)` : '';
            break;

          case 'documento_fisioterapia':
            type = 'documento';
            title = (content?.file_name as string) || 'Documento';
            subtitle = (content?.category as string) || '';
            description = (content?.description as string) || '';
            break;

          case 'alerta_funcional_fisio':
            type = 'alerta';
            title = (content?.titulo as string) || 'Alerta';
            subtitle = (content?.tipo as string) || '';
            description = (content?.descricao as string) || '';
            break;
        }

        return {
          id: record.id,
          type,
          title,
          subtitle,
          description,
          date: record.created_at,
          professional_name: professionalName || undefined,
          metadata: content || undefined,
        } as HistoricoEntry;
      });

      return entries;
    },
    enabled: !!patientId && !!clinicId,
  });

  // Agrupar por data
  const groupedByDate = (historicoQuery.data || []).reduce((acc, entry) => {
    const dateKey = entry.date.split('T')[0]; // YYYY-MM-DD
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(entry);
    return acc;
  }, {} as Record<string, HistoricoEntry[]>);

  // Estatísticas
  const stats = {
    total: historicoQuery.data?.length || 0,
    sessoes: historicoQuery.data?.filter(e => e.type === 'sessao').length || 0,
    documentos: historicoQuery.data?.filter(e => e.type === 'documento').length || 0,
    avaliacoes: historicoQuery.data?.filter(e => 
      e.type === 'avaliacao_funcional' || e.type === 'avaliacao_dor'
    ).length || 0,
  };

  return {
    entries: historicoQuery.data || [],
    groupedByDate,
    stats,
    loading: historicoQuery.isLoading,
    error: historicoQuery.error,
    refetch: historicoQuery.refetch,
  };
}
