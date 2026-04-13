import { useState, useMemo } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, Package, Tag, DollarSign, FileText } from "lucide-react";
import { useCreateInventoryItem, useUpdateInventoryItem } from "@/hooks/useInventoryItems";
import {
  inventoryItemTypeLabels,
  inventoryUnits,
  defaultInventoryItemForm,
  type InventoryItem,
  type InventoryItemFormData,
  type InventoryItemType,
} from "@/types/inventory-items";

interface InventoryItemFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editItem?: InventoryItem | null;
}

export function InventoryItemFormDialog({ open, onOpenChange, editItem }: InventoryItemFormDialogProps) {
  const createMutation = useCreateInventoryItem();
  const updateMutation = useUpdateInventoryItem();
  const isEditing = !!editItem;

  const [form, setForm] = useState<InventoryItemFormData>(() =>
    editItem ? mapItemToForm(editItem) : { ...defaultInventoryItemForm }
  );

  // Reset form when dialog opens with different item
  const [lastEditId, setLastEditId] = useState<string | null>(null);
  if (open && (editItem?.id ?? null) !== lastEditId) {
    setLastEditId(editItem?.id ?? null);
    setForm(editItem ? mapItemToForm(editItem) : { ...defaultInventoryItemForm });
  }

  const isValid = useMemo(() => {
    return (
      form.name.trim().length > 0 &&
      form.unit_of_measure.trim().length > 0 &&
      form.default_cost_price >= 0 &&
      form.default_sale_price >= 0 &&
      form.minimum_stock >= 0 &&
      form.ideal_stock >= 0
    );
  }, [form]);

  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = async () => {
    if (!isValid) return;

    try {
      if (isEditing && editItem) {
        await updateMutation.mutateAsync({ id: editItem.id, data: form });
      } else {
        await createMutation.mutateAsync(form);
      }
      onOpenChange(false);
    } catch {
      // error handled by mutation
    }
  };

  const updateField = <K extends keyof InventoryItemFormData>(key: K, value: InventoryItemFormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  // Auto-enable traceability for medication types
  const handleTypeChange = (type: InventoryItemType) => {
    const traceable = ['medication', 'injectable', 'vaccine'].includes(type);
    setForm((prev) => ({
      ...prev,
      item_type: type,
      controls_batch: traceable ? true : prev.controls_batch,
      controls_expiry: traceable ? true : prev.controls_expiry,
      requires_traceability: traceable ? true : prev.requires_traceability,
      is_sellable: type === 'retail_product' ? true : prev.is_sellable,
      is_consumable_in_procedures: type === 'retail_product' ? false : prev.is_consumable_in_procedures,
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Item" : "Novo Item"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Atualize os dados do item." : "Cadastre um novo item no catálogo mestre."}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="identification" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="identification" className="text-xs gap-1">
              <Package className="h-3 w-3" /> Identificação
            </TabsTrigger>
            <TabsTrigger value="classification" className="text-xs gap-1">
              <Tag className="h-3 w-3" /> Classificação
            </TabsTrigger>
            <TabsTrigger value="stock" className="text-xs gap-1">
              <DollarSign className="h-3 w-3" /> Estoque e Preços
            </TabsTrigger>
            <TabsTrigger value="technical" className="text-xs gap-1">
              <FileText className="h-3 w-3" /> Técnico
            </TabsTrigger>
          </TabsList>

          {/* A. Identificação */}
          <TabsContent value="identification" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="name">Nome do item *</Label>
                <Input id="name" value={form.name} onChange={(e) => updateField("name", e.target.value)} placeholder="Ex: Luva de procedimento P" />
              </div>
              <div>
                <Label htmlFor="commercial_name">Nome comercial</Label>
                <Input id="commercial_name" value={form.commercial_name || ""} onChange={(e) => updateField("commercial_name", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="internal_code">Código interno</Label>
                <Input id="internal_code" value={form.internal_code || ""} onChange={(e) => updateField("internal_code", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="sku">SKU</Label>
                <Input id="sku" value={form.sku || ""} onChange={(e) => updateField("sku", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="barcode">Código de barras</Label>
                <Input id="barcode" value={form.barcode || ""} onChange={(e) => updateField("barcode", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="category">Categoria</Label>
                <Input id="category" value={form.category || ""} onChange={(e) => updateField("category", e.target.value)} placeholder="Ex: Descartável" />
              </div>
              <div>
                <Label htmlFor="brand">Marca</Label>
                <Input id="brand" value={form.brand || ""} onChange={(e) => updateField("brand", e.target.value)} />
              </div>
              <div className="col-span-2">
                <Label htmlFor="manufacturer">Fabricante</Label>
                <Input id="manufacturer" value={form.manufacturer || ""} onChange={(e) => updateField("manufacturer", e.target.value)} />
              </div>
            </div>
          </TabsContent>

          {/* B. Classificação */}
          <TabsContent value="classification" className="space-y-4">
            <div>
              <Label>Tipo do item *</Label>
              <Select value={form.item_type} onValueChange={(v) => handleTypeChange(v as InventoryItemType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(inventoryItemTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <SwitchField label="Vendável" description="Pode ser vendido avulso ou no atendimento" checked={form.is_sellable} onCheckedChange={(v) => updateField("is_sellable", v)} />
              <SwitchField label="Consumível em procedimento" description="Usado em procedimentos clínicos" checked={form.is_consumable_in_procedures} onCheckedChange={(v) => updateField("is_consumable_in_procedures", v)} />
              <SwitchField label="Controla estoque" description="Saldo físico controlado pelo sistema" checked={form.controls_stock} onCheckedChange={(v) => updateField("controls_stock", v)} />
              <SwitchField label="Controla lote" description="Rastreamento por lote" checked={form.controls_batch} onCheckedChange={(v) => updateField("controls_batch", v)} />
              <SwitchField label="Controla validade" description="Data de vencimento obrigatória" checked={form.controls_expiry} onCheckedChange={(v) => updateField("controls_expiry", v)} />
              <SwitchField label="Exige rastreabilidade" description="Registro completo de uso" checked={form.requires_traceability} onCheckedChange={(v) => updateField("requires_traceability", v)} />
              <SwitchField label="Cadeia fria" description="Exige refrigeração" checked={form.requires_cold_chain} onCheckedChange={(v) => updateField("requires_cold_chain", v)} />
              <SwitchField label="Ativo" description="Item disponível no sistema" checked={form.is_active} onCheckedChange={(v) => updateField("is_active", v)} />
            </div>

            {['medication', 'injectable', 'vaccine'].includes(form.item_type) && (
              <Badge variant="outline" className="border-purple-300 text-purple-700">
                Rastreabilidade completa habilitada automaticamente
              </Badge>
            )}
          </TabsContent>

          {/* C. Estoque e Preços */}
          <TabsContent value="stock" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Unidade de medida *</Label>
                <Select value={form.unit_of_measure} onValueChange={(v) => updateField("unit_of_measure", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {inventoryUnits.map((u) => (
                      <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Dias de alerta (vencimento)</Label>
                <Input type="number" min={0} value={form.alert_days_before_expiry} onChange={(e) => updateField("alert_days_before_expiry", Number(e.target.value) || 0)} />
              </div>
            </div>

            {form.controls_stock && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Estoque mínimo</Label>
                  <Input type="number" min={0} step="0.01" value={form.minimum_stock} onChange={(e) => updateField("minimum_stock", Number(e.target.value) || 0)} />
                </div>
                <div>
                  <Label>Estoque ideal</Label>
                  <Input type="number" min={0} step="0.01" value={form.ideal_stock} onChange={(e) => updateField("ideal_stock", Number(e.target.value) || 0)} />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Custo padrão (R$)</Label>
                <Input type="number" min={0} step="0.01" value={form.default_cost_price} onChange={(e) => updateField("default_cost_price", Number(e.target.value) || 0)} />
              </div>
              {form.is_sellable && (
                <div>
                  <Label>Preço de venda padrão (R$)</Label>
                  <Input type="number" min={0} step="0.01" value={form.default_sale_price} onChange={(e) => updateField("default_sale_price", Number(e.target.value) || 0)} />
                </div>
              )}
            </div>

            <div>
              <Label>Local de armazenamento</Label>
              <Input value={form.storage_notes || ""} onChange={(e) => updateField("storage_notes", e.target.value)} placeholder="Ex: Armário B, prateleira 3" />
            </div>
          </TabsContent>

          {/* D. Informações Técnicas */}
          <TabsContent value="technical" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Registro ANVISA</Label>
                <Input value={form.anvisa_registration || ""} onChange={(e) => updateField("anvisa_registration", e.target.value)} />
              </div>
              <div>
                <Label>Bula ou link</Label>
                <Input value={form.leaflet_text_or_url || ""} onChange={(e) => updateField("leaflet_text_or_url", e.target.value)} placeholder="URL ou texto da bula" />
              </div>
            </div>
            <div>
              <Label>Composição</Label>
              <Textarea value={form.composition || ""} onChange={(e) => updateField("composition", e.target.value)} rows={3} />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea value={form.description || ""} onChange={(e) => updateField("description", e.target.value)} rows={2} />
            </div>
            <div>
              <Label>Observações internas</Label>
              <Textarea value={form.notes || ""} onChange={(e) => updateField("notes", e.target.value)} rows={2} />
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid || isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? "Salvar" : "Cadastrar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Helper component
function SwitchField({ label, description, checked, onCheckedChange }: {
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border p-3">
      <div className="space-y-0.5">
        <Label className="text-sm font-medium">{label}</Label>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

function mapItemToForm(item: InventoryItem): InventoryItemFormData {
  return {
    name: item.name,
    commercial_name: item.commercial_name || undefined,
    description: item.description || undefined,
    internal_code: item.internal_code || undefined,
    sku: item.sku || undefined,
    barcode: item.barcode || undefined,
    category: item.category || undefined,
    brand: item.brand || undefined,
    manufacturer: item.manufacturer || undefined,
    item_type: item.item_type,
    is_sellable: item.is_sellable,
    is_consumable_in_procedures: item.is_consumable_in_procedures,
    is_active: item.is_active,
    controls_stock: item.controls_stock,
    controls_batch: item.controls_batch,
    controls_expiry: item.controls_expiry,
    requires_traceability: item.requires_traceability,
    requires_cold_chain: item.requires_cold_chain,
    storage_notes: item.storage_notes || undefined,
    unit_of_measure: item.unit_of_measure,
    minimum_stock: Number(item.minimum_stock),
    ideal_stock: Number(item.ideal_stock),
    default_cost_price: Number(item.default_cost_price),
    default_sale_price: Number(item.default_sale_price),
    alert_days_before_expiry: item.alert_days_before_expiry,
    anvisa_registration: item.anvisa_registration || undefined,
    composition: item.composition || undefined,
    leaflet_text_or_url: item.leaflet_text_or_url || undefined,
    supplier_id: item.supplier_id || undefined,
    notes: item.notes || undefined,
  };
}
