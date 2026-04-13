import { useState } from "react";
import { Plus, Search, Trash2, Edit, Package, Calculator, AlertCircle, Boxes } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useProceduresList } from "@/hooks/useProceduresCRUD";
import { useInventoryItems } from "@/hooks/useInventoryItems";
import {
  useProcedureConsumptionTemplates,
  useCreateConsumptionTemplate,
  useUpdateConsumptionTemplate,
  useDeleteConsumptionTemplate,
  useInventoryKits,
  type ProcedureConsumptionTemplate,
  type ConsumptionTemplateFormData,
} from "@/hooks/useProcedureConsumption";
import {
  useProcedureConsumptionKits,
  useCreateProcedureConsumptionKit,
  useDeleteProcedureConsumptionKit,
} from "@/hooks/useProcedureConsumptionKits";

export function ProcedureConsumptionTab() {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [kitDialogOpen, setKitDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<ProcedureConsumptionTemplate | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteKitLinkId, setDeleteKitLinkId] = useState<string | null>(null);

  const { data: procedures = [], isLoading: loadingProc } = useProceduresList();
  const { data: items = [] } = useInventoryItems({ isConsumable: true });
  const { data: templates = [], isLoading: loadingTemplates } = useProcedureConsumptionTemplates();
  const { data: kits = [] } = useInventoryKits();
  const { data: kitLinks = [] } = useProcedureConsumptionKits();
  const createMut = useCreateConsumptionTemplate();
  const updateMut = useUpdateConsumptionTemplate();
  const deleteMut = useDeleteConsumptionTemplate();
  const createKitLink = useCreateProcedureConsumptionKit();
  const deleteKitLink = useDeleteProcedureConsumptionKit();

  const [form, setForm] = useState<ConsumptionTemplateFormData>({
    procedure_id: '', item_id: '', default_quantity: 1, unit: 'un',
    batch_required: false, allow_quantity_edit_on_finish: true, is_required: true,
  });
  const [kitForm, setKitForm] = useState({ procedure_id: '', kit_id: '', quantity: 1, is_required: false });

  const updateForm = (key: keyof ConsumptionTemplateFormData, value: any) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const resetForm = () => setForm({
    procedure_id: '', item_id: '', default_quantity: 1, unit: 'un',
    batch_required: false, allow_quantity_edit_on_finish: true, is_required: true,
  });

  const formatCurrency = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  const filteredProcedures = procedures.filter(p =>
    p.is_active && p.name.toLowerCase().includes(search.toLowerCase())
  );

  const getTemplatesForProc = (procId: string) => templates.filter(t => t.procedure_id === procId);
  const getKitLinksForProc = (procId: string) => kitLinks.filter(k => k.procedure_id === procId);

  const getCostForProc = (procId: string) =>
    getTemplatesForProc(procId).reduce((sum, t) => sum + (t.inventory_items?.default_cost_price || 0) * t.default_quantity, 0);

  const handleAdd = (procedureId: string) => {
    resetForm();
    updateForm("procedure_id", procedureId);
    setEditItem(null);
    setDialogOpen(true);
  };

  const handleAddKit = (procedureId: string) => {
    setKitForm({ procedure_id: procedureId, kit_id: '', quantity: 1, is_required: false });
    setKitDialogOpen(true);
  };

  const handleEdit = (t: ProcedureConsumptionTemplate) => {
    setEditItem(t);
    setForm({
      procedure_id: t.procedure_id,
      item_id: t.item_id,
      default_quantity: t.default_quantity,
      unit: t.unit,
      batch_required: t.batch_required,
      allow_quantity_edit_on_finish: t.allow_quantity_edit_on_finish,
      is_required: t.is_required,
      notes: t.notes || undefined,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.procedure_id || !form.item_id || form.default_quantity <= 0) return;
    if (editItem) {
      await updateMut.mutateAsync({ id: editItem.id, data: form });
    } else {
      await createMut.mutateAsync(form);
    }
    setDialogOpen(false);
    resetForm();
    setEditItem(null);
  };

  const handleSaveKitLink = async () => {
    if (!kitForm.procedure_id || !kitForm.kit_id) return;
    await createKitLink.mutateAsync(kitForm);
    setKitDialogOpen(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteMut.mutateAsync(deleteId);
    setDeleteId(null);
  };

  const handleDeleteKitLink = async () => {
    if (!deleteKitLinkId) return;
    await deleteKitLink.mutateAsync(deleteKitLinkId);
    setDeleteKitLinkId(null);
  };

  const isLoading = loadingProc || loadingTemplates;
  const isSaving = createMut.isPending || updateMut.isPending;

  const selectedItem = items.find(i => i.id === form.item_id);

  const getAvailableKits = (procId: string) => {
    const linkedKitIds = getKitLinksForProc(procId).map(k => k.kit_id);
    return kits.filter(k => k.is_active && !linkedKitIds.includes(k.id));
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg"><Package className="h-5 w-5 text-primary" /></div>
              <div>
                <p className="text-2xl font-bold">{filteredProcedures.filter(p => getTemplatesForProc(p.id).length > 0).length}</p>
                <p className="text-sm text-muted-foreground">Procedimentos com consumo</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg"><Calculator className="h-5 w-5 text-primary" /></div>
              <div>
                <p className="text-2xl font-bold">{templates.length}</p>
                <p className="text-sm text-muted-foreground">Vínculos de consumo</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-destructive/10 rounded-lg"><AlertCircle className="h-5 w-5 text-destructive" /></div>
              <div>
                <p className="text-2xl font-bold">{filteredProcedures.filter(p => getTemplatesForProc(p.id).length === 0).length}</p>
                <p className="text-sm text-muted-foreground">Sem consumo definido</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar procedimento..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {isLoading ? (
        <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-32 w-full" />)}</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredProcedures.map(proc => {
            const procTemplates = getTemplatesForProc(proc.id);
            const procKitLinks = getKitLinksForProc(proc.id);
            const cost = getCostForProc(proc.id);
            return (
              <Card key={proc.id} className={procTemplates.length === 0 && procKitLinks.length === 0 ? "border-dashed" : ""}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{proc.name}</CardTitle>
                      <CardDescription>{procTemplates.length} itens • {procKitLinks.length} kits</CardDescription>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-primary">{formatCurrency(cost)}</span>
                      <p className="text-xs text-muted-foreground">Custo previsto</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {procTemplates.length === 0 && procKitLinks.length === 0 && (
                    <div className="flex items-center gap-2 text-sm text-destructive mb-3 p-2 bg-destructive/10 rounded-md">
                      <AlertCircle className="h-4 w-4" /><span>Sem consumo vinculado</span>
                    </div>
                  )}
                  <div className="flex gap-2 mb-3">
                    <Button variant="outline" size="sm" onClick={() => handleAdd(proc.id)}>
                      <Plus className="h-4 w-4 mr-1" />Item
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleAddKit(proc.id)} disabled={getAvailableKits(proc.id).length === 0}>
                      <Boxes className="h-4 w-4 mr-1" />Kit
                    </Button>
                  </div>
                  {procTemplates.map(t => (
                    <div key={t.id} className="flex items-center justify-between text-sm py-1">
                      <span className="text-muted-foreground">
                        {t.inventory_items?.name} — {t.default_quantity} {t.unit}
                        {t.is_required && <Badge variant="outline" className="text-xs ml-1">Obrigatório</Badge>}
                        {t.batch_required && <Badge variant="outline" className="text-xs ml-1">Lote</Badge>}
                      </span>
                      <div className="flex gap-1">
                        <span className="text-xs text-muted-foreground mr-2">
                          {formatCurrency((t.inventory_items?.default_cost_price || 0) * t.default_quantity)}
                        </span>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleEdit(t)}>
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setDeleteId(t.id)}>
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {procKitLinks.map(kl => (
                    <div key={kl.id} className="flex items-center justify-between text-sm py-1">
                      <span className="text-muted-foreground">
                        <Boxes className="h-3 w-3 inline mr-1" />
                        {kl.inventory_kits?.name} × {kl.quantity}
                        {kl.is_required && <Badge variant="outline" className="text-xs ml-1">Obrigatório</Badge>}
                        <Badge variant="secondary" className="text-xs ml-1">Kit</Badge>
                      </span>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setDeleteKitLinkId(kl.id)}>
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add/Edit Item Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editItem ? "Editar Consumo" : "Vincular Item ao Procedimento"}</DialogTitle>
            <DialogDescription>Defina o consumo padrão deste item no procedimento</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Item do Cadastro Mestre *</Label>
              <Select value={form.item_id} onValueChange={v => { updateForm("item_id", v); const it = items.find(i => i.id === v); if (it) { updateForm("unit", it.unit_of_measure); updateForm("batch_required", it.controls_batch); }}} disabled={!!editItem}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {items.filter(i => i.is_active).map(i => (
                    <SelectItem key={i.id} value={i.id}>{i.name} ({i.unit_of_measure}) — {formatCurrency(i.default_cost_price)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Quantidade Padrão *</Label>
                <Input type="number" min="0.01" step="0.01" value={form.default_quantity} onChange={e => updateForm("default_quantity", parseFloat(e.target.value) || 1)} />
              </div>
              <div className="grid gap-2">
                <Label>Unidade</Label>
                <Input value={form.unit} onChange={e => updateForm("unit", e.target.value)} />
              </div>
            </div>
            {selectedItem && (
              <div className="text-sm bg-muted/50 p-3 rounded-md">
                <p>Custo estimado: <strong>{formatCurrency((selectedItem.default_cost_price || 0) * form.default_quantity)}</strong></p>
              </div>
            )}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Obrigatório no procedimento</Label>
                <Switch checked={form.is_required} onCheckedChange={v => updateForm("is_required", v)} />
              </div>
              <div className="flex items-center justify-between">
                <Label>Exige seleção de lote</Label>
                <Switch checked={form.batch_required} onCheckedChange={v => updateForm("batch_required", v)} />
              </div>
              <div className="flex items-center justify-between">
                <Label>Permite edição na finalização</Label>
                <Switch checked={form.allow_quantity_edit_on_finish} onCheckedChange={v => updateForm("allow_quantity_edit_on_finish", v)} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!form.item_id || !form.procedure_id || isSaving}>
              {isSaving ? "Salvando..." : editItem ? "Salvar" : "Vincular"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Kit to Procedure Dialog */}
      <Dialog open={kitDialogOpen} onOpenChange={setKitDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vincular Kit ao Procedimento</DialogTitle>
            <DialogDescription>Selecione um kit clínico para uso neste procedimento</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Kit *</Label>
              <Select value={kitForm.kit_id} onValueChange={v => setKitForm(prev => ({ ...prev, kit_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {getAvailableKits(kitForm.procedure_id).map(k => (
                    <SelectItem key={k.id} value={k.id}>{k.name} ({k.kit_type === 'clinical' ? 'Clínico' : 'Comercial'})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Quantidade</Label>
                <Input type="number" min="1" step="1" value={kitForm.quantity} onChange={e => setKitForm(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 1 }))} />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Switch checked={kitForm.is_required} onCheckedChange={v => setKitForm(prev => ({ ...prev, is_required: v }))} />
                <Label>Obrigatório</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setKitDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveKitLink} disabled={!kitForm.kit_id || createKitLink.isPending}>
              {createKitLink.isPending ? "Vinculando..." : "Vincular Kit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete item confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover vínculo?</AlertDialogTitle>
            <AlertDialogDescription>O item será desvinculado do procedimento. Isso não apaga o item do estoque.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete kit link confirm */}
      <AlertDialog open={!!deleteKitLinkId} onOpenChange={() => setDeleteKitLinkId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desvincular kit?</AlertDialogTitle>
            <AlertDialogDescription>O kit será desvinculado deste procedimento.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteKitLink}>Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
