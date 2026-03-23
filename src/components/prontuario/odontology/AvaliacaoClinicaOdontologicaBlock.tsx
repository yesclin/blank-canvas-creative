import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  Stethoscope,
  Edit3,
  Save,
  X,
  Clock,
  History,
  Droplet,
  AlertCircle,
  Activity,
  ChevronRight
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

/**
 * Estrutura de dados da Avaliação Clínica Odontológica
 */
export interface AvaliacaoClinicaOdontologicaData {
  id: string;
  patient_id: string;
  version: number;
  // Condição Gengival
  condicao_gengival: 'saudavel' | 'gengivite_leve' | 'gengivite_moderada' | 'gengivite_grave' | 'periodontite';
  condicao_gengival_notas: string;
  // Placa e Tártaro
  presenca_placa: 'ausente' | 'leve' | 'moderada' | 'severa';
  presenca_tartaro: 'ausente' | 'leve' | 'moderado' | 'severo';
  placa_tartaro_notas: string;
  // Mobilidade Dentária
  mobilidade_dentaria: 'ausente' | 'grau_1' | 'grau_2' | 'grau_3';
  dentes_com_mobilidade: string;
  // Sensibilidade
  sensibilidade_dentaria: 'ausente' | 'leve' | 'moderada' | 'severa';
  tipo_sensibilidade: string; // frio, calor, doce, toque
  dentes_sensiveis: string;
  // Sangramento
  sangramento_gengival: 'ausente' | 'pontual' | 'moderado' | 'espontaneo';
  sangramento_notas: string;
  // Observações
  observacoes_clinicas: string;
  // Metadata
  created_at: string;
  created_by: string;
  created_by_name?: string;
  is_current: boolean;
}

interface AvaliacaoClinicaOdontologicaBlockProps {
  currentAvaliacao: AvaliacaoClinicaOdontologicaData | null;
  avaliacaoHistory: AvaliacaoClinicaOdontologicaData[];
  loading?: boolean;
  saving?: boolean;
  canEdit?: boolean;
  onSave: (data: Omit<AvaliacaoClinicaOdontologicaData, 'id' | 'patient_id' | 'version' | 'created_at' | 'created_by' | 'created_by_name' | 'is_current'>) => Promise<void>;
}

// Labels para os selects
const CONDICAO_GENGIVAL_OPTIONS = [
  { value: 'saudavel', label: 'Saudável', color: 'bg-emerald-500' },
  { value: 'gengivite_leve', label: 'Gengivite Leve', color: 'bg-amber-400' },
  { value: 'gengivite_moderada', label: 'Gengivite Moderada', color: 'bg-amber-500' },
  { value: 'gengivite_grave', label: 'Gengivite Grave', color: 'bg-orange-500' },
  { value: 'periodontite', label: 'Periodontite', color: 'bg-destructive' },
];

const PRESENCA_OPTIONS = [
  { value: 'ausente', label: 'Ausente' },
  { value: 'leve', label: 'Leve' },
  { value: 'moderada', label: 'Moderada' },
  { value: 'moderado', label: 'Moderado' },
  { value: 'severa', label: 'Severa' },
  { value: 'severo', label: 'Severo' },
];

const MOBILIDADE_OPTIONS = [
  { value: 'ausente', label: 'Ausente' },
  { value: 'grau_1', label: 'Grau I (< 1mm)' },
  { value: 'grau_2', label: 'Grau II (1-2mm)' },
  { value: 'grau_3', label: 'Grau III (> 2mm / vertical)' },
];

const SANGRAMENTO_OPTIONS = [
  { value: 'ausente', label: 'Ausente' },
  { value: 'pontual', label: 'Pontual (à sondagem)' },
  { value: 'moderado', label: 'Moderado' },
  { value: 'espontaneo', label: 'Espontâneo' },
];

type FormDataType = {
  condicao_gengival: AvaliacaoClinicaOdontologicaData['condicao_gengival'];
  condicao_gengival_notas: string;
  presenca_placa: AvaliacaoClinicaOdontologicaData['presenca_placa'];
  presenca_tartaro: AvaliacaoClinicaOdontologicaData['presenca_tartaro'];
  placa_tartaro_notas: string;
  mobilidade_dentaria: AvaliacaoClinicaOdontologicaData['mobilidade_dentaria'];
  dentes_com_mobilidade: string;
  sensibilidade_dentaria: AvaliacaoClinicaOdontologicaData['sensibilidade_dentaria'];
  tipo_sensibilidade: string;
  dentes_sensiveis: string;
  sangramento_gengival: AvaliacaoClinicaOdontologicaData['sangramento_gengival'];
  sangramento_notas: string;
  observacoes_clinicas: string;
};

