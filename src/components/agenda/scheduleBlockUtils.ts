import { format } from 'date-fns';
import type { ScheduleBlock } from '@/types/agenda';

/** Reaproveita a estrutura atual de schedule_blocks — apenas leitura/apresentação. */

export const isClinicWideBlock = (block: ScheduleBlock) => !block.professional_id;

export const blockCoversDate = (block: ScheduleBlock, dateStr: string) =>
  dateStr >= block.start_date && dateStr <= block.end_date;

export interface BlockScope {
  /** Profissional em foco (coluna/aba selecionada) */
  professionalId?: string;
  /** Quando não há profissional em foco, inclui bloqueios individuais identificados */
  includeIndividual?: boolean;
}

export function getBlocksForDay(
  blocks: ScheduleBlock[],
  date: Date,
  scope: BlockScope = {},
): ScheduleBlock[] {
  const dateStr = format(date, 'yyyy-MM-dd');
  return blocks.filter((block) => {
    if (!blockCoversDate(block, dateStr)) return false;
    if (isClinicWideBlock(block)) return true;
    if (scope.professionalId) return block.professional_id === scope.professionalId;
    return !!scope.includeIndividual;
  });
}

export function blockTimeRangeLabel(block: ScheduleBlock): string {
  if (block.all_day) return 'Dia inteiro';
  const start = block.start_time?.slice(0, 5) ?? '--:--';
  const end = block.end_time?.slice(0, 5) ?? '--:--';
  return `${start} às ${end}`;
}

/** Título curto exibido na faixa/badge da agenda */
export function blockDisplayTitle(block: ScheduleBlock, professionalName?: string): string {
  if (isClinicWideBlock(block)) return 'Clínica fechada';
  if (block.all_day) {
    return professionalName ? `${professionalName} — indisponível` : 'Agenda bloqueada';
  }
  const range = blockTimeRangeLabel(block);
  return professionalName ? `${professionalName} — ${range}` : 'Horário bloqueado';
}

/** Título usado na faixa vertical das visões Dia/Semana */
export function blockBandTitle(block: ScheduleBlock, professionalName?: string): string {
  if (isClinicWideBlock(block)) return 'Clínica fechada';
  if (block.all_day) return professionalName ? `Profissional indisponível — ${professionalName}` : 'Agenda bloqueada';
  return professionalName ? `Horário bloqueado — ${professionalName}` : 'Horário bloqueado';
}

/** Minutos de início/fim do bloqueio em um dia (para posicionar a faixa) */
export function blockMinuteRange(
  block: ScheduleBlock,
  dayStartMin: number,
  dayEndMin: number,
): { startMin: number; endMin: number } {
  if (block.all_day || !block.start_time || !block.end_time) {
    return { startMin: dayStartMin, endMin: dayEndMin };
  }
  const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
  return {
    startMin: Math.max(dayStartMin, toMin(block.start_time)),
    endMin: Math.min(dayEndMin, toMin(block.end_time)),
  };
}
