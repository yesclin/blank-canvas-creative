import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Trash2, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface ToothProcedure {
  id: string;
  tooth_number: number;
  procedure_name: string;
  status: 'planned' | 'in_progress' | 'completed';
  notes?: string;
  created_at: string;
  completed_at?: string;
}

interface ToothProceduresListProps {
  procedures: ToothProcedure[];
  onAdd?: (procedure: Omit<ToothProcedure, 'id' | 'created_at'>) => void;
  onUpdate?: (id: string, updates: Partial<ToothProcedure>) => void;
  onRemove?: (id: string) => void;
  readOnly?: boolean;
  className?: string;
}

const STATUS_CONFIG = {
  planned: { label: 'Planejado', color: 'bg-yellow-100 text-yellow-800' },
  in_progress: { label: 'Em Andamento', color: 'bg-blue-100 text-blue-800' },
  completed: { label: 'Concluído', color: 'bg-green-100 text-green-800' },
};

const COMMON_PROCEDURES = [
  'Restauração',
  'Extração',
  'Canal',
  'Limpeza',
  'Clareamento',
  'Coroa',
  'Faceta',
  'Implante',
  'Prótese',
  'Gengivectomia',
];

export function ToothProceduresList({
  procedures,
  onAdd,
  onUpdate,
  onRemove,
  readOnly = false,
  className,
}: ToothProceduresListProps) {
  const [showForm, setShowForm] = useState(false);
  const [newProcedure, setNewProcedure] = useState({
    tooth_number: 11,
    procedure_name: '',
    status: 'planned' as const,
    notes: '',
  });

  const handleAdd = () => {
    if (!newProcedure.procedure_name.trim()) return;
    
    onAdd?.(newProcedure);
    setNewProcedure({
      tooth_number: 11,
      procedure_name: '',
      status: 'planned',
      notes: '',
    });
    setShowForm(false);
  };

  const groupedByTooth = procedures.reduce((acc, proc) => {
    if (!acc[proc.tooth_number]) {
      acc[proc.tooth_number] = [];
    }
    acc[proc.tooth_number].push(proc);
    return acc;
  }, {} as Record<number, ToothProcedure[]>);

  return (
    <div className={cn('space-y-4', className)}>
      {!readOnly && (
        <div className="flex justify-end">
          <Button onClick={() => setShowForm(!showForm)} variant={showForm ? 'secondary' : 'default'} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            {showForm ? 'Cancelar' : 'Novo Procedimento'}
          </Button>
        </div>
      )}

      {showForm && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Adicionar Procedimento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Dente</Label>
                <Input
                  type="number"
                  min={11}
                  max={48}
                  value={newProcedure.tooth_number}
                  onChange={(e) => setNewProcedure({ ...newProcedure, tooth_number: parseInt(e.target.value) || 11 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={newProcedure.status}
                  onValueChange={(v) => setNewProcedure({ ...newProcedure, status: v as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_CONFIG).map(([value, config]) => (
                      <SelectItem key={value} value={value}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Procedimento</Label>
              <Select
                value={newProcedure.procedure_name}
                onValueChange={(v) => setNewProcedure({ ...newProcedure, procedure_name: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione ou digite" />
                </SelectTrigger>
                <SelectContent>
                  {COMMON_PROCEDURES.map((proc) => (
                    <SelectItem key={proc} value={proc}>{proc}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                value={newProcedure.notes}
                onChange={(e) => setNewProcedure({ ...newProcedure, notes: e.target.value })}
                rows={2}
              />
            </div>
            <Button onClick={handleAdd} className="w-full">Adicionar</Button>
          </CardContent>
        </Card>
      )}

      <ScrollArea className="h-[400px]">
        {Object.keys(groupedByTooth).length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Nenhum procedimento registrado.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedByTooth)
              .sort(([a], [b]) => parseInt(a) - parseInt(b))
              .map(([toothNumber, procs]) => (
                <Card key={toothNumber}>
                  <CardHeader className="py-2 px-4">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Badge variant="outline">Dente {toothNumber}</Badge>
                      <span className="text-muted-foreground font-normal">
                        {procs.length} procedimento(s)
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-2 px-4">
                    <div className="space-y-2">
                      {procs.map((proc) => (
                        <div
                          key={proc.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{proc.procedure_name}</span>
                              <Badge className={STATUS_CONFIG[proc.status].color}>
                                {STATUS_CONFIG[proc.status].label}
                              </Badge>
                            </div>
                            {proc.notes && (
                              <p className="text-xs text-muted-foreground mt-1">{proc.notes}</p>
                            )}
                            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(proc.created_at), "dd/MM/yyyy", { locale: ptBR })}
                              {proc.completed_at && (
                                <span className="ml-2">
                                  → Concluído em {format(new Date(proc.completed_at), "dd/MM/yyyy", { locale: ptBR })}
                                </span>
                              )}
                            </div>
                          </div>
                          {!readOnly && (
                            <div className="flex gap-1">
                              {proc.status !== 'completed' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onUpdate?.(proc.id, { 
                                    status: 'completed', 
                                    completed_at: new Date().toISOString() 
                                  })}
                                >
                                  Concluir
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onRemove?.(proc.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
