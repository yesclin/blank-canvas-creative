import { Badge } from "@/components/ui/badge";
import { getFollowupStatusColor, FOLLOWUP_STATUSES } from "@/types/followup";

interface FollowupStatusBadgeProps {
  status: string;
  scheduledAt: string;
}

export function FollowupStatusBadge({ status, scheduledAt }: FollowupStatusBadgeProps) {
  // Treat pending + past date as overdue
  const effectiveStatus = status === "pending" && new Date(scheduledAt) < new Date() ? "overdue" : status;
  const label = FOLLOWUP_STATUSES.find(s => s.value === effectiveStatus)?.label || effectiveStatus;

  return (
    <Badge className={getFollowupStatusColor(effectiveStatus)} variant="secondary">
      {label}
    </Badge>
  );
}
