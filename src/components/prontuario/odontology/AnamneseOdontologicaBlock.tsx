import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
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
  FileText,
  Edit3,
  Save,
  X,
  Clock,
  History,
  AlertTriangle,
  Pill,
  Heart,
  Smile,
  Cigarette,
  Droplets,
  ChevronRight
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

/**
 * Estrutura de dados da Anamnese Odontológica
 */
export interface AnamneseOdontologicaData {
  id: string;
  patient_id: string;
  version: number;
  queixa_principal: string;
  historico_odontologico: string;
  ultima_consulta_dentista: string;
  tratamentos_anteriores: string;
  // Hábitos
  bruxismo: boolean;
  bruxismo_notas: string;
  tabagismo: boolean;
  tabagismo_notas: string;
  etilismo: boolean;
  habitos_higiene: string;
  uso_fio_dental: boolean;
  frequencia_escovacao: string;
  // Medicamentos e Alergias
  medicamentos_uso: string;
  alergias: string;
  alergia_anestesico: boolean;
  alergia_latex: boolean;
  // Doenças sistêmicas
  doencas_sistemicas: string;
  diabetes: boolean;
  hipertensao: boolean;
  cardiopatia: boolean;
  hepatite: boolean;
  hiv: boolean;
  gravidez: boolean;
  outras_condicoes: string;
  // Metadata
  created_at: string;
  created_by: string;
  created_by_name?: string;
  is_current: boolean;
}

interface AnamneseOdontologicaBlockProps {
  currentAnamnese: AnamneseOdontologicaData | null;
  anamneseHistory: AnamneseOdontologicaData[];
  loading?: boolean;
  saving?: boolean;
  canEdit?: boolean;
  onSave: (data: Omit<AnamneseOdontologicaData, 'id' | 'patient_id' | 'version' | 'created_at' | 'created_by' | 'created_by_name' | 'is_current'>) => Promise<void>;
}

const getEmptyFormData = () => ({
  queixa_principal: '',
  historico_odontologico: '',
  ultima_consulta_dentista: '',
  tratamentos_anteriores: '',
  bruxismo: false,
  bruxismo_notas: '',
  tabagismo: false,
  tabagismo_notas: '',
  etilismo: false,
  habitos_higiene: '',
  uso_fio_dental: false,
  frequencia_escovacao: '',
  medicamentos_uso: '',
  alergias: '',
  alergia_anestesico: false,
  alergia_latex: false,
  doencas_sistemicas: '',
  diabetes: false,
  hipertensao: false,
  cardiopatia: false,
  hepatite: false,
  hiv: false,
  gravidez: false,
  outras_condicoes: '',
});

/**
 * ANAMNESE ODONTOLÓGICA
 * 
 * Contém:
 * - Queixa principal
 * - Histórico odontológico (última consulta, tratamentos anteriores)
 * - Hábitos (bruxismo, tabagismo, higiene bucal)
 * - Uso de medicamentos
 * - Alergias (incluindo anestésicos e látex)
 * - Doenças sistêmicas relevantes
 * 
 * Regras:
 * - Não sobrescreve automaticamente anamneses anteriores
 * - Permite atualização manual (cria nova versão)
 * - Mantém histórico/versionamento completo
 */
