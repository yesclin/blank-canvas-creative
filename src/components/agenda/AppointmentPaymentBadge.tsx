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
  pago: "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
  parcial: "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800",
  pendente: "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
  faturar_convenio: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
  isento: "bg-gray-100 text-gray-600 border-gray-300 dark:bg-gray-800/30 dark:text-gray-400 dark:border-gray-700",
};

export function AppointmentPaymentBadge({
  paymentStatus,
  paymentType,
  showType = false,
  compact = false,
  className,
}: AppointmentPaymentBadgeProps) {
  const label = compact
    ? paymentStatusLabels[paymentStatus]?.charAt(0) || "?"
    : paymentStatusLabels[paymentStatus] || paymentStatus;

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Badge
        variant="outline"
        className={cn("text-[10px] px-1.5 py-0", statusStyles[paymentStatus])}
      >
        {label}
      </Badge>
      {showType && paymentType && (
        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
          {paymentTypeLabels[paymentType] || paymentType}
        </Badge>
      )}
    </div>
  );
}