const getEmptyFormData = (): FormDataType => ({
  condicao_gengival: 'saudavel',
  condicao_gengival_notas: '',
  presenca_placa: 'ausente',
  presenca_tartaro: 'ausente',
  placa_tartaro_notas: '',
  mobilidade_dentaria: 'ausente',
  dentes_com_mobilidade: '',
  sensibilidade_dentaria: 'ausente',
  tipo_sensibilidade: '',
  dentes_sensiveis: '',
  sangramento_gengival: 'ausente',
  sangramento_notas: '',
  observacoes_clinicas: '',
});

const getStatusBadgeVariant = (value: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
  if (value === 'ausente' || value === 'saudavel') return 'default';
  if (value.includes('leve') || value === 'grau_1' || value === 'pontual') return 'secondary';
  if (value.includes('severa') || value.includes('severo') || value === 'grau_3' || value === 'espontaneo' || value === 'periodontite') return 'destructive';
  return 'outline';
};

/**
 * AVALIAÇÃO CLÍNICA ODONTOLÓGICA
 * 
 * Registra:
 * - Condição gengival
 * - Presença de placa e tártaro
 * - Mobilidade dentária
 * - Sensibilidade
 * - Sangramento
 * - Observações clínicas gerais
 * 
 * Mantém histórico/versionamento completo
 */
