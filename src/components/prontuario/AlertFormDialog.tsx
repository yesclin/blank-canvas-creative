import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  AlertTriangle,
  Plus
} from "lucide-react";
import { 
  AlertSeverity, 
  AlertType,
  alertSeverityConfig,
  alertTypeLabels 
} from "@/types/prontuario";
import { toast } from "sonner";

interface AlertFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientName?: string;
  onSave?: (data: { 
    alert_type: AlertType; 
    severity: AlertSeverity; 
    title: string; 
    description?: string 
  }) => void;
}

export function AlertFormDialog({ 
  open, 
  onOpenChange, 
  patientName,
  onSave 
}: AlertFormDialogProps) {
  const [alertType, setAlertType] = useState<AlertType>('allergy');
  const [severity, setSeverity] = useState<AlertSeverity>('warning');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleSave = () => {
    if (!title.trim()) {
      toast.error('Informe o título do alerta');
      return;
    }

    onSave?.({ alert_type: alertType, severity, title, description });
    toast.success('Alerta adicionado com sucesso!');
    
    // Reset form
    setTitle('');
    setDescription('');
    setAlertType('allergy');
    setSeverity('warning');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Novo Alerta Clínico
            {patientName && (
              <span className="text-sm font-normal text-muted-foreground">
                - {patientName}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Alerta</Label>
              <Select value={alertType} onValueChange={(v) => setAlertType(v as AlertType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(alertTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Gravidade</Label>
              <Select value={severity} onValueChange={(v) => setSeverity(v as AlertSeverity)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(alertSeverityConfig).map(([value, config]) => (
                    <SelectItem key={value} value={value}>
                      <div className={`flex items-center gap-2 ${config.color}`}>
                        {config.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Título do Alerta *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Alergia a Dipirona"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalhes adicionais sobre o alerta..."
              rows={3}
            />
          </div>

          {/* Preview */}
          {title && (
            <div className={`p-3 rounded-lg border ${alertSeverityConfig[severity].bgColor}`}>
              <p className={`font-medium ${alertSeverityConfig[severity].color}`}>
                {title}
              </p>
              {description && (
                <p className="text-sm text-muted-foreground mt-1">{description}</p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Alerta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
