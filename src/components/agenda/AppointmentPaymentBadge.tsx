import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { PaymentStatus, PaymentType } from "@/types/agenda";
import { paymentStatusLabels, paymentTypeLabels } from "@/types/agenda";

interface AppointmentPaymentBadgeProps {
  paymentStatus: PaymentStatus;
  paymentType?: PaymentType;
  showType?: boolean;
  compact?: boolean;
  className?: string;
}

const statusStyles: Record<PaymentStatus, string> = {
  pago: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
  parcial: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
  pendente: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
  faturar_convenio: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
  isento: "bg-muted text-muted-foreground border-border",
};

const statusIcons: Record<PaymentStatus, string> = {
  pago: "●",
  parcial: "◐",
  pendente: "○",
  faturar_convenio: "◎",
  isento: "—",
};

export function AppointmentPaymentBadge({
  paymentStatus,
  paymentType,
  showType = false,
  compact = false,
  className,
}: AppointmentPaymentBadgeProps) {
  const label = compact
    ? statusIcons[paymentStatus] || "?"
    : paymentStatusLabels[paymentStatus] || paymentStatus;

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Badge
        variant="outline"
        className={cn(
          "text-[10px] px-1.5 py-0 font-medium",
          statusStyles[paymentStatus]
        )}
      >
        {label}
      </Badge>
      {showType && paymentType && (
        <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground">
          {paymentTypeLabels[paymentType] || paymentType}
        </Badge>
      )}
    </div>
  );
}
