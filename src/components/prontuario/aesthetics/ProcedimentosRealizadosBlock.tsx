/**
 * ESTÉTICA - Procedimentos Realizados
 *
 * Bloco funcional para registro e leitura de procedimentos realizados,
 * separado de Evoluções e de Produtos Utilizados.
 *
 * Modal "Registrar Procedimento" enriquecido em 6 blocos:
 *  1. Identificação (data/hora, profissional, especialidade, atendimento)
 *  2. Execução (região, lado, técnica, dose, unidade, status)
 *  3. Objetivo clínico (objetivo, queixa relacionada, resultado imediato)
 *  4. Produto e rastreabilidade (produto, lote, fabricante, validade, qtd consumida)
 *  5. Segurança e intercorrências (sem intercorrências, descrição, conduta)
 *  6. Pós-procedimento (orientações, retorno sugerido, observações)
 */

import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
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
  Stethoscope,
  Package,
  ShieldAlert,
  ClipboardList,
  Lock,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  usePerformedProcedures,
  useCreatePerformedProcedure,
  useDeletePerformedProcedure,
  type CreatePerformedProcedureInput,
} from '@/hooks/prontuario/usePerformedProcedures';
import { useProcedureCatalog } from '@/hooks/prontuario/useProcedureCatalog';

interface Props {
  patientId: string;
  clinicId: string | null;
  appointmentId?: string | null;
  specialtyId?: string | null;
  specialtyName?: string | null;
  professionalId?: string | null;
  professionalName?: string | null;
  canEdit: boolean;
}

const STATUS_OPTIONS = [
  { value: 'planejado', label: 'Planejado' },
  { value: 'parcial', label: 'Parcial' },
  { value: 'realizado', label: 'Realizado' },
  { value: 'interrompido', label: 'Interrompido' },
  { value: 'reagendado', label: 'Reagendado' },
  { value: 'cancelado', label: 'Cancelado' },
];

const STATUS_COLORS: Record<string, string> = {
  planejado: 'bg-blue-100 text-blue-800 border-blue-200',
  parcial: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  realizado: 'bg-green-100 text-green-800 border-green-200',
  interrompido: 'bg-orange-100 text-orange-800 border-orange-200',
  reagendado: 'bg-purple-100 text-purple-800 border-purple-200',
  cancelado: 'bg-red-100 text-red-800 border-red-200',
};

const REGION_SUGGESTIONS = [
  'Testa', 'Glabela', 'Periorbital', 'Malar', 'Nariz', 'Sulco Nasogeniano',
  'Lábios', 'Contorno Mandibular', 'Mento / Queixo', 'Pescoço', 'Colo',
  'Mãos', 'Glúteos', 'Abdômen',
];

const SIDE_OPTIONS = [
  { value: 'direito', label: 'Direito' },
  { value: 'esquerdo', label: 'Esquerdo' },
  { value: 'bilateral', label: 'Bilateral' },
  { value: 'central', label: 'Central' },
  { value: 'outro', label: 'Outro' },
];

const UNIT_OPTIONS = ['ml', 'U/UI', 'ampola', 'seringa', 'sessão', 'unidade'];

interface ClinicalDataState {
  side: string;
  dose: string;
  unit: string;
  objective: string;
  related_complaint: string;
  immediate_result: string;
  product_name: string;
  product_batch: string;
  product_manufacturer: string;
  product_expiry: string;
  product_consumed: string;
  no_incidents: boolean;
  incidents_description: string;
  incidents_conduct: string;
  post_instructions: string;
  next_return: string;
  extra_notes: string;
  link_before_after: boolean;
  link_facial_map: boolean;
  link_document: boolean;
}

const emptyClinical = (): ClinicalDataState => ({
  side: '',
  dose: '',
  unit: '',
  objective: '',
  related_complaint: '',
  immediate_result: '',
  product_name: '',
  product_batch: '',
  product_manufacturer: '',
  product_expiry: '',
  product_consumed: '',
  no_incidents: true,
  incidents_description: '',
  incidents_conduct: '',
  post_instructions: '',
  next_return: '',
  extra_notes: '',
  link_before_after: false,
  link_facial_map: false,
  link_document: false,
});

