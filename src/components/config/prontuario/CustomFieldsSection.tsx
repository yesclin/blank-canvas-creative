import { useState } from 'react';
import { Plus, Edit, Trash2, Power, PowerOff, GripVertical, Info, Globe, Stethoscope, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useCustomProntuarioFields, type CustomProntuarioField } from '@/hooks/prontuario/useCustomProntuarioFields';
import { usePermissions } from '@/hooks/usePermissions';
import { CustomFieldDialog } from './CustomFieldDialog';

const FIELD_TYPE_LABELS: Record<string, string> = {
  text: 'Texto curto',
  textarea: 'Texto longo',
  number: 'Número',
  date: 'Data',
  select: 'Lista de opções',
  checkbox: 'Checkbox',
  multiselect: 'Seleção múltipla',
};

const FIELD_TYPE_COLORS: Record<string, string> = {
  text: 'bg-blue-100 text-blue-800',
  textarea: 'bg-green-100 text-green-800',
  number: 'bg-purple-100 text-purple-800',
  date: 'bg-amber-100 text-amber-800',
  select: 'bg-cyan-100 text-cyan-800',
  checkbox: 'bg-pink-100 text-pink-800',
  multiselect: 'bg-indigo-100 text-indigo-800',
};

export function CustomFieldsSection({ specialtyId }: { specialtyId?: string | null }) {
  const { fields, loading, saving, remove, toggleActive } = useCustomProntuarioFields();
  const { isOwner } = usePermissions();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CustomProntuarioField | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [toDelete, setToDelete] = useState<CustomProntuarioField | null>(null);

  const canManage = isOwner;

  const handleEdit = (field: CustomProntuarioField) => {
    setEditing(field);
    setDialogOpen(true);
  };

  const handleDelete = (field: CustomProntuarioField) => {
    setToDelete(field);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (toDelete) {
      await remove(toDelete.id);
      setDeleteOpen(false);
      setToDelete(null);
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditing(null);
  };

  const getAssociationBadge = (field: CustomProntuarioField) => {
    if (field.all_appointments) {
      return (
        <Badge variant="outline" className="text-xs flex items-center gap-1">
          <Globe className="h-3 w-3" />
          Todos
        </Badge>
      );
    }
    if (field.specialty_name) {
      return (
        <Badge variant="outline" className="text-xs flex items-center gap-1">
          <Stethoscope className="h-3 w-3" />
          {field.specialty_name}
        </Badge>
      );
    }
    if (field.procedure_name) {
      return (
        <Badge variant="outline" className="text-xs flex items-center gap-1">
          <FileText className="h-3 w-3" />
          {field.procedure_name}
        </Badge>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Campos Personalizados</CardTitle>
              <CardDescription>
                Crie campos customizados para capturar dados específicos da sua clínica
              </CardDescription>
            </div>
            {canManage && (
              <Button onClick={() => setDialogOpen(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Novo Campo
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {fields.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Info className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">Nenhum campo personalizado</p>
              <p className="text-sm mt-1">
                Crie campos customizados para capturar dados específicos durante os atendimentos
              </p>
              {canManage && (
                <Button onClick={() => setDialogOpen(true)} variant="outline" className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Criar primeiro campo
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {fields.map((field) => (
                <div
                  key={field.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                    field.is_active ? 'bg-card' : 'bg-muted/50 opacity-60'
                  }`}
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{field.name}</span>
                      {field.is_required && (
                        <Badge variant="destructive" className="text-[10px] px-1 py-0">
                          Obrigatório
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={`text-[10px] ${FIELD_TYPE_COLORS[field.field_type]}`}>
                        {FIELD_TYPE_LABELS[field.field_type]}
                      </Badge>
                      {getAssociationBadge(field)}
                      {field.description && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Info className="h-3 w-3 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">{field.description}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </div>

                  {canManage && (
                    <div className="flex items-center gap-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div>
                              <Switch
                                checked={field.is_active}
                                onCheckedChange={(checked) => toggleActive(field.id, checked)}
                                disabled={saving}
                              />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            {field.is_active ? 'Desativar' : 'Ativar'}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(field)}
                        disabled={saving}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(field)}
                        disabled={saving}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {!canManage && fields.length > 0 && (
            <p className="text-xs text-muted-foreground mt-4 text-center">
              Apenas o proprietário pode gerenciar campos personalizados
            </p>
          )}
        </CardContent>
      </Card>

      <CustomFieldDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        editing={editing}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir campo personalizado?</AlertDialogTitle>
            <AlertDialogDescription>
              O campo "{toDelete?.name}" será excluído permanentemente. 
              Os dados já registrados com este campo serão mantidos, mas não poderão mais ser editados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
