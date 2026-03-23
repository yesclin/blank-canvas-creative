import { useEffect, useState } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  Procedure,
  useProcedureForm,
  useCreateProcedure,
  useUpdateProcedure,
} from "@/hooks/useProceduresCRUD";
import {
  useProcedureProductsByProcedure,
  useCreateProcedureProduct,
  useDeleteProcedureProduct,
  useUpdateProcedureProduct,
} from "@/hooks/useProcedureProductsCRUD";
import {
  useProcedureProductKitsByProcedure,
  useCreateProcedureProductKit,
  useDeleteProcedureProductKit,
  useUpdateProcedureProductKit,
} from "@/hooks/useProcedureProductKitsCRUD";
import {
  ProcedureProductsSection,
  type ProcedureProductItem,
} from "./ProcedureProductsSection";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useClinicData } from "@/hooks/useClinicData";

interface SpecialtyOption {
  id: string;
  name: string;
}

interface ProcedureFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  procedure?: Procedure | null;
  mode: "create" | "edit";
}

export function ProcedureFormDialog({
  open,
  onOpenChange,
  procedure,
  mode,
}: ProcedureFormDialogProps) {
  const { clinic } = useClinicData();
  const { formData, updateField, resetForm, loadProcedure, isValid } = useProcedureForm();
  const createMutation = useCreateProcedure();
  const updateMutation = useUpdateProcedure();

  // Fetch specialties from database
  const { data: specialties = [], isLoading: specialtiesLoading } = useQuery({
    queryKey: ["specialties-for-procedures", clinic?.id],
    queryFn: async () => {
      if (!clinic?.id) return [];
      const { data, error } = await supabase
        .from("specialties")
        .select("id, name")
        .eq("is_active", true)
        .or(`clinic_id.is.null,clinic_id.eq.${clinic.id}`)
        .order("name");
      
      if (error) throw error;
      return data as SpecialtyOption[];
    },
    enabled: !!clinic?.id,
  });

  // Products linked to procedure
  const { data: existingProducts = [] } = useProcedureProductsByProcedure(
    mode === "edit" && procedure ? procedure.id : null
  );
  const createProductMutation = useCreateProcedureProduct();
  const updateProductMutation = useUpdateProcedureProduct();
  const deleteProductMutation = useDeleteProcedureProduct();

  // Kits linked to procedure
  const { data: existingKits = [] } = useProcedureProductKitsByProcedure(
    mode === "edit" && procedure ? procedure.id : null
  );
  const createKitMutation = useCreateProcedureProductKit();
  const updateKitMutation = useUpdateProcedureProductKit();
  const deleteKitMutation = useDeleteProcedureProductKit();

  const [items, setItems] = useState<ProcedureProductItem[]>([]);

  const isLoading =
    createMutation.isPending ||
    updateMutation.isPending ||
    createProductMutation.isPending ||
    updateProductMutation.isPending ||
    deleteProductMutation.isPending ||
    createKitMutation.isPending ||
    updateKitMutation.isPending ||
    deleteKitMutation.isPending;

  useEffect(() => {
    if (open) {
      if (mode === "edit" && procedure) {
        loadProcedure(procedure);
      } else {
        resetForm();
        setItems([]);
      }
    }
  }, [open, mode, procedure]);

  // Sync existing products and kits when editing
  useEffect(() => {
    if (mode === "edit") {
      const productItems: ProcedureProductItem[] = existingProducts.map((p) => ({
        id: p.product_id,
        type: "product" as const,
        name: p.product_name || "",
        unit: p.product_unit || "",
        quantity: p.quantity,
      }));

      const kitItems: ProcedureProductItem[] = existingKits.map((k) => ({
        id: k.kit_id,
        type: "kit" as const,
        name: k.kit_name || "",
        unit: "kit",
        quantity: k.quantity,
        hasItems: true, // Assume they have items if saved
      }));

      setItems([...productItems, ...kitItems]);
    }
  }, [existingProducts, existingKits, mode]);

  const handleSubmit = async () => {
    if (!isValid) return;

    try {
      let procedureId: string;

      if (mode === "edit" && procedure) {
        await updateMutation.mutateAsync({ id: procedure.id, formData });
        procedureId = procedure.id;

        // Sync products
        const currentProducts = items.filter((i) => i.type === "product");
        const existingProductIds = existingProducts.map((p) => p.product_id);
        const newProductIds = currentProducts.map((p) => p.id);

        // Delete removed products
        for (const existing of existingProducts) {
          if (!newProductIds.includes(existing.product_id)) {
            await deleteProductMutation.mutateAsync({
              id: existing.id,
              procedureId,
            });
          }
        }

        // Update or add products
        for (const item of currentProducts) {
          const existingItem = existingProducts.find((p) => p.product_id === item.id);
          if (existingItem) {
            if (existingItem.quantity !== item.quantity) {
              await updateProductMutation.mutateAsync({
                id: existingItem.id,
                procedureId,
                formData: { quantity: item.quantity },
              });
            }
          } else {
            await createProductMutation.mutateAsync({
              procedure_id: procedureId,
              product_id: item.id,
              quantity: item.quantity,
            });
          }
        }

        // Sync kits
        const currentKits = items.filter((i) => i.type === "kit");
        const existingKitIds = existingKits.map((k) => k.kit_id);
        const newKitIds = currentKits.map((k) => k.id);

        // Delete removed kits
        for (const existing of existingKits) {
          if (!newKitIds.includes(existing.kit_id)) {
            await deleteKitMutation.mutateAsync({
              id: existing.id,
              procedureId,
            });
          }
        }

        // Update or add kits
        for (const item of currentKits) {
          const existingItem = existingKits.find((k) => k.kit_id === item.id);
          if (existingItem) {
            if (existingItem.quantity !== item.quantity) {
              await updateKitMutation.mutateAsync({
                id: existingItem.id,
                procedureId,
                formData: { quantity: item.quantity },
              });
            }
          } else {
            await createKitMutation.mutateAsync({
              procedure_id: procedureId,
              kit_id: item.id,
              quantity: item.quantity,
              is_required: true,
            });
          }
        }
      } else {
        const newProcedure = await createMutation.mutateAsync(formData);
        procedureId = newProcedure.id;

        // Add all products
        for (const item of items.filter((i) => i.type === "product")) {
          await createProductMutation.mutateAsync({
            procedure_id: procedureId,
            product_id: item.id,
            quantity: item.quantity,
          });
        }

        // Add all kits
        for (const item of items.filter((i) => i.type === "kit")) {
          await createKitMutation.mutateAsync({
            procedure_id: procedureId,
            kit_id: item.id,
            quantity: item.quantity,
            is_required: true,
          });
        }
      }

      onOpenChange(false);
      resetForm();
      setItems([]);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onOpenChange(false);
      resetForm();
      setItems([]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "edit" ? "Editar Procedimento" : "Novo Procedimento"}
          </DialogTitle>
          <DialogDescription>
            {mode === "edit"
              ? "Atualize os dados do procedimento"
              : "Cadastre um novo procedimento para a clínica"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nome do Procedimento *</Label>
            <Input
              id="name"
              placeholder="Ex: Consulta Inicial"
              value={formData.name}
              onChange={(e) => updateField("name", e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="specialty_id">Especialidade *</Label>
            <Select
              value={formData.specialty_id || ""}
              onValueChange={(value) => {
                updateField("specialty_id", value);
                // Also update the legacy text field for backwards compatibility
                const selectedSpec = specialties.find(s => s.id === value);
                if (selectedSpec) {
                  updateField("specialty", selectedSpec.name);
                }
              }}
              disabled={isLoading || specialtiesLoading}
            >
              <SelectTrigger className={!formData.specialty_id ? "border-amber-500" : ""}>
                <SelectValue placeholder={specialtiesLoading ? "Carregando..." : "Selecione a especialidade"} />
              </SelectTrigger>
              <SelectContent>
                {specialties.map((spec) => (
                  <SelectItem key={spec.id} value={spec.id}>
                    {spec.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!formData.specialty_id && (
              <p className="text-xs text-amber-600">
                A especialidade define qual prontuário será ativado automaticamente.
              </p>
            )}
            {specialties.length === 0 && !specialtiesLoading && (
              <Alert variant="default" className="mt-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Nenhuma especialidade cadastrada. Cadastre em Configurações → Clínica.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              placeholder="Descrição do procedimento..."
              value={formData.description}
              onChange={(e) => updateField("description", e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="duration">Duração (minutos) *</Label>
              <Input
                id="duration"
                type="number"
                value={formData.duration_minutes}
                onChange={(e) => updateField("duration_minutes", Math.max(5, parseInt(e.target.value) || 5))}
                min={5}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">Mínimo: 5 minutos</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="price">Valor (R$)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min={0}
                placeholder="0,00"
                value={formData.price || ""}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  updateField("price", isNaN(val) ? undefined : Math.max(0, val));
                }}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Permite Retorno</Label>
              <p className="text-sm text-muted-foreground">
                Paciente pode agendar retorno sem cobrança
              </p>
            </div>
            <Switch
              checked={formData.allows_return}
              onCheckedChange={(checked) => updateField("allows_return", checked)}
              disabled={isLoading}
            />
          </div>

          {formData.allows_return && (
            <div className="grid gap-2">
              <Label htmlFor="return_days">Prazo para Retorno (dias)</Label>
              <Input
                id="return_days"
                type="number"
                value={formData.return_days || 15}
                onChange={(e) => updateField("return_days", parseInt(e.target.value) || 15)}
                min={1}
                disabled={isLoading}
              />
            </div>
          )}

          {/* Products/Materials Section */}
          <Separator className="my-2" />
          <ProcedureProductsSection
            items={items}
            onChange={setItems}
            disabled={isLoading}
          />
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
              "Criar Procedimento"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
