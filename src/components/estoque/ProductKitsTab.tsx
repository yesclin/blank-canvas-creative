import { useState } from "react";
import { Plus, Search, Edit, Trash2, ToggleLeft, ToggleRight, Package, Eye, Calculator, Info, Boxes } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useProducts } from "@/hooks/useProducts";
import {
  useProductKitsList,
  useProductKitItems,
  useCreateProductKit,
  useUpdateProductKit,
  useToggleProductKitStatus,
  useAddProductToKit,
  useRemoveProductFromKit,
  useProductKitForm,
  useProductKitItemForm,
} from "@/hooks/useProductKitsCRUD";
import { useKitsUsageCount } from "@/hooks/useProcedureProductKitsCRUD";
import type { ProductKit, ProductKitItem } from "@/types/product-kits";
import { usePermissions } from "@/hooks/usePermissions";
import { productUnits } from "@/types/inventory";

export function ProductKitsTab() {
  const [search, setSearch] = useState("");
  const [kitDialogOpen, setKitDialogOpen] = useState(false);
  const [itemsDialogOpen, setItemsDialogOpen] = useState(false);
  const [addItemDialogOpen, setAddItemDialogOpen] = useState(false);
  const [editKit, setEditKit] = useState<ProductKit | null>(null);
  const [selectedKit, setSelectedKit] = useState<ProductKit | null>(null);
  const [confirmToggle, setConfirmToggle] = useState<ProductKit | null>(null);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);

  const { data: kits = [], isLoading } = useProductKitsList(true);
  const { data: products = [] } = useProducts();
  const { data: kitItems = [], isLoading: loadingItems } = useProductKitItems(selectedKit?.id || null);
  const { data: usageCount = {} } = useKitsUsageCount();

  const createKitMutation = useCreateProductKit();
  const updateKitMutation = useUpdateProductKit();
  const toggleKitMutation = useToggleProductKitStatus();
  const addItemMutation = useAddProductToKit();
  const removeItemMutation = useRemoveProductFromKit();

  const { formData: kitFormData, updateField: updateKitField, resetForm: resetKitForm, loadKit, isValid: isKitValid } = useProductKitForm();
  const { formData: itemFormData, updateField: updateItemField, resetForm: resetItemForm, isValid: isItemValid } = useProductKitItemForm();

  const { isOwner, can } = usePermissions();
  const canManage = isOwner || can("configuracoes", "edit");

  const filteredKits = kits.filter((kit) =>
    kit.name.toLowerCase().includes(search.toLowerCase()) ||
    kit.description?.toLowerCase().includes(search.toLowerCase())
  );

  const formatCurrency = (value?: number) => {
    if (!value) return "R$ 0,00";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const handleCreateKit = () => {
    resetKitForm();
    setEditKit(null);
    setKitDialogOpen(true);
  };

  const handleEditKit = (kit: ProductKit) => {
    loadKit(kit);
    setEditKit(kit);
    setKitDialogOpen(true);
  };

  const handleViewItems = (kit: ProductKit) => {
    setSelectedKit(kit);
    setItemsDialogOpen(true);
  };

  const handleSaveKit = async () => {
    if (!isKitValid) return;

    if (editKit) {
      await updateKitMutation.mutateAsync({ id: editKit.id, formData: kitFormData });
    } else {
      await createKitMutation.mutateAsync(kitFormData);
    }
    setKitDialogOpen(false);
    resetKitForm();
    setEditKit(null);
  };

  const handleAddItem = () => {
    resetItemForm();
    setAddItemDialogOpen(true);
  };

  const handleSaveItem = async () => {
    if (!isItemValid || !selectedKit) return;

    await addItemMutation.mutateAsync({
      kitId: selectedKit.id,
      formData: itemFormData,
    });
    setAddItemDialogOpen(false);
    resetItemForm();
  };

  const handleRemoveItem = async () => {
    if (!deleteItemId || !selectedKit) return;
    await removeItemMutation.mutateAsync({ id: deleteItemId, kitId: selectedKit.id });
    setDeleteItemId(null);
  };

  const handleToggleStatus = async () => {
    if (!confirmToggle) return;
    await toggleKitMutation.mutateAsync({
      id: confirmToggle.id,
      isActive: confirmToggle.is_active,
    });
    setConfirmToggle(null);
  };

  const isSavingKit = createKitMutation.isPending || updateKitMutation.isPending;
  const isSavingItem = addItemMutation.isPending;

  // Get products not yet in the kit
  const availableProducts = products.filter(
    (p) => p.is_active && !kitItems.some((ki) => ki.product_id === p.id)
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar kit..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {canManage && (
          <Button onClick={handleCreateKit}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Kit
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      ) : filteredKits.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 text-muted-foreground">
              <Boxes className="h-12 w-12 mx-auto mb-4 opacity-50" />
              {search ? "Nenhum kit encontrado" : "Nenhum kit de produtos cadastrado"}
              {!search && canManage && (
                <p className="text-sm mt-2">
                  Crie kits para agrupar produtos usados juntos em procedimentos
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredKits.map((kit) => {
            const usage = usageCount[kit.id] || 0;
            return (
              <Card key={kit.id} className={!kit.is_active ? "opacity-60" : ""}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Boxes className="h-5 w-5 text-primary" />
                      <CardTitle className="text-lg">{kit.name}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      {usage > 0 && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge variant="outline" className="text-xs">
                                {usage} proc.
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              Usado em {usage} procedimento(s)
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      <Badge variant={kit.is_active ? "default" : "secondary"}>
                        {kit.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                  </div>
                  {kit.description && (
                    <CardDescription className="line-clamp-2">
                      {kit.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                    <span>{kit.items_count || 0} produto(s)</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-1">
                            <Calculator className="h-4 w-4 text-primary" />
                            <span className="font-medium text-foreground">
                              {formatCurrency(kit.total_cost)}
                            </span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="flex items-center gap-1">
                            <Info className="h-3 w-3" />
                            <span>Custo total do kit</span>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleViewItems(kit)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Ver Itens
                    </Button>
                    {canManage && (
                      <>
                        <Button variant="ghost" size="icon" onClick={() => handleEditKit(kit)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setConfirmToggle(kit)}
                        >
                          {kit.is_active ? (
                            <ToggleRight className="h-4 w-4 text-primary" />
                          ) : (
                            <ToggleLeft className="h-4 w-4" />
                          )}
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Dialog de criação/edição de kit */}
      <Dialog open={kitDialogOpen} onOpenChange={setKitDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editKit ? "Editar Kit" : "Novo Kit de Produtos"}</DialogTitle>
            <DialogDescription>
              Agrupe produtos para uso padronizado em procedimentos
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Nome do Kit *</Label>
              <Input
                placeholder="Ex: Kit Limpeza de Pele"
                value={kitFormData.name}
                onChange={(e) => updateKitField("name", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Descrição</Label>
              <Textarea
                placeholder="Descrição do kit..."
                value={kitFormData.description || ""}
                onChange={(e) => updateKitField("description", e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setKitDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveKit} disabled={!isKitValid || isSavingKit}>
              {isSavingKit ? "Salvando..." : editKit ? "Salvar" : "Criar Kit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de itens do kit */}
      <Dialog open={itemsDialogOpen} onOpenChange={setItemsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Itens do Kit: {selectedKit?.name}</DialogTitle>
            <DialogDescription>
              Gerencie os produtos que compõem este kit
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {canManage && (
              <div className="flex justify-end mb-4">
                <Button size="sm" onClick={handleAddItem} disabled={availableProducts.length === 0}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Produto
                </Button>
              </div>
            )}

            {loadingItems ? (
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : kitItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum produto neste kit
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead>Quantidade</TableHead>
                    <TableHead>Custo Unit.</TableHead>
                    <TableHead>Subtotal</TableHead>
                    {canManage && <TableHead className="text-right">Ações</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {kitItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {item.product_name}
                        <span className="text-xs text-muted-foreground ml-2">
                          ({item.product_unit})
                        </span>
                      </TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{formatCurrency(item.product_cost_price)}</TableCell>
                      <TableCell>
                        {formatCurrency((item.product_cost_price || 0) * item.quantity)}
                      </TableCell>
                      {canManage && (
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteItemId(item.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            <div className="flex justify-between items-center mt-4 pt-4 border-t">
              <span className="text-muted-foreground">Total do Kit:</span>
              <span className="font-bold text-lg">
                {formatCurrency(kitItems.reduce((sum, item) =>
                  sum + (item.product_cost_price || 0) * item.quantity, 0
                ))}
              </span>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setItemsDialogOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de adicionar item */}
      <Dialog open={addItemDialogOpen} onOpenChange={setAddItemDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Produto ao Kit</DialogTitle>
            <DialogDescription>
              Selecione o produto e a quantidade
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Produto *</Label>
              <Select
                value={itemFormData.product_id}
                onValueChange={(value) => updateItemField("product_id", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o produto" />
                </SelectTrigger>
                <SelectContent>
                  {availableProducts.map((prod) => (
                    <SelectItem key={prod.id} value={prod.id}>
                      {prod.name} ({prod.unit}) - {formatCurrency(prod.cost_price)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Quantidade *</Label>
              <Input
                type="number"
                value={itemFormData.quantity}
                onChange={(e) => updateItemField("quantity", parseFloat(e.target.value) || 1)}
                min={0.01}
                step={0.01}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddItemDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveItem} disabled={!isItemValid || isSavingItem}>
              {isSavingItem ? "Adicionando..." : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm toggle status */}
      <AlertDialog open={!!confirmToggle} onOpenChange={() => setConfirmToggle(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmToggle?.is_active ? "Desativar Kit" : "Ativar Kit"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmToggle?.is_active
                ? `Desativar "${confirmToggle?.name}"? Ele não será mais usado em novos procedimentos.`
                : `Ativar "${confirmToggle?.name}"?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleToggleStatus}>
              {confirmToggle?.is_active ? "Desativar" : "Ativar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm delete item */}
      <AlertDialog open={!!deleteItemId} onOpenChange={() => setDeleteItemId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Produto</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover este produto do kit?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveItem} className="bg-destructive text-destructive-foreground">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
