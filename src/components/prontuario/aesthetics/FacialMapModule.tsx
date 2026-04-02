import { useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
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
  Download, 
  History,
  Save,
  FileText,
  RotateCcw,
  AlertCircle,
  Syringe,
  Droplets,
  Sparkles,
  Plus,
  CheckCircle2,
  Clock,
  Unlock,
  Copy,
} from "lucide-react";
import { FacialMapSVG } from "./FacialMapSVG";
import { MuscleList } from "./MuscleList";
import { ApplicationPointDialog } from "./ApplicationPointDialog";
import { SessionHistoryPanel } from "./SessionHistoryPanel";
import { useFacialMap } from "@/hooks/aesthetics";
import { useFacialMapPdf } from "./useFacialMapPdf";
import type { FacialMapApplication, ViewType, ProcedureType } from "./types";
import { VIEW_TYPE_LABELS, COMMON_PRODUCTS, getDefaultUnit, getRegionsForProcedure } from "./types";
import facialMapToxinaFrontal from "@/assets/facial-map-toxina-frontal.png";
import facialMapToxinaLateralEsquerda from "@/assets/facial-map-toxina-lateral-esquerda.png";
import facialMapToxinaLateralDireita from "@/assets/facial-map-toxina-lateral-direita.png";
import facialMapFillerFrontal from "@/assets/facial-map-filler-frontal.png";
import facialMapFillerLeftLateral from "@/assets/facial-map-filler-left-lateral.png";
import facialMapFillerRightLateral from "@/assets/facial-map-filler-right-lateral.png";
import facialMapBiostimulatorFrontal from "@/assets/facial-map-biostimulator-frontal.png";
import facialMapBiostimulatorRightLateral from "@/assets/facial-map-biostimulator-right-lateral.png";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface FacialMapModuleProps {
  patientId: string;
  patientName?: string;
  appointmentId?: string | null;
  canEdit?: boolean;
  professionalId?: string | null;
  specialtyKey?: string;
  procedureType?: ProcedureType;
}

const PROCEDURE_CONFIG = {
  toxin: { label: 'Toxina', icon: Syringe, color: 'bg-destructive/10 text-destructive border-destructive/20' },
  filler: { label: 'Preenchimento', icon: Droplets, color: 'bg-primary/10 text-primary border-primary/20' },
  biostimulator: { label: 'Bioestimulador', icon: Sparkles, color: 'bg-accent/10 text-accent-foreground border-accent/20' },
} as const;
 
