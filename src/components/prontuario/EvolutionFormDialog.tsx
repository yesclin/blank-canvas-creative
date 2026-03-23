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
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Save, 
  CheckCircle, 
  FileText,
  Stethoscope,
  AlertTriangle
} from "lucide-react";
import { 
  SpecialtyFieldTemplate, 
  Specialty, 
  specialtyLabels,
  EvolutionType,
  evolutionTypeLabels,
  ClinicalAlert,
  alertSeverityConfig
} from "@/types/prontuario";
import { toast } from "sonner";

interface EvolutionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  specialtyFields: SpecialtyFieldTemplate[];
  alerts?: ClinicalAlert[];
  patientName?: string;
  onSave?: (data: { specialty: Specialty; type: EvolutionType; content: Record<string, string>; notes: string }) => void;
}

export function EvolutionFormDialog({ 
  open, 
  onOpenChange, 
  specialtyFields,
  alerts = [],
  patientName,
  onSave 
}: EvolutionFormDialogProps) {
  const [selectedSpecialty, setSelectedSpecialty] = useState<Specialty>('medical_general');
  const [evolutionType, setEvolutionType] = useState<EvolutionType>('consultation');
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState('');

  const currentFields = specialtyFields
    .filter(f => f.specialty === selectedSpecialty)
    .sort((a, b) => a.field_order - b.field_order);

  const activeAlerts = alerts.filter(a => a.is_active);
  const criticalAlerts = activeAlerts.filter(a => a.severity === 'critical');

  const handleFieldChange = (fieldName: string, value: string) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
  };

  const handleSaveDraft = () => {
    onSave?.({ specialty: selectedSpecialty, type: evolutionType, content: formData, notes });
    toast.success('Rascunho salvo com sucesso!');
    onOpenChange(false);
  };

  const handleSign = () => {
    // Validate required fields
    const requiredFields = currentFields.filter(f => f.is_required);
    const missingFields = requiredFields.filter(f => !formData[f.field_name]?.trim());
    
    if (missingFields.length > 0) {
      toast.error(`Preencha os campos obrigatórios: ${missingFields.map(f => f.field_label).join(', ')}`);
      return;
    }

    onSave?.({ specialty: selectedSpecialty, type: evolutionType, content: formData, notes });
    toast.success('Evolução assinada com sucesso!');
    onOpenChange(false);
  };

  const handleSpecialtyChange = (value: Specialty) => {
    setSelectedSpecialty(value);
    setFormData({});
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Nova Evolução Clínica
            {patientName && (
              <Badge variant="secondary">{patientName}</Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Alertas críticos */}
        {criticalAlerts.length > 0 && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-700 font-medium mb-2">
              <AlertTriangle className="h-4 w-4" />
              Atenção aos alertas críticos:
            </div>
            <div className="flex flex-wrap gap-2">
              {criticalAlerts.map(alert => (
                <Badge key={alert.id} variant="destructive">
                  {alert.title}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Especialidade</Label>
            <Select value={selectedSpecialty} onValueChange={handleSpecialtyChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(specialtyLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    <div className="flex items-center gap-2">
                      <Stethoscope className="h-4 w-4" />
                      {label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Tipo de Atendimento</Label>
            <Select value={evolutionType} onValueChange={(v) => setEvolutionType(v as EvolutionType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(evolutionTypeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator />

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
            {currentFields.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Nenhum campo configurado para esta especialidade.
              </p>
            ) : (
              currentFields.map(field => (
                <div key={field.id} className="space-y-2">
                  <Label htmlFor={field.field_name} className="flex items-center gap-2">
                    {field.field_label}
                    {field.is_required && (
                      <span className="text-red-500">*</span>
                    )}
                  </Label>
                  
                  {field.field_type === 'textarea' ? (
                    <Textarea
                      id={field.field_name}
                      value={formData[field.field_name] || ''}
                      onChange={(e) => handleFieldChange(field.field_name, e.target.value)}
                      placeholder={`Digite ${field.field_label.toLowerCase()}...`}
                      rows={4}
                    />
                  ) : field.field_type === 'number' ? (
                    <Input
                      id={field.field_name}
                      type="number"
                      value={formData[field.field_name] || ''}
                      onChange={(e) => handleFieldChange(field.field_name, e.target.value)}
                      placeholder={`Digite ${field.field_label.toLowerCase()}...`}
                    />
                  ) : field.field_type === 'odontogram' ? (
                    <div className="p-8 border-2 border-dashed rounded-lg text-center text-muted-foreground">
                      <p>Odontograma</p>
                      <p className="text-xs">Componente interativo (em desenvolvimento)</p>
                    </div>
                  ) : (
                    <Input
                      id={field.field_name}
                      value={formData[field.field_name] || ''}
                      onChange={(e) => handleFieldChange(field.field_name, e.target.value)}
                      placeholder={`Digite ${field.field_label.toLowerCase()}...`}
                    />
                  )}
                </div>
              ))
            )}

            <div className="space-y-2 pt-4">
              <Label htmlFor="notes">Observações Gerais</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observações adicionais..."
                rows={3}
              />
            </div>
          </div>
        </ScrollArea>

        <Separator />

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button variant="secondary" onClick={handleSaveDraft}>
            <Save className="h-4 w-4 mr-2" />
            Salvar Rascunho
          </Button>
          <Button onClick={handleSign}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Assinar Evolução
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
