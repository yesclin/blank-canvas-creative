import { useState, useEffect } from "react";
import { FileText, CheckCircle, AlertTriangle, Building2, User, Stethoscope } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Appointment, Insurance } from "@/types/agenda";
import type { TissGuideType } from "@/types/convenios";
import { guideTypeLabels } from "@/types/convenios";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface TissGuideGenerationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: Appointment | null;
  onConfirm: (guideData: GeneratedGuideData) => void;
  onSkip: () => void;
}

export interface GeneratedGuideData {
  appointment_id: string;
  patient_id: string;
  patient_name: string;
  professional_id: string;
  professional_name: string;
  insurance_id: string;
  insurance_name: string;
  guide_type: TissGuideType;
  service_date: string;
  procedure_name?: string;
  authorization_number?: string;
  card_number?: string;
  auto_calculate_fee: boolean;
}

// Mock para procedimentos cobertos pelo convênio
const mockCoveredProcedures = [
  { id: '1', code: '10101012', name: 'Consulta em consultório', price: 150 },
  { id: '2', code: '20101015', name: 'Retorno de consulta', price: 100 },
  { id: '3', code: '30101010', name: 'Avaliação clínica geral', price: 200 },
];

export function TissGuideGenerationDialog({
  open,
  onOpenChange,
  appointment,
  onConfirm,
  onSkip,
}: TissGuideGenerationDialogProps) {
  const navigate = useNavigate();
  
  const [guideType, setGuideType] = useState<TissGuideType>('consulta');
  const [authorizationNumber, setAuthorizationNumber] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [autoCalculateFee, setAutoCalculateFee] = useState(true);
  const [selectedProcedure, setSelectedProcedure] = useState('');

  // Reset form when appointment changes
  useEffect(() => {
    if (appointment) {
      // Set guide type based on appointment type
      if (appointment.appointment_type === 'procedimento') {
        setGuideType('sp_sadt');
      } else {
        setGuideType('consulta');
      }
      setAuthorizationNumber('');
      setCardNumber('');
      setAutoCalculateFee(true);
      setSelectedProcedure('');
    }
  }, [appointment]);

  if (!appointment || !appointment.insurance) {
    return null;
  }

  const handleGenerate = () => {
    const guideData: GeneratedGuideData = {
      appointment_id: appointment.id,
      patient_id: appointment.patient_id,
      patient_name: appointment.patient?.full_name || 'Paciente',
      professional_id: appointment.professional_id,
      professional_name: appointment.professional?.full_name || 'Profissional',
      insurance_id: appointment.insurance_id!,
      insurance_name: appointment.insurance?.name || 'Convênio',
      guide_type: guideType,
      service_date: appointment.scheduled_date,
      procedure_name: appointment.appointment_type === 'procedimento' 
        ? mockCoveredProcedures.find(p => p.id === selectedProcedure)?.name 
        : undefined,
      authorization_number: authorizationNumber || undefined,
      card_number: cardNumber || undefined,
      auto_calculate_fee: autoCalculateFee,
    };

    onConfirm(guideData);
    
    toast.success(
      <div className="flex flex-col gap-1">
        <span className="font-medium">Guia TISS gerada com sucesso!</span>
        <span className="text-sm text-muted-foreground">
          {guideTypeLabels[guideType]} • {appointment.patient?.full_name}
        </span>
      </div>,
      {
        action: {
          label: 'Ver Guias',
          onClick: () => navigate('/app/gestao/convenios'),
        },
      }
    );
    
    onOpenChange(false);
  };

  const handleSkip = () => {
    onSkip();
    onOpenChange(false);
    toast.info('Atendimento finalizado sem gerar guia TISS');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Gerar Guia TISS
          </DialogTitle>
          <DialogDescription>
            Atendimento finalizado com convênio. Deseja gerar a guia automaticamente?
          </DialogDescription>
        </DialogHeader>

        {/* Appointment Summary */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Resumo do Atendimento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="font-medium">{appointment.patient?.full_name}</div>
                <div className="text-sm text-muted-foreground">Paciente</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Stethoscope className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="font-medium">{appointment.professional?.full_name}</div>
                <div className="text-sm text-muted-foreground">
                  {appointment.professional?.registration_number}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="font-medium">{appointment.insurance?.name}</div>
                <div className="text-sm text-muted-foreground">
                  ANS: {appointment.insurance?.ans_code || 'N/A'}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 pt-2">
              <Badge variant="secondary">
                {appointment.start_time.slice(0, 5)} - {appointment.end_time.slice(0, 5)}
              </Badge>
              <Badge variant="outline">
                {appointment.scheduled_date}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Guide Configuration */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Guia</Label>
              <Select value={guideType} onValueChange={(v: TissGuideType) => setGuideType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="consulta">Consulta</SelectItem>
                  <SelectItem value="sp_sadt">SP/SADT</SelectItem>
                  <SelectItem value="internacao">Internação</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Nº da Carteirinha</Label>
              <Input
                placeholder="Opcional"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
              />
            </div>
          </div>

          {guideType === 'sp_sadt' && (
            <div className="space-y-2">
              <Label>Procedimento Principal</Label>
              <Select value={selectedProcedure} onValueChange={setSelectedProcedure}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o procedimento" />
                </SelectTrigger>
                <SelectContent>
                  {mockCoveredProcedures.map((proc) => (
                    <SelectItem key={proc.id} value={proc.id}>
                      {proc.code} - {proc.name} ({formatCurrency(proc.price)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Nº de Autorização (se houver)</Label>
            <Input
              placeholder="Número de autorização prévia"
              value={authorizationNumber}
              onChange={(e) => setAuthorizationNumber(e.target.value)}
            />
          </div>

          <div className="flex items-center space-x-2 p-3 border rounded-lg bg-muted/30">
            <Checkbox
              id="auto-fee"
              checked={autoCalculateFee}
              onCheckedChange={(checked) => setAutoCalculateFee(checked as boolean)}
            />
            <div className="grid gap-0.5 leading-none">
              <label
                htmlFor="auto-fee"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Calcular repasse automaticamente
              </label>
              <p className="text-xs text-muted-foreground">
                Aplicar regra de repasse do convênio para o profissional
              </p>
            </div>
          </div>
        </div>

        {/* Alert for insurance requirements */}
        {appointment.insurance && (
          <div className="flex items-start gap-2 p-3 border rounded-lg bg-yellow-50/50 border-yellow-200 dark:bg-yellow-900/10">
            <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
            <div className="text-sm">
              <span className="font-medium text-yellow-800 dark:text-yellow-200">
                Atenção:
              </span>
              <span className="text-yellow-700 dark:text-yellow-300 ml-1">
                Verifique se o convênio exige autorização prévia para este tipo de atendimento.
              </span>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={handleSkip}>
            Pular
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleGenerate}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Gerar Guia
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
