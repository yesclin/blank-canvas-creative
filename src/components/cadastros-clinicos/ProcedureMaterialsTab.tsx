import { useState } from "react";
import { Plus, Search, Trash2, Edit, Calculator, Package, Layers, Link2, AlertCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Switch } from "@/components/ui/switch";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useProceduresList } from "@/hooks/useProceduresCRUD";
import { useMaterialsList } from "@/hooks/useMaterialsCRUD";
import {
  useProcedureMaterialsList,
  useCreateProcedureMaterial,
  useUpdateProcedureMaterial,
  useDeleteProcedureMaterial,
  useProcedureMaterialForm,
} from "@/hooks/useProcedureMaterialsCRUD";
import {
  useProcedureKitsList,
  useCreateProcedureKit,
  useDeleteProcedureKit,
  useProcedureKitForm,
} from "@/hooks/useProcedureKitsCRUD";
import { useMaterialKitsList } from "@/hooks/useMaterialKitsCRUD";
import { useProceduresWithCosts } from "@/hooks/useProcedureCostCalculation";
import { ProcedureCostSummaryCard } from "./ProcedureCostSummaryCard";
import type { ProcedureMaterial, ProcedureKit, MaterialCategory } from "@/types/cadastros-clinicos";
import { materialCategoryLabels, materialUnits } from "@/types/cadastros-clinicos";
import { usePermissions } from "@/hooks/usePermissions";