export function FacialMapModule({ 
  patientId, 
  patientName,
  appointmentId,
  canEdit = false,
  professionalId,
  specialtyKey = 'estetica',
  procedureType: activeProcedureType = 'toxin',
}: FacialMapModuleProps) {
   const [viewType, setViewType] = useState<ViewType>('frontal');
   const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
   const [selectedPoint, setSelectedPoint] = useState<FacialMapApplication | null>(null);
   const [activeProcedure, setActiveProcedure] = useState<ProcedureType>(activeProcedureType);
   const [newPointPosition, setNewPointPosition] = useState<{ x: number; y: number } | null>(null);
   const [dialogOpen, setDialogOpen] = useState(false);
   const [showHistory, setShowHistory] = useState(false);
   const [notesValue, setNotesValue] = useState('');
   const [editingNotes, setEditingNotes] = useState(false);
   const [viewingHistoryMapId, setViewingHistoryMapId] = useState<string | null>(null);
   const [historyApplications, setHistoryApplications] = useState<FacialMapApplication[]>([]);
   
   // Confirmation dialog states
   const [confirmAction, setConfirmAction] = useState<'conclude' | 'create' | 'reopen' | null>(null);
   const [duplicateConfirmMapId, setDuplicateConfirmMapId] = useState<string | null>(null);
 
   const { 
     facialMap,
     applications, 
     allApplications,
     allMaps,
     isLoading, 
     addApplication,
     updateApplication,
     deleteApplication,
     updateMapNotes,
      createMap,
      forceCreateNewSession,
     concludeSession,
     isConcluding,
     duplicateSession,
     isDuplicating,
     reopenSession,
     isReopening,
     loadMapApplications,
     currentMapId,
     setCurrentMapId,
   } = useFacialMap(patientId, showHistory ? null : appointmentId, {
     professionalId: professionalId || null,
     specialtyKey,
     canEditRecords: canEdit,
   });

  // === CORE FILTERING ===
  const displayApplications = useMemo(() => {
    if (viewingHistoryMapId) {
      return historyApplications.filter(a => a.procedure_type === activeProcedure);
    }
    if (showHistory) {
      return allApplications.filter(a => a.procedure_type === activeProcedure);
    }
    return applications.filter(a => a.procedure_type === activeProcedure);
  }, [showHistory, viewingHistoryMapId, historyApplications, allApplications, applications, activeProcedure]);

  const isViewingHistory = !!viewingHistoryMapId;
  const isSessionConcluded = facialMap?.status === 'concluded';
  const canEditPoints = canEdit && !isViewingHistory && !isSessionConcluded && !showHistory;
  const isEditing = canEditPoints && selectedMuscle !== null;
  const sourceSessionId = facialMap?.source_session_id;

  const { generatePdf } = useFacialMapPdf({
    patientName,
    patientId,
    facialMap,
    applications: displayApplications,
  });
 
  const currentTotal = useMemo(() => {
    return displayApplications.reduce((sum, app) => sum + app.quantity, 0);
  }, [displayApplications]);

  const regionTotals = useMemo(() => {
    const regions = getRegionsForProcedure(activeProcedure);
    const map = new Map<string, { name: string; total: number; count: number }>();
    for (const app of displayApplications) {
      const regionInfo = regions.find(r => r.id === app.muscle);
      const key = app.muscle || 'other';
      const existing = map.get(key) || { name: regionInfo?.name || app.muscle || 'Outro', total: 0, count: 0 };
      existing.total += app.quantity;
      existing.count += 1;
      map.set(key, existing);
    }
    return Array.from(map.entries()).map(([id, data]) => ({ id, ...data }));
  }, [displayApplications, activeProcedure]);

  const unitLabel = getDefaultUnit(activeProcedure);
  const procConfig = PROCEDURE_CONFIG[activeProcedure];
  const ProcIcon = procConfig.icon;
 
   const handleMapClick = (x: number, y: number) => {
     if (!canEditPoints) return;
     if (!selectedMuscle) {
       toast.info(`Selecione ${activeProcedure === 'toxin' ? 'um músculo' : 'uma região'} antes de marcar o ponto.`);
       return;
     }
     if (!Number.isFinite(x) || !Number.isFinite(y) || x < 0 || x > 100 || y < 0 || y > 100) {
       return;
     }
     setNewPointPosition({ x, y });
     setSelectedPoint(null);
     setDialogOpen(true);
   };
 
   const handlePointClick = (point: FacialMapApplication) => {
     if (isViewingHistory || showHistory) return;
     setSelectedPoint(point);
     setNewPointPosition(null);
     setDialogOpen(true);
   };
 
   const handleSavePoint = async (data: Partial<FacialMapApplication>) => {
     try {
       if (selectedPoint) {
         await updateApplication({ id: selectedPoint.id, data });
       } else if (newPointPosition) {
         await addApplication({
           ...data,
           procedure_type: activeProcedure,
           position_x: newPointPosition.x,
           position_y: newPointPosition.y,
           view_type: viewType,
           muscle: selectedMuscle || data.muscle,
         });
       }
     } catch (err) {
       console.error('handleSavePoint failed:', err);
     } finally {
       setSelectedPoint(null);
       setNewPointPosition(null);
     }
   };
 
   const handleDeletePoint = async () => {
     if (selectedPoint) {
       await deleteApplication(selectedPoint.id);
       setSelectedPoint(null);
       setDialogOpen(false);
     }
   };
 
   const handleEditNotes = () => {
     setNotesValue(facialMap?.general_notes || '');
     setEditingNotes(true);
   };
 
   const handleSaveNotes = async () => {
     await updateMapNotes(notesValue);
     setEditingNotes(false);
   };

   const handleProcedureChange = (proc: ProcedureType) => {
     setActiveProcedure(proc);
     setSelectedMuscle(null);
   };

   // Actions with confirmation
   const handleConfirmedAction = async () => {
     try {
       if (confirmAction === 'conclude') {
         await concludeSession();
        } else if (confirmAction === 'create') {
          await forceCreateNewSession('general');
       } else if (confirmAction === 'reopen') {
         await reopenSession();
       }
     } catch (err) {
       console.error(`${confirmAction} failed:`, err);
     }
     setConfirmAction(null);
   };

   const handleConfirmedDuplicate = async () => {
     if (!duplicateConfirmMapId) return;
     try {
       await duplicateSession(duplicateConfirmMapId);
       setShowHistory(false);
       setViewingHistoryMapId(null);
       setHistoryApplications([]);
     } catch (err) {
       console.error('Duplicate session failed:', err);
     }
     setDuplicateConfirmMapId(null);
   };

   const handleViewHistorySession = useCallback(async (mapId: string) => {
     try {
       const apps = await loadMapApplications(mapId);
       setHistoryApplications(apps);
       setViewingHistoryMapId(mapId);
       setShowHistory(false);
     } catch (err) {
       console.error('Failed to load history session:', err);
       toast.error('Erro ao carregar sessão');
     }
   }, [loadMapApplications]);

   const handleExitHistoryView = () => {
     setViewingHistoryMapId(null);
     setHistoryApplications([]);
   };
 
   if (isLoading) {
     return (
       <div className="space-y-4">
         <Skeleton className="h-12 w-full" />
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           <Skeleton className="h-[600px] lg:col-span-2" />
           <Skeleton className="h-[600px]" />
         </div>
       </div>
     );
   }

   const noAppointment = !appointmentId;
   const noMap = !facialMap && !noAppointment;

    const getBaseImage = () => {
      if (activeProcedure === 'filler' && viewType === 'frontal') return facialMapFillerFrontal;
      if (activeProcedure === 'filler' && viewType === 'left_lateral') return facialMapFillerLeftLateral;
      if (activeProcedure === 'filler' && viewType === 'right_lateral') return facialMapFillerRightLateral;
      if (activeProcedure === 'biostimulator' && viewType === 'frontal') return facialMapBiostimulatorFrontal;
      if (activeProcedure === 'biostimulator' && viewType === 'right_lateral') return facialMapBiostimulatorRightLateral;
      if (viewType === 'frontal') return facialMapToxinaFrontal;
      if (viewType === 'left_lateral') return facialMapToxinaLateralEsquerda;
      if (viewType === 'right_lateral') return facialMapToxinaLateralDireita;
      return undefined;
    };

   const viewingHistoryMap = viewingHistoryMapId ? allMaps.find(m => m.id === viewingHistoryMapId) : null;

   const confirmMessages = {
     conclude: {
       title: 'Concluir Sessão',
       description: 'Ao concluir, esta sessão será congelada e não poderá receber novas marcações. Deseja continuar?',
     },
     create: {
       title: 'Criar Nova Sessão',
       description: 'Uma nova sessão de mapa facial será criada para este atendimento. Deseja continuar?',
     },
     reopen: {
       title: 'Reabrir Sessão',
       description: 'A sessão será reaberta e poderá receber novas marcações. Deseja continuar?',
     },
   };
 
   return (
     <div className="space-y-4">
       {/* Context Indicator */}
       <div className="flex items-center justify-between flex-wrap gap-2 p-3 rounded-lg border bg-muted/30">
         <div className="flex items-center gap-3 flex-wrap">
           <Badge variant="outline" className={`${procConfig.color} border gap-1.5 font-semibold`}>
             <ProcIcon className="h-3.5 w-3.5" />
             {procConfig.label}
           </Badge>
           {facialMap && !isViewingHistory && (
             <>
               <span className="text-xs text-muted-foreground">
                 Sessão: <span className="font-medium text-foreground">
                   {format(new Date(facialMap.created_at), "dd/MM/yyyy", { locale: ptBR })}
                 </span>
               </span>
               {isSessionConcluded ? (
                 <Badge variant="secondary" className="text-[10px] h-5 px-1.5 gap-0.5">
                   <CheckCircle2 className="h-2.5 w-2.5" />
                   Concluída
                 </Badge>
               ) : (
                 <Badge variant="outline" className="text-[10px] h-5 px-1.5 gap-0.5">
                   <Clock className="h-2.5 w-2.5" />
                   Em andamento
                 </Badge>
               )}
             </>
           )}
           {isViewingHistory && viewingHistoryMap && (
             <>
               <Badge variant="outline" className="text-[10px] h-5 px-1.5 gap-0.5 border-secondary text-secondary-foreground bg-secondary/50">
                 <History className="h-2.5 w-2.5" />
                 Histórico
               </Badge>
               <span className="text-xs text-muted-foreground">
                 Sessão de <span className="font-medium text-foreground">
                   {format(new Date(viewingHistoryMap.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                 </span>
               </span>
             </>
           )}
           {currentTotal > 0 && (
             <span className="text-sm font-semibold">
               Total: {currentTotal} {unitLabel}
             </span>
           )}
         </div>
         <div className="flex items-center gap-2">
           {/* Reopen session button */}
           {isSessionConcluded && canEdit && !isViewingHistory && !showHistory && (
             <Button
               variant="ghost"
               size="sm"
               onClick={() => setConfirmAction('reopen')}
               disabled={isReopening}
               className="text-xs gap-1"
             >
               <Unlock className="h-3.5 w-3.5" />
               {isReopening ? 'Reabrindo...' : 'Reabrir'}
             </Button>
           )}
           {/* Conclude session button */}
           {facialMap && !isSessionConcluded && canEdit && !isViewingHistory && !showHistory && (
             <Button
               variant="outline"
               size="sm"
               onClick={() => setConfirmAction('conclude')}
               disabled={isConcluding || displayApplications.length === 0}
               className="text-xs gap-1"
             >
               <CheckCircle2 className="h-3.5 w-3.5" />
               {isConcluding ? 'Concluindo...' : 'Concluir Sessão'}
             </Button>
           )}
         </div>
       </div>

       {/* Source session banner */}
       {sourceSessionId && !isViewingHistory && (
         <div className="flex items-center gap-2 p-2.5 rounded-lg border bg-muted/20 text-muted-foreground">
           <Copy className="h-3.5 w-3.5 shrink-0" />
           <p className="text-xs">Sessão criada a partir de base anterior</p>
         </div>
       )}

       {/* Viewing history session banner */}
       {isViewingHistory && (
         <div className="flex items-center justify-between gap-2 p-3 rounded-lg border bg-secondary/30">
           <div className="flex items-center gap-2">
             <History className="h-4 w-4 shrink-0 text-muted-foreground" />
             <p className="text-sm text-muted-foreground">Visualizando sessão anterior (somente leitura)</p>
           </div>
           <div className="flex gap-2">
             {canEdit && (
               <Button
                 variant="outline"
                 size="sm"
                 onClick={() => setDuplicateConfirmMapId(viewingHistoryMapId!)}
                 disabled={isDuplicating}
                 className="text-xs gap-1"
               >
                 <Copy className="h-3.5 w-3.5" />
                 Duplicar como Base
               </Button>
             )}
             <Button variant="outline" size="sm" onClick={handleExitHistoryView} className="text-xs gap-1">
               <RotateCcw className="h-3.5 w-3.5" />
               Voltar à Sessão Atual
             </Button>
           </div>
         </div>
       )}

       {/* No appointment warning */}
       {noAppointment && !isViewingHistory && (
         <div className="flex items-center gap-2 p-3 rounded-lg border bg-muted/40">
           <AlertCircle className="h-4 w-4 shrink-0 text-muted-foreground" />
           <p className="text-sm text-muted-foreground">
             Nenhum atendimento ativo. Inicie um atendimento para registrar novas marcações.
           </p>
         </div>
       )}

       {/* No map for current appointment */}
       {noMap && canEdit && !isViewingHistory && (
         <div className="flex items-center justify-between gap-2 p-3 rounded-lg border bg-primary/5">
           <div className="flex items-center gap-2">
             <Plus className="h-4 w-4 shrink-0 text-primary" />
             <p className="text-sm">Nenhum mapa facial neste atendimento.</p>
           </div>
           <Button size="sm" variant="outline" onClick={() => setConfirmAction('create')} className="shrink-0">
             <Plus className="h-3.5 w-3.5 mr-1" />
             Nova Sessão
           </Button>
         </div>
       )}

       {/* Concluded session - allow creating new */}
       {isSessionConcluded && canEdit && !isViewingHistory && (
         <div className="flex items-center justify-between gap-2 p-3 rounded-lg border bg-muted/30">
           <div className="flex items-center gap-2">
             <CheckCircle2 className="h-4 w-4 shrink-0 text-muted-foreground" />
             <p className="text-sm text-muted-foreground">Sessão concluída. Crie uma nova sessão para novas marcações.</p>
           </div>
           <Button size="sm" variant="outline" onClick={() => setConfirmAction('create')} className="shrink-0">
             <Plus className="h-3.5 w-3.5 mr-1" />
             Nova Sessão
           </Button>
         </div>
       )}

       {/* Header Actions */}
       <div className="flex items-center justify-between flex-wrap gap-2">
         <div className="flex items-center gap-2 flex-wrap">
           {/* View Switcher */}
           <div className="flex bg-muted rounded-lg p-1">
             {Object.entries(VIEW_TYPE_LABELS).map(([key, label]) => (
               <button
                 key={key}
                 onClick={() => setViewType(key as ViewType)}
                 className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                   viewType === key 
                     ? 'bg-background text-foreground shadow-sm' 
                     : 'text-muted-foreground hover:text-foreground'
                 }`}
               >
                 {label}
               </button>
             ))}
            </div>

            {/* Procedure Type Switcher */}
            <div className="flex bg-muted rounded-lg p-1 ml-2">
              {(Object.entries(PROCEDURE_CONFIG) as [ProcedureType, typeof PROCEDURE_CONFIG[ProcedureType]][]).map(([key, config]) => {
                const Icon = config.icon;
                return (
                  <button
                    key={key}
                    onClick={() => handleProcedureChange(key)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                      activeProcedure === key 
                        ? 'bg-background text-foreground shadow-sm' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {config.label}
                  </button>
                );
              })}
            </div>
          </div>
 
         <div className="flex items-center gap-2">
           <Button
             variant={showHistory ? "default" : "ghost"}
             size="sm"
             onClick={() => {
               if (isViewingHistory) {
                 handleExitHistoryView();
               } else {
                 setShowHistory(!showHistory);
               }
             }}
             className={showHistory ? "" : "text-muted-foreground"}
           >
             {showHistory || isViewingHistory ? (
               <>
                 <RotateCcw className="h-4 w-4 mr-1.5" />
                 Sessão Atual
               </>
             ) : (
               <>
                 <History className="h-4 w-4 mr-1.5" />
                 Histórico
               </>
             )}
           </Button>
           
            <Button 
              variant="outline" 
              size="sm"
              onClick={generatePdf}
              disabled={displayApplications.length === 0}
            >
              <Download className="h-4 w-4 mr-1.5" />
              PDF
            </Button>
         </div>
       </div>

       {/* History Panel */}
       {showHistory && (
         <SessionHistoryPanel
           allMaps={allMaps}
           currentMapId={currentMapId}
           onViewSession={handleViewHistorySession}
           onDuplicateSession={(mapId) => setDuplicateConfirmMapId(mapId)}
           onClose={() => setShowHistory(false)}
           loadMapApplications={loadMapApplications}
           canDuplicate={canEdit && !!appointmentId}
         />
       )}
 
        {/* Main Content */}
        {!showHistory && (
          <div className="flex flex-col gap-6">
            {/* Top - Face Map */}
            <div className="bg-gradient-to-b from-muted/20 to-muted/5 rounded-xl border p-4 flex items-center justify-center">
              <div className="w-full max-w-[600px] mx-auto flex items-center justify-center">
                <FacialMapSVG
                  viewType={viewType}
                  applications={displayApplications}
                  selectedPointId={selectedPoint?.id}
                  onPointClick={handlePointClick}
                  onMapClick={handleMapClick}
                  isEditing={isEditing}
                  selectedMuscle={selectedMuscle}
                  className="max-h-[700px]"
                  baseImageUrl={getBaseImage()}
                />
              </div>
            </div>

            {/* Empty state */}
            {displayApplications.length === 0 && !isLoading && (
              <div className="text-center py-6 text-muted-foreground">
                <p className="text-sm">
                  {isViewingHistory
                    ? `Nenhuma marcação de ${procConfig.label} nesta sessão.`
                    : canEditPoints 
                      ? `Selecione ${activeProcedure === 'toxin' ? 'um músculo' : 'uma região'} abaixo e clique no mapa para começar.`
                      : isSessionConcluded
                      ? 'Sessão concluída. Crie uma nova sessão para novas marcações.'
                      : 'Nenhuma marcação neste atendimento.'
                  }
                </p>
              </div>
            )}

            {/* Region Totals Summary */}
            {regionTotals.length > 0 && (
              <div className="bg-muted/20 rounded-xl border p-4">
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <ProcIcon className="h-4 w-4" />
                  Resumo por {activeProcedure === 'toxin' ? 'Músculo' : 'Região'}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {regionTotals.map((rt) => (
                    <div key={rt.id} className="flex items-center justify-between p-2 rounded-lg bg-background border text-sm">
                      <span className="truncate text-muted-foreground">{rt.name}</span>
                      <span className="font-semibold ml-2 shrink-0">{rt.total} {unitLabel}</span>
                    </div>
                  ))}
                </div>
                {activeProcedure === 'biostimulator' && displayApplications.length > 0 && (
                  <div className="mt-3 pt-3 border-t text-sm text-muted-foreground space-y-1">
                    {displayApplications[0]?.session_number && (
                      <p>Sessão: <span className="font-medium text-foreground">{displayApplications[0].session_number} de {displayApplications[0].total_sessions || '?'}</span></p>
                    )}
                    {displayApplications[0]?.protocol && (
                      <p>Protocolo: <span className="font-medium text-foreground">{displayApplications[0].protocol}</span></p>
                    )}
                  </div>
                )}
              </div>
            )}
   
           {/* Region/Muscle List */}
           <div className="bg-background rounded-xl border flex flex-col">
             <div className="p-4 border-b">
               <h3 className="font-semibold text-sm">
                 {activeProcedure === 'toxin' ? 'Músculos' : activeProcedure === 'filler' ? 'Regiões' : 'Áreas'}
               </h3>
               <p className="text-xs text-muted-foreground mt-1">
                 {canEditPoints 
                   ? `Selecione ${activeProcedure === 'toxin' ? 'um músculo' : 'uma região'} e clique no mapa`
                   : 'Visualização dos pontos de aplicação'
                 }
               </p>
               {selectedMuscle && canEditPoints && (
                 <Button 
                   variant="ghost" 
                   size="sm" 
                   onClick={() => setSelectedMuscle(null)}
                   className="mt-2 h-7 text-xs"
                 >
                   Limpar seleção
                 </Button>
               )}
             </div>
             <div className="flex-1 p-3 overflow-hidden">
               <MuscleList
                 selectedMuscle={selectedMuscle}
                 onSelectMuscle={(id) => setSelectedMuscle(id)}
                 disabled={!canEditPoints}
                 procedureType={activeProcedure}
               />
             </div>
           </div>
         </div>
        )}
   
        {/* Clinical Notes Section */}
        {!showHistory && (
          <div className="bg-muted/20 rounded-xl border p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-medium text-sm">Observações Clínicas</h3>
              </div>
              {canEditPoints && !editingNotes && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleEditNotes}
                  className="h-7 text-xs"
                >
                  Editar
                </Button>
              )}
            </div>
            
            {editingNotes ? (
              <div className="space-y-3">
                <Textarea
                  value={notesValue}
                  onChange={(e) => setNotesValue(e.target.value)}
                  placeholder="Registre observações sobre reações, recomendações e anotações técnicas..."
                  rows={3}
                  className="bg-background resize-none"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSaveNotes} className="h-8">
                    <Save className="h-3.5 w-3.5 mr-1.5" />
                    Salvar
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => setEditingNotes(false)}
                    className="h-8"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {facialMap?.general_notes || 'Nenhuma observação registrada.'}
              </p>
            )}
          </div>
        )}
 
       {/* Edit Dialog */}
       {!isViewingHistory && (
         <ApplicationPointDialog
           open={dialogOpen}
           onOpenChange={setDialogOpen}
           point={selectedPoint || (newPointPosition ? { 
             position_x: newPointPosition.x, 
             position_y: newPointPosition.y,
             view_type: viewType,
           } : null)}
           onSave={handleSavePoint}
           onDelete={selectedPoint ? handleDeletePoint : undefined}
           isNew={!selectedPoint}
           preselectedMuscle={selectedMuscle}
           preselectedProduct={COMMON_PRODUCTS[activeProcedure][0]}
           preselectedType={activeProcedure}
         />
       )}

       {/* Confirmation Dialogs */}
       {confirmAction && (
         <AlertDialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
           <AlertDialogContent>
             <AlertDialogHeader>
               <AlertDialogTitle>{confirmMessages[confirmAction].title}</AlertDialogTitle>
               <AlertDialogDescription>{confirmMessages[confirmAction].description}</AlertDialogDescription>
             </AlertDialogHeader>
             <AlertDialogFooter>
               <AlertDialogCancel>Cancelar</AlertDialogCancel>
               <AlertDialogAction onClick={handleConfirmedAction}>Confirmar</AlertDialogAction>
             </AlertDialogFooter>
           </AlertDialogContent>
         </AlertDialog>
       )}

       {duplicateConfirmMapId && (
         <AlertDialog open={!!duplicateConfirmMapId} onOpenChange={(open) => !open && setDuplicateConfirmMapId(null)}>
           <AlertDialogContent>
             <AlertDialogHeader>
               <AlertDialogTitle>Duplicar Sessão como Base</AlertDialogTitle>
               <AlertDialogDescription>
                 Uma nova sessão será criada com os mesmos pontos da sessão selecionada. A sessão original não será alterada. Deseja continuar?
               </AlertDialogDescription>
             </AlertDialogHeader>
             <AlertDialogFooter>
               <AlertDialogCancel>Cancelar</AlertDialogCancel>
               <AlertDialogAction onClick={handleConfirmedDuplicate} disabled={isDuplicating}>
                 {isDuplicating ? 'Duplicando...' : 'Duplicar'}
               </AlertDialogAction>
             </AlertDialogFooter>
           </AlertDialogContent>
         </AlertDialog>
       )}
     </div>
   );
 }
