import { useState, useEffect } from "react";
import { Package, Plus, Trash2, Loader2, AlertCircle, Boxes } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProducts } from "@/hooks/useProducts";
import {
  useProcedureProductsByProcedure,
  useCreateProcedureProduct,
  useDeleteProcedureProduct,
  useUpdateProcedureProduct,
  type ProcedureProduct,
} from "@/hooks/useProcedureProductsCRUD";
import {
  useProductKitsList,
} from "@/hooks/useProductKitsCRUD";
import {
  useProcedureProductKitsByProcedure,
  useCreateProcedureProductKit,
  useDeleteProcedureProductKit,
  useUpdateProcedureProductKit,
} from "@/hooks/useProcedureProductKitsCRUD";
import { Procedure } from "@/hooks/useProceduresCRUD";
import type { ProcedureProductKit } from "@/types/product-kits";

interface ProcedureProductsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  procedure: Procedure | null;
}

export function ProcedureProductsDialog({
  open,
  onOpenChange,
  procedure,
}: ProcedureProductsDialogProps) {
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQuantity, setEditQuantity] = useState(1);
  
  // Kit state
  const [selectedKitId, setSelectedKitId] = useState("");
  const [kitQuantity, setKitQuantity] = useState(1);
  const [editingKitId, setEditingKitId] = useState<string | null>(null);
  const [editKitQuantity, setEditKitQuantity] = useState(1);

  const { data: products, isLoading: productsLoading } = useProducts();
  const { data: procedureProducts, isLoading: linkLoading } = useProcedureProductsByProcedure(
    procedure?.id ?? null
  );
  
  // Kits data
  const { data: kits = [] } = useProductKitsList();
  const { data: procedureKits = [], isLoading: kitsLinkLoading } = useProcedureProductKitsByProcedure(
    procedure?.id ?? null
  );

  const createMutation = useCreateProcedureProduct();
  const deleteMutation = useDeleteProcedureProduct();
  const updateMutation = useUpdateProcedureProduct();
  
  // Kit mutations
  const createKitMutation = useCreateProcedureProductKit();
  const deleteKitMutation = useDeleteProcedureProductKit();
  const updateKitMutation = useUpdateProcedureProductKit();

  const isLoading = createMutation.isPending || deleteMutation.isPending || updateMutation.isPending ||
    createKitMutation.isPending || deleteKitMutation.isPending || updateKitMutation.isPending;

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedProductId("");
      setQuantity(1);
      setEditingId(null);
      setSelectedKitId("");
      setKitQuantity(1);
      setEditingKitId(null);
    }
  }, [open]);

  // Get available products (not yet linked to this procedure)
  const linkedProductIds = new Set((procedureProducts || []).map((pp) => pp.product_id));
  const availableProducts = (products || []).filter((p) => !linkedProductIds.has(p.id));
  
  // Get available kits (not yet linked)
  const linkedKitIds = new Set(procedureKits.map((pk) => pk.kit_id));
  const availableKits = kits.filter((k) => k.is_active && !linkedKitIds.has(k.id));

  const handleAddProduct = async () => {
    if (!procedure?.id || !selectedProductId || quantity <= 0) return;

    await createMutation.mutateAsync({
      procedure_id: procedure.id,
      product_id: selectedProductId,
      quantity,
    });

    setSelectedProductId("");
    setQuantity(1);
  };

  const handleRemoveProduct = async (item: ProcedureProduct) => {
    if (!procedure?.id) return;
    await deleteMutation.mutateAsync({ id: item.id, procedureId: procedure.id });
  };

  const handleStartEdit = (item: ProcedureProduct) => {
    setEditingId(item.id);
    setEditQuantity(item.quantity);
  };

  const handleSaveEdit = async (item: ProcedureProduct) => {
    if (!procedure?.id || editQuantity <= 0) return;

    await updateMutation.mutateAsync({
      id: item.id,
      procedureId: procedure.id,
      formData: { quantity: editQuantity },
    });

    setEditingId(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };
  
  // Kit handlers
  const handleAddKit = async () => {
    if (!procedure?.id || !selectedKitId || kitQuantity <= 0) return;

    await createKitMutation.mutateAsync({
      procedure_id: procedure.id,
      kit_id: selectedKitId,
      quantity: kitQuantity,
      is_required: true,
    });

    setSelectedKitId("");
    setKitQuantity(1);
  };

  const handleRemoveKit = async (item: ProcedureProductKit) => {
    if (!procedure?.id) return;
    await deleteKitMutation.mutateAsync({ id: item.id, procedureId: procedure.id });
  };

  const handleStartEditKit = (item: ProcedureProductKit) => {
    setEditingKitId(item.id);
    setEditKitQuantity(item.quantity);
  };

  const handleSaveEditKit = async (item: ProcedureProductKit) => {
    if (!procedure?.id || editKitQuantity <= 0) return;

    await updateKitMutation.mutateAsync({
      id: item.id,
      procedureId: procedure.id,
      formData: { quantity: editKitQuantity },
    });

    setEditingKitId(null);
  };

  const handleCancelEditKit = () => {
    setEditingKitId(null);
  };

  const productsCost = (procedureProducts || []).reduce((sum, pp) => {
    const cost = pp.product_cost_price || 0;
    return sum + cost * pp.quantity;
  }, 0);
  
  const kitsCost = procedureKits.reduce((sum, pk) => {
    return sum + (pk.kit_total_cost || 0);
  }, 0);
  
  const totalCost = productsCost + kitsCost;

  const formatCurrency = (value: number) =>
    value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[750px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Insumos do Procedimento
          </DialogTitle>
          <DialogDescription>
            Configure produtos e kits utilizados em "{procedure?.name}"
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="products" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="products" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Produtos ({procedureProducts?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="kits" className="flex items-center gap-2">
              <Boxes className="h-4 w-4" />
              Kits ({procedureKits.length})
            </TabsTrigger>
          </TabsList>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-4">
            {/* Add new product form */}
            <div className="p-4 border rounded-lg bg-muted/50">
              <h4 className="font-medium mb-3">Adicionar Produto</h4>
              <div className="grid grid-cols-1 sm:grid-cols-[1fr,120px,auto] gap-3 items-end">
                <div className="space-y-2">
                  <Label>Produto</Label>
                  <Select
                    value={selectedProductId}
                    onValueChange={setSelectedProductId}
                    disabled={isLoading || productsLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um produto..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableProducts.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground text-center">
                          Nenhum produto disponível
                        </div>
                      ) : (
                        availableProducts.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name} ({product.unit})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Quantidade</Label>
                  <Input
                    type="number"
                    min={0.001}
                    step={0.001}
                    value={quantity}
                    onChange={(e) => setQuantity(parseFloat(e.target.value) || 1)}
                    disabled={isLoading}
                  />
                </div>

                <Button
                  onClick={handleAddProduct}
                  disabled={!selectedProductId || quantity <= 0 || isLoading}
                >
                  {createMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Products list */}
            {linkLoading ? (
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (procedureProducts || []).length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Nenhum produto individual vinculado.
                </AlertDescription>
              </Alert>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead>Unid.</TableHead>
                    <TableHead>Qtd.</TableHead>
                    <TableHead>Custo Unit.</TableHead>
                    <TableHead>Subtotal</TableHead>
                    <TableHead className="w-[60px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {procedureProducts?.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {item.product_name}
                      </TableCell>
                      <TableCell>{item.product_unit}</TableCell>
                      <TableCell>
                        {editingId === item.id ? (
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min={0.001}
                              step={0.001}
                              value={editQuantity}
                              onChange={(e) =>
                                setEditQuantity(parseFloat(e.target.value) || 1)
                              }
                              className="w-20 h-8"
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleSaveEdit(item)}
                              disabled={isLoading}
                            >
                              OK
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={handleCancelEdit}
                            >
                              ✕
                            </Button>
                          </div>
                        ) : (
                          <span
                            className="cursor-pointer hover:underline"
                            onClick={() => handleStartEdit(item)}
                          >
                            {item.quantity}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{formatCurrency(item.product_cost_price || 0)}</TableCell>
                      <TableCell>
                        {formatCurrency((item.product_cost_price || 0) * item.quantity)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveProduct(item)}
                          disabled={isLoading}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>

          {/* Kits Tab */}
          <TabsContent value="kits" className="space-y-4">
            {/* Add kit form */}
            <div className="p-4 border rounded-lg bg-muted/50">
              <h4 className="font-medium mb-3">Adicionar Kit</h4>
              <div className="grid grid-cols-1 sm:grid-cols-[1fr,120px,auto] gap-3 items-end">
                <div className="space-y-2">
                  <Label>Kit</Label>
                  <Select
                    value={selectedKitId}
                    onValueChange={setSelectedKitId}
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um kit..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableKits.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground text-center">
                          Nenhum kit disponível
                        </div>
                      ) : (
                        availableKits.map((kit) => (
                          <SelectItem key={kit.id} value={kit.id}>
                            {kit.name} ({kit.items_count} itens) - {formatCurrency(kit.total_cost || 0)}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Qtd. Kits</Label>
                  <Input
                    type="number"
                    min={1}
                    step={1}
                    value={kitQuantity}
                    onChange={(e) => setKitQuantity(parseInt(e.target.value) || 1)}
                    disabled={isLoading}
                  />
                </div>

                <Button
                  onClick={handleAddKit}
                  disabled={!selectedKitId || kitQuantity <= 0 || isLoading}
                >
                  {createKitMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Kits list */}
            {kitsLinkLoading ? (
              <div className="space-y-2">
                {[1].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : procedureKits.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Nenhum kit vinculado. Crie kits em Gestão → Estoque.
                </AlertDescription>
              </Alert>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kit</TableHead>
                    <TableHead>Qtd.</TableHead>
                    <TableHead>Custo/Kit</TableHead>
                    <TableHead>Subtotal</TableHead>
                    <TableHead className="w-[60px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {procedureKits.map((item) => {
                    const kitCostPerUnit = (item.kit_total_cost || 0) / (item.quantity || 1);
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Boxes className="h-4 w-4 text-primary" />
                            {item.kit_name}
                          </div>
                        </TableCell>
                        <TableCell>
                          {editingKitId === item.id ? (
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                min={1}
                                step={1}
                                value={editKitQuantity}
                                onChange={(e) =>
                                  setEditKitQuantity(parseInt(e.target.value) || 1)
                                }
                                className="w-20 h-8"
                              />
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleSaveEditKit(item)}
                                disabled={isLoading}
                              >
                                OK
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleCancelEditKit}
                              >
                                ✕
                              </Button>
                            </div>
                          ) : (
                            <span
                              className="cursor-pointer hover:underline"
                              onClick={() => handleStartEditKit(item)}
                            >
                              {item.quantity}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>{formatCurrency(kitCostPerUnit)}</TableCell>
                        <TableCell>{formatCurrency(item.kit_total_cost || 0)}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveKit(item)}
                            disabled={isLoading}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </TabsContent>
        </Tabs>

        {/* Total cost summary */}
        <div className="mt-4 pt-4 border-t space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Produtos individuais:</span>
            <span>{formatCurrency(productsCost)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Kits:</span>
            <span>{formatCurrency(kitsCost)}</span>
          </div>
          <div className="flex justify-between font-semibold text-lg pt-2 border-t">
            <span>Custo Total:</span>
            <span className="text-primary">{formatCurrency(totalCost)}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
