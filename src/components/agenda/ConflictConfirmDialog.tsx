import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle } from "lucide-react";
import type { ScheduleConflict } from "@/hooks/useConflictDetection";

interface ConflictConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conflicts: ScheduleConflict[];
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConflictConfirmDialog({
  open,
  onOpenChange,
  conflicts,
  onConfirm,
  onCancel,
}: ConflictConfirmDialogProps) {
  const warningConflicts = conflicts.filter(c => c.severity === 'warning');
  
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="h-5 w-5" />
            Confirmar Encaixe com Conflito
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>
              Este horário possui {warningConflicts.length === 1 ? 'um conflito' : 'conflitos'} que requer{warningConflicts.length === 1 ? '' : 'm'} sua atenção:
            </p>
            
            <ul className="space-y-2 mt-2">
              {warningConflicts.map((conflict) => (
                <li 
                  key={conflict.id} 
                  className="flex items-start gap-2 text-sm bg-amber-50 dark:bg-amber-950/30 p-2 rounded-md"
                >
                  <span className="text-amber-600 font-medium">⚠️ {conflict.message}</span>
                  {conflict.details && (
                    <span className="text-muted-foreground">— {conflict.details}</span>
                  )}
                </li>
              ))}
            </ul>
            
            <p className="text-sm font-medium mt-4">
              Deseja continuar mesmo assim?
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            className="bg-amber-600 hover:bg-amber-700"
          >
            Confirmar Encaixe
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
