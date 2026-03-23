import { useState, useEffect } from 'react';
import { GripVertical, Eye, EyeOff, Plus, Save, RotateCcw, LayoutDashboard, FileText, Activity, Stethoscope, Pill, Image, FolderOpen, History, Heart, ClipboardList, Target, Paperclip, Smile, Crosshair, Camera, Pencil, Trash2, User, AlertTriangle, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSpecialtyTabs, type SpecialtyTab } from '@/hooks/prontuario/useSpecialtyTabs';
import { TabFieldsBuilder } from './TabFieldsBuilder';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard, FileText, Activity, Stethoscope, Pill, Image, FolderOpen, History, Heart, ClipboardList, Target, Paperclip, Smile, Crosshair, Camera, User,
};

const ICON_OPTIONS = [
  { value: 'User', label: 'Pessoa' },
  { value: 'FileText', label: 'Documento' },
  { value: 'Activity', label: 'Atividade' },
  { value: 'Stethoscope', label: 'Estetoscópio' },
  { value: 'Pill', label: 'Medicamento' },
  { value: 'Heart', label: 'Coração' },
  { value: 'ClipboardList', label: 'Lista' },
  { value: 'Target', label: 'Alvo' },
  { value: 'Paperclip', label: 'Anexo' },
  { value: 'Image', label: 'Imagem' },
  { value: 'History', label: 'Histórico' },
  { value: 'LayoutDashboard', label: 'Dashboard' },
  { value: 'Camera', label: 'Câmera' },
  { value: 'Smile', label: 'Sorriso' },
];

