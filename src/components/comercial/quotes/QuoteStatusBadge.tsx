import { Badge } from "@/components/ui/badge";
import { getQuoteStatusColor, QUOTE_STATUSES } from "@/types/quote";

export function QuoteStatusBadge({ status }: { status: string }) {
  const label = QUOTE_STATUSES.find(s => s.value === status)?.label || status;
  return (
    <Badge className={getQuoteStatusColor(status)} variant="secondary">
      {label}
    </Badge>
  );
}
