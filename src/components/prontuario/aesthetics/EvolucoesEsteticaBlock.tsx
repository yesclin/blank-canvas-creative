/**
 * ESTÉTICA - Evoluções Estéticas
 * 
 * Bloco principal para registro de evoluções clínicas em procedimentos estéticos.
 * Inclui resposta do paciente, intercorrências, satisfação e orientações.
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Activity,
  Plus,
  FileSignature,
  Calendar,
  User,
  CheckCircle,
  Clock,
  AlertTriangle,
  Smile,
  ThumbsUp,
  ThumbsDown,
  Camera,
  ListChecks,
  CalendarClock,
  Sparkles,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  useEvolucoesEsteticaData,
  SATISFACTION_LEVELS,
  RESPONSE_TYPES,
  COMMON_COMPLICATIONS,
  type EvolucaoEstetica,
  type EvolucaoEsteticaFormData,
  type SatisfactionLevel,
  type ResponseType,
} from '@/hooks/aesthetics/useEvolucoesEsteticaData';

interface EvolucoesEsteticaBlockProps {
  patientId: string | null;
  appointmentId?: string | null;
  canEdit?: boolean;
}

export function EvolucoesEsteticaBlock({
  patientId,
  appointmentId,
  canEdit = false,
}: EvolucoesEsteticaBlockProps) {
  const {
    evolucoes,
    isLoading,
    create,
    sign,
    isCreating,
    isSigning,
  } = useEvolucoesEsteticaData({ patientId, appointmentId });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState<EvolucaoEsteticaFormData>({
    evolution_date: new Date().toISOString().split('T')[0],
    procedure_performed: '',
    treatment_area: '',
    patient_response: undefined,
    complications: [],
    complications_notes: '',
    satisfaction_level: undefined,
    satisfaction_notes: '',
    planned_adjustments: '',
    post_procedure_guidelines: [],
    follow_up_date: '',
    notes: '',
    photos_taken: false,
  });

  const [newGuideline, setNewGuideline] = useState('');

  const resetForm = () => {
    setFormData({
      evolution_date: new Date().toISOString().split('T')[0],
      procedure_performed: '',
      treatment_area: '',
      patient_response: undefined,
      complications: [],
      complications_notes: '',
      satisfaction_level: undefined,
      satisfaction_notes: '',
      planned_adjustments: '',
      post_procedure_guidelines: [],
      follow_up_date: '',
      notes: '',
      photos_taken: false,
    });
    setNewGuideline('');
  };

  const handleOpenDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const handleSave = async (andSign: boolean = false) => {
    if (!formData.procedure_performed) return;

    const result = await create(formData);
    if (result && andSign) {
      await sign(result.id);
    }
    setDialogOpen(false);
    resetForm();
  };

  const handleSign = async (evolucaoId: string) => {
    await sign(evolucaoId);
  };

  const toggleComplication = (complication: string) => {
    const current = formData.complications || [];
    if (current.includes(complication)) {
      setFormData({ ...formData, complications: current.filter(c => c !== complication) });
    } else {
      setFormData({ ...formData, complications: [...current, complication] });
    }
  };

  const addGuideline = () => {
    if (!newGuideline.trim()) return;
    const current = formData.post_procedure_guidelines || [];
    setFormData({ ...formData, post_procedure_guidelines: [...current, newGuideline.trim()] });
    setNewGuideline('');
  };

  const removeGuideline = (index: number) => {
    const current = formData.post_procedure_guidelines || [];
    setFormData({ ...formData, post_procedure_guidelines: current.filter((_, i) => i !== index) });
  };

  const getSatisfactionIcon = (level: SatisfactionLevel | undefined) => {
    if (!level) return null;
    if (level === 'muito_satisfeito' || level === 'satisfeito') {
      return <ThumbsUp className="h-4 w-4" />;
    }
    if (level === 'insatisfeito' || level === 'muito_insatisfeito') {
      return <ThumbsDown className="h-4 w-4" />;
    }
    return <Smile className="h-4 w-4" />;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!patientId) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Selecione um paciente.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Evoluções Estéticas</h2>
          <Badge variant="secondary">{evolucoes.length}</Badge>
        </div>
        {canEdit && (
          <Button onClick={handleOpenDialog}>
            <Plus className="h-4 w-4 mr-1.5" />
            Nova Evolução
          </Button>
        )}
      </div>

      {/* Lista de Evoluções */}
      {evolucoes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-2">Nenhuma evolução registrada.</p>
            <p className="text-muted-foreground text-sm mb-4">
              Registre a evolução dos procedimentos estéticos deste paciente.
            </p>
            {canEdit && (
              <Button onClick={handleOpenDialog}>
                <Plus className="h-4 w-4 mr-1.5" />
                Registrar Primeira Evolução
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {evolucoes.map((ev) => (
            <Card key={ev.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{ev.procedure_performed}</Badge>
                    {ev.status === 'signed' ? (
                      <Badge variant="default" className="bg-primary">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Assinada
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <Clock className="h-3 w-3 mr-1" />
                        Rascunho
                      </Badge>
                    )}
                    {ev.complications.length > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        {ev.complications.length} intercorrência(s)
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {format(parseISO(ev.evolution_date), "dd/MM/yyyy", { locale: ptBR })}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Profissional */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-3 w-3" />
                  {ev.professional_name}
                </div>

                {/* Área e Resposta */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  {ev.treatment_area && (
                    <div className="p-2 bg-muted rounded">
                      <p className="text-xs text-muted-foreground">Área</p>
                      <p className="font-medium">{ev.treatment_area}</p>
                    </div>
                  )}
                  {ev.patient_response && (
                    <div className="p-2 bg-muted rounded">
                      <p className="text-xs text-muted-foreground">Resposta</p>
                      <p className="font-medium capitalize">
                        {RESPONSE_TYPES.find(r => r.value === ev.patient_response)?.label || ev.patient_response}
                      </p>
                    </div>
                  )}
                  {ev.satisfaction_level && (
                    <div className="p-2 bg-muted rounded">
                      <p className="text-xs text-muted-foreground">Satisfação</p>
                      <p className="font-medium flex items-center gap-1">
                        {getSatisfactionIcon(ev.satisfaction_level)}
                        {SATISFACTION_LEVELS.find(s => s.value === ev.satisfaction_level)?.label}
                      </p>
                    </div>
                  )}
                  {ev.photos_taken && (
                    <div className="p-2 bg-muted rounded">
                      <p className="text-xs text-muted-foreground">Fotos</p>
                      <p className="font-medium flex items-center gap-1">
                        <Camera className="h-3 w-3" />
                        Registradas
                      </p>
                    </div>
                  )}
                </div>

                {/* Intercorrências */}
                {ev.complications.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Intercorrências</p>
                    <div className="flex flex-wrap gap-1">
                      {ev.complications.map((comp, i) => (
                        <Badge key={i} variant="outline" className="text-xs border-destructive/50 text-destructive">
                          {comp}
                        </Badge>
                      ))}
                    </div>
                    {ev.complications_notes && (
                      <p className="text-sm text-muted-foreground mt-1">{ev.complications_notes}</p>
                    )}
                  </div>
                )}

                {/* Ajustes Planejados */}
                {ev.planned_adjustments && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Ajustes Planejados</p>
                    <p className="text-sm bg-primary/5 p-2 rounded border-l-2 border-primary">
                      {ev.planned_adjustments}
                    </p>
                  </div>
                )}

                {/* Orientações */}
                {ev.post_procedure_guidelines.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Orientações Pós-Procedimento</p>
                    <ul className="list-disc list-inside text-sm space-y-0.5">
                      {ev.post_procedure_guidelines.map((guideline, i) => (
                        <li key={i}>{guideline}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Retorno */}
                {ev.follow_up_date && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CalendarClock className="h-4 w-4" />
                    Retorno: {format(parseISO(ev.follow_up_date), "dd/MM/yyyy", { locale: ptBR })}
                  </div>
                )}

                {/* Observações */}
                {ev.notes && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Observações</p>
                    <p className="text-sm bg-muted/50 p-2 rounded">{ev.notes}</p>
                  </div>
                )}

                {/* Ação de Assinar */}
                {ev.status === 'draft' && canEdit && (
                  <div className="pt-2 border-t">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSign(ev.id)}
                      disabled={isSigning}
                    >
                      <FileSignature className="h-4 w-4 mr-1.5" />
                      Assinar Evolução
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog de Nova Evolução */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Evolução Estética</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Data e Procedimento */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Data *</Label>
                <Input
                  type="date"
                  value={formData.evolution_date}
                  onChange={(e) => setFormData({ ...formData, evolution_date: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Procedimento Realizado *</Label>
                <Input
                  value={formData.procedure_performed}
                  onChange={(e) => setFormData({ ...formData, procedure_performed: e.target.value })}
                  placeholder="Ex: Toxina - Glabela"
                />
              </div>
            </div>

            {/* Área e Resposta */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Área Tratada</Label>
                <Input
                  value={formData.treatment_area}
                  onChange={(e) => setFormData({ ...formData, treatment_area: e.target.value })}
                  placeholder="Ex: Face superior"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Resposta do Paciente</Label>
                <Select
                  value={formData.patient_response}
                  onValueChange={(v) => setFormData({ ...formData, patient_response: v as ResponseType })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {RESPONSE_TYPES.map((r) => (
                      <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Intercorrências */}
            <div className="space-y-2">
              <Label className="text-xs">Intercorrências</Label>
              <div className="flex flex-wrap gap-2">
                {COMMON_COMPLICATIONS.map((comp) => (
                  <Badge
                    key={comp}
                    variant={formData.complications?.includes(comp) ? "default" : "outline"}
                    className="cursor-pointer transition-colors"
                    onClick={() => toggleComplication(comp)}
                  >
                    {comp}
                  </Badge>
                ))}
              </div>
              <Textarea
                value={formData.complications_notes}
                onChange={(e) => setFormData({ ...formData, complications_notes: e.target.value })}
                placeholder="Detalhes adicionais sobre intercorrências..."
                rows={2}
                className="mt-2"
              />
            </div>

            {/* Satisfação */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Nível de Satisfação</Label>
                <Select
                  value={formData.satisfaction_level}
                  onValueChange={(v) => setFormData({ ...formData, satisfaction_level: v as SatisfactionLevel })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {SATISFACTION_LEVELS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Comentário sobre Satisfação</Label>
                <Input
                  value={formData.satisfaction_notes}
                  onChange={(e) => setFormData({ ...formData, satisfaction_notes: e.target.value })}
                  placeholder="Ex: Paciente gostou do resultado"
                />
              </div>
            </div>

            {/* Ajustes Planejados */}
            <div className="space-y-1.5">
              <Label className="text-xs">Ajustes Planejados</Label>
              <Textarea
                value={formData.planned_adjustments}
                onChange={(e) => setFormData({ ...formData, planned_adjustments: e.target.value })}
                placeholder="Ajustes a serem realizados na próxima sessão..."
                rows={2}
              />
            </div>

            {/* Orientações Pós-Procedimento */}
            <div className="space-y-2">
              <Label className="text-xs">Orientações Pós-Procedimento</Label>
              <div className="flex gap-2">
                <Input
                  value={newGuideline}
                  onChange={(e) => setNewGuideline(e.target.value)}
                  placeholder="Adicionar orientação..."
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addGuideline())}
                />
                <Button type="button" variant="outline" size="icon" onClick={addGuideline}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {(formData.post_procedure_guidelines?.length || 0) > 0 && (
                <ul className="space-y-1">
                  {formData.post_procedure_guidelines?.map((g, i) => (
                    <li key={i} className="flex items-center justify-between text-sm bg-muted px-3 py-1.5 rounded">
                      <span className="flex items-center gap-2">
                        <ListChecks className="h-3 w-3 text-primary" />
                        {g}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => removeGuideline(i)}
                      >
                        ×
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Data de Retorno e Fotos */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Data de Retorno Sugerida</Label>
                <Input
                  type="date"
                  value={formData.follow_up_date}
                  onChange={(e) => setFormData({ ...formData, follow_up_date: e.target.value })}
                />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Checkbox
                  id="photos_taken"
                  checked={formData.photos_taken}
                  onCheckedChange={(checked) => setFormData({ ...formData, photos_taken: !!checked })}
                />
                <Label htmlFor="photos_taken" className="text-sm">
                  Fotos registradas nesta sessão
                </Label>
              </div>
            </div>

            {/* Observações */}
            <div className="space-y-1.5">
              <Label className="text-xs">Observações Gerais</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Outras observações..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="secondary"
              onClick={() => handleSave(false)}
              disabled={!formData.procedure_performed || isCreating}
            >
              <Clock className="h-4 w-4 mr-1.5" />
              Salvar Rascunho
            </Button>
            <Button
              onClick={() => handleSave(true)}
              disabled={!formData.procedure_performed || isCreating}
            >
              <FileSignature className="h-4 w-4 mr-1.5" />
              Salvar e Assinar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
