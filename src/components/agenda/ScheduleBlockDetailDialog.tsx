import { format } from 'date-fns';
import { Ban } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { ScheduleBlock } from '@/types/agenda';
import { blockTimeRangeLabel, isClinicWideBlock } from './scheduleBlockUtils';

interface ScheduleBlockDetailDialogProps {
  block: ScheduleBlock | null;
  professionalName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canManage?: boolean;
  onDelete?: (block: ScheduleBlock) => void;
  isDeleting?: boolean;
}

const fmt = (d: string) => format(new Date(`${d}T00:00:00`), 'dd/MM/yyyy');

export function ScheduleBlockDetailDialog({
  block,
  professionalName,
  open,
  onOpenChange,
  canManage = false,
  onDelete,
  isDeleting = false,
}: ScheduleBlockDetailDialogProps) {
  if (!block) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ban className="h-4 w-4 text-muted-foreground" />
            {block.title}
          </DialogTitle>
          <DialogDescription>Detalhes do bloqueio de agenda</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">Abrangência</span>
            <Badge variant={isClinicWideBlock(block) ? 'destructive' : 'secondary'}>
              {isClinicWideBlock(block) ? 'Toda a clínica' : professionalName || 'Profissional'}
            </Badge>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">Data</span>
            <span className="font-medium">
              {block.start_date === block.end_date
                ? fmt(block.start_date)
                : `${fmt(block.start_date)} → ${fmt(block.end_date)}`}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">Horário</span>
            <span className="font-medium">{blockTimeRangeLabel(block)}</span>
          </div>
          {block.reason && (
            <div className="rounded-md border bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground mb-1">Motivo</p>
              <p>{block.reason}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          {canManage && onDelete && (
            <Button variant="destructive" disabled={isDeleting} onClick={() => onDelete(block)}>
              {isDeleting ? 'Removendo...' : 'Remover bloqueio'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
