import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreVertical, CheckCircle, CalendarClock, XCircle, Edit, User, Target } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { FollowupStatusBadge } from "./FollowupStatusBadge";
import { FOLLOWUP_TYPES, getFollowupTypeIcon } from "@/types/followup";
import type { CrmFollowup } from "@/types/followup";

interface FollowupListProps {
  title: string;
  followups: CrmFollowup[];
  onEdit: (f: CrmFollowup) => void;
  onComplete: (id: string) => void;
  onReschedule: (f: CrmFollowup) => void;
  onCancel: (id: string) => void;
  emptyMessage?: string;
}

export function FollowupList({ title, followups, onEdit, onComplete, onReschedule, onCancel, emptyMessage }: FollowupListProps) {
  if (followups.length === 0) {
    return (
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase">{title}</h3>
        <p className="text-sm text-muted-foreground py-4 text-center">{emptyMessage || "Nenhum follow-up"}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase">{title} ({followups.length})</h3>
      <div className="space-y-2">
        {followups.map(f => {
          const typeLabel = FOLLOWUP_TYPES.find(t => t.value === f.followup_type)?.label || f.followup_type;
          const typeIcon = getFollowupTypeIcon(f.followup_type);
          const isActive = f.status === "pending" || (f.status === "pending" && new Date(f.scheduled_at) < new Date());

          return (
            <Card key={f.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-3 flex items-start gap-3">
                <span className="text-lg mt-0.5">{typeIcon}</span>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium truncate">
                      {f.subject || typeLabel}
                    </span>
                    <FollowupStatusBadge status={f.status} scheduledAt={f.scheduled_at} />
                  </div>

                  <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                    <span>{format(new Date(f.scheduled_at), "dd/MM/yy 'às' HH:mm", { locale: ptBR })}</span>
                    {f.lead && (
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" /> {f.lead.name}
                      </span>
                    )}
                    {f.opportunity && (
                      <span className="flex items-center gap-1">
                        <Target className="h-3 w-3" /> {f.opportunity.title}
                      </span>
                    )}
                  </div>

                  {f.notes && (
                    <p className="text-xs text-muted-foreground line-clamp-1">{f.notes}</p>
                  )}
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                      <MoreVertical className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {isActive && (
                      <DropdownMenuItem onClick={() => onComplete(f.id)}>
                        <CheckCircle className="h-4 w-4 mr-2" /> Concluir
                      </DropdownMenuItem>
                    )}
                    {isActive && (
                      <DropdownMenuItem onClick={() => onReschedule(f)}>
                        <CalendarClock className="h-4 w-4 mr-2" /> Reagendar
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => onEdit(f)}>
                      <Edit className="h-4 w-4 mr-2" /> Editar
                    </DropdownMenuItem>
                    {isActive && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onCancel(f.id)} className="text-destructive">
                          <XCircle className="h-4 w-4 mr-2" /> Cancelar
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
