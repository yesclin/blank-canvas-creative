import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  Edit,
  Save,
  X,
  Heart,
  Pill,
  AlertTriangle,
  Droplet,
  Users,
  FileText,
  Stethoscope,
  User,
  Phone,
  Mail,
  Clock,
  History,
  CheckCircle,
  Cigarette,
  Wine,
  Dumbbell,
  MessageSquare,
  Shield
} from "lucide-react";
import { 
  Anamnesis,
  PatientGuardian,
  smokingLabels,
  alcoholLabels,
  physicalActivityLabels,
  AnamnesisVersion
} from "@/types/prontuario";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface AnamnesisTabProps {
  anamnesis: Anamnesis;
  guardians: PatientGuardian[];
  versions?: AnamnesisVersion[];
  onSave?: (data: Partial<Anamnesis>) => void;
  canEdit?: boolean;
}

export function AnamnesisTab({ 
  anamnesis, 
  guardians, 
  versions = [],
  onSave,
  canEdit = true
}: AnamnesisTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  
  const [formData, setFormData] = useState({
    chief_complaint: anamnesis.chief_complaint || '',
    current_disease_history: anamnesis.current_disease_history || '',
    pre_existing_conditions: anamnesis.pre_existing_conditions.join(', '),
    allergies: anamnesis.allergies.join(', '),
    current_medications: anamnesis.current_medications.join(', '),
    family_history: anamnesis.family_history || '',
    blood_type: anamnesis.blood_type || '',
    clinical_restrictions: anamnesis.clinical_restrictions || '',
    general_observations: anamnesis.general_observations || '',
    habits: { ...anamnesis.habits }
  });

  // Auto-save indicator
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (isEditing) {
      setHasChanges(true);
    }
  }, [formData]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updatedData: Partial<Anamnesis> = {
        chief_complaint: formData.chief_complaint,
        current_disease_history: formData.current_disease_history,
        pre_existing_conditions: formData.pre_existing_conditions.split(',').map(s => s.trim()).filter(Boolean),
        allergies: formData.allergies.split(',').map(s => s.trim()).filter(Boolean),
        current_medications: formData.current_medications.split(',').map(s => s.trim()).filter(Boolean),
        family_history: formData.family_history,
        blood_type: formData.blood_type,
        clinical_restrictions: formData.clinical_restrictions,
        general_observations: formData.general_observations,
        habits: formData.habits
      };
      
      await onSave?.(updatedData);
      toast.success("Anamnese salva com sucesso");
      setIsEditing(false);
      setHasChanges(false);
    } catch (error) {
      toast.error("Erro ao salvar anamnese");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      chief_complaint: anamnesis.chief_complaint || '',
      current_disease_history: anamnesis.current_disease_history || '',
      pre_existing_conditions: anamnesis.pre_existing_conditions.join(', '),
      allergies: anamnesis.allergies.join(', '),
      current_medications: anamnesis.current_medications.join(', '),
      family_history: anamnesis.family_history || '',
      blood_type: anamnesis.blood_type || '',
      clinical_restrictions: anamnesis.clinical_restrictions || '',
      general_observations: anamnesis.general_observations || '',
      habits: { ...anamnesis.habits }
    });
    setIsEditing(false);
    setHasChanges(false);
  };

  const updateHabit = (key: keyof typeof formData.habits, value: string) => {
    setFormData(prev => ({
      ...prev,
      habits: { ...prev.habits, [key]: value }
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header com ações e auditoria */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Stethoscope className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Anamnese</h2>
            <p className="text-sm text-muted-foreground">
              Base clínica do paciente • Versão {anamnesis.version}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Auditoria Info */}
          <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground mr-3">
            <Clock className="h-3 w-3" />
            <span>
              Atualizado em {format(parseISO(anamnesis.updated_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
              {anamnesis.updated_by_name && ` por ${anamnesis.updated_by_name}`}
            </span>
          </div>

          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowVersions(!showVersions)}
          >
            <History className="h-4 w-4 mr-1" />
            Histórico
          </Button>

          {canEdit && (
            isEditing ? (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleCancel} disabled={isSaving}>
                  <X className="h-4 w-4 mr-1" />
                  Cancelar
                </Button>
                <Button size="sm" onClick={handleSave} disabled={isSaving}>
                  <Save className="h-4 w-4 mr-1" />
                  {isSaving ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            ) : (
              <Button variant="default" size="sm" onClick={() => setIsEditing(true)}>
                <Edit className="h-4 w-4 mr-1" />
                Editar
              </Button>
            )
          )}
        </div>
      </div>

      {/* Alerta de alterações não salvas */}
      {isEditing && hasChanges && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-700">
            Você tem alterações não salvas. Clique em "Salvar" para manter as mudanças.
          </AlertDescription>
        </Alert>
      )}

      {/* Histórico de Versões */}
      {showVersions && versions.length > 0 && (
        <Card className="border-dashed">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <History className="h-4 w-4" />
              Histórico de Alterações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-40">
              <div className="space-y-2">
                {versions.map(version => (
                  <div key={version.id} className="flex items-center gap-3 p-2 rounded hover:bg-muted/50">
                    <Badge variant="outline">v{version.version}</Badge>
                    <span className="text-sm">{version.changed_by_name}</span>
                    <span className="text-xs text-muted-foreground">
                      {format(parseISO(version.changed_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </span>
                    {version.change_summary && (
                      <span className="text-xs text-muted-foreground">- {version.change_summary}</span>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Conteúdo Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Coluna 1: Queixa e História */}
        <div className="space-y-6">
          {/* Queixa Principal */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Queixa Principal
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <Textarea
                  value={formData.chief_complaint}
                  onChange={(e) => setFormData({ ...formData, chief_complaint: e.target.value })}
                  placeholder="Descreva a queixa principal do paciente..."
                  rows={3}
                  className="resize-none"
                />
              ) : (
                <p className="text-sm p-3 bg-muted/30 rounded-lg min-h-[60px]">
                  {anamnesis.chief_complaint || <span className="text-muted-foreground italic">Não informado</span>}
                </p>
              )}
            </CardContent>
          </Card>

          {/* História da Doença Atual */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-500" />
                História da Doença Atual
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <Textarea
                  value={formData.current_disease_history}
                  onChange={(e) => setFormData({ ...formData, current_disease_history: e.target.value })}
                  placeholder="Descreva a história da doença atual..."
                  rows={5}
                  className="resize-none"
                />
              ) : (
                <p className="text-sm p-3 bg-muted/30 rounded-lg min-h-[100px] whitespace-pre-wrap">
                  {anamnesis.current_disease_history || <span className="text-muted-foreground italic">Não informado</span>}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Doenças Pré-existentes */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Heart className="h-5 w-5 text-pink-500" />
                Doenças Pré-existentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <Textarea
                  value={formData.pre_existing_conditions}
                  onChange={(e) => setFormData({ ...formData, pre_existing_conditions: e.target.value })}
                  placeholder="Separe por vírgula: Hipertensão, Diabetes, Asma..."
                  rows={2}
                />
              ) : (
                <>
                  {anamnesis.pre_existing_conditions.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {anamnesis.pre_existing_conditions.map((condition, idx) => (
                        <Badge key={idx} variant="secondary">{condition}</Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">Nenhuma doença informada</p>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Coluna 2: Dados Críticos e Hábitos */}
        <div className="space-y-6">
          {/* Alergias - Destaque Visual */}
          <Card className="border-red-200 bg-red-50/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2 text-red-700">
                <AlertTriangle className="h-5 w-5" />
                Alergias
                <Badge variant="destructive" className="ml-2">CRÍTICO</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <Textarea
                  value={formData.allergies}
                  onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                  placeholder="Separe por vírgula: Dipirona, Penicilina, Frutos do mar..."
                  rows={2}
                  className="border-red-200"
                />
              ) : (
                <>
                  {anamnesis.allergies.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {anamnesis.allergies.map((allergy, idx) => (
                        <Badge key={idx} variant="destructive">{allergy}</Badge>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm">Nenhuma alergia conhecida (NKDA)</span>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Medicamentos em Uso */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Pill className="h-5 w-5 text-blue-500" />
                Medicamentos em Uso Contínuo
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <Textarea
                  value={formData.current_medications}
                  onChange={(e) => setFormData({ ...formData, current_medications: e.target.value })}
                  placeholder="Separe por vírgula: Losartana 50mg, Metformina 850mg..."
                  rows={2}
                />
              ) : (
                <>
                  {anamnesis.current_medications.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {anamnesis.current_medications.map((med, idx) => (
                        <Badge key={idx} variant="outline">{med}</Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">Nenhum medicamento em uso</p>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Tipo Sanguíneo e Restrições */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Droplet className="h-5 w-5 text-red-500" />
                Dados Complementares
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Tipo Sanguíneo</Label>
                  {isEditing ? (
                    <Select 
                      value={formData.blood_type} 
                      onValueChange={(v) => setFormData({ ...formData, blood_type: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge variant="outline" className="mt-1 text-base">
                      {anamnesis.blood_type || 'Não informado'}
                    </Badge>
                  )}
                </div>
              </div>

              <Separator />

              <div>
                <Label className="text-sm font-medium text-yellow-700 flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Restrições Clínicas
                </Label>
                {isEditing ? (
                  <Textarea
                    value={formData.clinical_restrictions}
                    onChange={(e) => setFormData({ ...formData, clinical_restrictions: e.target.value })}
                    placeholder="Descreva restrições importantes..."
                    rows={2}
                    className="mt-2"
                  />
                ) : (
                  <p className="text-sm mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    {anamnesis.clinical_restrictions || 'Nenhuma restrição informada'}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Seções Expansíveis */}
      <Accordion type="multiple" defaultValue={["habits", "family", "guardians"]} className="space-y-4">
        {/* Hábitos de Vida */}
        <AccordionItem value="habits" className="border rounded-lg">
          <AccordionTrigger className="px-4 hover:no-underline">
            <div className="flex items-center gap-2">
              <Dumbbell className="h-5 w-5 text-green-500" />
              <span className="font-medium">Hábitos de Vida</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Tabagismo */}
              <div className="p-3 rounded-lg bg-muted/30">
                <Label className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <Cigarette className="h-4 w-4" />
                  Tabagismo
                </Label>
                {isEditing ? (
                  <div className="space-y-2">
                    <Select 
                      value={formData.habits.smoking || ''} 
                      onValueChange={(v) => updateHabit('smoking', v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(smokingLabels).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="Detalhes (opcional)"
                      value={formData.habits.smoking_details || ''}
                      onChange={(e) => updateHabit('smoking_details', e.target.value)}
                    />
                  </div>
                ) : (
                  <div>
                    <Badge variant={anamnesis.habits.smoking === 'current' ? 'destructive' : 'secondary'}>
                      {anamnesis.habits.smoking ? smokingLabels[anamnesis.habits.smoking] : 'Não informado'}
                    </Badge>
                    {anamnesis.habits.smoking_details && (
                      <p className="text-xs text-muted-foreground mt-1">{anamnesis.habits.smoking_details}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Álcool */}
              <div className="p-3 rounded-lg bg-muted/30">
                <Label className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <Wine className="h-4 w-4" />
                  Consumo de Álcool
                </Label>
                {isEditing ? (
                  <div className="space-y-2">
                    <Select 
                      value={formData.habits.alcohol || ''} 
                      onValueChange={(v) => updateHabit('alcohol', v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(alcoholLabels).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="Detalhes (opcional)"
                      value={formData.habits.alcohol_details || ''}
                      onChange={(e) => updateHabit('alcohol_details', e.target.value)}
                    />
                  </div>
                ) : (
                  <div>
                    <Badge variant={anamnesis.habits.alcohol === 'regular' ? 'destructive' : 'secondary'}>
                      {anamnesis.habits.alcohol ? alcoholLabels[anamnesis.habits.alcohol] : 'Não informado'}
                    </Badge>
                    {anamnesis.habits.alcohol_details && (
                      <p className="text-xs text-muted-foreground mt-1">{anamnesis.habits.alcohol_details}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Atividade Física */}
              <div className="p-3 rounded-lg bg-muted/30">
                <Label className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <Dumbbell className="h-4 w-4" />
                  Atividade Física
                </Label>
                {isEditing ? (
                  <div className="space-y-2">
                    <Select 
                      value={formData.habits.physical_activity || ''} 
                      onValueChange={(v) => updateHabit('physical_activity', v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(physicalActivityLabels).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="Detalhes (opcional)"
                      value={formData.habits.physical_activity_details || ''}
                      onChange={(e) => updateHabit('physical_activity_details', e.target.value)}
                    />
                  </div>
                ) : (
                  <div>
                    <Badge variant={anamnesis.habits.physical_activity === 'intense' ? 'default' : 'secondary'}>
                      {anamnesis.habits.physical_activity ? physicalActivityLabels[anamnesis.habits.physical_activity] : 'Não informado'}
                    </Badge>
                    {anamnesis.habits.physical_activity_details && (
                      <p className="text-xs text-muted-foreground mt-1">{anamnesis.habits.physical_activity_details}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Histórico Familiar */}
        <AccordionItem value="family" className="border rounded-lg">
          <AccordionTrigger className="px-4 hover:no-underline">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-500" />
              <span className="font-medium">Histórico Familiar</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            {isEditing ? (
              <Textarea
                value={formData.family_history}
                onChange={(e) => setFormData({ ...formData, family_history: e.target.value })}
                placeholder="Descreva doenças relevantes na família (ex: Pai - IAM aos 55 anos; Mãe - DM2; Avó materna - CA mama)..."
                rows={4}
              />
            ) : (
              <p className="text-sm p-3 bg-muted/30 rounded-lg whitespace-pre-wrap">
                {anamnesis.family_history || <span className="text-muted-foreground italic">Não informado</span>}
              </p>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* Observações Gerais */}
        <AccordionItem value="observations" className="border rounded-lg">
          <AccordionTrigger className="px-4 hover:no-underline">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-gray-500" />
              <span className="font-medium">Observações Gerais</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            {isEditing ? (
              <Textarea
                value={formData.general_observations}
                onChange={(e) => setFormData({ ...formData, general_observations: e.target.value })}
                placeholder="Outras observações relevantes sobre o paciente..."
                rows={4}
              />
            ) : (
              <p className="text-sm p-3 bg-muted/30 rounded-lg whitespace-pre-wrap">
                {anamnesis.general_observations || <span className="text-muted-foreground italic">Nenhuma observação</span>}
              </p>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* Responsáveis Legais */}
        <AccordionItem value="guardians" className="border rounded-lg">
          <AccordionTrigger className="px-4 hover:no-underline">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <span className="font-medium">Responsáveis Legais</span>
              {guardians.length > 0 && (
                <Badge variant="secondary">{guardians.length}</Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            {guardians.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {guardians.map(guardian => (
                  <div key={guardian.id} className="p-4 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{guardian.full_name}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">{guardian.relationship}</Badge>
                          {guardian.is_primary && (
                            <Badge className="text-xs">Principal</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      {guardian.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-3 w-3" />
                          <span>{guardian.phone}</span>
                        </div>
                      )}
                      {guardian.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-3 w-3" />
                          <span>{guardian.email}</span>
                        </div>
                      )}
                      {guardian.cpf && (
                        <div className="flex items-center gap-2">
                          <FileText className="h-3 w-3" />
                          <span>CPF: {guardian.cpf}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">
                Nenhum responsável legal cadastrado
              </p>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
