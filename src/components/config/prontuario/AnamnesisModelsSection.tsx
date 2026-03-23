import { useState, useEffect } from 'react';
import {
  Plus, FileText, Copy, Star, Power, PowerOff, ChevronDown,
  AlertTriangle, Lock, ClipboardList, Stethoscope, Syringe, History,
  Clock, Sparkles, Edit3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useClinicData } from '@/hooks/useClinicData';
import { useAnamnesisModels, type AnamnesisModel, type AnamnesisModelVersion } from '@/hooks/prontuario/useAnamnesisModels';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { NewAnamnesisModelDialog, generateStructureFromConfig, type CreateModelConfig } from './NewAnamnesisModelDialog';
import { getDefaultAnamnesisStructure } from '@/constants/defaultAnamnesisStructures';
import { toast } from 'sonner';
import { AnamnesisModelEditorDialog } from './AnamnesisModelEditorDialog';

interface Props {
  specialtyId?: string | null;
  /** Action triggered via deep-link from Prontuário: 'create' opens dialog, 'create_default' creates YesClin default */
  initialAction?: 'create' | 'create_default' | null;
  /** Called after a model is successfully created (used to navigate back to Prontuário) */
  onModelCreated?: () => void;
}

export function AnamnesisModelsSection({ specialtyId, initialAction, onModelCreated }: Props) {
  const { clinic } = useClinicData();
  const {
    models, loading, saving, createModel, updateModel, duplicateModel,
    setAsDefault, toggleActive, fetchVersionHistory,
  } = useAnamnesisModels(specialtyId || null);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<AnamnesisModel | null>(null);
  const [procedures, setProcedures] = useState<{ id: string; name: string }[]>([]);

  // Version history state
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [historyModelName, setHistoryModelName] = useState('');
  const [versions, setVersions] = useState<AnamnesisModelVersion[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);

  // Load procedures for this clinic
  useEffect(() => {
    if (!clinic?.id) return;
    supabase
      .from('procedures')
      .select('id, name')
      .eq('clinic_id', clinic.id)
      .eq('is_active', true)
      .order('name')
      .then(({ data }) => setProcedures(data || []));
  }, [clinic?.id]);

  // Handle deep-link actions from Prontuário
  const [actionHandled, setActionHandled] = useState(false);
  useEffect(() => {
    if (actionHandled || !initialAction || !specialtyId || loading) return;
    setActionHandled(true);
    if (initialAction === 'create') {
      setCreateDialogOpen(true);
    }
    if (initialAction === 'create_default') {
      (async () => {
        const name = `Anamnese Padrão (YesClin)`;
        await createModel({
          name,
          description: 'Modelo padrão criado automaticamente pelo YesClin',
          procedure_id: null,
        });
        onModelCreated?.();
      })();
    }
  }, [initialAction, specialtyId, loading, actionHandled]);

  // Auto-provision default model when list is empty after loading
  const [autoProvisionAttempted, setAutoProvisionAttempted] = useState(false);
  useEffect(() => {
    if (loading || !specialtyId || !clinic?.id || autoProvisionAttempted || models.length > 0 || saving) return;
    setAutoProvisionAttempted(true);
    handleProvisionDefault();
  }, [loading, specialtyId, clinic?.id, models.length, autoProvisionAttempted, saving]);

  // Reset auto-provision flag when specialty changes
  useEffect(() => {
    setAutoProvisionAttempted(false);
  }, [specialtyId]);

  const openHistory = async (m: AnamnesisModel) => {
    setHistoryModelName(m.name);
    setHistoryDialogOpen(true);
    setLoadingVersions(true);
    const data = await fetchVersionHistory(m.id);
    setVersions(data);
    setLoadingVersions(false);
  };

  const handleCreateModel = async (config: CreateModelConfig) => {
    const structure = generateStructureFromConfig(config);
    const result = await createModel({
      name: config.name,
      description: config.description,
      procedure_id: config.procedureId,
    });
    if (result) {
      // Update model with structure (creates version with content)
      await updateModel(result.id, {
        campos: structure as any,
      });
      // Apply settings
      if (config.settings.padrao) {
        await setAsDefault(result.id);
      }
      if (!config.settings.ativo) {
        await toggleActive(result.id, false);
      }
    }
    onModelCreated?.();
  };

  const handleProvisionDefault = async () => {
    if (!specialtyId) return;
    // Try to detect specialty slug from enabled specialties
    const defaultStructure = getDefaultAnamnesisStructure('clinica-geral');
    const structure = defaultStructure.length > 0 ? defaultStructure : getDefaultAnamnesisStructure('geral');

    const result = await createModel({
      name: 'Anamnese Padrão – Clínica Geral (YesClin)',
      description: 'Modelo padrão completo com 10 seções clínicas estruturadas. Editável e versionado.',
      procedure_id: null,
    });
    if (result) {
      await updateModel(result.id, { campos: structure as any });
      await setAsDefault(result.id);
      toast.success('Modelo padrão YesClin criado com sucesso!');
    }
  };

  if (!specialtyId) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <AlertTriangle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Selecione uma especialidade para gerenciar modelos de anamnese.</p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Modelos de Anamnese
              </CardTitle>
              <CardDescription>
                Gerencie modelos de anamnese vinculados a esta especialidade ou procedimento específico.
                {models.length > 0 && (
                  <span className="ml-1 font-medium">{models.filter(m => m.is_active).length} ativo(s) de {models.length}</span>
                )}
              </CardDescription>
            </div>
            <Button onClick={() => setCreateDialogOpen(true)} disabled={saving}>
              <Plus className="h-4 w-4 mr-2" />Novo Modelo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {models.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-1">Nenhum modelo de anamnese encontrado.</p>
              <p className="text-sm text-muted-foreground mb-4">Crie um modelo ou gere o padrão YesClin automaticamente.</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button
                  variant="default"
                  disabled={saving}
                  onClick={handleProvisionDefault}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Criar modelo padrão YesClin
                </Button>
                <Button
                  variant="outline"
                  disabled={saving}
                  onClick={() => setCreateDialogOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Criar do zero
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {models.map(m => (
                <div
                  key={m.id}
                  className={`flex items-center gap-4 p-4 rounded-lg border transition-all ${
                    !m.is_active ? 'opacity-60 bg-muted/30' : 'hover:bg-muted/50'
                  }`}
                >
                  <div className="p-2 rounded-md bg-primary/10 shrink-0">
                    <ClipboardList className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="font-medium truncate">{m.name}</span>
                      {m.is_default && (
                        <Badge variant="outline" className="text-xs">
                          <Star className="h-3 w-3 mr-1 fill-current" />Padrão
                        </Badge>
                      )}
                      {m.is_system && (
                        <Badge variant="secondary" className="text-xs">
                          <Lock className="h-3 w-3 mr-1" />Sistema
                        </Badge>
                      )}
                      {!m.is_active && <Badge variant="destructive" className="text-xs">Inativo</Badge>}
                      {m.current_version_number && (
                        <Badge variant="secondary" className="text-xs font-mono">
                          v{m.current_version_number}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {m.description && <span className="truncate max-w-[200px]">{m.description}</span>}
                      {m.procedure_name ? (
                        <Badge variant="outline" className="text-xs">
                          <Syringe className="h-3 w-3 mr-1" />{m.procedure_name}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          <Stethoscope className="h-3 w-3 mr-1" />Especialidade inteira
                        </Badge>
                      )}
                      {m.usage_count > 0 && (
                        <span>{m.usage_count} uso(s)</span>
                      )}
                    </div>
                  </div>
                  {/* Primary Edit button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { setEditingModel(m); setEditorOpen(true); }}
                    disabled={saving}
                  >
                    <Edit3 className="h-4 w-4 mr-1" />Editar
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm"><ChevronDown className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => duplicateModel(m.id)} disabled={saving}>
                        <Copy className="h-4 w-4 mr-2" />Duplicar
                      </DropdownMenuItem>
                      {!m.is_default && (
                        <DropdownMenuItem onClick={() => setAsDefault(m.id)} disabled={saving}>
                          <Star className="h-4 w-4 mr-2" />Definir como Padrão
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => openHistory(m)}>
                        <History className="h-4 w-4 mr-2" />Histórico de Versões
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => toggleActive(m.id, !m.is_active)} disabled={saving}>
                        {m.is_active ? (
                          <><PowerOff className="h-4 w-4 mr-2" />Desativar</>
                        ) : (
                          <><Power className="h-4 w-4 mr-2" />Ativar</>
                        )}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}

              <div className="p-3 rounded-md bg-muted/50 text-xs text-muted-foreground">
                <strong>Resolução:</strong> Se existir modelo vinculado ao procedimento → será usado. Caso contrário → modelo padrão da especialidade.
              </div>
              <div className="p-3 rounded-md bg-muted/50 text-xs text-muted-foreground">
                <strong>Versionamento:</strong> Cada edição de estrutura cria uma nova versão. Atendimentos anteriores permanecem vinculados à versão original — nunca são sobrescritos.
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* New Advanced Create Dialog */}
      <NewAnamnesisModelDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        specialtyId={specialtyId}
        procedures={procedures}
        saving={saving}
        onCreateModel={handleCreateModel}
      />

      {/* Editor Dialog */}
      <AnamnesisModelEditorDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        model={editingModel}
        onSave={async (id, data) => {
          const result = await updateModel(id, data);
          return !!result;
        }}
        saving={saving}
      />

      {/* Version History Dialog */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Histórico de Versões
            </DialogTitle>
            <DialogDescription>
              Versões do modelo "{historyModelName}". Atendimentos antigos permanecem vinculados à versão em que foram preenchidos.
            </DialogDescription>
          </DialogHeader>

          {loadingVersions ? (
            <div className="space-y-3 py-4">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : versions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhuma versão registrada ainda.</p>
            </div>
          ) : (
            <ScrollArea className="max-h-[400px]">
              <div className="space-y-2 pr-3">
                {versions.map((v, idx) => {
                  const isLatest = idx === 0;
                  const fieldCount = Array.isArray(v.structure) ? (v.structure as any[]).length : 0;

                  return (
                    <div
                      key={v.id}
                      className={`p-3 rounded-lg border ${isLatest ? 'border-primary/30 bg-primary/5' : 'bg-muted/30'}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={isLatest ? 'default' : 'secondary'} className="text-xs font-mono">
                            v{v.version_number}
                          </Badge>
                          {isLatest && (
                            <Badge variant="outline" className="text-xs">Atual</Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {fieldCount} seção(ões)
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(v.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setHistoryDialogOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