export function TabsSection({ specialtyId }: { specialtyId?: string | null }) {
  const {
    tabs, loading, saving, initializeDefaults,
    createTab, updateTab, removeTab, toggleActive, reorder,
    hasNoSpecialty,
  } = useSpecialtyTabs(specialtyId);

  const [localTabs, setLocalTabs] = useState<SpecialtyTab[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [expandedTabId, setExpandedTabId] = useState<string | null>(null);

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTab, setEditingTab] = useState<SpecialtyTab | null>(null);
  const [tabName, setTabName] = useState('');
  const [tabIcon, setTabIcon] = useState('FileText');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [toDelete, setToDelete] = useState<SpecialtyTab | null>(null);

  useEffect(() => {
    if (!loading && tabs.length > 0) {
      setLocalTabs(tabs);
      setHasChanges(false);
    } else if (!loading && tabs.length === 0) {
      setLocalTabs([]);
    }
  }, [loading, tabs]);

  const handleToggle = (id: string, current: boolean) => {
    setLocalTabs(prev => prev.map(t => t.id === id ? { ...t, is_active: !current } : t));
    setHasChanges(true);
  };

  const handleDragStart = (idx: number) => setDragIdx(idx);

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) return;
    const newTabs = [...localTabs];
    const [dragged] = newTabs.splice(dragIdx, 1);
    newTabs.splice(idx, 0, dragged);
    setLocalTabs(newTabs.map((t, i) => ({ ...t, display_order: i + 1 })));
    setDragIdx(idx);
    setHasChanges(true);
  };

  const handleDragEnd = () => setDragIdx(null);

  const handleSave = async () => {
    const reorderData = localTabs.map(t => ({ id: t.id, display_order: t.display_order }));
    await reorder(reorderData);

    for (const local of localTabs) {
      const orig = tabs.find(t => t.id === local.id);
      if (orig && orig.is_active !== local.is_active) {
        await toggleActive(local.id, local.is_active);
      }
    }
    setHasChanges(false);
  };

  const handleReset = () => {
    setLocalTabs(tabs);
    setHasChanges(false);
  };

  const openCreate = () => {
    setEditingTab(null);
    setTabName('');
    setTabIcon('FileText');
    setDialogOpen(true);
  };

  const openEdit = (tab: SpecialtyTab) => {
    setEditingTab(tab);
    setTabName(tab.name);
    setTabIcon(tab.icon || 'FileText');
    setDialogOpen(true);
  };

  const handleDialogSubmit = async () => {
    if (!tabName.trim()) return;
    if (editingTab) {
      await updateTab(editingTab.id, { name: tabName.trim(), icon: tabIcon });
    } else {
      const key = tabName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');
      await createTab({ name: tabName.trim(), key, icon: tabIcon });
    }
    setDialogOpen(false);
  };

  const confirmDelete = async () => {
    if (toDelete) {
      await removeTab(toDelete.id);
      setDeleteOpen(false);
      setToDelete(null);
    }
  };

  const getIcon = (name: string | null) => ICON_MAP[name || ''] || LayoutDashboard;

  if (hasNoSpecialty) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <AlertTriangle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Selecione uma especialidade para configurar as abas.</p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-14 w-full" />)}
        </CardContent>
      </Card>
    );
  }

  if (tabs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Abas do Prontuário</CardTitle>
          <CardDescription>Configure quais abas aparecem no prontuário desta especialidade</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-12">
          <p className="text-muted-foreground mb-2">Nenhuma aba configurada para esta especialidade.</p>
          <p className="text-sm text-muted-foreground mb-6">
            Clique abaixo para criar as abas padrão sugeridas: Identificação, Anamnese, Evolução, Procedimentos e Documentos.
          </p>
          <Button onClick={initializeDefaults} disabled={saving}>
            <Plus className="h-4 w-4 mr-2" />
            Criar Abas Padrão
          </Button>
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
              <CardTitle>Abas do Prontuário</CardTitle>
              <CardDescription>Arraste para reordenar. Crie, edite ou desative abas.</CardDescription>
            </div>
            <div className="flex gap-2">
              {hasChanges && (
                <>
                  <Button variant="outline" size="sm" onClick={handleReset}>
                    <RotateCcw className="h-4 w-4 mr-2" />Desfazer
                  </Button>
                  <Button size="sm" onClick={handleSave} disabled={saving}>
                    <Save className="h-4 w-4 mr-2" />{saving ? 'Salvando...' : 'Salvar'}
                  </Button>
                </>
              )}
              <Button size="sm" variant="outline" onClick={openCreate}>
                <Plus className="h-4 w-4 mr-2" />Nova Aba
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {localTabs.map((tab, idx) => {
            const Icon = getIcon(tab.icon);
            const isExpanded = expandedTabId === tab.id;
            return (
              <div key={tab.id} className="space-y-0">
                <div
                  draggable
                  onDragStart={() => handleDragStart(idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDragEnd={handleDragEnd}
                  className={`flex items-center gap-4 p-4 rounded-lg border cursor-move transition-all ${
                    dragIdx === idx ? 'opacity-50 border-primary' : 'hover:bg-muted/50'
                  } ${!tab.is_active ? 'opacity-60 bg-muted/30' : 'bg-card'} ${isExpanded ? 'rounded-b-none border-b-0' : ''}`}
                >
                  <GripVertical className="h-5 w-5 text-muted-foreground" />
                  <div className={`p-2 rounded-md ${tab.is_active ? 'bg-primary/10' : 'bg-muted'}`}>
                    <Icon className={`h-4 w-4 ${tab.is_active ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setExpandedTabId(isExpanded ? null : tab.id)}>
                    <p className="font-medium">{tab.name}</p>
                    <p className="text-xs text-muted-foreground">Clique para gerenciar campos</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {tab.is_system && <Badge variant="secondary" className="text-xs">Padrão</Badge>}
                    <div className="flex items-center gap-2">
                      {tab.is_active ? <Eye className="h-4 w-4 text-green-600" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                      <Switch
                        checked={tab.is_active}
                        onCheckedChange={() => handleToggle(tab.id, tab.is_active)}
                      />
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(tab)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {!tab.is_system && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => { setToDelete(tab); setDeleteOpen(true); }}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => setExpandedTabId(isExpanded ? null : tab.id)}>
                      {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                {isExpanded && specialtyId && (
                  <div className="border border-t-0 rounded-b-lg p-4 bg-muted/10">
                    <TabFieldsBuilder tabId={tab.id} tabName={tab.name} specialtyId={specialtyId} />
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTab ? 'Editar Aba' : 'Nova Aba'}</DialogTitle>
            <DialogDescription>
              {editingTab ? 'Altere o nome ou ícone da aba.' : 'Defina o nome e ícone para a nova aba.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome da Aba</Label>
              <Input
                value={tabName}
                onChange={(e) => setTabName(e.target.value)}
                placeholder="Ex: Exames Complementares"
              />
            </div>
            <div>
              <Label>Ícone</Label>
              <Select value={tabIcon} onValueChange={setTabIcon}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ICON_OPTIONS.map(opt => {
                    const Ic = ICON_MAP[opt.value] || LayoutDashboard;
                    return (
                      <SelectItem key={opt.value} value={opt.value}>
                        <span className="flex items-center gap-2">
                          <Ic className="h-4 w-4" />
                          {opt.label}
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleDialogSubmit} disabled={!tabName.trim() || saving}>
              {saving ? 'Salvando...' : editingTab ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir aba?</AlertDialogTitle>
            <AlertDialogDescription>
              A aba "{toDelete?.name}" será excluída permanentemente. Esta ação não pode ser desfeita.
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
