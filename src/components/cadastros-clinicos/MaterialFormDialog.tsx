import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import type { Material, MaterialCategory } from "@/types/cadastros-clinicos";
import { materialCategoryLabels, materialUnits } from "@/types/cadastros-clinicos";
import {
  useMaterialForm,
  useCreateMaterial,
  useUpdateMaterial,
} from "@/hooks/useMaterialsCRUD";

interface MaterialFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  material?: Material | null;
  mode: "create" | "edit";
}

export function MaterialFormDialog({
  open,
  onOpenChange,
  material,
  mode,
}: MaterialFormDialogProps) {
  const { formData, updateField, resetForm, loadMaterial, isValid } = useMaterialForm();
  const createMutation = useCreateMaterial();
  const updateMutation = useUpdateMaterial();

  const isLoading = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (open) {
      if (mode === "edit" && material) {
        loadMaterial(material);
      } else {
        resetForm();
      }
    }
  }, [open, mode, material]);

  const handleSubmit = async () => {
    if (!isValid) return;

    try {
      if (mode === "edit" && material) {
        await updateMutation.mutateAsync({ id: material.id, formData });
      } else {
        await createMutation.mutateAsync(formData);
      }
      onOpenChange(false);
      resetForm();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onOpenChange(false);
      resetForm();
    }
  };

  const categories = Object.entries(materialCategoryLabels) as [MaterialCategory, string][];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "edit" ? "Editar Material" : "Novo Material"}
          </DialogTitle>
          <DialogDescription>
            {mode === "edit"
              ? "Atualize os dados do material"
              : "Cadastre um novo material clínico"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nome do Material *</Label>
            <Input
              id="name"
              placeholder="Ex: Seringa Descartável 10ml"
              value={formData.name}
              onChange={(e) => updateField("name", e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="category">Categoria *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => updateField("category", value as MaterialCategory)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="unit">Unidade *</Label>
              <Select
                value={formData.unit}
                onValueChange={(value) => updateField("unit", value)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
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

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="min_quantity">Quantidade Mínima</Label>
              <Input
                id="min_quantity"
                type="number"
                value={formData.min_quantity}
                onChange={(e) => updateField("min_quantity", parseInt(e.target.value) || 0)}
                min={0}
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="unit_cost">Custo Unitário (R$)</Label>
              <Input
                id="unit_cost"
                type="number"
                step="0.01"
                placeholder="0,00"
                value={formData.unit_cost || ""}
                onChange={(e) => updateField("unit_cost", parseFloat(e.target.value) || undefined)}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              placeholder="Descrição ou observações sobre o material..."
              value={formData.description || ""}
              onChange={(e) => updateField("description", e.target.value)}
              disabled={isLoading}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid || isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : mode === "edit" ? (
              "Salvar Alterações"
            ) : (
              "Criar Material"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
