import { useState } from "react";
import { TrendingUp, Plus, Trash2, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useCommercialGoals, useCreateGoal, useDeleteGoal, GOAL_TYPES } from "@/hooks/crm/useCommercialGoals";
import { useCrmProfessionals, useCrmSpecialties } from "@/hooks/crm/useCrmOptions";
import { ReportEmptyState } from "@/components/relatorios/ReportEmptyState";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function GoalsPage() {
  const { data: goals, isLoading } = useCommercialGoals();
  const createGoal = useCreateGoal();
  const deleteGoal = useDeleteGoal();
  const { data: professionals } = useCrmProfessionals();
  const { data: specialties } = useCrmSpecialties();

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({
    goal_type: "leads",
    title: "",
    target_value: "",
    period_start: "",
    period_end: "",
    professional_id: "",
    specialty_id: "",
  });

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createGoal.mutateAsync({
      goal_type: form.goal_type,
      title: form.title.trim(),
      target_value: parseFloat(form.target_value) || 0,
      period_start: form.period_start,
      period_end: form.period_end,
      professional_id: form.professional_id || undefined,
      specialty_id: form.specialty_id || undefined,
    });
    setForm({ goal_type: "leads", title: "", target_value: "", period_start: "", period_end: "", professional_id: "", specialty_id: "" });
    setFormOpen(false);
  };

  const canSubmit = form.title.trim() && parseFloat(form.target_value) > 0 && form.period_start && form.period_end;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <TrendingUp className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Metas Comerciais</h1>
            <p className="text-sm text-muted-foreground">
              Defina e acompanhe metas de receita, conversão e atendimento
            </p>
          </div>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Nova Meta
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-40" />)}
        </div>
      ) : !goals || goals.length === 0 ? (
        <ReportEmptyState
          title="Nenhuma meta definida"
          description="Crie metas para acompanhar o desempenho comercial."
          icon={<Target className="h-8 w-8 text-muted-foreground" />}
          actionLabel="Criar Meta"
          onAction={() => setFormOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map(goal => {
            const pct = goal.target_value > 0 ? Math.min(100, (goal.current_value / goal.target_value) * 100) : 0;
            const typeLabel = GOAL_TYPES.find(t => t.value === goal.goal_type)?.label || goal.goal_type;
            const isExpired = new Date(goal.period_end) < new Date();
            const isAchieved = pct >= 100;

            return (
              <Card key={goal.id} className={isAchieved ? "border-green-300 dark:border-green-800" : ""}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{goal.title}</CardTitle>
                    <div className="flex items-center gap-1">
                      {isAchieved && <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Atingida</Badge>}
                      {isExpired && !isAchieved && <Badge variant="destructive">Expirada</Badge>}
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteGoal.mutate(goal.id)}>
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{typeLabel}</span>
                    <span className="font-medium">
                      {goal.goal_type === "revenue"
                        ? `R$ ${Number(goal.current_value).toLocaleString("pt-BR")} / R$ ${Number(goal.target_value).toLocaleString("pt-BR")}`
                        : `${goal.current_value} / ${goal.target_value}`}
                    </span>
                  </div>
                  <Progress value={pct} className="h-2" />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{pct.toFixed(0)}%</span>
                    <span>
                      {format(new Date(goal.period_start), "dd/MM", { locale: ptBR })} — {format(new Date(goal.period_end), "dd/MM/yy", { locale: ptBR })}
                    </span>
                  </div>
                  {goal.professional && (
                    <div className="text-xs text-muted-foreground">Profissional: {goal.professional.name}</div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Goal Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Meta Comercial</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <Label>Tipo de Meta *</Label>
              <Select value={form.goal_type} onValueChange={v => set("goal_type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {GOAL_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Título *</Label>
              <Input value={form.title} onChange={e => set("title", e.target.value)} maxLength={200} placeholder="Ex: Meta de leads de Abril" />
            </div>
            <div>
              <Label>Valor Alvo *</Label>
              <Input type="number" min={1} step="0.01" value={form.target_value} onChange={e => set("target_value", e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Início *</Label>
                <Input type="date" value={form.period_start} onChange={e => set("period_start", e.target.value)} />
              </div>
              <div>
                <Label>Fim *</Label>
                <Input type="date" value={form.period_end} onChange={e => set("period_end", e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Profissional</Label>
                <Select value={form.professional_id || "all"} onValueChange={v => set("professional_id", v === "all" ? "" : v)}>
                  <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Clínica toda</SelectItem>
                    {(professionals || []).map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Especialidade</Label>
                <Select value={form.specialty_id || "all"} onValueChange={v => set("specialty_id", v === "all" ? "" : v)}>
                  <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {(specialties || []).map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={!canSubmit || createGoal.isPending}>Criar Meta</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
