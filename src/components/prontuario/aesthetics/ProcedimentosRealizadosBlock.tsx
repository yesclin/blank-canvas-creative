/**
 * ESTÉTICA - Procedimentos Realizados
 *
 * Modal usa fonte oficial:
 *  - `procedures` (filtrado por clinic_id + specialty_id + is_active)
 *  - `procedure_products` (carrega automaticamente itens vinculados ao procedimento selecionado)
 *  - `products` para acrescentar itens extras
 * Persiste valor e materiais em `clinical_data` (JSONB).
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
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
  Package,
  DollarSign,
  Sparkles,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  usePerformedProcedures,
  useCreatePerformedProcedure,
  useDeletePerformedProcedure,
  type CreatePerformedProcedureInput,
} from '@/hooks/prontuario/usePerformedProcedures';
import { useProceduresList } from '@/hooks/useProceduresCRUD';
import { useProducts } from '@/hooks/useProducts';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

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

const REGION_SUGGESTIONS = [
  'Testa', 'Glabela', 'Periorbital', 'Malar', 'Nariz', 'Sulco Nasogeniano',
  'Lábios', 'Contorno Mandibular', 'Mento / Queixo', 'Pescoço', 'Colo', 'Mãos',
  'Glúteos', 'Abdômen',
];

interface ProductLine {
  key: string;
  product_id: string;
  product_name: string;
  unit: string;
  quantity: number;
  source: 'auto' | 'manual';
}

const formatCurrency = (v: number | null | undefined) =>
  (v ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

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
  const [procedureId, setProcedureId] = useState<string>('');
  const [procedureName, setProcedureName] = useState('');
  const [region, setRegion] = useState('');
  const [technique, setTechnique] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('realizado');
  const [price, setPrice] = useState<string>('');
  const [productLines, setProductLines] = useState<ProductLine[]>([]);
  const [extraProductId, setExtraProductId] = useState<string>('');
  const [extraQuantity, setExtraQuantity] = useState<string>('1');

  const { data: procedures, isLoading, isError } = usePerformedProcedures(
    patientId, clinicId, appointmentId, specialtyId,
  );

  // Catálogo oficial de procedimentos (filtrado por especialidade + ativos)
  const { data: catalogAll = [], isLoading: loadingCatalog } = useProceduresList(false);
  const catalog = useMemo(
    () => catalogAll.filter((p) =>
      p.is_active && (!specialtyId || p.specialty_id === specialtyId),
    ),
    [catalogAll, specialtyId],
  );

  // Catálogo de produtos (para item extra)
  const { data: allProducts = [] } = useProducts(false);

  // Carrega produtos vinculados ao procedimento selecionado
  const { data: linkedProducts, isLoading: loadingLinked } = useQuery({
    queryKey: ['procedure-products-linked', procedureId],
    enabled: !!procedureId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('procedure_products')
        .select('id, product_id, quantity, products:product_id (name, unit, is_active)')
        .eq('procedure_id', procedureId);
      if (error) throw error;
      return data ?? [];
    },
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
    setPrice('');
    setProductLines([]);
    setExtraProductId('');
    setExtraQuantity('1');
  }, []);

  // Quando seleciona um procedimento do catálogo: preenche nome + valor
  const handleSelectProcedure = useCallback((id: string) => {
    setProcedureId(id);
    const proc = catalog.find((p) => p.id === id);
    if (proc) {
      setProcedureName(proc.name);
      setPrice(proc.price != null ? String(proc.price) : '');
    }
  }, [catalog]);

  // Auto-carrega produtos vinculados quando linkedProducts chega
  useEffect(() => {
    if (!procedureId || !linkedProducts) return;
    const autoLines: ProductLine[] = linkedProducts
      .filter((lp: any) => lp.products?.is_active !== false)
      .map((lp: any) => ({
        key: `auto-${lp.id}`,
        product_id: lp.product_id,
        product_name: lp.products?.name ?? 'Produto',
        unit: lp.products?.unit ?? 'un',
        quantity: Number(lp.quantity) || 1,
        source: 'auto' as const,
      }));
    // mantém manuais já adicionados
    setProductLines((prev) => {
      const manuals = prev.filter((l) => l.source === 'manual');
      return [...autoLines, ...manuals];
    });
  }, [procedureId, linkedProducts]);

  const updateLineQty = (key: string, qty: number) => {
    setProductLines((prev) => prev.map((l) => l.key === key ? { ...l, quantity: qty } : l));
  };
  const removeLine = (key: string) => {
    setProductLines((prev) => prev.filter((l) => l.key !== key));
  };
  const addExtraProduct = () => {
    if (!extraProductId) return;
    const prod = allProducts.find((p: any) => p.id === extraProductId);
    if (!prod) return;
    const qty = Number(extraQuantity) || 1;
    setProductLines((prev) => [
      ...prev,
      {
        key: `manual-${Date.now()}-${Math.random()}`,
        product_id: prod.id,
        product_name: prod.name,
        unit: (prod as any).unit ?? 'un',
        quantity: qty,
        source: 'manual',
      },
    ]);
    setExtraProductId('');
    setExtraQuantity('1');
  };

  const handleSave = useCallback(() => {
    if (!procedureName.trim() || !clinicId) return;

    const numericPrice = price === '' ? null : Number(price);

    const input: CreatePerformedProcedureInput & { clinical_data?: any } = {
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
      // payload extra persistido em clinical_data
      clinical_data: {
        price: numericPrice,
        products: productLines.map((l) => ({
          product_id: l.product_id,
          product_name: l.product_name,
          unit: l.unit,
          quantity: l.quantity,
          source: l.source,
        })),
      },
    } as any;

    createMutation.mutate(input as any, {
      onSuccess: () => {
        resetForm();
        setDialogOpen(false);
      },
    });
  }, [procedureId, procedureName, region, technique, notes, status, price, productLines, clinicId, patientId, professionalId, appointmentId, specialtyId, createMutation, resetForm]);

  const handleDelete = useCallback(() => {
    if (!deleteId) return;
    deleteMutation.mutate(deleteId, { onSuccess: () => setDeleteId(null) });
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
  const availableExtras = allProducts.filter(
    (p: any) => !productLines.some((l) => l.product_id === p.id),
  );

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
                    const cd: any = (proc as any).clinical_data ?? {};
                    const prodCount = Array.isArray(cd.products) ? cd.products.length : 0;
                    return (
                      <TableRow key={proc.id}>
                        <TableCell className="font-medium">
                          {proc.procedure_name}
                          <div className="flex flex-wrap gap-2 mt-1">
                            {cd.price != null && (
                              <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                                <DollarSign className="h-3 w-3" />{formatCurrency(cd.price)}
                              </span>
                            )}
                            {prodCount > 0 && (
                              <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                                <Package className="h-3 w-3" />{prodCount} item(ns)
                              </span>
                            )}
                          </div>
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

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0">
          <DialogHeader className="p-6 pb-3 border-b shrink-0">
            <DialogTitle>Registrar Procedimento</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 px-6 py-4 overflow-y-auto flex-1 min-h-0">
            {/* Seletor oficial */}
            <div className="space-y-1.5">
              <Label>Procedimento (catálogo oficial) *</Label>
              <Select value={procedureId} onValueChange={handleSelectProcedure} disabled={loadingCatalog}>
                <SelectTrigger>
                  <SelectValue placeholder={loadingCatalog ? 'Carregando...' : (catalog.length === 0 ? 'Nenhum procedimento ativo nesta especialidade' : 'Selecione um procedimento')} />
                </SelectTrigger>
                <SelectContent>
                  {catalog.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                      {p.price != null && (
                        <span className="text-muted-foreground ml-2">· {formatCurrency(p.price)}</span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Cadastre novos em <strong>Configurações › Procedimentos</strong>.
              </p>
            </div>

            {/* Nome (editável caso queira ajustar a descrição daquele registro) */}
            <div className="space-y-1.5">
              <Label>Nome registrado *</Label>
              <Input
                placeholder="Ex: Aplicação de Toxina Botulínica"
                value={procedureName}
                onChange={(e) => setProcedureName(e.target.value)}
              />
            </div>

            {/* Valor */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1">
                  <DollarSign className="h-3.5 w-3.5" /> Valor do procedimento (R$)
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Preenchido pelo cadastro. Editável como ajuste pontual.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map(o => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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

            <Separator />

            {/* Materiais / Produtos */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2 text-sm font-semibold">
                  <Package className="h-4 w-4" /> Materiais / Produtos Utilizados
                </Label>
                {procedureId && loadingLinked && (
                  <span className="text-xs text-muted-foreground">Carregando vínculos...</span>
                )}
              </div>

              {productLines.length === 0 ? (
                <div className="text-xs text-muted-foreground border rounded-md p-3 bg-muted/30">
                  {procedureId
                    ? 'Nenhum material vinculado a este procedimento. Você pode acrescentar manualmente abaixo.'
                    : 'Selecione um procedimento para carregar os materiais vinculados automaticamente.'}
                </div>
              ) : (
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produto</TableHead>
                        <TableHead className="w-28">Quantidade</TableHead>
                        <TableHead className="w-20">Unidade</TableHead>
                        <TableHead className="w-24">Origem</TableHead>
                        <TableHead className="w-10" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {productLines.map((line) => (
                        <TableRow key={line.key}>
                          <TableCell className="font-medium text-sm">{line.product_name}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={line.quantity}
                              onChange={(e) => updateLineQty(line.key, Number(e.target.value))}
                              className="h-8"
                            />
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{line.unit}</TableCell>
                          <TableCell>
                            {line.source === 'auto' ? (
                              <Badge variant="secondary" className="text-[10px]">
                                <Sparkles className="h-3 w-3 mr-1" />Auto
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px]">Manual</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => removeLine(line.key)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Adicionar item extra */}
              <div className="flex items-end gap-2 p-3 rounded-md border border-dashed bg-muted/20">
                <div className="flex-1 space-y-1">
                  <Label className="text-xs">Adicionar item extra</Label>
                  <Select value={extraProductId} onValueChange={setExtraProductId}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Selecione um produto do estoque" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableExtras.length === 0 ? (
                        <div className="px-2 py-1.5 text-xs text-muted-foreground">
                          Nenhum produto disponível
                        </div>
                      ) : (
                        availableExtras.map((p: any) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name} <span className="text-muted-foreground">({p.unit})</span>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-24 space-y-1">
                  <Label className="text-xs">Qtd</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={extraQuantity}
                    onChange={(e) => setExtraQuantity(e.target.value)}
                    className="h-9"
                  />
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={addExtraProduct}
                  disabled={!extraProductId}
                >
                  <Plus className="h-4 w-4 mr-1" /> Adicionar
                </Button>
              </div>
            </div>

            <Separator />

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
