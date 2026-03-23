import { useState } from "react";
import { usePatientOdontogram, useOdontogramTeeth, getToothByCode } from "@/hooks/useOdontogram";
import { OdontogramChart } from "./OdontogramChart";
import { ToothDetailDialog } from "./ToothDetailDialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Smile, AlertCircle } from "lucide-react";
import type { ToothStatus } from "@/types/odontogram";

interface OdontogramModuleProps {
  patientId: string;
  appointmentId?: string;
  professionalId: string;
  readOnly?: boolean;
}

/**
 * Main odontogram module component for the medical record
 */
export function OdontogramModule({
  patientId,
  appointmentId,
  professionalId,
  readOnly = false,
}: OdontogramModuleProps) {
  const { data: odontogram, isLoading: odontogramLoading, error: odontogramError } = usePatientOdontogram(patientId);
  const { data: teeth = [], isLoading: teethLoading } = useOdontogramTeeth(odontogram?.id || null);
  
  const [selectedTooth, setSelectedTooth] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<ToothStatus>('healthy');
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleToothClick = (toothCode: string, currentStatus: ToothStatus) => {
    if (readOnly) return;
    
    setSelectedTooth(toothCode);
    setSelectedStatus(currentStatus);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedTooth(null);
  };

  const isLoading = odontogramLoading || teethLoading;

  if (odontogramError) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex flex-col items-center justify-center text-center">
            <AlertCircle className="h-8 w-8 text-destructive mb-2" />
            <p className="text-sm text-muted-foreground">
              Erro ao carregar odontograma
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Smile className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Odontograma</CardTitle>
              <CardDescription>
                Mapeamento dental do paciente
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : (
            <OdontogramChart
              teeth={teeth}
              onToothClick={handleToothClick}
              selectedTooth={selectedTooth}
              isLoading={isLoading}
            />
          )}
        </CardContent>
      </Card>

      {/* Tooth detail dialog */}
      {selectedTooth && odontogram && (
        <ToothDetailDialog
          open={dialogOpen}
          onOpenChange={handleDialogClose}
          toothCode={selectedTooth}
          currentStatus={selectedStatus}
          odontogramId={odontogram.id}
          toothData={getToothByCode(teeth, selectedTooth)}
          appointmentId={appointmentId}
          professionalId={professionalId}
        />
      )}
    </>
  );
}