export function AnamneseOdontologicaBlock({
  currentAnamnese,
  anamneseHistory,
  loading = false,
  saving = false,
  canEdit = false,
  onSave,
}: AnamneseOdontologicaBlockProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<AnamneseOdontologicaData | null>(null);
  
  const [formData, setFormData] = useState(getEmptyFormData());

  const handleStartEdit = () => {
    if (currentAnamnese) {
      setFormData({
        queixa_principal: currentAnamnese.queixa_principal || '',
        historico_odontologico: currentAnamnese.historico_odontologico || '',
        ultima_consulta_dentista: currentAnamnese.ultima_consulta_dentista || '',
        tratamentos_anteriores: currentAnamnese.tratamentos_anteriores || '',
        bruxismo: currentAnamnese.bruxismo || false,
        bruxismo_notas: currentAnamnese.bruxismo_notas || '',
        tabagismo: currentAnamnese.tabagismo || false,
        tabagismo_notas: currentAnamnese.tabagismo_notas || '',
        etilismo: currentAnamnese.etilismo || false,
        habitos_higiene: currentAnamnese.habitos_higiene || '',
        uso_fio_dental: currentAnamnese.uso_fio_dental || false,
        frequencia_escovacao: currentAnamnese.frequencia_escovacao || '',
        medicamentos_uso: currentAnamnese.medicamentos_uso || '',
        alergias: currentAnamnese.alergias || '',
        alergia_anestesico: currentAnamnese.alergia_anestesico || false,
        alergia_latex: currentAnamnese.alergia_latex || false,
        doencas_sistemicas: currentAnamnese.doencas_sistemicas || '',
        diabetes: currentAnamnese.diabetes || false,
        hipertensao: currentAnamnese.hipertensao || false,
        cardiopatia: currentAnamnese.cardiopatia || false,
        hepatite: currentAnamnese.hepatite || false,
        hiv: currentAnamnese.hiv || false,
        gravidez: currentAnamnese.gravidez || false,
        outras_condicoes: currentAnamnese.outras_condicoes || '',
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

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // Empty state
  if (!currentAnamnese && !isEditing) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-8 text-center">
          <Smile className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
          <h3 className="font-semibold mb-2">Nenhuma anamnese odontológica registrada</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Registre a anamnese inicial do paciente para iniciar o acompanhamento odontológico.
          </p>
          {canEdit && (
            <Button onClick={() => setIsEditing(true)}>
              <Edit3 className="h-4 w-4 mr-2" />
              Registrar Anamnese
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
              {currentAnamnese ? 'Atualizar Anamnese Odontológica' : 'Nova Anamnese Odontológica'}
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
          {currentAnamnese && (
            <p className="text-sm text-muted-foreground">
              Uma nova versão será criada. O histórico anterior será preservado.
            </p>
          )}
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-6">
              {/* Queixa Principal */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Smile className="h-4 w-4 text-primary" />
                  Queixa Principal *
                </Label>
                <Textarea
                  placeholder="Descreva a queixa principal do paciente (dor, sensibilidade, estética, etc.)..."
                  value={formData.queixa_principal}
                  onChange={(e) => setFormData(prev => ({ ...prev, queixa_principal: e.target.value }))}
                  rows={3}
                />
              </div>

              <Separator />

              {/* Histórico Odontológico */}
              <div className="space-y-4">
                <h3 className="font-medium flex items-center gap-2">
                  <History className="h-4 w-4 text-blue-500" />
                  Histórico Odontológico
                </h3>
                
                <div className="space-y-2">
                  <Label>Última Consulta ao Dentista</Label>
                  <Textarea
                    placeholder="Quando foi a última consulta? Qual foi o motivo?"
                    value={formData.ultima_consulta_dentista}
                    onChange={(e) => setFormData(prev => ({ ...prev, ultima_consulta_dentista: e.target.value }))}
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tratamentos Anteriores</Label>
                  <Textarea
                    placeholder="Extrações, tratamentos de canal, próteses, implantes, ortodontia..."
                    value={formData.tratamentos_anteriores}
                    onChange={(e) => setFormData(prev => ({ ...prev, tratamentos_anteriores: e.target.value }))}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Histórico Geral</Label>
                  <Textarea
                    placeholder="Outras informações relevantes sobre o histórico odontológico..."
                    value={formData.historico_odontologico}
                    onChange={(e) => setFormData(prev => ({ ...prev, historico_odontologico: e.target.value }))}
                    rows={3}
                  />
                </div>
              </div>

              <Separator />

              {/* Hábitos */}
              <div className="space-y-4">
                <h3 className="font-medium flex items-center gap-2">
                  <Cigarette className="h-4 w-4 text-orange-500" />
                  Hábitos
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3 p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-2">
                        Bruxismo
                      </Label>
                      <Switch
                        checked={formData.bruxismo}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, bruxismo: checked }))}
                      />
                    </div>
                    {formData.bruxismo && (
                      <Textarea
                        placeholder="Detalhes (noturno, diurno, uso de placa...)"
                        value={formData.bruxismo_notas}
                        onChange={(e) => setFormData(prev => ({ ...prev, bruxismo_notas: e.target.value }))}
                        rows={2}
                      />
                    )}
                  </div>

                  <div className="space-y-3 p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-2">
                        <Cigarette className="h-4 w-4" />
                        Tabagismo
                      </Label>
                      <Switch
                        checked={formData.tabagismo}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, tabagismo: checked }))}
                      />
                    </div>
                    {formData.tabagismo && (
                      <Textarea
                        placeholder="Quantidade, tempo de uso..."
                        value={formData.tabagismo_notas}
                        onChange={(e) => setFormData(prev => ({ ...prev, tabagismo_notas: e.target.value }))}
                        rows={2}
                      />
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <Label>Etilismo</Label>
                  <Switch
                    checked={formData.etilismo}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, etilismo: checked }))}
                  />
                </div>

                <div className="space-y-4 p-4 border rounded-lg">
                  <h4 className="font-medium flex items-center gap-2">
                    <Droplets className="h-4 w-4 text-cyan-500" />
                    Higiene Bucal
                  </h4>
                  
                  <div className="space-y-2">
                    <Label>Frequência de Escovação</Label>
                    <Textarea
                      placeholder="Quantas vezes ao dia? Após as refeições?"
                      value={formData.frequencia_escovacao}
                      onChange={(e) => setFormData(prev => ({ ...prev, frequencia_escovacao: e.target.value }))}
                      rows={2}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Uso de Fio Dental</Label>
                    <Switch
                      checked={formData.uso_fio_dental}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, uso_fio_dental: checked }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Observações sobre Higiene</Label>
                    <Textarea
                      placeholder="Uso de enxaguante, escova elétrica, outros hábitos..."
                      value={formData.habitos_higiene}
                      onChange={(e) => setFormData(prev => ({ ...prev, habitos_higiene: e.target.value }))}
                      rows={2}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Medicamentos e Alergias */}
              <div className="space-y-4">
                <h3 className="font-medium flex items-center gap-2">
                  <Pill className="h-4 w-4 text-blue-500" />
                  Medicamentos e Alergias
                </h3>

                <div className="space-y-2">
                  <Label>Medicamentos em Uso</Label>
                  <Textarea
                    placeholder="Liste os medicamentos em uso (anticoagulantes, bifosfonatos, anti-hipertensivos...)"
                    value={formData.medicamentos_uso}
                    onChange={(e) => setFormData(prev => ({ ...prev, medicamentos_uso: e.target.value }))}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    Alergias
                  </Label>
                  <Textarea
                    placeholder="Alergias medicamentosas, alimentares..."
                    value={formData.alergias}
                    onChange={(e) => setFormData(prev => ({ ...prev, alergias: e.target.value }))}
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg border-destructive/30 bg-destructive/5">
                    <Label className="text-destructive">Alergia a Anestésico Local</Label>
                    <Switch
                      checked={formData.alergia_anestesico}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, alergia_anestesico: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg border-destructive/30 bg-destructive/5">
                    <Label className="text-destructive">Alergia a Látex</Label>
                    <Switch
                      checked={formData.alergia_latex}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, alergia_latex: checked }))}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Doenças Sistêmicas */}
              <div className="space-y-4">
                <h3 className="font-medium flex items-center gap-2">
                  <Heart className="h-4 w-4 text-pink-500" />
                  Doenças Sistêmicas Relevantes
                </h3>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { key: 'diabetes', label: 'Diabetes' },
                    { key: 'hipertensao', label: 'Hipertensão' },
                    { key: 'cardiopatia', label: 'Cardiopatia' },
                    { key: 'hepatite', label: 'Hepatite' },
                    { key: 'hiv', label: 'HIV/AIDS' },
                    { key: 'gravidez', label: 'Gravidez' },
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                      <Label className="text-sm">{label}</Label>
                      <Switch
                        checked={formData[key as keyof typeof formData] as boolean}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, [key]: checked }))}
                      />
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <Label>Outras Doenças Sistêmicas</Label>
                  <Textarea
                    placeholder="Outras condições relevantes para o tratamento odontológico..."
                    value={formData.doencas_sistemicas}
                    onChange={(e) => setFormData(prev => ({ ...prev, doencas_sistemicas: e.target.value }))}
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Outras Condições ou Observações</Label>
                  <Textarea
                    placeholder="Informações adicionais relevantes..."
                    value={formData.outras_condicoes}
                    onChange={(e) => setFormData(prev => ({ ...prev, outras_condicoes: e.target.value }))}
                    rows={2}
                  />
                </div>
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
          <h2 className="text-lg font-semibold">Anamnese Odontológica</h2>
          <Badge variant="outline" className="text-xs">
            Versão {currentAnamnese?.version || 1}
          </Badge>
        </div>
        <div className="flex gap-2">
          {anamneseHistory.length > 1 && (
            <Button variant="outline" size="sm" onClick={() => setShowHistory(true)}>
              <History className="h-4 w-4 mr-1" />
              Histórico ({anamneseHistory.length})
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
      {currentAnamnese && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
          <Clock className="h-4 w-4" />
          <span>
            Última atualização em{' '}
            {format(parseISO(currentAnamnese.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            {currentAnamnese.created_by_name && ` por ${currentAnamnese.created_by_name}`}
          </span>
        </div>
      )}

      {/* Critical Alerts */}
      {(currentAnamnese?.alergia_anestesico || currentAnamnese?.alergia_latex) && (
        <div className="flex flex-wrap gap-2 p-3 rounded-lg border border-destructive/30 bg-destructive/5">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <span className="text-sm font-medium text-destructive">Alergias Críticas:</span>
          {currentAnamnese.alergia_anestesico && (
            <Badge variant="destructive" className="text-xs">Anestésico Local</Badge>
          )}
          {currentAnamnese.alergia_latex && (
            <Badge variant="destructive" className="text-xs">Látex</Badge>
          )}
        </div>
      )}

      {/* Anamnese Content */}
      <Card>
        <CardContent className="p-0">
          <Accordion type="multiple" defaultValue={['queixa', 'historico']} className="w-full">
            {/* Queixa Principal */}
            <AccordionItem value="queixa" className="border-b">
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center gap-2">
                  <Smile className="h-4 w-4 text-primary" />
                  <span>Queixa Principal</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <p className="text-sm whitespace-pre-wrap">
                  {currentAnamnese?.queixa_principal || <span className="italic text-muted-foreground">Não informado</span>}
                </p>
              </AccordionContent>
            </AccordionItem>

            {/* Histórico Odontológico */}
            <AccordionItem value="historico" className="border-b">
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4 text-blue-500" />
                  <span>Histórico Odontológico</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground">Última Consulta</p>
                  <p className="text-sm">
                    {currentAnamnese?.ultima_consulta_dentista || <span className="italic text-muted-foreground">Não informado</span>}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Tratamentos Anteriores</p>
                  <p className="text-sm whitespace-pre-wrap">
                    {currentAnamnese?.tratamentos_anteriores || <span className="italic text-muted-foreground">Não informado</span>}
                  </p>
                </div>
                {currentAnamnese?.historico_odontologico && (
                  <div>
                    <p className="text-xs text-muted-foreground">Histórico Geral</p>
                    <p className="text-sm whitespace-pre-wrap">{currentAnamnese.historico_odontologico}</p>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>

            {/* Hábitos */}
            <AccordionItem value="habitos" className="border-b">
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center gap-2">
                  <Cigarette className="h-4 w-4 text-orange-500" />
                  <span>Hábitos</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  <Badge variant={currentAnamnese?.bruxismo ? "destructive" : "secondary"}>
                    Bruxismo: {currentAnamnese?.bruxismo ? 'Sim' : 'Não'}
                  </Badge>
                  <Badge variant={currentAnamnese?.tabagismo ? "destructive" : "secondary"}>
                    Tabagismo: {currentAnamnese?.tabagismo ? 'Sim' : 'Não'}
                  </Badge>
                  <Badge variant={currentAnamnese?.etilismo ? "secondary" : "secondary"}>
                    Etilismo: {currentAnamnese?.etilismo ? 'Sim' : 'Não'}
                  </Badge>
                  <Badge variant={currentAnamnese?.uso_fio_dental ? "default" : "secondary"}>
                    Fio Dental: {currentAnamnese?.uso_fio_dental ? 'Sim' : 'Não'}
                  </Badge>
                </div>
                {currentAnamnese?.bruxismo_notas && (
                  <p className="text-sm"><strong>Bruxismo:</strong> {currentAnamnese.bruxismo_notas}</p>
                )}
                {currentAnamnese?.tabagismo_notas && (
                  <p className="text-sm"><strong>Tabagismo:</strong> {currentAnamnese.tabagismo_notas}</p>
                )}
                {currentAnamnese?.frequencia_escovacao && (
                  <p className="text-sm"><strong>Escovação:</strong> {currentAnamnese.frequencia_escovacao}</p>
                )}
                {currentAnamnese?.habitos_higiene && (
                  <p className="text-sm"><strong>Higiene:</strong> {currentAnamnese.habitos_higiene}</p>
                )}
              </AccordionContent>
            </AccordionItem>

            {/* Medicamentos e Alergias */}
            <AccordionItem value="medicamentos" className="border-b">
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center gap-2">
                  <Pill className="h-4 w-4 text-blue-500" />
                  <span>Medicamentos e Alergias</span>
                  {(currentAnamnese?.alergia_anestesico || currentAnamnese?.alergia_latex || currentAnamnese?.alergias) && (
                    <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground">Medicamentos em Uso</p>
                  <p className="text-sm whitespace-pre-wrap">
                    {currentAnamnese?.medicamentos_uso || <span className="italic text-muted-foreground">Nenhum</span>}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Alergias</p>
                  <p className="text-sm whitespace-pre-wrap">
                    {currentAnamnese?.alergias || <span className="italic text-muted-foreground">Nenhuma</span>}
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Doenças Sistêmicas */}
            <AccordionItem value="doencas" className="border-b-0">
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-pink-500" />
                  <span>Doenças Sistêmicas</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 space-y-3">
                <div className="flex flex-wrap gap-2">
                  {currentAnamnese?.diabetes && <Badge variant="secondary">Diabetes</Badge>}
                  {currentAnamnese?.hipertensao && <Badge variant="secondary">Hipertensão</Badge>}
                  {currentAnamnese?.cardiopatia && <Badge variant="secondary">Cardiopatia</Badge>}
                  {currentAnamnese?.hepatite && <Badge variant="secondary">Hepatite</Badge>}
                  {currentAnamnese?.hiv && <Badge variant="secondary">HIV/AIDS</Badge>}
                  {currentAnamnese?.gravidez && <Badge variant="secondary">Gravidez</Badge>}
                  {!currentAnamnese?.diabetes && !currentAnamnese?.hipertensao && !currentAnamnese?.cardiopatia && 
                   !currentAnamnese?.hepatite && !currentAnamnese?.hiv && !currentAnamnese?.gravidez && (
                    <span className="italic text-muted-foreground text-sm">Nenhuma marcada</span>
                  )}
                </div>
                {currentAnamnese?.doencas_sistemicas && (
                  <div>
                    <p className="text-xs text-muted-foreground">Outras Doenças</p>
                    <p className="text-sm whitespace-pre-wrap">{currentAnamnese.doencas_sistemicas}</p>
                  </div>
                )}
                {currentAnamnese?.outras_condicoes && (
                  <div>
                    <p className="text-xs text-muted-foreground">Observações</p>
                    <p className="text-sm whitespace-pre-wrap">{currentAnamnese.outras_condicoes}</p>
                  </div>
                )}
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
              Histórico de Anamneses
            </DialogTitle>
            <DialogDescription>
              Todas as versões da anamnese odontológica do paciente
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {anamneseHistory.map((item) => (
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
              {selectedVersion?.created_by_name && ` por ${selectedVersion.created_by_name}`}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[400px]">
            <div className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground">Queixa Principal</p>
                <p className="text-sm whitespace-pre-wrap">{selectedVersion?.queixa_principal || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Histórico Odontológico</p>
                <p className="text-sm whitespace-pre-wrap">{selectedVersion?.historico_odontologico || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tratamentos Anteriores</p>
                <p className="text-sm whitespace-pre-wrap">{selectedVersion?.tratamentos_anteriores || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Medicamentos</p>
                <p className="text-sm whitespace-pre-wrap">{selectedVersion?.medicamentos_uso || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Alergias</p>
                <p className="text-sm whitespace-pre-wrap">{selectedVersion?.alergias || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Doenças Sistêmicas</p>
                <p className="text-sm whitespace-pre-wrap">{selectedVersion?.doencas_sistemicas || '-'}</p>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
