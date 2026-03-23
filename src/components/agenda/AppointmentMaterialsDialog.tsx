import { useState, useEffect } from "react";
import { Package, Plus, Minus, Trash2, Layers, AlertTriangle, Check, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  useAppointmentMaterials, 
  useProcessMaterialConsumption,
  useAutoConsumptionConfig,
  type MaterialConsumptionItem 
} from "@/hooks/useMaterialConsumption";
import { useMaterialsList } from "@/hooks/useMaterialsCRUD";
import { materialUnits } from "@/types/cadastros-clinicos";
import { usePermissions } from "@/hooks/usePermissions";
import { MaterialConsumptionConfirmDialog } from "./MaterialConsumptionConfirmDialog";

interface AppointmentMaterialsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointmentId: string;
  procedureName?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function AppointmentMaterialsDialog({
  open,
  onOpenChange,
  appointmentId,
  procedureName,
  onConfirm,
  onCancel,
}: AppointmentMaterialsDialogProps) {
  const [materials, setMaterials] = useState<MaterialConsumptionItem[]>([]);
  const [addingExtra, setAddingExtra] = useState(false);
  const [extraMaterialId, setExtraMaterialId] = useState("");
  const [extraQuantity, setExtraQuantity] = useState(1);
  const [extraUnit, setExtraUnit] = useState("unidade");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const { data: appointmentMaterials = [], isLoading } = useAppointmentMaterials(open ? appointmentId : null);
  const { data: allMaterials = [] } = useMaterialsList();
  const { data: autoConsumptionEnabled } = useAutoConsumptionConfig();
  const processMutation = useProcessMaterialConsumption();
  
  // Permissão para executar procedimentos que consomem estoque - owner tem bypass total
  const { isOwner, can } = usePermissions();
  const canConsumeStock = isOwner || can("estoque", "edit");
  
  // Whether we should consume stock on confirm
  const shouldConsumeStock = canConsumeStock && autoConsumptionEnabled && materials.length > 0;

  // Initialize materials from appointment
  useEffect(() => {
    if (appointmentMaterials.length > 0) {
      setMaterials(appointmentMaterials);
    }
  }, [appointmentMaterials]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const totalCost = materials.reduce((sum, m) => sum + (m.quantity * m.unit_cost), 0);

  const handleQuantityChange = (index: number, delta: number) => {
    setMaterials(prev => {
      const updated = [...prev];
      const item = updated[index];
      if (item.allow_manual_edit || !item.is_required) {
        item.quantity = Math.max(0.01, item.quantity + delta);
      }
      return updated;
    });
  };

  const handleRemoveMaterial = (index: number) => {
    const item = materials[index];
    if (!item.is_required) {
      setMaterials(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleAddExtra = () => {
    const material = allMaterials.find(m => m.id === extraMaterialId);
    if (!material) return;

    setMaterials(prev => [
      ...prev,
      {
        material_id: material.id,
        material_name: material.name,
        quantity: extraQuantity,
        unit: extraUnit,
        unit_cost: material.unit_cost || 0,
        source: 'extra',
        is_required: false,
        allow_manual_edit: true,
      },
    ]);

    setAddingExtra(false);
    setExtraMaterialId("");
    setExtraQuantity(1);
    setExtraUnit("unidade");
  };

  const handleRequestConfirm = () => {
    // If we should consume stock, show confirmation dialog first
    if (shouldConsumeStock) {
      setShowConfirmDialog(true);
    } else {
      // No stock consumption, proceed directly
      onConfirm();
    }
  };

  const handleConfirmConsumption = async () => {
    try {
      await processMutation.mutateAsync({
        appointmentId,
        materials,
      });
      setShowConfirmDialog(false);
      onConfirm();
    } catch (error) {
      // Error is already handled in the mutation
      setShowConfirmDialog(false);
    }
  };

  const handleCancelConfirmation = () => {
    setShowConfirmDialog(false);
  };

  const availableMaterials = allMaterials.filter(
    m => m.is_active && !materials.some(mat => mat.material_id === m.id)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Materiais deste Atendimento
          </DialogTitle>
          <DialogDescription>
            {procedureName && (
              <span className="font-medium">Procedimento: {procedureName}</span>
            )}
            {!autoConsumptionEnabled && (
              <span className="block mt-1 text-muted-foreground">
                Baixa automática desativada - apenas visualização
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : materials.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-2 opacity-30" />
              <p>Nenhum material vinculado a este procedimento</p>
            </div>
          ) : (
            <div className="space-y-3">
              {materials.map((material, index) => (
                <div 
                  key={`${material.material_id}-${index}`}
                  className="flex items-center justify-between p-3 border rounded-lg bg-muted/30"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{material.material_name}</span>
                      {material.source === 'kit' && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Badge variant="secondary" className="text-xs">
                                <Layers className="h-3 w-3 mr-1" />
                                Kit
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Do kit: {material.kit_name}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      {material.source === 'extra' && (
                        <Badge variant="outline" className="text-xs">Extra</Badge>
                      )}
                      {material.is_required && (
                        <Badge variant="destructive" className="text-xs">Obrigatório</Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {formatCurrency(material.unit_cost)} / {material.unit}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleQuantityChange(index, -1)}
                        disabled={!material.allow_manual_edit && material.is_required}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <div className="w-16 text-center">
                        <span className="font-medium">{material.quantity}</span>
                        <span className="text-xs text-muted-foreground ml-1">{material.unit}</span>
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleQuantityChange(index, 1)}
                        disabled={!material.allow_manual_edit && material.is_required}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>

                    <div className="w-24 text-right font-medium">
                      {formatCurrency(material.quantity * material.unit_cost)}
                    </div>

                    {!material.is_required && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleRemoveMaterial(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}

              {/* Add extra material */}
              {addingExtra ? (
                <div className="p-3 border rounded-lg border-dashed bg-muted/20">
                  <div className="grid gap-3">
                    <div className="grid gap-2">
                      <Label>Material</Label>
                      <Select value={extraMaterialId} onValueChange={setExtraMaterialId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o material" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableMaterials.map((mat) => (
                            <SelectItem key={mat.id} value={mat.id}>
                              {mat.name} {mat.unit_cost ? `(${formatCurrency(mat.unit_cost)})` : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="grid gap-2">
                        <Label>Quantidade</Label>
                        <Input
                          type="number"
                          value={extraQuantity}
                          onChange={(e) => setExtraQuantity(parseFloat(e.target.value) || 1)}
                          min={0.01}
                          step={0.01}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Unidade</Label>
                        <Select value={extraUnit} onValueChange={setExtraUnit}>
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
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleAddExtra} disabled={!extraMaterialId}>
                        <Check className="h-4 w-4 mr-1" />
                        Adicionar
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setAddingExtra(false)}>
                        Cancelar
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="w-full border-dashed"
                  onClick={() => setAddingExtra(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar material extra
                </Button>
              )}
            </div>
          )}

          {/* Total */}
          {materials.length > 0 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                Custo total estimado:
              </div>
              <div className="text-xl font-bold text-primary">
                {formatCurrency(totalCost)}
              </div>
            </div>
          )}

          {/* Warning if auto consumption disabled */}
          {!autoConsumptionEnabled && materials.length > 0 && (
            <div className="flex items-start gap-2 mt-4 p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <div>
                <p>A baixa automática está desativada.</p>
                <p>Os materiais serão registrados apenas para cálculo de custo.</p>
              </div>
            </div>
          )}

          {/* Warning if user doesn't have permission to consume stock */}
          {!canConsumeStock && autoConsumptionEnabled && materials.length > 0 && (
            <Alert className="mt-4">
              <ShieldAlert className="h-4 w-4" />
              <AlertDescription>
                Você não tem permissão para baixar estoque. Os materiais serão exibidos apenas para referência.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button 
            onClick={handleRequestConfirm}
            disabled={processMutation.isPending}
          >
            {processMutation.isPending ? "Processando..." : "Finalizar Atendimento"}
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Confirmation dialog for stock consumption */}
      <MaterialConsumptionConfirmDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        materials={materials}
        totalCost={totalCost}
        onConfirm={handleConfirmConsumption}
        onCancel={handleCancelConfirmation}
        isProcessing={processMutation.isPending}
      />
    </Dialog>
  );
}
