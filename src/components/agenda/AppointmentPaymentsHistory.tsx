import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { History, CreditCard } from "lucide-react";

interface AppointmentPaymentsHistoryProps {
  appointmentId: string;
  clinicId: string;
}

interface PaymentRecord {
  id: string;
  received_amount: number;
  received_at: string;
  installments: number;
  installment_number: number;
  authorization_code: string | null;
  notes: string | null;
  status: string;
  payment_method: {
    name: string;
  } | null;
}

const statusLabels: Record<string, string> = {
  pending: "Pendente",
  received: "Recebido",
  canceled: "Cancelado",
  refunded: "Estornado",
};

const statusColors: Record<string, string> = {
  received: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  canceled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  refunded: "bg-gray-100 text-gray-600 dark:bg-gray-800/30 dark:text-gray-400",
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

export function AppointmentPaymentsHistory({ appointmentId, clinicId }: AppointmentPaymentsHistoryProps) {
  const { data: payments, isLoading } = useQuery({
    queryKey: ["appointment-payments", appointmentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointment_payments")
        .select("id, received_amount, received_at, installments, installment_number, authorization_code, notes, status, payment_method_id")
        .eq("appointment_id", appointmentId)
        .eq("clinic_id", clinicId)
        .order("received_at", { ascending: false });

      if (error) throw error;

      // Fetch payment method names
      if (!data || data.length === 0) return [];

      const methodIds = [...new Set(data.map((p) => p.payment_method_id).filter(Boolean))];
      const { data: methods } = await supabase
        .from("payment_methods")
        .select("id, name")
        .in("id", methodIds);

      const methodMap = new Map((methods || []).map((m) => [m.id, m.name]));

      return data.map((p) => ({
        ...p,
        payment_method: p.payment_method_id ? { name: methodMap.get(p.payment_method_id) || "—" } : null,
      })) as PaymentRecord[];
    },
    enabled: !!appointmentId && !!clinicId,
  });

  if (isLoading || !payments || payments.length === 0) return null;

  return (
    <>
      <Separator />
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
          <History className="h-3.5 w-3.5" />
          Histórico de Pagamentos
        </p>
        <div className="space-y-2">
          {payments.map((p) => (
            <div key={p.id} className="rounded-md border border-border p-2 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">{formatCurrency(p.received_amount)}</span>
                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${statusColors[p.status] || ""}`}>
                  {statusLabels[p.status] || p.status}
                </Badge>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CreditCard className="h-3 w-3" />
                <span>{p.payment_method?.name || "—"}</span>
                {p.installments > 1 && (
                  <span className="ml-1">({p.installment_number}/{p.installments}x)</span>
                )}
              </div>
              <div className="text-[10px] text-muted-foreground">
                {new Date(p.received_at).toLocaleString("pt-BR", {
                  day: "2-digit", month: "2-digit", year: "2-digit",
                  hour: "2-digit", minute: "2-digit",
                })}
                {p.authorization_code && ` • NSU: ${p.authorization_code}`}
              </div>
              {p.notes && (
                <p className="text-[10px] text-muted-foreground italic truncate">{p.notes}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
