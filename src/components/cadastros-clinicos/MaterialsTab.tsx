import { useState } from "react";
import { Plus, Search, Edit, ToggleLeft, ToggleRight, AlertTriangle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
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
import { useMaterialsList, useToggleMaterialStatus } from "@/hooks/useMaterialsCRUD";
import { MaterialFormDialog } from "./MaterialFormDialog";
import { MaterialUsageBadge } from "./MaterialUsageBadge";
import type { Material, MaterialCategory } from "@/types/cadastros-clinicos";
import { materialCategoryLabels, materialCategoryColors, materialUnits } from "@/types/cadastros-clinicos";
import { usePermissions } from "@/hooks/usePermissions";

export function MaterialsTab() {
  const [search, setSearch] = useState("");
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [confirmToggle, setConfirmToggle] = useState<Material | null>(null);

  const { data: materials = [], isLoading, error } = useMaterialsList(true);
  const toggleStatusMutation = useToggleMaterialStatus();
  const { isOwner, can } = usePermissions();

  const canManage = isOwner || can("configuracoes", "edit");

  const filteredMaterials = materials.filter((mat) =>
    mat.name.toLowerCase().includes(search.toLowerCase()) ||
    materialCategoryLabels[mat.category as MaterialCategory]?.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = () => {
    setSelectedMaterial(null);
    setDialogMode("create");
    setDialogOpen(true);
  };

  const handleEdit = (material: Material) => {
    setSelectedMaterial(material);
    setDialogMode("edit");
    setDialogOpen(true);
  };

  const handleToggleStatus = (material: Material) => {
    setConfirmToggle(material);
  };

  const confirmStatusChange = async () => {
    if (!confirmToggle) return;
    await toggleStatusMutation.mutateAsync({
      id: confirmToggle.id,
      isActive: confirmToggle.is_active,
    });
    setConfirmToggle(null);
  };

  const formatCurrency = (value?: number) => {
    if (!value) return "-";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getUnitLabel = (value: string) => {
    return materialUnits.find((u) => u.value === value)?.label || value;
  };

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <span>Erro ao carregar materiais: {(error as Error).message}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar material ou categoria..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {canManage && (
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Material
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredMaterials.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {search ? "Nenhum material encontrado" : "Nenhum material cadastrado"}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Material</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead>Qtd. Mínima</TableHead>
                  <TableHead>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger className="flex items-center gap-1">
                          Custo Unitário
                          <Info className="h-3 w-3 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Alterar o custo impacta kits e procedimentos vinculados</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableHead>
                  <TableHead>Uso</TableHead>
                  <TableHead>Status</TableHead>
                  {canManage && <TableHead className="text-right">Ações</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMaterials.map((material) => (
                  <TableRow key={material.id}>
                    <TableCell className="font-medium">{material.name}</TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={materialCategoryColors[material.category as MaterialCategory] || ""}
                      >
                        {materialCategoryLabels[material.category as MaterialCategory] || material.category}
                      </Badge>
                    </TableCell>
                    <TableCell>{getUnitLabel(material.unit)}</TableCell>
                    <TableCell>{material.min_quantity}</TableCell>
                    <TableCell>{formatCurrency(material.unit_cost)}</TableCell>
                    <TableCell>
                      <MaterialUsageBadge materialId={material.id} compact />
                    </TableCell>
                    <TableCell>
                      <Badge variant={material.is_active ? "default" : "secondary"}>
                        {material.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    {canManage && (
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(material)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggleStatus(material)}
                            disabled={toggleStatusMutation.isPending}
                          >
                            {material.is_active ? (
                              <ToggleRight className="h-4 w-4 text-primary" />
                            ) : (
                              <ToggleLeft className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <MaterialFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        material={selectedMaterial}
        mode={dialogMode}
      />

      <AlertDialog open={!!confirmToggle} onOpenChange={() => setConfirmToggle(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmToggle?.is_active ? "Desativar Material" : "Ativar Material"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmToggle?.is_active
                ? `Deseja desativar "${confirmToggle?.name}"? Materiais inativos não podem ser usados em novos procedimentos.`
                : `Deseja ativar "${confirmToggle?.name}"?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmStatusChange}>
              {toggleStatusMutation.isPending ? "Salvando..." : "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