export function AvaliacaoClinicaOdontologicaBlock({
  currentAvaliacao,
  avaliacaoHistory,
  loading = false,
  saving = false,
  canEdit = false,
  onSave,
}: AvaliacaoClinicaOdontologicaBlockProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<AvaliacaoClinicaOdontologicaData | null>(null);
  
  const [formData, setFormData] = useState(getEmptyFormData());

  const handleStartEdit = () => {
    if (currentAvaliacao) {
      setFormData({
        condicao_gengival: currentAvaliacao.condicao_gengival || 'saudavel',
        condicao_gengival_notas: currentAvaliacao.condicao_gengival_notas || '',
        presenca_placa: currentAvaliacao.presenca_placa || 'ausente',
        presenca_tartaro: currentAvaliacao.presenca_tartaro || 'ausente',
        placa_tartaro_notas: currentAvaliacao.placa_tartaro_notas || '',
        mobilidade_dentaria: currentAvaliacao.mobilidade_dentaria || 'ausente',
        dentes_com_mobilidade: currentAvaliacao.dentes_com_mobilidade || '',
        sensibilidade_dentaria: currentAvaliacao.sensibilidade_dentaria || 'ausente',
        tipo_sensibilidade: currentAvaliacao.tipo_sensibilidade || '',
        dentes_sensiveis: currentAvaliacao.dentes_sensiveis || '',
        sangramento_gengival: currentAvaliacao.sangramento_gengival || 'ausente',
        sangramento_notas: currentAvaliacao.sangramento_notas || '',
        observacoes_clinicas: currentAvaliacao.observacoes_clinicas || '',
      });
    }
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData(getEmptyFormData());
  };

  const handleSave = async () => {
    await onSave(formData);
    setIsEditing(false);
  };

  const getLabel = (value: string, options: { value: string; label: string }[]) => {
    return options.find(o => o.value === value)?.label || value;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // Empty state
  if (!currentAvaliacao && !isEditing) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-8 text-center">
          <Stethoscope className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
          <h3 className="font-semibold mb-2">Nenhuma avaliação clínica registrada</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Registre a avaliação clínica inicial do paciente.
          </p>
          {canEdit && (
            <Button onClick={() => setIsEditing(true)}>
              <Edit3 className="h-4 w-4 mr-2" />
              Registrar Avaliação
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  // Editing mode
  if (isEditing) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Edit3 className="h-5 w-5 text-primary" />
              {currentAvaliacao ? 'Atualizar Avaliação Clínica' : 'Nova Avaliação Clínica'}
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCancel} disabled={saving}>
                <X className="h-4 w-4 mr-1" />
                Cancelar
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-1" />
                {saving ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
          {currentAvaliacao && (
            <p className="text-sm text-muted-foreground">
              Uma nova versão será criada. O histórico anterior será preservado.
            </p>
          )}
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[550px] pr-4">
            <div className="space-y-6">
              {/* Condição Gengival */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2 text-base font-medium">
                  <Activity className="h-4 w-4 text-pink-500" />
                  Condição Gengival
                </Label>
                <Select
                  value={formData.condicao_gengival}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, condicao_gengival: v as typeof formData.condicao_gengival }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONDICAO_GENGIVAL_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${opt.color}`} />
                          {opt.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Textarea
                  placeholder="Observações sobre a condição gengival..."
                  value={formData.condicao_gengival_notas}
                  onChange={(e) => setFormData(prev => ({ ...prev, condicao_gengival_notas: e.target.value }))}
                  rows={2}
                />
              </div>

              <Separator />

              {/* Placa e Tártaro */}
              <div className="space-y-4">
                <Label className="flex items-center gap-2 text-base font-medium">
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                  Placa e Tártaro
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm">Presença de Placa</Label>
                    <Select
                      value={formData.presenca_placa}
                      onValueChange={(v) => setFormData(prev => ({ ...prev, presenca_placa: v as typeof formData.presenca_placa }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ausente">Ausente</SelectItem>
                        <SelectItem value="leve">Leve</SelectItem>
                        <SelectItem value="moderada">Moderada</SelectItem>
                        <SelectItem value="severa">Severa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Presença de Tártaro</Label>
                    <Select
                      value={formData.presenca_tartaro}
                      onValueChange={(v) => setFormData(prev => ({ ...prev, presenca_tartaro: v as typeof formData.presenca_tartaro }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ausente">Ausente</SelectItem>
                        <SelectItem value="leve">Leve</SelectItem>
                        <SelectItem value="moderado">Moderado</SelectItem>
                        <SelectItem value="severo">Severo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Textarea
                  placeholder="Localização, distribuição..."
                  value={formData.placa_tartaro_notas}
                  onChange={(e) => setFormData(prev => ({ ...prev, placa_tartaro_notas: e.target.value }))}
                  rows={2}
                />
              </div>

              <Separator />

              {/* Mobilidade Dentária */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2 text-base font-medium">
                  <Activity className="h-4 w-4 text-blue-500" />
                  Mobilidade Dentária
                </Label>
                <Select
                  value={formData.mobilidade_dentaria}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, mobilidade_dentaria: v as typeof formData.mobilidade_dentaria }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MOBILIDADE_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formData.mobilidade_dentaria !== 'ausente' && (
                  <Textarea
                    placeholder="Dentes afetados (ex: 16, 26, 36...)"
                    value={formData.dentes_com_mobilidade}
                    onChange={(e) => setFormData(prev => ({ ...prev, dentes_com_mobilidade: e.target.value }))}
                    rows={2}
                  />
                )}
              </div>

              <Separator />

              {/* Sensibilidade */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2 text-base font-medium">
                  <AlertCircle className="h-4 w-4 text-cyan-500" />
                  Sensibilidade Dentária
                </Label>
                <Select
                  value={formData.sensibilidade_dentaria}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, sensibilidade_dentaria: v as typeof formData.sensibilidade_dentaria }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ausente">Ausente</SelectItem>
                    <SelectItem value="leve">Leve</SelectItem>
                    <SelectItem value="moderada">Moderada</SelectItem>
                    <SelectItem value="severa">Severa</SelectItem>
                  </SelectContent>
                </Select>
                {formData.sensibilidade_dentaria !== 'ausente' && (
                  <>
                    <Textarea
                      placeholder="Tipo de sensibilidade (frio, calor, doce, toque, pressão...)"
                      value={formData.tipo_sensibilidade}
                      onChange={(e) => setFormData(prev => ({ ...prev, tipo_sensibilidade: e.target.value }))}
                      rows={2}
                    />
                    <Textarea
                      placeholder="Dentes afetados..."
                      value={formData.dentes_sensiveis}
                      onChange={(e) => setFormData(prev => ({ ...prev, dentes_sensiveis: e.target.value }))}
                      rows={2}
                    />
                  </>
                )}
              </div>

              <Separator />

              {/* Sangramento */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2 text-base font-medium">
                  <Droplet className="h-4 w-4 text-destructive" />
                  Sangramento Gengival
                </Label>
                <Select
                  value={formData.sangramento_gengival}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, sangramento_gengival: v as typeof formData.sangramento_gengival }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SANGRAMENTO_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formData.sangramento_gengival !== 'ausente' && (
                  <Textarea
                    placeholder="Localização, frequência..."
                    value={formData.sangramento_notas}
                    onChange={(e) => setFormData(prev => ({ ...prev, sangramento_notas: e.target.value }))}
                    rows={2}
                  />
                )}
              </div>

              <Separator />

              {/* Observações Gerais */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-base font-medium">
                  <Stethoscope className="h-4 w-4 text-primary" />
                  Observações Clínicas Gerais
                </Label>
                <Textarea
                  placeholder="Outras observações relevantes sobre o exame clínico..."
                  value={formData.observacoes_clinicas}
                  onChange={(e) => setFormData(prev => ({ ...prev, observacoes_clinicas: e.target.value }))}
                  rows={4}
                />
              </div>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    );
  }

  // View mode
  return (
    <div className="space-y-4">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">Avaliação Clínica</h2>
          <Badge variant="outline" className="text-xs">
            Versão {currentAvaliacao?.version || 1}
          </Badge>
        </div>
        <div className="flex gap-2">
          {avaliacaoHistory.length > 1 && (
            <Button variant="outline" size="sm" onClick={() => setShowHistory(true)}>
              <History className="h-4 w-4 mr-1" />
              Histórico ({avaliacaoHistory.length})
            </Button>
          )}
          {canEdit && (
            <Button size="sm" onClick={handleStartEdit}>
              <Edit3 className="h-4 w-4 mr-1" />
              Atualizar
            </Button>
          )}
        </div>
      </div>

      {/* Last update info */}
      {currentAvaliacao && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
          <Clock className="h-4 w-4" />
          <span>
            Última atualização em{' '}
            {format(parseISO(currentAvaliacao.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            {currentAvaliacao.created_by_name && ` por ${currentAvaliacao.created_by_name}`}
          </span>
        </div>
      )}

      {/* Summary badges */}
      <div className="flex flex-wrap gap-2 p-3 rounded-lg border bg-muted/30">
        <Badge variant={getStatusBadgeVariant(currentAvaliacao?.condicao_gengival || '')}>
          Gengiva: {getLabel(currentAvaliacao?.condicao_gengival || '', CONDICAO_GENGIVAL_OPTIONS)}
        </Badge>
        <Badge variant={getStatusBadgeVariant(currentAvaliacao?.presenca_placa || '')}>
          Placa: {getLabel(currentAvaliacao?.presenca_placa || '', PRESENCA_OPTIONS)}
        </Badge>
        <Badge variant={getStatusBadgeVariant(currentAvaliacao?.presenca_tartaro || '')}>
          Tártaro: {getLabel(currentAvaliacao?.presenca_tartaro || '', PRESENCA_OPTIONS)}
        </Badge>
        <Badge variant={getStatusBadgeVariant(currentAvaliacao?.sangramento_gengival || '')}>
          Sangramento: {getLabel(currentAvaliacao?.sangramento_gengival || '', SANGRAMENTO_OPTIONS)}
        </Badge>
      </div>

      {/* Avaliação Content */}
      <Card>
        <CardContent className="p-0">
          <Accordion type="multiple" defaultValue={['gengival', 'placa']} className="w-full">
            {/* Condição Gengival */}
            <AccordionItem value="gengival" className="border-b">
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-pink-500" />
                  <span>Condição Gengival</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 space-y-2">
                <Badge variant={getStatusBadgeVariant(currentAvaliacao?.condicao_gengival || '')}>
                  {getLabel(currentAvaliacao?.condicao_gengival || '', CONDICAO_GENGIVAL_OPTIONS)}
                </Badge>
                {currentAvaliacao?.condicao_gengival_notas && (
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {currentAvaliacao.condicao_gengival_notas}
                  </p>
                )}
              </AccordionContent>
            </AccordionItem>

            {/* Placa e Tártaro */}
            <AccordionItem value="placa" className="border-b">
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                  <span>Placa e Tártaro</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 space-y-2">
                <div className="flex gap-2">
                  <Badge variant={getStatusBadgeVariant(currentAvaliacao?.presenca_placa || '')}>
                    Placa: {getLabel(currentAvaliacao?.presenca_placa || '', PRESENCA_OPTIONS)}
                  </Badge>
                  <Badge variant={getStatusBadgeVariant(currentAvaliacao?.presenca_tartaro || '')}>
                    Tártaro: {getLabel(currentAvaliacao?.presenca_tartaro || '', PRESENCA_OPTIONS)}
                  </Badge>
                </div>
                {currentAvaliacao?.placa_tartaro_notas && (
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {currentAvaliacao.placa_tartaro_notas}
                  </p>
                )}
              </AccordionContent>
            </AccordionItem>

            {/* Mobilidade */}
            <AccordionItem value="mobilidade" className="border-b">
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-blue-500" />
                  <span>Mobilidade Dentária</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 space-y-2">
                <Badge variant={getStatusBadgeVariant(currentAvaliacao?.mobilidade_dentaria || '')}>
                  {getLabel(currentAvaliacao?.mobilidade_dentaria || '', MOBILIDADE_OPTIONS)}
                </Badge>
                {currentAvaliacao?.dentes_com_mobilidade && (
                  <p className="text-sm">
                    <span className="text-muted-foreground">Dentes afetados:</span> {currentAvaliacao.dentes_com_mobilidade}
                  </p>
                )}
              </AccordionContent>
            </AccordionItem>

            {/* Sensibilidade */}
            <AccordionItem value="sensibilidade" className="border-b">
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-cyan-500" />
                  <span>Sensibilidade</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 space-y-2">
                <Badge variant={getStatusBadgeVariant(currentAvaliacao?.sensibilidade_dentaria || '')}>
                  {getLabel(currentAvaliacao?.sensibilidade_dentaria || '', PRESENCA_OPTIONS)}
                </Badge>
                {currentAvaliacao?.tipo_sensibilidade && (
                  <p className="text-sm">
                    <span className="text-muted-foreground">Tipo:</span> {currentAvaliacao.tipo_sensibilidade}
                  </p>
                )}
                {currentAvaliacao?.dentes_sensiveis && (
                  <p className="text-sm">
                    <span className="text-muted-foreground">Dentes:</span> {currentAvaliacao.dentes_sensiveis}
                  </p>
                )}
              </AccordionContent>
            </AccordionItem>

            {/* Sangramento */}
            <AccordionItem value="sangramento" className="border-b">
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center gap-2">
                  <Droplet className="h-4 w-4 text-destructive" />
                  <span>Sangramento</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 space-y-2">
                <Badge variant={getStatusBadgeVariant(currentAvaliacao?.sangramento_gengival || '')}>
                  {getLabel(currentAvaliacao?.sangramento_gengival || '', SANGRAMENTO_OPTIONS)}
                </Badge>
                {currentAvaliacao?.sangramento_notas && (
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {currentAvaliacao.sangramento_notas}
                  </p>
                )}
              </AccordionContent>
            </AccordionItem>

            {/* Observações */}
            <AccordionItem value="observacoes" className="border-b-0">
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center gap-2">
                  <Stethoscope className="h-4 w-4 text-primary" />
                  <span>Observações Gerais</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <p className="text-sm whitespace-pre-wrap">
                  {currentAvaliacao?.observacoes_clinicas || <span className="italic text-muted-foreground">Nenhuma observação</span>}
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* History Dialog */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Histórico de Avaliações
            </DialogTitle>
            <DialogDescription>
              Todas as versões da avaliação clínica do paciente
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {avaliacaoHistory.map((item) => (
                <div
                  key={item.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50 ${
                    item.is_current ? 'border-primary bg-primary/5' : ''
                  }`}
                  onClick={() => setSelectedVersion(item)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant={item.is_current ? "default" : "outline"}>
                        Versão {item.version}
                      </Badge>
                      {item.is_current && (
                        <Badge variant="secondary" className="text-xs">Atual</Badge>
                      )}
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {format(parseISO(item.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    {item.created_by_name && ` • ${item.created_by_name}`}
                  </p>
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Version Detail Dialog */}
      <Dialog open={!!selectedVersion} onOpenChange={() => setSelectedVersion(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Versão {selectedVersion?.version}
              {selectedVersion?.is_current && (
                <Badge variant="default" className="text-xs">Atual</Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              Registrada em{' '}
              {selectedVersion && format(parseISO(selectedVersion.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Badge variant={getStatusBadgeVariant(selectedVersion?.condicao_gengival || '')}>
                  Gengiva: {getLabel(selectedVersion?.condicao_gengival || '', CONDICAO_GENGIVAL_OPTIONS)}
                </Badge>
                <Badge variant={getStatusBadgeVariant(selectedVersion?.presenca_placa || '')}>
                  Placa: {getLabel(selectedVersion?.presenca_placa || '', PRESENCA_OPTIONS)}
                </Badge>
                <Badge variant={getStatusBadgeVariant(selectedVersion?.sangramento_gengival || '')}>
                  Sangramento: {getLabel(selectedVersion?.sangramento_gengival || '', SANGRAMENTO_OPTIONS)}
                </Badge>
              </div>
              {selectedVersion?.observacoes_clinicas && (
                <div>
                  <p className="text-xs text-muted-foreground">Observações</p>
                  <p className="text-sm whitespace-pre-wrap">{selectedVersion.observacoes_clinicas}</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
