import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Download, 
  History,
  Eye,
  Save,
  FileText,
  RotateCcw,
  AlertCircle,
} from "lucide-react";
import { FacialMapSVG } from "./FacialMapSVG";
import { MuscleList } from "./MuscleList";
import { ApplicationPointDialog } from "./ApplicationPointDialog";
import { useFacialMap } from "@/hooks/aesthetics";
import { useFacialMapPdf } from "./useFacialMapPdf";
import type { FacialMapApplication, ViewType, ProcedureType } from "./types";
import { VIEW_TYPE_LABELS, COMMON_PRODUCTS, getDefaultUnit, getRegionLabel } from "./types";
import facialMapToxinaFrontal from "@/assets/facial-map-toxina-frontal.png";
import facialMapToxinaLateralEsquerda from "@/assets/facial-map-toxina-lateral-esquerda.png";
import facialMapToxinaLateralDireita from "@/assets/facial-map-toxina-lateral-direita.png";
import facialMapFillerFrontal from "@/assets/facial-map-filler-frontal.png";
import { toast } from "sonner";

interface FacialMapModuleProps {
  patientId: string;
  patientName?: string;
  appointmentId?: string | null;
  canEdit?: boolean;
  professionalId?: string | null;
  specialtyKey?: string;
  procedureType?: ProcedureType;
}
 
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
 
   const { 
     facialMap,
     applications, 
     allApplications,
     isLoading, 
     addApplication,
     updateApplication,
     deleteApplication,
     updateMapNotes,
   } = useFacialMap(patientId, showHistory ? null : appointmentId, {
     professionalId: professionalId || null,
     specialtyKey,
     canEditRecords: canEdit,
   });

  // === CORE FILTERING ===
  // Default: only current appointment + current procedure type
  // History mode: all applications across all appointments
  const displayApplications = useMemo(() => {
    if (showHistory) {
      // In history mode show all points but still filter by active procedure
      return allApplications.filter(a => a.procedure_type === activeProcedure);
    }
    // Current appointment only + current procedure type
    return applications.filter(a => a.procedure_type === activeProcedure);
  }, [showHistory, allApplications, applications, activeProcedure]);

  const isEditing = canEdit && selectedMuscle !== null;

  // PDF export hook
  const { generatePdf } = useFacialMapPdf({
    patientName,
    patientId,
    facialMap,
    applications: displayApplications,
  });
 
   // Calculate totals for current procedure only
   const currentTotal = useMemo(() => {
     return displayApplications.reduce((sum, app) => sum + app.quantity, 0);
   }, [displayApplications]);

   const unitLabel = getDefaultUnit(activeProcedure);
 
   const handleMapClick = (x: number, y: number) => {
     if (!canEdit) return;
     if (!selectedMuscle) {
       toast.info(`Selecione ${activeProcedure === 'toxin' ? 'um músculo' : 'uma região'} antes de marcar o ponto.`);
       return;
     }
     if (!Number.isFinite(x) || !Number.isFinite(y) || x < 0 || x > 100 || y < 0 || y > 100) {
       console.warn('Invalid click coordinates:', { x, y });
       return;
     }
     setNewPointPosition({ x, y });
     setSelectedPoint(null);
     setDialogOpen(true);
   };
 
   const handlePointClick = (point: FacialMapApplication) => {
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

   // Clear muscle selection when switching procedure type
   const handleProcedureChange = (proc: ProcedureType) => {
     setActiveProcedure(proc);
     setSelectedMuscle(null);
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

   // No appointment context warning
   const noAppointment = !appointmentId;
 
   return (
     <div className="space-y-4">
       {/* No appointment warning */}
       {noAppointment && (
         <div className="flex items-center gap-2 p-3 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
           <AlertCircle className="h-4 w-4 shrink-0" />
           <p className="text-sm">
             Nenhum atendimento ativo. Inicie um atendimento para registrar novas marcações.
             {' '}Visualizando histórico disponível.
           </p>
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
              {([['toxin', 'Toxina'], ['filler', 'Preenchimento'], ['biostimulator', 'Bioestimulador']] as const).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => handleProcedureChange(key)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    activeProcedure === key 
                      ? 'bg-background text-foreground shadow-sm' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
 
         <div className="flex items-center gap-2">
           {/* Current procedure total */}
           {currentTotal > 0 && (
             <span className="text-sm text-muted-foreground mr-2">
               Total: <span className="font-semibold text-foreground">{currentTotal} {unitLabel}</span>
             </span>
           )}
 
           <Button
             variant="ghost"
             size="sm"
             onClick={() => setShowHistory(!showHistory)}
             className="text-muted-foreground"
           >
             {showHistory ? (
               <>
                 <RotateCcw className="h-4 w-4 mr-1.5" />
                 Atual
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

       {/* History mode banner */}
       {showHistory && (
         <div className="flex items-center gap-2 p-3 rounded-lg border border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-200">
           <History className="h-4 w-4 shrink-0" />
           <p className="text-sm">
             Modo Histórico — exibindo todas as marcações de <strong>{activeProcedure === 'toxin' ? 'Toxina' : activeProcedure === 'filler' ? 'Preenchimento' : 'Bioestimulador'}</strong> do paciente.
           </p>
         </div>
       )}
 
        {/* Main Content */}
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
                baseImageUrl={
                  viewType === 'frontal' 
                    ? (activeProcedure === 'filler' ? facialMapFillerFrontal : facialMapToxinaFrontal)
                  : viewType === 'left_lateral' ? facialMapToxinaLateralEsquerda 
                  : viewType === 'right_lateral' ? facialMapToxinaLateralDireita
                  : undefined
                }
              />
            </div>
          </div>

          {/* Empty state */}
          {displayApplications.length === 0 && !isLoading && (
            <div className="text-center py-6 text-muted-foreground">
              <p className="text-sm">
                {showHistory 
                  ? `Nenhuma marcação de ${activeProcedure === 'toxin' ? 'Toxina' : activeProcedure === 'filler' ? 'Preenchimento' : 'Bioestimulador'} encontrada no histórico.`
                  : canEdit 
                    ? `Selecione ${activeProcedure === 'toxin' ? 'um músculo' : 'uma região'} abaixo e clique no mapa para começar.`
                    : 'Nenhuma marcação neste atendimento.'
                }
              </p>
            </div>
          )}
 
         {/* Region/Muscle List */}
         <div className="bg-background rounded-xl border flex flex-col">
           <div className="p-4 border-b">
             <h3 className="font-semibold text-sm">
               {activeProcedure === 'toxin' ? 'Músculos' : activeProcedure === 'filler' ? 'Regiões' : 'Áreas'}
             </h3>
             <p className="text-xs text-muted-foreground mt-1">
               {canEdit 
                 ? `Selecione ${activeProcedure === 'toxin' ? 'um músculo' : 'uma região'} e clique no mapa`
                 : 'Visualização dos pontos de aplicação'
               }
             </p>
             {selectedMuscle && canEdit && (
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
               disabled={!canEdit || showHistory}
               procedureType={activeProcedure}
             />
           </div>
         </div>
       </div>
 
       {/* Clinical Notes Section */}
       <div className="bg-muted/20 rounded-xl border p-4">
         <div className="flex items-center justify-between mb-3">
           <div className="flex items-center gap-2">
             <FileText className="h-4 w-4 text-muted-foreground" />
             <h3 className="font-medium text-sm">Observações Clínicas</h3>
           </div>
           {canEdit && !editingNotes && !showHistory && (
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
 
       {/* Edit Dialog */}
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
     </div>
   );
 }
