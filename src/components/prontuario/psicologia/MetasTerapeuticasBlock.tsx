import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Target, Plus, CheckCircle, Pause, Play, Archive, TrendingUp, TrendingDown, Minus,
  Calendar, BarChart3, Clock, ChevronRight, Eye, AlertTriangle,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { TherapeuticGoal, GoalFormData, GoalUpdate } from "@/hooks/prontuario/psicologia/useMetasTerapeuticasData";

interface MetasTerapeuticasBlockProps {
  goals: TherapeuticGoal[];
  loading?: boolean;
  saving?: boolean;
  canEdit?: boolean;
  onCreateGoal: (data: GoalFormData) => Promise<void>;
  onUpdateProgress: (data: { goalId: string; newProgress: number; observation: string }) => Promise<void>;
  onUpdateStatus: (data: { goalId: string; status: string }) => Promise<void>;
  onUpdateScaleScore?: (data: { goalId: string; newScore: number; sessaoId?: string }) => Promise<void>;
  fetchGoalUpdates: (goalId: string) => Promise<GoalUpdate[]>;
  latestPHQ9?: number | null;
  latestGAD7?: number | null;
}

const PRIORITY_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  baixa: { label: "Baixa", color: "bg-blue-100 text-blue-700 border-blue-300", icon: "↓" },
  media: { label: "Média", color: "bg-yellow-100 text-yellow-700 border-yellow-300", icon: "→" },
  alta: { label: "Alta", color: "bg-red-100 text-red-700 border-red-300", icon: "↑" },
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  ativa: { label: "Ativa", color: "bg-green-100 text-green-700 border-green-300" },
  concluida: { label: "Concluída", color: "bg-primary/10 text-primary border-primary/30" },
  pausada: { label: "Pausada", color: "bg-yellow-100 text-yellow-700 border-yellow-300" },
  arquivada: { label: "Arquivada", color: "bg-muted text-muted-foreground" },
};

const EMPTY_FORM: GoalFormData = {
  title: "", description: "", priority: "media",
  is_measurable: false, success_indicator: "", review_date: "",
  goal_type: "livre", scale_name: "", initial_score: null, target_score: null,
};

function ScaleTrendIcon({ updates }: { updates: GoalUpdate[] }) {
  if (updates.length < 2) return null;
  const recent = updates.slice(-2);
  const lastScore = recent[1]?.score_value;
  const prevScore = recent[0]?.score_value;
  if (lastScore == null || prevScore == null) return null;
  if (lastScore < prevScore) return <TrendingDown className="h-4 w-4 text-green-600" />;
  if (lastScore > prevScore) return <TrendingUp className="h-4 w-4 text-red-500" />;
  return <Minus className="h-4 w-4 text-yellow-500" />;
}

function getScoreAlertLevel(updates: GoalUpdate[]): 'none' | 'warning' | 'danger' {
  const scored = updates.filter(u => u.score_value != null);
  if (scored.length < 2) return 'none';
  const last = scored[scored.length - 1].score_value!;
  const prev = scored[scored.length - 2].score_value!;
  if (last <= prev) return 'none';
  // Score increased — check if 2 consecutive increases
  if (scored.length >= 3) {
    const prevPrev = scored[scored.length - 3].score_value!;
    if (prev > prevPrev && last > prev) return 'danger';
  }
  return 'warning';
}

