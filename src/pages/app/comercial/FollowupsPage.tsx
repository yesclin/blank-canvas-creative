import { useState, useMemo } from "react";
import { PhoneCall, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useFollowups, useCompleteFollowup, useCancelFollowup, useRescheduleFollowup, type FollowupsFilters } from "@/hooks/crm/useFollowups";
import { FollowupFiltersBar } from "@/components/comercial/followups/FollowupFiltersBar";
import { FollowupDialog } from "@/components/comercial/followups/FollowupDialog";
import { FollowupList } from "@/components/comercial/followups/FollowupList";
import { RescheduleDialog } from "@/components/comercial/followups/RescheduleDialog";
import { ReportEmptyState } from "@/components/relatorios/ReportEmptyState";
import type { CrmFollowup } from "@/types/followup";
import { startOfDay, endOfDay, isToday, isBefore, isAfter } from "date-fns";

export default function FollowupsPage() {
  const [filters, setFilters] = useState<FollowupsFilters>({});
  const { data: followups, isLoading, isError, refetch } = useFollowups(filters);
  const completeFollowup = useCompleteFollowup();
  const cancelFollowup = useCancelFollowup();
  const rescheduleFollowup = useRescheduleFollowup();

  const [formOpen, setFormOpen] = useState(false);
  const [editFollowup, setEditFollowup] = useState<CrmFollowup | null>(null);
  const [rescheduleTarget, setRescheduleTarget] = useState<CrmFollowup | null>(null);

  // Group by sections
  const grouped = useMemo(() => {
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);

    const overdue: CrmFollowup[] = [];
    const today: CrmFollowup[] = [];
    const upcoming: CrmFollowup[] = [];
    const completed: CrmFollowup[] = [];

    for (const f of (followups || [])) {
      if (f.status === "completed" || f.status === "canceled") {
        completed.push(f);
      } else {
        const date = new Date(f.scheduled_at);
        if (isBefore(date, todayStart)) {
          overdue.push(f);
        } else if (isToday(date)) {
          today.push(f);
        } else {
          upcoming.push(f);
        }
      }
    }

    return { overdue, today, upcoming, completed };
  }, [followups]);

  const handleNew = () => { setEditFollowup(null); setFormOpen(true); };
  const handleEdit = (f: CrmFollowup) => { setEditFollowup(f); setFormOpen(true); };
  const handleComplete = (id: string) => completeFollowup.mutate(id);
  const handleCancel = (id: string) => cancelFollowup.mutate(id);
  const handleReschedule = (f: CrmFollowup) => setRescheduleTarget(f);

  const handleRescheduleConfirm = (newDate: string) => {
    if (!rescheduleTarget) return;
    rescheduleFollowup.mutate({ id: rescheduleTarget.id, scheduled_at: newDate });
    setRescheduleTarget(null);
  };

  const total = followups?.length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <PhoneCall className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Follow-ups</h1>
            <p className="text-sm text-muted-foreground">
              {total > 0 ? `${total} follow-up${total > 1 ? "s" : ""}` : "Acompanhamentos agendados com leads e oportunidades"}
            </p>
          </div>
        </div>
        <Button onClick={handleNew}>
          <Plus className="h-4 w-4 mr-2" /> Novo Follow-up
        </Button>
      </div>

      {/* Filters */}
      <FollowupFiltersBar filters={filters} onFiltersChange={setFilters} />

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : isError ? (
        <ReportEmptyState
          title="Erro ao carregar follow-ups"
          description="Ocorreu um erro. Tente novamente."
          actionLabel="Tentar novamente"
          onAction={() => refetch()}
        />
      ) : total === 0 ? (
        <ReportEmptyState
          title="Nenhum follow-up encontrado"
          description={Object.values(filters).some(v => v) ? "Nenhum follow-up corresponde aos filtros." : "Crie seu primeiro follow-up."}
          icon={<PhoneCall className="h-8 w-8 text-muted-foreground" />}
          actionLabel={Object.values(filters).some(v => v) ? "Limpar filtros" : undefined}
          onAction={Object.values(filters).some(v => v) ? () => setFilters({}) : undefined}
        />
      ) : (
        <div className="space-y-6">
          {grouped.overdue.length > 0 && (
            <FollowupList
              title="🔴 Atrasados"
              followups={grouped.overdue}
              onEdit={handleEdit}
              onComplete={handleComplete}
              onReschedule={handleReschedule}
              onCancel={handleCancel}
            />
          )}

          <FollowupList
            title="📅 Hoje"
            followups={grouped.today}
            onEdit={handleEdit}
            onComplete={handleComplete}
            onReschedule={handleReschedule}
            onCancel={handleCancel}
            emptyMessage="Nenhum follow-up para hoje"
          />

          {grouped.upcoming.length > 0 && (
            <FollowupList
              title="📆 Próximos"
              followups={grouped.upcoming}
              onEdit={handleEdit}
              onComplete={handleComplete}
              onReschedule={handleReschedule}
              onCancel={handleCancel}
            />
          )}

          {grouped.completed.length > 0 && (
            <FollowupList
              title="✅ Concluídos / Cancelados"
              followups={grouped.completed}
              onEdit={handleEdit}
              onComplete={handleComplete}
              onReschedule={handleReschedule}
              onCancel={handleCancel}
            />
          )}
        </div>
      )}

      {/* Dialogs */}
      <FollowupDialog
        open={formOpen}
        onOpenChange={(v) => { setFormOpen(v); if (!v) setEditFollowup(null); }}
        editFollowup={editFollowup}
      />

      <RescheduleDialog
        open={!!rescheduleTarget}
        onOpenChange={(v) => { if (!v) setRescheduleTarget(null); }}
        currentDate={rescheduleTarget?.scheduled_at || ""}
        onConfirm={handleRescheduleConfirm}
        isPending={rescheduleFollowup.isPending}
      />
    </div>
  );
}