function nowLocalDateTime(): string {
  // yyyy-MM-ddTHH:mm in local TZ for <input type="datetime-local">
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function ProcedimentosRealizadosBlock({
  patientId,
  clinicId,
  appointmentId,
  specialtyId,
  specialtyName,
  professionalId,
  professionalName,
  canEdit,
}: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Identificação
  const [performedAt, setPerformedAt] = useState(nowLocalDateTime());

  // Form state — execução básica
  const [procedureId, setProcedureId] = useState<string>('');
  const [procedureName, setProcedureName] = useState('');
  const [region, setRegion] = useState('');
  const [technique, setTechnique] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('realizado');

  // Dados clínicos estruturados
  const [clinical, setClinical] = useState<ClinicalDataState>(emptyClinical());

  const updateClinical = useCallback(<K extends keyof ClinicalDataState>(key: K, value: ClinicalDataState[K]) => {
    setClinical(prev => ({ ...prev, [key]: value }));
  }, []);

  const { data: procedures, isLoading, isError } = usePerformedProcedures(
    patientId,
    clinicId,
    appointmentId,
    specialtyId,
  );

  const { procedures: catalog, isLoading: catalogLoading } = useProcedureCatalog({
    clinicId,
    specialtyId,
  });

  const createMutation = useCreatePerformedProcedure(patientId, appointmentId);
  const deleteMutation = useDeletePerformedProcedure(patientId, appointmentId);

  const resetForm = useCallback(() => {
    setProcedureId('');
    setProcedureName('');
    setRegion('');
    setTechnique('');
    setNotes('');
    setStatus('realizado');
    setPerformedAt(nowLocalDateTime());
    setClinical(emptyClinical());
  }, []);

  // Reset performed_at to "now" each time the dialog opens
  useEffect(() => {
    if (dialogOpen) {
      setPerformedAt(nowLocalDateTime());
    }
  }, [dialogOpen]);

  const handleSelectProcedure = useCallback((id: string) => {
    setProcedureId(id);
    const found = catalog.find(p => p.id === id);
    if (found) setProcedureName(found.name);
  }, [catalog]);

  const handleSave = useCallback(() => {
    if (!procedureName.trim() || !clinicId) return;

    // Build clinical_data only with non-empty fields to keep payload clean
    const clinicalData: Record<string, unknown> = {};
    Object.entries(clinical).forEach(([k, v]) => {
      if (typeof v === 'string' && v.trim()) clinicalData[k] = v.trim();
      else if (typeof v === 'boolean' && v) clinicalData[k] = v;
    });

    const performedIso = performedAt
      ? new Date(performedAt).toISOString()
      : new Date().toISOString();

    const input: CreatePerformedProcedureInput = {
      clinic_id: clinicId,
      patient_id: patientId,
      professional_id: professionalId ?? null,
      appointment_id: appointmentId ?? null,
      specialty_id: specialtyId ?? null,
      procedure_id: procedureId || null,
      procedure_name: procedureName.trim(),
      region: region.trim() || null,
      technique: technique.trim() || null,
      notes: notes.trim() || null,
      status,
      performed_at: performedIso,
      clinical_data: clinicalData,
    };

    createMutation.mutate(input, {
      onSuccess: () => {
        resetForm();
        setDialogOpen(false);
      },
    });
  }, [procedureId, procedureName, region, technique, notes, status, performedAt, clinical, clinicId, patientId, professionalId, appointmentId, specialtyId, createMutation, resetForm]);

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
  const appointmentLocked = !!appointmentId;

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
                  {list.map((proc) => {
                    const cd = (proc.clinical_data ?? {}) as Record<string, unknown>;
                    const dose = cd.dose as string | undefined;
                    const unit = cd.unit as string | undefined;
                    return (
                      <TableRow key={proc.id}>
                        <TableCell className="font-medium">
                          {proc.procedure_name}
                          {(dose || unit) && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {dose} {unit}
                            </p>
                          )}
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
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog — enriquecido */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Syringe className="h-5 w-5 text-primary" />
              Registrar Procedimento
            </DialogTitle>
            <DialogDescription>
              Registre o procedimento realizado de forma estruturada e completa para o prontuário.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* === BLOCO 1: IDENTIFICAÇÃO === */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2 text-foreground">
                <ClipboardList className="h-4 w-4 text-primary" />
                Identificação
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Data e hora *</Label>
                  <Input
                    type="datetime-local"
                    value={performedAt}
                    onChange={(e) => setPerformedAt(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1">
                    Profissional
                    {appointmentLocked && <Lock className="h-3 w-3 text-muted-foreground" />}
                  </Label>
                  <Input
                    value={professionalName ?? '—'}
                    disabled
                    className="bg-muted/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1">
                    Especialidade
                    {appointmentLocked && <Lock className="h-3 w-3 text-muted-foreground" />}
                  </Label>
                  <Input
                    value={specialtyName ?? 'Estética / Harmonização'}
                    disabled
                    className="bg-muted/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Atendimento vinculado</Label>
                  <Input
                    value={appointmentId ? `#${appointmentId.slice(0, 8)}` : 'Avulso'}
                    disabled
                    className="bg-muted/50"
                  />
                </div>
              </div>
            </section>

            <Separator />

            {/* === BLOCO 2: EXECUÇÃO === */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2 text-foreground">
                <Stethoscope className="h-4 w-4 text-primary" />
                Execução
              </h3>

              <div className="space-y-1.5">
                <Label>Procedimento *</Label>
                {catalog.length === 0 ? (
                  <div className="rounded-md border border-dashed bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                    {catalogLoading
                      ? 'Carregando procedimentos...'
                      : 'Nenhum procedimento ativo cadastrado para esta especialidade. Cadastre em Configurações › Procedimentos.'}
                  </div>
                ) : (
                  <Select value={procedureId} onValueChange={handleSelectProcedure}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o procedimento" />
                    </SelectTrigger>
                    <SelectContent>
                      {catalog.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
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
                  <Label>Lado / Local detalhado</Label>
                  <Select value={clinical.side} onValueChange={(v) => updateClinical('side', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {SIDE_OPTIONS.map(o => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Técnica</Label>
                <Input
                  placeholder="Ex: Microinjeções, retroinjeção, fanning"
                  value={technique}
                  onChange={(e) => setTechnique(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label>Quantidade / Dose</Label>
                  <Input
                    type="text"
                    inputMode="decimal"
                    placeholder="Ex: 1.5"
                    value={clinical.dose}
                    onChange={(e) => updateClinical('dose', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Unidade</Label>
                  <Select value={clinical.unit} onValueChange={(v) => updateClinical('unit', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Unidade" />
                    </SelectTrigger>
                    <SelectContent>
                      {UNIT_OPTIONS.map(u => (
                        <SelectItem key={u} value={u}>{u}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Status *</Label>
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
              </div>
            </section>

            <Separator />

            {/* === BLOCOS COLAPSÁVEIS (mantém modal leve) === */}
            <Accordion type="multiple" className="w-full">
              {/* BLOCO 3: OBJETIVO CLÍNICO */}
              <AccordionItem value="objective">
                <AccordionTrigger className="text-sm font-semibold">
                  <span className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    Objetivo clínico
                  </span>
                </AccordionTrigger>
                <AccordionContent className="space-y-3 pt-2">
                  <div className="space-y-1.5">
                    <Label>Objetivo / Indicação</Label>
                    <Textarea
                      rows={2}
                      placeholder="Ex: Suavizar rugas dinâmicas frontais"
                      value={clinical.objective}
                      onChange={(e) => updateClinical('objective', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Queixa principal relacionada</Label>
                    <Input
                      placeholder="Ex: Linhas de expressão na testa"
                      value={clinical.related_complaint}
                      onChange={(e) => updateClinical('related_complaint', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Resultado imediato / Avaliação inicial</Label>
                    <Textarea
                      rows={2}
                      placeholder="Como o ato evoluiu durante a aplicação"
                      value={clinical.immediate_result}
                      onChange={(e) => updateClinical('immediate_result', e.target.value)}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* BLOCO 4: PRODUTO E RASTREABILIDADE */}
              <AccordionItem value="product">
                <AccordionTrigger className="text-sm font-semibold">
                  <span className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-primary" />
                    Produto e rastreabilidade
                  </span>
                </AccordionTrigger>
                <AccordionContent className="space-y-3 pt-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Produto utilizado</Label>
                      <Input
                        placeholder="Nome comercial"
                        value={clinical.product_name}
                        onChange={(e) => updateClinical('product_name', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Fabricante</Label>
                      <Input
                        value={clinical.product_manufacturer}
                        onChange={(e) => updateClinical('product_manufacturer', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Lote</Label>
                      <Input
                        value={clinical.product_batch}
                        onChange={(e) => updateClinical('product_batch', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Validade</Label>
                      <Input
                        type="date"
                        value={clinical.product_expiry}
                        onChange={(e) => updateClinical('product_expiry', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5 col-span-2">
                      <Label>Quantidade consumida</Label>
                      <Input
                        placeholder="Ex: 1 ampola, 0.5 ml"
                        value={clinical.product_consumed}
                        onChange={(e) => updateClinical('product_consumed', e.target.value)}
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* BLOCO 5: SEGURANÇA E INTERCORRÊNCIAS */}
              <AccordionItem value="safety">
                <AccordionTrigger className="text-sm font-semibold">
                  <span className="flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-primary" />
                    Segurança e intercorrências
                  </span>
                </AccordionTrigger>
                <AccordionContent className="space-y-3 pt-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="no-incidents"
                      checked={clinical.no_incidents}
                      onCheckedChange={(v) => updateClinical('no_incidents', !!v)}
                    />
                    <Label htmlFor="no-incidents" className="cursor-pointer font-normal">
                      Sem intercorrências durante o procedimento
                    </Label>
                  </div>
                  {!clinical.no_incidents && (
                    <>
                      <div className="space-y-1.5">
                        <Label>Descrição da intercorrência</Label>
                        <Textarea
                          rows={2}
                          placeholder="O que ocorreu, quando e como foi identificado"
                          value={clinical.incidents_description}
                          onChange={(e) => updateClinical('incidents_description', e.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Conduta adotada</Label>
                        <Textarea
                          rows={2}
                          placeholder="Como foi manejado e medicações administradas"
                          value={clinical.incidents_conduct}
                          onChange={(e) => updateClinical('incidents_conduct', e.target.value)}
                        />
                      </div>
                    </>
                  )}
                </AccordionContent>
              </AccordionItem>

              {/* BLOCO 6: PÓS-PROCEDIMENTO */}
              <AccordionItem value="post">
                <AccordionTrigger className="text-sm font-semibold">
                  <span className="flex items-center gap-2">
                    <ClipboardList className="h-4 w-4 text-primary" />
                    Pós-procedimento
                  </span>
                </AccordionTrigger>
                <AccordionContent className="space-y-3 pt-2">
                  <div className="space-y-1.5">
                    <Label>Orientações pós-procedimento</Label>
                    <Textarea
                      rows={3}
                      placeholder="Cuidados, restrições, sinais de alerta"
                      value={clinical.post_instructions}
                      onChange={(e) => updateClinical('post_instructions', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Retorno sugerido</Label>
                    <Input
                      placeholder="Ex: 15 dias para reavaliação"
                      value={clinical.next_return}
                      onChange={(e) => updateClinical('next_return', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Observações clínicas complementares</Label>
                    <Textarea
                      rows={2}
                      value={clinical.extra_notes}
                      onChange={(e) => updateClinical('extra_notes', e.target.value)}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* BLOCO 7: VÍNCULOS */}
              <AccordionItem value="links">
                <AccordionTrigger className="text-sm font-semibold">
                  <span className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    Vínculos adicionais
                  </span>
                </AccordionTrigger>
                <AccordionContent className="space-y-2 pt-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="link-ba"
                      checked={clinical.link_before_after}
                      onCheckedChange={(v) => updateClinical('link_before_after', !!v)}
                    />
                    <Label htmlFor="link-ba" className="cursor-pointer font-normal">
                      Marcar para vincular fotos antes/depois
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="link-fm"
                      checked={clinical.link_facial_map}
                      onCheckedChange={(v) => updateClinical('link_facial_map', !!v)}
                    />
                    <Label htmlFor="link-fm" className="cursor-pointer font-normal">
                      Marcar para vincular mapa facial
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="link-doc"
                      checked={clinical.link_document}
                      onCheckedChange={(v) => updateClinical('link_document', !!v)}
                    />
                    <Label htmlFor="link-doc" className="cursor-pointer font-normal">
                      Marcar para vincular documento/termo
                    </Label>
                  </div>
                  <p className="text-xs text-muted-foreground pt-1">
                    Os vínculos ficam registrados no procedimento e podem ser anexados pelos blocos correspondentes.
                  </p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {/* OBSERVAÇÕES RÁPIDAS — sempre visíveis */}
            <div className="space-y-1.5">
              <Label>Observações rápidas</Label>
              <Textarea
                placeholder="Resumo curto que aparece na lista..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { resetForm(); setDialogOpen(false); }}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={!procedureId || !procedureName.trim() || createMutation.isPending}
            >
              {createMutation.isPending ? 'Salvando...' : 'Salvar procedimento'}
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
