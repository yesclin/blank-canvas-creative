import { useState } from "react";
import { Plus, Search, Trash2, Edit, ToggleLeft, ToggleRight, Eye, Boxes, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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
import { useInventoryItems } from "@/hooks/useInventoryItems";
import {
  useInventoryKits, useInventoryKitItems,
  useCreateInventoryKit, useUpdateInventoryKit,
  useAddInventoryKitItem, useRemoveInventoryKitItem,
  type InventoryKit,
} from "@/hooks/useProcedureConsumption";

export function InventoryKitsTab() {
  const [search, setSearch] = useState("");
  const [kitDialogOpen, setKitDialogOpen] = useState(false);
  const [itemsDialogOpen, setItemsDialogOpen] = useState(false);
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [editKit, setEditKit] = useState<InventoryKit | null>(null);
  const [selectedKit, setSelectedKit] = useState<InventoryKit | null>(null);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);

  const [kitName, setKitName] = useState("");
  const [kitDesc, setKitDesc] = useState("");
  const [kitType, setKitType] = useState<'clinical' | 'retail'>('clinical');
  const [addItemId, setAddItemId] = useState("");
  const [addItemQty, setAddItemQty] = useState("1");

  const { data: kits = [], isLoading } = useInventoryKits(true);
  const { data: items = [] } = useInventoryItems();
  const { data: kitItems = [], isLoading: loadingItems } = useInventoryKitItems(selectedKit?.id || null);

  const createKit = useCreateInventoryKit();
  const updateKit = useUpdateInventoryKit();
  const addItem = useAddInventoryKitItem();
  const removeItem = useRemoveInventoryKitItem();

  const formatCurrency = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  const filteredKits = kits.filter(k =>
    k.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreateKit = () => {
    setEditKit(null); setKitName(""); setKitDesc(""); setKitType('clinical');
    setKitDialogOpen(true);
  };

  const handleEditKit = (kit: InventoryKit) => {
    setEditKit(kit); setKitName(kit.name); setKitDesc(kit.description || ""); setKitType(kit.kit_type);
    setKitDialogOpen(true);
  };

  const handleSaveKit = async () => {
    if (!kitName.trim()) return;
    if (editKit) {
      await updateKit.mutateAsync({ id: editKit.id, data: { name: kitName, description: kitDesc, kit_type: kitType } });
    } else {
      await createKit.mutateAsync({ name: kitName, description: kitDesc || undefined, kit_type: kitType });
    }
    setKitDialogOpen(false);
  };

  const handleToggle = async (kit: InventoryKit) => {
    await updateKit.mutateAsync({ id: kit.id, data: { is_active: !kit.is_active } });
  };

  const handleViewItems = (kit: InventoryKit) => {
    setSelectedKit(kit); setItemsDialogOpen(true);
  };

  const handleAddItem = async () => {
    if (!selectedKit || !addItemId || parseFloat(addItemQty) <= 0) return;
    await addItem.mutateAsync({ kit_id: selectedKit.id, item_id: addItemId, quantity: parseFloat(addItemQty) });
    setAddItemOpen(false); setAddItemId(""); setAddItemQty("1");
  };

  const handleRemoveItem = async () => {
    if (!deleteItemId) return;
    await removeItem.mutateAsync(deleteItemId);
    setDeleteItemId(null);
  };

  const kitTotalCost = kitItems.reduce((sum, ki) =>
    sum + (ki.inventory_items?.default_cost_price || 0) * ki.quantity, 0);

  const availableItems = items.filter(i => i.is_active && !kitItems.some(ki => ki.item_id === i.id));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar kit..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Button onClick={handleCreateKit}><Plus className="h-4 w-4 mr-2" />Novo Kit</Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{[1,2,3].map(i => <Skeleton key={i} className="h-40 w-full" />)}</div>
      ) : filteredKits.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center py-8 text-muted-foreground">
            <Boxes className="h-12 w-12 mx-auto mb-4 opacity-50" />
            {search ? "Nenhum kit encontrado" : "Nenhum kit cadastrado"}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredKits.map(kit => (
            <Card key={kit.id} className={!kit.is_active ? "opacity-60" : ""}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Boxes className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">{kit.name}</CardTitle>
                  </div>
                  <div className="flex gap-1">
                    <Badge variant={kit.kit_type === 'clinical' ? 'default' : 'secondary'}>
                      {kit.kit_type === 'clinical' ? 'Clínico' : 'Comercial'}
                    </Badge>
                    <Badge variant={kit.is_active ? "outline" : "secondary"}>
                      {kit.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                </div>
                {kit.description && <CardDescription className="line-clamp-2">{kit.description}</CardDescription>}
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => handleViewItems(kit)}>
                    <Eye className="h-4 w-4 mr-1" />Ver Itens
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleEditKit(kit)}><Edit className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => handleToggle(kit)} disabled={updateKit.isPending}>
                    {kit.is_active ? <ToggleRight className="h-4 w-4 text-primary" /> : <ToggleLeft className="h-4 w-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Kit create/edit */}
      <Dialog open={kitDialogOpen} onOpenChange={setKitDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editKit ? "Editar Kit" : "Novo Kit"}</DialogTitle>
            <DialogDescription>Agrupe itens para uso padronizado</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Nome *</Label>
              <Input value={kitName} onChange={e => setKitName(e.target.value)} placeholder="Ex: Kit Limpeza de Pele" />
            </div>
            <div className="grid gap-2">
              <Label>Tipo</Label>
              <Select value={kitType} onValueChange={v => setKitType(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="clinical">Clínico</SelectItem>
                  <SelectItem value="retail">Comercial</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Descrição</Label>
              <Textarea value={kitDesc} onChange={e => setKitDesc(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setKitDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveKit} disabled={!kitName.trim() || createKit.isPending || updateKit.isPending}>
              {editKit ? "Salvar" : "Criar Kit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Kit items dialog */}
      <Dialog open={itemsDialogOpen} onOpenChange={setItemsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Itens do Kit: {selectedKit?.name}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="flex justify-end mb-4">
              <Button size="sm" onClick={() => { setAddItemId(""); setAddItemQty("1"); setAddItemOpen(true); }} disabled={availableItems.length === 0}>
                <Plus className="h-4 w-4 mr-2" />Adicionar Item
              </Button>
            </div>
            {loadingItems ? <Skeleton className="h-32 w-full" /> : kitItems.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">Nenhum item neste kit</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Quantidade</TableHead>
                    <TableHead>Custo Unit.</TableHead>
                    <TableHead>Subtotal</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {kitItems.map(ki => (
                    <TableRow key={ki.id}>
                      <TableCell className="font-medium">{ki.inventory_items?.name}</TableCell>
                      <TableCell>{ki.quantity} {ki.inventory_items?.unit_of_measure}</TableCell>
                      <TableCell>{formatCurrency(ki.inventory_items?.default_cost_price || 0)}</TableCell>
                      <TableCell>{formatCurrency((ki.inventory_items?.default_cost_price || 0) * ki.quantity)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => setDeleteItemId(ki.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            <div className="flex justify-between items-center mt-4 pt-4 border-t">
              <span className="text-muted-foreground">Total do Kit:</span>
              <span className="font-bold text-lg">{formatCurrency(kitTotalCost)}</span>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setItemsDialogOpen(false)}>Fechar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add item to kit */}
      <Dialog open={addItemOpen} onOpenChange={setAddItemOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Adicionar Item ao Kit</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Item *</Label>
              <Select value={addItemId} onValueChange={setAddItemId}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {availableItems.map(i => (
                    <SelectItem key={i.id} value={i.id}>{i.name} ({i.unit_of_measure}) — {formatCurrency(i.default_cost_price)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Quantidade *</Label>
              <Input type="number" min="0.01" step="0.01" value={addItemQty} onChange={e => setAddItemQty(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddItemOpen(false)}>Cancelar</Button>
            <Button onClick={handleAddItem} disabled={!addItemId || addItem.isPending}>Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete item confirm */}
      <AlertDialog open={!!deleteItemId} onOpenChange={() => setDeleteItemId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover item do kit?</AlertDialogTitle>
            <AlertDialogDescription>O item será removido deste kit.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveItem}>Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
