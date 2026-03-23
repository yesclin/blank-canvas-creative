import { useState } from "react";
import { Plus, Edit, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
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
import { useAppointmentTypes, AppointmentType, AppointmentTypeFormData } from "@/hooks/useAppointmentTypes";
import { Skeleton } from "@/components/ui/skeleton";

const COLOR_OPTIONS = [
  { value: "bg-blue-500", label: "Azul", className: "bg-blue-500" },
  { value: "bg-green-500", label: "Verde", className: "bg-green-500" },
  { value: "bg-purple-500", label: "Roxo", className: "bg-purple-500" },
  { value: "bg-yellow-500", label: "Amarelo", className: "bg-yellow-500" },
  { value: "bg-red-500", label: "Vermelho", className: "bg-red-500" },
  { value: "bg-orange-500", label: "Laranja", className: "bg-orange-500" },
  { value: "bg-pink-500", label: "Rosa", className: "bg-pink-500" },
  { value: "bg-teal-500", label: "Turquesa", className: "bg-teal-500" },
];

const DURATION_OPTIONS = [
  { value: 15, label: "15 minutos" },
  { value: 30, label: "30 minutos" },
  { value: 45, label: "45 minutos" },
  { value: 60, label: "1 hora" },
  { value: 90, label: "1h 30min" },
  { value: 120, label: "2 horas" },
];

export function AppointmentTypesCard() {
  const { types, isLoading, isSaving, createType, updateType, deleteType } = useAppointmentTypes();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<AppointmentType | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<AppointmentTypeFormData>({
    name: "",
    description: "",
    color: "bg-blue-500",
    duration_minutes: 30,
    is_active: true,
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      color: "bg-blue-500",
      duration_minutes: 30,
      is_active: true,
    });
    setEditingType(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (type: AppointmentType) => {
    setEditingType(type);
    setFormData({
      name: type.name,
      description: type.description || "",
      color: type.color,
      duration_minutes: type.duration_minutes,
      is_active: type.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) return;

    if (editingType) {
      const success = await updateType(editingType.id, formData);
      if (success) {
        setIsDialogOpen(false);
        resetForm();
      }
    } else {
      const result = await createType(formData);
      if (result) {
        setIsDialogOpen(false);
        resetForm();
      }
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    await deleteType(deleteConfirmId);
    setDeleteConfirmId(null);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tipos de Atendimento</CardTitle>
          <CardDescription>Categorias de atendimento disponíveis</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
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
            <CardTitle>Tipos de Atendimento</CardTitle>
            <CardDescription>Categorias de atendimento disponíveis</CardDescription>
          </div>
          <Button size="sm" variant="outline" onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar
          </Button>
        </CardHeader>
        <CardContent>
          {types.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhum tipo de atendimento cadastrado.
            </p>
          ) : (
            <div className="space-y-3">
              {types.map((type) => (
                <div
                  key={type.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${type.color}`} />
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        {type.name}
                        {!type.is_active && (
                          <span className="text-xs text-muted-foreground">(inativo)</span>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {type.description || "Sem descrição"} • {type.duration_minutes} min
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(type)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => setDeleteConfirmId(type.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingType ? "Editar Tipo de Atendimento" : "Novo Tipo de Atendimento"}
            </DialogTitle>
            <DialogDescription>
              {editingType ? "Edite as informações do tipo de atendimento" : "Adicione um novo tipo de atendimento"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="type_name">Nome *</Label>
              <Input
                id="type_name"
                placeholder="Ex: Avaliação"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="type_description">Descrição</Label>
              <Input
                id="type_description"
                placeholder="Descrição do tipo"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="type_duration">Duração</Label>
              <Select
                value={String(formData.duration_minutes)}
                onValueChange={(v) => setFormData({ ...formData, duration_minutes: Number(v) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a duração" />
                </SelectTrigger>
                <SelectContent>
                  {DURATION_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={String(option.value)}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="type_color">Cor</Label>
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
            {editingType && (
              <div className="flex items-center justify-between">
                <Label htmlFor="type_active">Ativo</Label>
                <Switch
                  id="type_active"
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
              {editingType ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir tipo de atendimento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O tipo de atendimento será removido permanentemente.
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
