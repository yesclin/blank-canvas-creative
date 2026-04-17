/**
 * ESTÉTICA - Procedimentos Realizados
 *
 * Bloco funcional para registro e leitura de procedimentos realizados,
 * separado de Evoluções e de Produtos Utilizados.
 */

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Plus,
  Syringe,
  Trash2,
  Clock,
  User,
  MapPin,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  usePerformedProcedures,
  useCreatePerformedProcedure,
  useDeletePerformedProcedure,
  type CreatePerformedProcedureInput,
} from '@/hooks/prontuario/usePerformedProcedures';

interface Props {
  patientId: string;
  clinicId: string | null;
  appointmentId?: string | null;
  specialtyId?: string | null;
  professionalId?: string | null;
  canEdit: boolean;
}

const STATUS_OPTIONS = [
  { value: 'realizado', label: 'Realizado' },
  { value: 'parcial', label: 'Parcial' },
  { value: 'cancelado', label: 'Cancelado' },
];

const STATUS_COLORS: Record<string, string> = {
  realizado: 'bg-green-100 text-green-800 border-green-200',
  parcial: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  cancelado: 'bg-red-100 text-red-800 border-red-200',
};

const PROCEDURE_SUGGESTIONS = [
  'Aplicação de Toxina Botulínica',
  'Preenchimento com Ácido Hialurônico',
  'Bioestimulador de Colágeno',
  'Skinbooster',
  'Harmonização Facial',
  'Limpeza de Pele',
  'Peeling Químico',
  'Microagulhamento',
  'Laser Fracionado',
  'Radiofrequência',
  'Ultrassom Microfocado',
  'Criolipólise',
  'Fios de PDO',
  'Mesoterapia',
  'Carboxiterapia',
];

const REGION_SUGGESTIONS = [
  'Testa',
  'Glabela',
  'Periorbital',
  'Malar',
  'Nariz',
  'Sulco Nasogeniano',
  'Lábios',
  'Contorno Mandibular',
  'Mento / Queixo',
  'Pescoço',
  'Colo',
  'Mãos',
  'Glúteos',
  'Abdômen',
];

export function ProcedimentosRealizadosBlock({
  patientId,
  clinicId,
  appointmentId,
  specialtyId,
  professionalId,
  canEdit,
}: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form state
  const [procedureName, setProcedureName] = useState('');
  const [region, setRegion] = useState('');
  const [technique, setTechnique] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('realizado');

  const { data: procedures, isLoading, isError } = usePerformedProcedures(
    patientId,
    clinicId,
    appointmentId,
    specialtyId,
  );

  const createMutation = useCreatePerformedProcedure(patientId, appointmentId);
  const deleteMutation = useDeletePerformedProcedure(patientId, appointmentId);

  const resetForm = useCallback(() => {
    setProcedureName('');
    setRegion('');
    setTechnique('');
    setNotes('');
    setStatus('realizado');
  }, []);

  const handleSave = useCallback(() => {
    if (!procedureName.trim() || !clinicId) return;

    const input: CreatePerformedProcedureInput = {
      clinic_id: clinicId,
      patient_id: patientId,
      professional_id: professionalId ?? null,
      appointment_id: appointmentId ?? null,
      specialty_id: specialtyId ?? null,
      procedure_name: procedureName.trim(),
      region: region.trim() || null,
      technique: technique.trim() || null,
      notes: notes.trim() || null,
      status,
    };

    createMutation.mutate(input, {
      onSuccess: () => {
        resetForm();
        setDialogOpen(false);
      },
    });
  }, [procedureName, region, technique, notes, status, clinicId, patientId, professionalId, appointmentId, specialtyId, createMutation, resetForm]);

  const handleDelete = useCallback(() => {
    if (!deleteId) return;
    deleteMutation.mutate(deleteId, {
      onSuccess: () => setDeleteId(null),
    });
  }, [deleteId, deleteMutation]);

  // Loading
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Syringe className="h-5 w-5" />
            Procedimentos Realizados
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Error
  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Syringe className="h-5 w-5" />
            Procedimentos Realizados
          </CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center">
          <AlertCircle className="h-8 w-8 mx-auto text-destructive mb-2" />
          <p className="text-sm text-destructive">Erro ao carregar procedimentos.</p>
        </CardContent>
      </Card>
    );
  }

  const list = procedures ?? [];

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Syringe className="h-5 w-5" />
            Procedimentos Realizados
            {list.length > 0 && (
              <Badge variant="secondary" className="ml-1">{list.length}</Badge>
            )}
          </CardTitle>
          {canEdit && (
            <Button size="sm" onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-1" /> Registrar
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {list.length === 0 ? (
            <div className="py-10 text-center">
              <Syringe className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">
                Nenhum procedimento registrado{appointmentId ? ' neste atendimento' : ''}.
              </p>
              {canEdit && (
                <Button variant="outline" size="sm" className="mt-3" onClick={() => setDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" /> Registrar primeiro procedimento
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Procedimento</TableHead>
                    <TableHead>Região</TableHead>
                    <TableHead>Técnica</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Profissional</TableHead>
                    {canEdit && <TableHead className="w-10" />}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {list.map((proc) => (
                    <TableRow key={proc.id}>
                      <TableCell className="font-medium">
                        {proc.procedure_name}
                        {proc.notes && (
                          <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[200px]" title={proc.notes}>
                            <FileText className="h-3 w-3 inline mr-1" />
                            {proc.notes}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        {proc.region ? (
                          <span className="flex items-center gap-1 text-sm">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            {proc.region}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">{proc.technique || <span className="text-muted-foreground text-xs">—</span>}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={STATUS_COLORS[proc.status] ?? ''}>
                          {STATUS_OPTIONS.find(s => s.value === proc.status)?.label ?? proc.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm whitespace-nowrap">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          {format(parseISO(proc.performed_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">
                        {proc.professional_name ? (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3 text-muted-foreground" />
                            {proc.professional_name}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
                      {canEdit && (
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => setDeleteId(proc.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col p-0 gap-0">
          <DialogHeader className="p-6 pb-3 border-b shrink-0">
            <DialogTitle>Registrar Procedimento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 px-6 py-4 overflow-y-auto flex-1 min-h-0">
            <div className="space-y-1.5">
              <Label>Procedimento *</Label>
              <Input
                placeholder="Ex: Aplicação de Toxina Botulínica"
                value={procedureName}
                onChange={(e) => setProcedureName(e.target.value)}
                list="proc-suggestions"
              />
              <datalist id="proc-suggestions">
                {PROCEDURE_SUGGESTIONS.map(s => <option key={s} value={s} />)}
              </datalist>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Região / Área</Label>
                <Input
                  placeholder="Ex: Glabela"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  list="region-suggestions"
                />
                <datalist id="region-suggestions">
                  {REGION_SUGGESTIONS.map(s => <option key={s} value={s} />)}
                </datalist>
              </div>
              <div className="space-y-1.5">
                <Label>Técnica</Label>
                <Input
                  placeholder="Ex: Microinjeções"
                  value={technique}
                  onChange={(e) => setTechnique(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(o => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Observações</Label>
              <Textarea
                placeholder="Observações sobre o procedimento..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="p-6 pt-3 border-t shrink-0">
            <Button variant="outline" onClick={() => { resetForm(); setDialogOpen(false); }}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={!procedureName.trim() || createMutation.isPending}
            >
              {createMutation.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover procedimento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O registro será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? 'Removendo...' : 'Remover'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
