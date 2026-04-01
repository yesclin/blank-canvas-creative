import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
  Plus, Edit2, Trash2, Filter, Loader2,
  CalendarCheck, UserX, Cake, Users, Clock,
} from "lucide-react";
import { usePatientSegments, type SegmentFilters, type SavedSegment } from "@/hooks/usePatientSegments";

const PRESET_SEGMENTS: Array<{ name: string; description: string; icon: React.ElementType; filters: SegmentFilters }> = [
  { name: "Consultas de amanhã", description: "Pacientes com consulta agendada para amanhã", icon: CalendarCheck, filters: { type: 'tomorrow' } },
  { name: "Sem retorno há 30 dias", description: "Pacientes sem consulta nos últimos 30 dias", icon: Clock, filters: { type: 'no_return_30' } },
  { name: "Sem retorno há 60 dias", description: "Pacientes sem consulta nos últimos 60 dias", icon: Clock, filters: { type: 'no_return_60' } },
  { name: "Sem retorno há 90 dias", description: "Pacientes sem consulta nos últimos 90 dias", icon: Clock, filters: { type: 'no_return_90' } },
  { name: "Faltantes (30 dias)", description: "Pacientes que faltaram nos últimos 30 dias", icon: UserX, filters: { type: 'missed' } },
  { name: "Aniversariantes do mês", description: "Pacientes com aniversário neste mês", icon: Cake, filters: { type: 'birthday' } },
];

export default function MarketingSegmentacoes() {
  const { segments, loading, saving, createSegment, updateSegment, deleteSegment } = usePatientSegments();
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingSegment, setEditingSegment] = useState<SavedSegment | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SavedSegment | null>(null);
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");

  const handleOpenCreate = (preset?: typeof PRESET_SEGMENTS[0]) => {
    setEditingSegment(null);
    setFormName(preset?.name || "");
    setFormDescription(preset?.description || "");
    setFormOpen(true);
  };

  const handleOpenEdit = (seg: SavedSegment) => {
    setEditingSegment(seg);
    setFormName(seg.name);
    setFormDescription(seg.description || "");
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) return;
    if (editingSegment) {
      await updateSegment(editingSegment.id, formName, formDescription, editingSegment.filters);
    } else {
      await createSegment(formName, formDescription, {});
    }
    setFormOpen(false);
  };

  const handleSavePreset = async (preset: typeof PRESET_SEGMENTS[0]) => {
    await createSegment(preset.name, preset.description, preset.filters);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteSegment(deleteTarget.id);
    setDeleteOpen(false);
    setDeleteTarget(null);
  };

  if (loading) {
    return <Skeleton className="h-64 w-full" />;
  }

  return (
    <div className="space-y-6">
      {/* Preset Segments */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Segmentações Pré-definidas</CardTitle>
          <p className="text-sm text-muted-foreground">Clique para salvar como segmentação reutilizável</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {PRESET_SEGMENTS.map((preset) => {
              const Icon = preset.icon;
              const alreadySaved = segments.some((s) => s.name === preset.name);
              return (
                <button
                  key={preset.name}
                  onClick={() => !alreadySaved && handleSavePreset(preset)}
                  disabled={alreadySaved || saving}
                  className={`p-4 rounded-lg border text-left transition-all ${
                    alreadySaved
                      ? 'opacity-50 cursor-default bg-muted/30'
                      : 'hover:border-primary/50 hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">{preset.name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{preset.description}</p>
                  {alreadySaved && <Badge variant="secondary" className="text-xs mt-2">Já salva</Badge>}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Saved Segments */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Segmentações Salvas</CardTitle>
            <Button size="sm" onClick={() => handleOpenCreate()} className="gap-1">
              <Plus className="h-4 w-4" /> Nova
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {segments.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <Filter className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhuma segmentação salva</p>
              <p className="text-xs">Salve filtros pré-definidos acima ou crie uma nova</p>
            </div>
          ) : (
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {segments.map((seg) => (
                  <div key={seg.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30 transition-colors">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{seg.name}</p>
                      {seg.description && <p className="text-xs text-muted-foreground mt-0.5">{seg.description}</p>}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleOpenEdit(seg)}>
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                        onClick={() => { setDeleteTarget(seg); setDeleteOpen(true); }}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSegment ? 'Editar Segmentação' : 'Nova Segmentação'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome</Label>
              <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Nome da segmentação" />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Descrição" rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving || !formName.trim()}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir segmentação?</AlertDialogTitle>
            <AlertDialogDescription>
              A segmentação "{deleteTarget?.name}" será excluída permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
