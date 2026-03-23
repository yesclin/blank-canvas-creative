import { useState } from "react";
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
} from "lucide-react";
import { FacialMapSVG } from "./FacialMapSVG";
import { MuscleList } from "./MuscleList";
import { ApplicationPointDialog } from "./ApplicationPointDialog";
import { useFacialMap } from "@/hooks/aesthetics";
import { useFacialMapPdf } from "./useFacialMapPdf";
import type { FacialMapApplication, ViewType, ProcedureType } from "./types";
import { VIEW_TYPE_LABELS, FACIAL_MUSCLES, COMMON_PRODUCTS } from "./types";

interface FacialMapModuleProps {
  patientId: string;
  patientName?: string;
  appointmentId?: string | null;
  canEdit?: boolean;
}
 
export function FacialMapModule({ 
  patientId, 
  patientName,
  appointmentId,
  canEdit = false,
}: FacialMapModuleProps) {
   const [viewType, setViewType] = useState<ViewType>('frontal');
   const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
   const [selectedPoint, setSelectedPoint] = useState<FacialMapApplication | null>(null);
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
   } = useFacialMap(patientId, showHistory ? null : appointmentId);
 
  const displayApplications = showHistory ? allApplications : applications;
  const isEditing = canEdit && selectedMuscle !== null;

  // PDF export hook
  const { generatePdf } = useFacialMapPdf({
    patientName,
    patientId,
    facialMap,
    applications: displayApplications,
  });
 
   // Calculate totals
   const totals = displayApplications.reduce<Record<string, number>>((acc, app) => {
     if (!acc[app.procedure_type]) acc[app.procedure_type] = 0;
     acc[app.procedure_type] += app.quantity;
     return acc;
   }, {});
 
   const handleMapClick = (x: number, y: number) => {
     if (!isEditing || !canEdit || !selectedMuscle) return;
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
     if (selectedPoint) {
       await updateApplication({ id: selectedPoint.id, data });
     } else if (newPointPosition) {
       await addApplication({
         ...data,
         position_x: newPointPosition.x,
         position_y: newPointPosition.y,
         view_type: viewType,
         muscle: selectedMuscle,
       });
     }
     setSelectedPoint(null);
     setNewPointPosition(null);
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
 
   return (
     <div className="space-y-4">
       {/* Header Actions - Minimal */}
       <div className="flex items-center justify-between">
         <div className="flex items-center gap-2">
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
         </div>
 
         <div className="flex items-center gap-2">
           {/* Totals Summary */}
           {Object.keys(totals).length > 0 && (
             <div className="flex items-center gap-3 mr-4 text-sm">
               {totals.toxin && (
                 <span className="text-muted-foreground">
                   Toxina: <span className="font-semibold text-foreground">{totals.toxin} UI</span>
                 </span>
               )}
               {totals.filler && (
                 <span className="text-muted-foreground">
                   Preench.: <span className="font-semibold text-foreground">{totals.filler} ml</span>
                 </span>
               )}
               {totals.biostimulator && (
                 <span className="text-muted-foreground">
                   Bioestim.: <span className="font-semibold text-foreground">{totals.biostimulator} ml</span>
                 </span>
               )}
             </div>
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
           
           <Button variant="ghost" size="sm" className="text-muted-foreground">
             <Eye className="h-4 w-4 mr-1.5" />
             Visualizar
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
 
       {/* Main Content - Two Column Layout */}
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[600px]">
         {/* Left Column - Face Map (2/3 width) */}
         <div className="lg:col-span-2 bg-gradient-to-b from-muted/20 to-muted/5 rounded-xl border p-4">
           <div className="h-full flex items-center justify-center">
             <FacialMapSVG
               viewType={viewType}
               applications={displayApplications}
               selectedPointId={selectedPoint?.id}
               onPointClick={handlePointClick}
               onMapClick={handleMapClick}
               isEditing={isEditing}
               selectedMuscle={selectedMuscle}
               className="max-h-[560px]"
             />
           </div>
         </div>
 
         {/* Right Column - Muscle List (1/3 width) */}
         <div className="bg-background rounded-xl border flex flex-col">
           <div className="p-4 border-b">
             <h3 className="font-semibold text-sm">Músculos</h3>
             <p className="text-xs text-muted-foreground mt-1">
               {canEdit 
                 ? 'Selecione um músculo e clique no mapa'
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
               disabled={!canEdit}
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
           {canEdit && !editingNotes && (
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
 
       {/* Edit Dialog - Simplified */}
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
         preselectedProduct={COMMON_PRODUCTS.toxin[0]}
         preselectedType="toxin"
       />
     </div>
   );
 }