export function ProcedureMaterialsTab() {
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "cards">("cards");
  const [materialDialogOpen, setMaterialDialogOpen] = useState(false);
  const [kitDialogOpen, setKitDialogOpen] = useState(false);
  const [editMaterial, setEditMaterial] = useState<ProcedureMaterial | null>(null);
  const [deleteMaterial, setDeleteMaterial] = useState<ProcedureMaterial | null>(null);
  const [deleteKit, setDeleteKit] = useState<(ProcedureKit & { kit_is_active?: boolean }) | null>(null);
  const [selectedProcedure, setSelectedProcedure] = useState<string>("");

  const { data: procedureMaterials = [], isLoading: loadingMaterials } = useProcedureMaterialsList();
  const { data: procedureKits = [], isLoading: loadingKits } = useProcedureKitsList();
  const { data: proceduresWithCosts = [], isLoading: loadingCosts } = useProceduresWithCosts();
  const { data: procedures = [] } = useProceduresList();
  const { data: materials = [] } = useMaterialsList();
  const { data: kits = [] } = useMaterialKitsList();
  
  const createMaterialMutation = useCreateProcedureMaterial();
  const updateMaterialMutation = useUpdateProcedureMaterial();
  const deleteMaterialMutation = useDeleteProcedureMaterial();
  const createKitMutation = useCreateProcedureKit();
  const deleteKitMutation = useDeleteProcedureKit();
  
  const { formData: materialForm, updateField: updateMaterialField, resetForm: resetMaterialForm, isValid: isMaterialValid } = useProcedureMaterialForm();
  const { formData: kitForm, updateField: updateKitField, resetForm: resetKitForm, isValid: isKitValid } = useProcedureKitForm();
  
  const { isOwner, can } = usePermissions();
  // Permissão para configurar produtos nos procedimentos: owner tem bypass total
  const canManage = isOwner || (can("configuracoes", "edit") && can("estoque", "edit"));

  const isLoading = loadingMaterials || loadingKits || loadingCosts;

  // Filtrar procedimentos
  const filteredProcedures = proceduresWithCosts.filter((proc) =>
    proc.name.toLowerCase().includes(search.toLowerCase())
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  // Handlers para materiais
  const handleAddMaterial = (procedureId: string) => {
    resetMaterialForm();
    updateMaterialField("procedure_id", procedureId);
    setSelectedProcedure(procedureId);
    setEditMaterial(null);
    setMaterialDialogOpen(true);
  };

  const handleEditMaterial = (item: ProcedureMaterial) => {
    setEditMaterial(item);
    updateMaterialField("procedure_id", item.procedure_id);
    updateMaterialField("material_id", item.material_id);
    updateMaterialField("quantity", item.quantity);
    updateMaterialField("unit", item.unit);
    updateMaterialField("is_required", item.is_required);
    updateMaterialField("allow_manual_edit", item.allow_manual_edit);
    updateMaterialField("notes", item.notes || "");
    setMaterialDialogOpen(true);
  };

  const handleSaveMaterial = async () => {
    if (!isMaterialValid) return;

    if (editMaterial) {
      await updateMaterialMutation.mutateAsync({ id: editMaterial.id, formData: materialForm });
    } else {
      await createMaterialMutation.mutateAsync(materialForm);
    }
    setMaterialDialogOpen(false);
    resetMaterialForm();
    setEditMaterial(null);
  };

  const handleDeleteMaterial = async () => {
    if (!deleteMaterial) return;
    await deleteMaterialMutation.mutateAsync(deleteMaterial.id);
    setDeleteMaterial(null);
  };

  // Handlers para kits
  const handleAddKit = (procedureId: string) => {
    resetKitForm();
    updateKitField("procedure_id", procedureId);
    setSelectedProcedure(procedureId);
    setKitDialogOpen(true);
  };

  const handleSaveKit = async () => {
    if (!isKitValid) return;
    await createKitMutation.mutateAsync(kitForm);
    setKitDialogOpen(false);
    resetKitForm();
  };

  const handleDeleteKit = async () => {
    if (!deleteKit) return;
    await deleteKitMutation.mutateAsync(deleteKit.id);
    setDeleteKit(null);
  };

  // Agrupar materiais e kits por procedimento
  const getProcedureMaterialsById = (procedureId: string) => 
    procedureMaterials.filter((pm) => pm.procedure_id === procedureId);
    
  const getProcedureKitsById = (procedureId: string) =>
    procedureKits.filter((pk) => pk.procedure_id === procedureId);

  const isSavingMaterial = createMaterialMutation.isPending || updateMaterialMutation.isPending;
  const isSavingKit = createKitMutation.isPending;

  return (
    <div className="space-y-4">
      {/* Header com estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{proceduresWithCosts.filter(p => p.has_items).length}</p>
                <p className="text-sm text-muted-foreground">Procedimentos com insumos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Link2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{procedureMaterials.length + procedureKits.length}</p>
                <p className="text-sm text-muted-foreground">Vínculos ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-destructive/10 rounded-lg">
                <AlertCircle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{proceduresWithCosts.filter(p => !p.has_items).length}</p>
                <p className="text-sm text-muted-foreground">Procedimentos sem insumos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Busca e ações */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar procedimento..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "list" | "cards")}>
          <TabsList>
            <TabsTrigger value="cards">Cards</TabsTrigger>
            <TabsTrigger value="list">Lista</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Conteúdo */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : filteredProcedures.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 text-muted-foreground">
              {search ? "Nenhum procedimento encontrado" : "Nenhum procedimento cadastrado"}
            </div>
          </CardContent>
        </Card>
      ) : viewMode === "cards" ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredProcedures.map((proc) => (
            <Card key={proc.id} className={!proc.has_items ? "border-dashed" : ""}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{proc.name}</CardTitle>
                    <CardDescription className="flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1">
                        <Package className="h-3.5 w-3.5" />
                        {proc.material_count} materiais
                      </span>
                      <span className="flex items-center gap-1">
                        <Layers className="h-3.5 w-3.5" />
                        {proc.kit_count} kits
                      </span>
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      <Calculator className="h-4 w-4 text-primary" />
                      <span className="font-bold text-primary">
                        {formatCurrency(proc.total_cost)}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">Custo estimado</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {!proc.has_items && (
                  <div className="flex items-center gap-2 text-sm text-destructive mb-3 p-2 bg-destructive/10 rounded-md">
                    <AlertCircle className="h-4 w-4" />
                    <span>Procedimento sem insumos vinculados</span>
                  </div>
                )}
                
                {canManage && (
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleAddMaterial(proc.id)}
                    >
                      <Package className="h-4 w-4 mr-1" />
                      + Material
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleAddKit(proc.id)}
                    >
                      <Layers className="h-4 w-4 mr-1" />
                      + Kit
                    </Button>
                  </div>
                )}
                
                {proc.has_items && (
                  <div className="mt-3 space-y-2">
                    {getProcedureMaterialsById(proc.id).slice(0, 3).map((pm) => (
                      <div key={pm.id} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {pm.material_name} ({pm.quantity} {pm.unit})
                        </span>
                        {canManage && (
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleEditMaterial(pm)}>
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setDeleteMaterial(pm)}>
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                    {getProcedureKitsById(proc.id).map((pk) => (
                      <div key={pk.id} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Layers className="h-3 w-3" />
                          Kit: {pk.kit_name} (×{pk.quantity})
                        </span>
                        {canManage && (
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setDeleteKit(pk)}>
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        )}
                      </div>
                    ))}
                    {(getProcedureMaterialsById(proc.id).length > 3) && (
                      <p className="text-xs text-muted-foreground">
                        +{getProcedureMaterialsById(proc.id).length - 3} outros materiais
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredProcedures.map((proc) => (
            <ProcedureCostSummaryCard 
              key={proc.id}
              procedureId={proc.id}
              procedureName={proc.name}
            />
          ))}
        </div>
      )}

      {/* Dialog adicionar material */}
      <Dialog open={materialDialogOpen} onOpenChange={setMaterialDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editMaterial ? "Editar Vínculo" : "Vincular Material ao Procedimento"}
            </DialogTitle>
            <DialogDescription>
              Defina qual material é utilizado no procedimento e sua quantidade
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Procedimento</Label>
              <Select
                value={materialForm.procedure_id}
                onValueChange={(value) => updateMaterialField("procedure_id", value)}
                disabled={!!editMaterial || !!selectedProcedure}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o procedimento" />
                </SelectTrigger>
                <SelectContent>
                  {procedures.filter((p) => p.is_active).map((proc) => (
                    <SelectItem key={proc.id} value={proc.id}>
                      {proc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Material *</Label>
              <Select
                value={materialForm.material_id}
                onValueChange={(value) => updateMaterialField("material_id", value)}
                disabled={!!editMaterial}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o material" />
                </SelectTrigger>
                <SelectContent>
                  {materials.filter((m) => m.is_active).map((mat) => (
                    <SelectItem key={mat.id} value={mat.id}>
                      {mat.name} {mat.unit_cost ? `(${formatCurrency(mat.unit_cost)})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Quantidade *</Label>
                <Input
                  type="number"
                  value={materialForm.quantity}
                  onChange={(e) => updateMaterialField("quantity", parseFloat(e.target.value) || 1)}
                  min={0.01}
                  step={0.01}
                />
              </div>
              <div className="grid gap-2">
                <Label>Unidade</Label>
                <Select
                  value={materialForm.unit}
                  onValueChange={(value) => updateMaterialField("unit", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {materialUnits.map((unit) => (
                      <SelectItem key={unit.value} value={unit.value}>
                        {unit.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Material Obrigatório</Label>
                  <p className="text-sm text-muted-foreground">
                    Obrigatório para realizar o procedimento
                  </p>
                </div>
                <Switch
                  checked={materialForm.is_required}
                  onCheckedChange={(checked) => updateMaterialField("is_required", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Permite Edição Manual</Label>
                  <p className="text-sm text-muted-foreground">
                    Quantidade pode ser alterada no atendimento
                  </p>
                </div>
                <Switch
                  checked={materialForm.allow_manual_edit}
                  onCheckedChange={(checked) => updateMaterialField("allow_manual_edit", checked)}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setMaterialDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveMaterial} disabled={!isMaterialValid || isSavingMaterial}>
              {isSavingMaterial ? "Salvando..." : editMaterial ? "Salvar" : "Vincular"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog adicionar kit */}
      <Dialog open={kitDialogOpen} onOpenChange={setKitDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vincular Kit ao Procedimento</DialogTitle>
            <DialogDescription>
              Selecione um kit de materiais para vincular ao procedimento
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Procedimento</Label>
              <Select
                value={kitForm.procedure_id}
                onValueChange={(value) => updateKitField("procedure_id", value)}
                disabled={!!selectedProcedure}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o procedimento" />
                </SelectTrigger>
                <SelectContent>
                  {procedures.filter((p) => p.is_active).map((proc) => (
                    <SelectItem key={proc.id} value={proc.id}>
                      {proc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Kit de Materiais *</Label>
              <Select
                value={kitForm.kit_id}
                onValueChange={(value) => updateKitField("kit_id", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o kit" />
                </SelectTrigger>
                <SelectContent>
                  {kits.filter((k) => k.is_active).map((kit) => (
                    <SelectItem key={kit.id} value={kit.id}>
                      {kit.name} ({kit.items_count} itens - {formatCurrency(kit.total_cost || 0)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Quantidade</Label>
              <Input
                type="number"
                value={kitForm.quantity}
                onChange={(e) => updateKitField("quantity", parseInt(e.target.value) || 1)}
                min={1}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Kit Obrigatório</Label>
                <p className="text-sm text-muted-foreground">
                  Obrigatório para realizar o procedimento
                </p>
              </div>
              <Switch
                checked={kitForm.is_required}
                onCheckedChange={(checked) => updateKitField("is_required", checked)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setKitDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveKit} disabled={!isKitValid || isSavingKit}>
              {isSavingKit ? "Vinculando..." : "Vincular Kit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog confirmar exclusão de material */}
      <AlertDialog open={!!deleteMaterial} onOpenChange={() => setDeleteMaterial(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Vínculo</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja remover "{deleteMaterial?.material_name}" do procedimento? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteMaterial}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMaterialMutation.isPending ? "Removendo..." : "Remover"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog confirmar exclusão de kit */}
      <AlertDialog open={!!deleteKit} onOpenChange={() => setDeleteKit(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Kit do Procedimento</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja remover o kit "{deleteKit?.kit_name}" do procedimento? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteKit}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteKitMutation.isPending ? "Removendo..." : "Remover"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