export function MetasTerapeuticasBlock({
  goals, loading, saving, canEdit, onCreateGoal, onUpdateProgress, onUpdateStatus,
  onUpdateScaleScore, fetchGoalUpdates, latestPHQ9, latestGAD7,
}: MetasTerapeuticasBlockProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState<GoalFormData>(EMPTY_FORM);
  const [selectedGoal, setSelectedGoal] = useState<TherapeuticGoal | null>(null);
  const [goalHistory, setGoalHistory] = useState<GoalUpdate[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [progressValue, setProgressValue] = useState(0);
  const [progressNote, setProgressNote] = useState("");
  const [isUpdatingProgress, setIsUpdatingProgress] = useState(false);
  const [newScoreValue, setNewScoreValue] = useState(0);

  const activeGoals = goals.filter(g => g.status === 'ativa');

  const handleOpenGoal = async (goal: TherapeuticGoal) => {
    setSelectedGoal(goal);
    setProgressValue(goal.progress);
    setNewScoreValue(goal.current_score ?? 0);
    setProgressNote("");
    setIsUpdatingProgress(false);
    setLoadingHistory(true);
    try {
      const updates = await fetchGoalUpdates(goal.id);
      setGoalHistory(updates);
    } catch { setGoalHistory([]); }
    finally { setLoadingHistory(false); }
  };

  const handleCreateGoal = async () => {
    if (!formData.title.trim()) return;
    const data = { ...formData };
    // Auto-fill initial score from latest scale reading
    if (data.goal_type === 'escala' && data.initial_score == null) {
      if (data.scale_name === 'PHQ-9' && latestPHQ9 != null) data.initial_score = latestPHQ9;
      if (data.scale_name === 'GAD-7' && latestGAD7 != null) data.initial_score = latestGAD7;
    }
    await onCreateGoal(data);
    setFormData(EMPTY_FORM);
    setIsFormOpen(false);
  };

  const handleSaveProgress = async () => {
    if (!selectedGoal) return;
    if (selectedGoal.goal_type === 'escala' && onUpdateScaleScore) {
      await onUpdateScaleScore({ goalId: selectedGoal.id, newScore: newScoreValue });
    } else {
      await onUpdateProgress({ goalId: selectedGoal.id, newProgress: progressValue, observation: progressNote });
    }
    setIsUpdatingProgress(false);
    const updates = await fetchGoalUpdates(selectedGoal.id);
    setGoalHistory(updates);
    if (selectedGoal.goal_type === 'escala') {
      const initialScore = selectedGoal.initial_score ?? 0;
      const targetScore = selectedGoal.target_score ?? 0;
      let newProg = 0;
      if (initialScore !== targetScore) {
        newProg = Math.round(((initialScore - newScoreValue) / (initialScore - targetScore)) * 100);
        newProg = Math.max(0, Math.min(100, newProg));
      }
      setSelectedGoal(prev => prev ? { ...prev, progress: newProg, current_score: newScoreValue } : null);
    } else {
      setSelectedGoal(prev => prev ? { ...prev, progress: progressValue, status: progressValue >= 100 ? 'concluida' : prev.status } : null);
    }
  };

  const handleOpenForm = () => {
    const newForm = { ...EMPTY_FORM };
    setFormData(newForm);
    setIsFormOpen(true);
  };

  if (loading) {
    return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-32 w-full" /><Skeleton className="h-32 w-full" /></div>;
  }

  const chartData = goalHistory
    .filter(u => selectedGoal?.goal_type === 'escala' ? u.score_value != null : true)
    .map((u, i) => ({
      name: `#${i + 1}`,
      progresso: selectedGoal?.goal_type === 'escala' ? undefined : u.new_progress,
      pontuacao: u.score_value ?? undefined,
    }));

  const alertLevel = getScoreAlertLevel(goalHistory);

  const maxScaleScore = selectedGoal?.scale_name === 'PHQ-9' ? 27 : selectedGoal?.scale_name === 'GAD-7' ? 21 : 27;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">Metas Terapêuticas</h2>
          <Badge variant="secondary">{activeGoals.length} ativas</Badge>
        </div>
        {canEdit && (
          <Button onClick={handleOpenForm}>
            <Plus className="h-4 w-4 mr-2" /> Nova Meta
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      {activeGoals.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {activeGoals.slice(0, 3).map(goal => (
            <Card key={goal.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleOpenGoal(goal)}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="text-sm font-semibold line-clamp-1 flex-1">{goal.title}</h4>
                  <div className="flex items-center gap-1 ml-2">
                    {goal.goal_type === 'escala' && (
                      <Badge variant="outline" className="text-[10px]">{goal.scale_name}</Badge>
                    )}
                    <Badge className={`text-[10px] ${PRIORITY_CONFIG[goal.priority]?.color}`}>
                      {PRIORITY_CONFIG[goal.priority]?.icon} {PRIORITY_CONFIG[goal.priority]?.label}
                    </Badge>
                  </div>
                </div>
                <Progress value={goal.progress} className="h-2 mb-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{goal.progress}%</span>
                  {goal.goal_type === 'escala' && goal.current_score != null && (
                    <span>Pontuação: {goal.current_score} → alvo {goal.target_score}</span>
                  )}
                  {goal.goal_type !== 'escala' && goal.review_date && (
                    <span>Revisão: {format(parseISO(goal.review_date), "dd/MM", { locale: ptBR })}</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Goals List */}
      {goals.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <Target className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <h3 className="font-semibold mb-2">Nenhuma meta terapêutica registrada</h3>
            <p className="text-sm text-muted-foreground mb-4">Defina metas para acompanhar o progresso do tratamento.</p>
            {canEdit && <Button onClick={handleOpenForm}><Plus className="h-4 w-4 mr-2" /> Nova Meta</Button>}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {goals.map(goal => (
            <Card key={goal.id} className={`cursor-pointer hover:shadow-md transition-shadow ${goal.status === 'concluida' ? 'opacity-70' : ''}`}
              onClick={() => handleOpenGoal(goal)}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  goal.status === 'concluida' ? 'bg-green-100 text-green-600' : 
                  goal.status === 'pausada' ? 'bg-yellow-100 text-yellow-600' : 'bg-primary/10 text-primary'
                }`}>
                  {goal.status === 'concluida' ? <CheckCircle className="h-5 w-5" /> : 
                   goal.status === 'pausada' ? <Pause className="h-5 w-5" /> : <Target className="h-5 w-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-semibold truncate">{goal.title}</h4>
                    <Badge className={`text-[10px] ${STATUS_CONFIG[goal.status]?.color}`}>{STATUS_CONFIG[goal.status]?.label}</Badge>
                    <Badge className={`text-[10px] ${PRIORITY_CONFIG[goal.priority]?.color}`}>{PRIORITY_CONFIG[goal.priority]?.label}</Badge>
                    {goal.goal_type === 'escala' && (
                      <Badge variant="outline" className="text-[10px]">{goal.scale_name}</Badge>
                    )}
                  </div>
                  <Progress value={goal.progress} className="h-1.5 mb-1" />
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{goal.progress}% concluído</span>
                    {goal.goal_type === 'escala' && goal.current_score != null && (
                      <span>Pontuação: {goal.current_score} (alvo: {goal.target_score})</span>
                    )}
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {format(parseISO(goal.updated_at), "dd/MM/yy", { locale: ptBR })}</span>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ===== NEW GOAL DIALOG ===== */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] min-h-0 flex flex-col overflow-hidden">
          <DialogHeader className="shrink-0">
            <DialogTitle className="flex items-center gap-2"><Target className="h-5 w-5 text-primary" /> Nova Meta Terapêutica</DialogTitle>
            <DialogDescription>Defina uma meta para o acompanhamento do tratamento.</DialogDescription>
          </DialogHeader>

          <div className="flex-1 min-h-0 overflow-y-auto pr-2">
            <div className="space-y-4 py-2">
              {/* Goal Type */}
              <div className="space-y-2">
                <Label>Tipo de Meta</Label>
                <Select value={formData.goal_type} onValueChange={(v: any) => {
                  setFormData(prev => ({
                    ...prev, goal_type: v,
                    is_measurable: v === 'escala' ? true : prev.is_measurable,
                    title: v === 'escala' && !prev.title ? '' : prev.title,
                  }));
                }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="livre">Meta Livre</SelectItem>
                    <SelectItem value="escala">Meta baseada em Escala</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.goal_type === 'escala' && (
                <>
                  <div className="space-y-2">
                    <Label>Selecionar Escala</Label>
                    <Select value={formData.scale_name} onValueChange={(v) => {
                      const autoTitle = v === 'PHQ-9' ? 'Reduzir pontuação PHQ-9' : 'Reduzir pontuação GAD-7';
                      const latestScore = v === 'PHQ-9' ? latestPHQ9 : latestGAD7;
                      setFormData(prev => ({
                        ...prev,
                        scale_name: v,
                        title: prev.title || autoTitle,
                        initial_score: latestScore ?? prev.initial_score,
                      }));
                    }}>
                      <SelectTrigger><SelectValue placeholder="Escolha..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PHQ-9">PHQ-9 (Depressão)</SelectItem>
                        <SelectItem value="GAD-7">GAD-7 (Ansiedade)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Pontuação Atual</Label>
                      <Input type="number" min={0} max={formData.scale_name === 'PHQ-9' ? 27 : 21}
                        value={formData.initial_score ?? ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, initial_score: e.target.value ? parseInt(e.target.value) : null }))} />
                      {formData.initial_score != null && (
                        <p className="text-xs text-muted-foreground">Auto-preenchido da última aplicação</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Pontuação Alvo</Label>
                      <Input type="number" min={0} max={formData.scale_name === 'PHQ-9' ? 27 : 21}
                        value={formData.target_score ?? ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, target_score: e.target.value ? parseInt(e.target.value) : null }))} />
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label>Título da Meta *</Label>
                <Input placeholder="Ex: Reduzir episódios de ansiedade social" value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea placeholder="Detalhamento da meta..." value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} rows={3} className="resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Prioridade</Label>
                  <Select value={formData.priority} onValueChange={(v: any) => setFormData(prev => ({ ...prev, priority: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baixa">↓ Baixa</SelectItem>
                      <SelectItem value="media">→ Média</SelectItem>
                      <SelectItem value="alta">↑ Alta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Data de Revisão</Label>
                  <Input type="date" value={formData.review_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, review_date: e.target.value }))} />
                </div>
              </div>
              {formData.goal_type === 'livre' && (
                <>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <Label>Meta mensurável?</Label>
                      <p className="text-xs text-muted-foreground">Possui indicador de sucesso quantificável</p>
                    </div>
                    <Switch checked={formData.is_measurable}
                      onCheckedChange={(v) => setFormData(prev => ({ ...prev, is_measurable: v }))} />
                  </div>
                  {formData.is_measurable && (
                    <div className="space-y-2">
                      <Label>Indicador de Sucesso</Label>
                      <Input placeholder="Ex: Reduzir de 5 para 2 episódios por semana" value={formData.success_indicator}
                        onChange={(e) => setFormData(prev => ({ ...prev, success_indicator: e.target.value }))} />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <DialogFooter className="shrink-0 pt-2 border-t">
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateGoal} disabled={saving || !formData.title.trim() || (formData.goal_type === 'escala' && (!formData.scale_name || formData.target_score == null))}>
              {saving ? 'Criando...' : 'Criar Meta'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== GOAL DETAIL DIALOG ===== */}
      <Dialog open={!!selectedGoal} onOpenChange={() => setSelectedGoal(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] min-h-0 flex flex-col overflow-hidden">
          <DialogHeader className="shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" /> {selectedGoal?.title}
            </DialogTitle>
            {selectedGoal && (
              <DialogDescription className="flex items-center gap-3 flex-wrap">
                <Badge className={STATUS_CONFIG[selectedGoal.status]?.color}>{STATUS_CONFIG[selectedGoal.status]?.label}</Badge>
                <Badge className={PRIORITY_CONFIG[selectedGoal.priority]?.color}>{PRIORITY_CONFIG[selectedGoal.priority]?.label}</Badge>
                {selectedGoal.goal_type === 'escala' && (
                  <Badge variant="outline">{selectedGoal.scale_name}</Badge>
                )}
                {selectedGoal.review_date && (
                  <span className="flex items-center gap-1 text-xs"><Calendar className="h-3 w-3" /> Revisão: {format(parseISO(selectedGoal.review_date), "dd/MM/yyyy")}</span>
                )}
              </DialogDescription>
            )}
          </DialogHeader>

          {selectedGoal && (
            <div className="flex-1 min-h-0 overflow-y-auto pr-4">
              <div className="space-y-4">
                {/* Scale Alert */}
                {selectedGoal.goal_type === 'escala' && alertLevel !== 'none' && (
                  <Card className={`border ${alertLevel === 'danger' ? 'border-red-300 bg-red-50 dark:bg-red-950/20' : 'border-yellow-300 bg-yellow-50 dark:bg-yellow-950/20'}`}>
                    <CardContent className="p-3 flex items-center gap-3">
                      <AlertTriangle className={`h-5 w-5 ${alertLevel === 'danger' ? 'text-red-600' : 'text-yellow-600'}`} />
                      <p className={`text-sm font-medium ${alertLevel === 'danger' ? 'text-red-700' : 'text-yellow-700'}`}>
                        {alertLevel === 'danger'
                          ? 'Pontuação aumentou por 2 sessões consecutivas — atenção redobrada'
                          : 'Pontuação aumentou na última aplicação'}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Scale Info */}
                {selectedGoal.goal_type === 'escala' && (
                  <Card>
                    <CardContent className="p-4">
                      <div className="grid grid-cols-3 gap-4 text-center mb-3">
                        <div>
                          <p className="text-xs text-muted-foreground">Inicial</p>
                          <p className="text-xl font-bold">{selectedGoal.initial_score}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Atual</p>
                          <div className="flex items-center justify-center gap-1">
                            <p className="text-xl font-bold text-primary">{selectedGoal.current_score}</p>
                            <ScaleTrendIcon updates={goalHistory} />
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Alvo</p>
                          <p className="text-xl font-bold text-green-600">{selectedGoal.target_score}</p>
                        </div>
                      </div>
                      <Progress value={selectedGoal.progress} className="h-3 mb-1" />
                      <p className="text-xs text-center text-muted-foreground">{selectedGoal.progress}% do progresso</p>
                    </CardContent>
                  </Card>
                )}

                {/* Progress for free goals */}
                {selectedGoal.goal_type !== 'escala' && (
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold flex items-center gap-2">
                          <BarChart3 className="h-4 w-4 text-primary" /> Progresso Atual
                        </h4>
                        <span className="text-2xl font-bold text-primary">{selectedGoal.progress}%</span>
                      </div>
                      <Progress value={selectedGoal.progress} className="h-3 mb-3" />
                    </CardContent>
                  </Card>
                )}

                {/* Update Controls */}
                {canEdit && selectedGoal.status === 'ativa' && !isUpdatingProgress && (
                  <Button variant="outline" size="sm" onClick={() => setIsUpdatingProgress(true)}>
                    <TrendingUp className="h-4 w-4 mr-1" /> {selectedGoal.goal_type === 'escala' ? 'Registrar Nova Pontuação' : 'Atualizar Progresso'}
                  </Button>
                )}

                {isUpdatingProgress && (
                  <Card className="bg-muted/30">
                    <CardContent className="p-4 space-y-3">
                      {selectedGoal.goal_type === 'escala' ? (
                        <div className="space-y-2">
                          <Label>Nova pontuação ({selectedGoal.scale_name})</Label>
                          <div className="flex items-center gap-3">
                            <Slider min={0} max={maxScaleScore} step={1} value={[newScoreValue]}
                              onValueChange={([v]) => setNewScoreValue(v)} className="flex-1" />
                            <Badge variant="outline" className="min-w-[48px] text-center">{newScoreValue}</Badge>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-3">
                            <Label className="text-sm min-w-fit">Novo progresso:</Label>
                            <Slider min={0} max={100} step={5} value={[progressValue]}
                              onValueChange={([v]) => setProgressValue(v)} className="flex-1" />
                            <Badge variant="outline" className="min-w-[48px] text-center">{progressValue}%</Badge>
                          </div>
                          <Textarea placeholder="Observação (opcional)..." value={progressNote}
                            onChange={(e) => setProgressNote(e.target.value)} rows={2} className="resize-none" />
                        </>
                      )}
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setIsUpdatingProgress(false)}>Cancelar</Button>
                        <Button size="sm" onClick={handleSaveProgress} disabled={saving}>
                          {saving ? 'Salvando...' : 'Salvar'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {selectedGoal.description && (
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold">Descrição</h4>
                    <p className="text-sm whitespace-pre-wrap text-muted-foreground">{selectedGoal.description}</p>
                  </div>
                )}

                {/* Chart */}
                {chartData.length >= 2 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-primary" /> 
                        {selectedGoal.goal_type === 'escala' ? 'Evolução da Pontuação' : 'Evolução do Progresso'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[180px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                            {selectedGoal.goal_type === 'escala' ? (
                              <YAxis domain={[0, maxScaleScore]} tick={{ fontSize: 10 }} />
                            ) : (
                              <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tick={{ fontSize: 10 }} />
                            )}
                            <Tooltip formatter={(v: number) => [
                              selectedGoal.goal_type === 'escala' ? `${v} pts` : `${v}%`,
                              selectedGoal.goal_type === 'escala' ? 'Pontuação' : 'Progresso'
                            ]} />
                            <Line type="monotone" 
                              dataKey={selectedGoal.goal_type === 'escala' ? 'pontuacao' : 'progresso'} 
                              stroke="hsl(var(--primary))" strokeWidth={2}
                              dot={{ r: 4, fill: "hsl(var(--primary))" }} activeDot={{ r: 6 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* History */}
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <Clock className="h-4 w-4" /> Histórico de Atualizações
                  </h4>
                  {loadingHistory ? (
                    <Skeleton className="h-20 w-full" />
                  ) : goalHistory.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhuma atualização registrada.</p>
                  ) : (
                    <div className="space-y-2">
                      {goalHistory.map(update => (
                        <div key={update.id} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <TrendingUp className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 text-sm">
                              {update.score_value != null ? (
                                <span className="font-medium">Pontuação: {update.score_value}</span>
                              ) : (
                                <span className="font-medium">{update.previous_progress}% → {update.new_progress}%</span>
                              )}
                              <span className="text-xs text-muted-foreground">
                                {format(parseISO(update.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                              </span>
                            </div>
                            {update.observation && <p className="text-xs text-muted-foreground mt-1">{update.observation}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {selectedGoal && canEdit && selectedGoal.status !== 'arquivada' && (
            <>
              <Separator />
              <DialogFooter className="shrink-0 gap-2 flex-wrap">
                {selectedGoal.status === 'ativa' && (
                  <>
                    <Button variant="outline" size="sm" onClick={() => { onUpdateStatus({ goalId: selectedGoal.id, status: 'pausada' }); setSelectedGoal(null); }}>
                      <Pause className="h-4 w-4 mr-1" /> Pausar
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => { onUpdateStatus({ goalId: selectedGoal.id, status: 'concluida' }); setSelectedGoal(null); }}>
                      <CheckCircle className="h-4 w-4 mr-1" /> Concluir
                    </Button>
                  </>
                )}
                {selectedGoal.status === 'pausada' && (
                  <Button variant="outline" size="sm" onClick={() => { onUpdateStatus({ goalId: selectedGoal.id, status: 'ativa' }); setSelectedGoal(null); }}>
                    <Play className="h-4 w-4 mr-1" /> Reativar
                  </Button>
                )}
                {selectedGoal.status === 'concluida' && (
                  <Button variant="outline" size="sm" onClick={() => { onUpdateStatus({ goalId: selectedGoal.id, status: 'ativa' }); setSelectedGoal(null); }}>
                    <Play className="h-4 w-4 mr-1" /> Reabrir
                  </Button>
                )}
                <Button variant="ghost" size="sm" className="text-muted-foreground"
                  onClick={() => { onUpdateStatus({ goalId: selectedGoal.id, status: 'arquivada' }); setSelectedGoal(null); }}>
                  <Archive className="h-4 w-4 mr-1" /> Arquivar
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
