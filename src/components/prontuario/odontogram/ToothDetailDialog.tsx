import { useState } from "react";
import { useToothHistory, useUpdateToothStatus } from "@/hooks/useOdontogram";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useClinicData } from "@/hooks/useClinicData";
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
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CircleDot, 
  Clock, 
  Loader2, 
  Save,
  History,
  Stethoscope,
} from "lucide-react";
import { 
  TOOTH_STATUS_LABELS, 
  TOOTH_NAMES,
  type ToothStatus,
  type OdontogramTooth,
} from "@/types/odontogram";
import { ToothSurfaceSelector } from "./ToothSurfaceSelector";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ToothDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  toothCode: string;
  currentStatus: ToothStatus;
  odontogramId: string;
  toothData?: OdontogramTooth;
  appointmentId?: string;
  professionalId: string;
}

interface FormData {
  status: ToothStatus;
  surfaces: string[];
  procedureId: string;
  notes: string;
}

export function ToothDetailDialog({
  open,
  onOpenChange,
  toothCode,
  currentStatus,
  odontogramId,
  toothData,
  appointmentId,
  professionalId,
}: ToothDetailDialogProps) {
  const { clinic } = useClinicData();
  const updateTooth = useUpdateToothStatus();
  const { data: history = [], isLoading: historyLoading } = useToothHistory(toothData?.id || null);
  
  const [activeTab, setActiveTab] = useState("status");
  const [selectedStatus, setSelectedStatus] = useState<ToothStatus>(currentStatus);
  const [selectedSurfaces, setSelectedSurfaces] = useState<string[]>([]);
  const [selectedProcedure, setSelectedProcedure] = useState<string>("");
  const [notes, setNotes] = useState(toothData?.notes || "");

  // Fetch dental procedures
  const { data: procedures = [] } = useQuery({
    queryKey: ["dental-procedures", clinic?.id],
    queryFn: async () => {
      if (!clinic?.id) return [];
      
      const { data, error } = await supabase
        .from("procedures")
        .select("id, name")
        .eq("clinic_id", clinic.id)
        .eq("is_active", true)
        .order("name");
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!clinic?.id,
  });

  const handleSave = async () => {
    await updateTooth.mutateAsync({
      odontogramId,
      toothCode,
      status: selectedStatus,
      surface: selectedSurfaces.join(''),
      notes: notes || undefined,
      appointmentId,
      professionalId,
      procedureId: selectedProcedure || undefined,
    });
    
    onOpenChange(false);
  };

  const handleSurfaceToggle = (code: string) => {
    setSelectedSurfaces(prev => 
      prev.includes(code) 
        ? prev.filter(s => s !== code)
        : [...prev, code]
    );
  };

  const toothName = TOOTH_NAMES[toothCode] || `Dente ${toothCode}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CircleDot className="h-5 w-5 text-primary" />
            {toothName}
          </DialogTitle>
          <DialogDescription>
            Dente {toothCode} • Status atual: {TOOTH_STATUS_LABELS[currentStatus]}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="status" className="gap-2">
              <Stethoscope className="h-4 w-4" />
              Registrar
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="h-4 w-4" />
              Histórico
              {history.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-[10px]">
                  {history.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="status" className="space-y-4 py-4">
            {/* Status selection */}
            <div className="space-y-2">
              <Label>Status do Dente</Label>
              <Select value={selectedStatus} onValueChange={(v) => setSelectedStatus(v as ToothStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TOOTH_STATUS_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Interactive surface selection */}
            <div className="space-y-2">
              <Label>Superfícies Afetadas (opcional)</Label>
              <ToothSurfaceSelector
                selectedSurfaces={selectedSurfaces}
                onToggleSurface={handleSurfaceToggle}
                status={selectedStatus}
                size="md"
              />
            </div>

            {/* Procedure selection */}
            <div className="space-y-2">
              <Label>Procedimento Realizado (opcional)</Label>
              <Select 
                value={selectedProcedure || "none"} 
                onValueChange={(v) => setSelectedProcedure(v === "none" ? "" : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um procedimento..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {procedures.map((proc) => (
                    <SelectItem key={proc.id} value={proc.id}>
                      {proc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Anotações sobre este dente..."
                rows={3}
              />
            </div>
          </TabsContent>

          <TabsContent value="history" className="py-4">
            {historyLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : history.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Clock className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Nenhum registro histórico para este dente
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[280px] pr-4">
                <div className="space-y-3">
                  {history.map((record) => (
                    <div
                      key={record.id}
                      className="p-3 rounded-lg border bg-muted/30 space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary">
                          {TOOTH_STATUS_LABELS[record.status_applied]}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(record.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                      {record.surface && (
                        <p className="text-xs text-muted-foreground">
                          Superfícies: {record.surface}
                        </p>
                      )}
                      {record.procedure?.name && (
                        <p className="text-sm">
                          <span className="text-muted-foreground">Procedimento:</span> {record.procedure.name}
                        </p>
                      )}
                      {record.notes && (
                        <p className="text-sm text-muted-foreground">{record.notes}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Por: {record.professional?.full_name || 'Profissional'}
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={updateTooth.isPending}
          >
            {updateTooth.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
