import { useState } from "react";
import { Edit, GripVertical, Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { useAppointmentStatuses, AppointmentStatus, AppointmentStatusFormData } from "@/hooks/useAppointmentStatuses";
import { Skeleton } from "@/components/ui/skeleton";

const COLOR_OPTIONS = [
  { value: "bg-slate-500", label: "Cinza", className: "bg-slate-500" },
  { value: "bg-blue-500", label: "Azul", className: "bg-blue-500" },
  { value: "bg-green-500", label: "Verde", className: "bg-green-500" },
  { value: "bg-yellow-500", label: "Amarelo", className: "bg-yellow-500" },
  { value: "bg-orange-500", label: "Laranja", className: "bg-orange-500" },
  { value: "bg-red-500", label: "Vermelho", className: "bg-red-500" },
  { value: "bg-purple-500", label: "Roxo", className: "bg-purple-500" },
  { value: "bg-emerald-600", label: "Esmeralda", className: "bg-emerald-600" },
];

export function AppointmentStatusCard() {
  const { statuses, isLoading, isSaving, createStatus, updateStatus, deleteStatus, reorderStatuses } = useAppointmentStatuses();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState<AppointmentStatus | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<AppointmentStatusFormData>({
    name: "",
    description: "",
    color: "bg-slate-500",
    is_active: true,
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      color: "bg-slate-500",
      is_active: true,
    });
    setEditingStatus(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (status: AppointmentStatus) => {
    setEditingStatus(status);
    setFormData({
      name: status.name,
      description: status.description || "",
      color: status.color,
      is_active: status.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) return;

    if (editingStatus) {
      const success = await updateStatus(editingStatus.id, formData);
      if (success) {
        setIsDialogOpen(false);
        resetForm();
      }
    } else {
      const result = await createStatus(formData);
      if (result) {
        setIsDialogOpen(false);
        resetForm();
      }
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    await deleteStatus(deleteConfirmId);
    setDeleteConfirmId(null);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    
    // Reorder locally for visual feedback
    const newStatuses = [...statuses];
    const draggedItem = newStatuses[draggedIndex];
    newStatuses.splice(draggedIndex, 1);
    newStatuses.splice(index, 0, draggedItem);
    
    setDraggedIndex(index);
  };

  const handleDragEnd = async () => {
    if (draggedIndex === null) return;
    
    // Persist the new order
    const reordered = statuses.map((status, index) => ({
      id: status.id,
      display_order: index,
    }));
    
    await reorderStatuses(reordered);
    setDraggedIndex(null);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Status de Atendimento</CardTitle>
          <CardDescription>Fluxo de status do agendamento ao fim do atendimento</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Status de Atendimento</CardTitle>
            <CardDescription>Fluxo de status do agendamento ao fim do atendimento</CardDescription>
          </div>
          <Button size="sm" variant="outline" onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar
          </Button>
        </CardHeader>
        <CardContent>
          {statuses.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhum status cadastrado.
            </p>
          ) : (
            <div className="space-y-3">
              {statuses.map((status, index) => (
                <div
                  key={status.id}
                  draggable={!status.is_system}
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    draggedIndex === index ? "border-primary bg-muted" : ""
                  } ${!status.is_system ? "cursor-move" : ""}`}
                >
                  <div className="flex items-center gap-3">
                    {!status.is_system && (
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                    )}
                    <div className={`w-3 h-3 rounded-full ${status.color}`} />
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        {status.name}
                        <Badge variant="outline" className="text-xs">
                          {status.display_order + 1}
                        </Badge>
                        {!status.is_active && (
                          <span className="text-xs text-muted-foreground">(inativo)</span>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {status.description || "Sem descrição"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(status)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    {!status.is_system && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => setDeleteConfirmId(status.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-4">
            💡 Arraste os status para reordenar o fluxo de atendimento
          </p>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingStatus ? "Editar Status" : "Novo Status"}
            </DialogTitle>
            <DialogDescription>
              {editingStatus ? "Edite as informações do status" : "Adicione um novo status de atendimento"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="status_name">Nome *</Label>
              <Input
                id="status_name"
                placeholder="Ex: Em Espera"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status_description">Descrição</Label>
              <Input
                id="status_description"
                placeholder="Descrição do status"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status_color">Cor</Label>
              <Select
                value={formData.color}
                onValueChange={(v) => setFormData({ ...formData, color: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma cor" />
                </SelectTrigger>
                <SelectContent>
                  {COLOR_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${option.className}`} />
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {editingStatus && (
              <div className="flex items-center justify-between">
                <Label htmlFor="status_active">Ativo</Label>
                <Switch
                  id="status_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSaving || !formData.name.trim()}>
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingStatus ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir status?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O status será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
