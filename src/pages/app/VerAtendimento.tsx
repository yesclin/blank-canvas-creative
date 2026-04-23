import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useAttendanceDetail } from "@/hooks/useAttendanceDetail";
import { AttendanceDetailView } from "@/components/atendimento/AttendanceDetailView";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Activity } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function VerAtendimento() {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const action = searchParams.get("action") as
    | "sign" | "note" | "addendum" | "print" | "pdf" | "history" | null;
  const { data: detail, isLoading, error } = useAttendanceDetail(appointmentId || null);

  if (isLoading) {
    return (
      <div className="space-y-4 p-6 max-w-4xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full rounded-lg" />
        <Skeleton className="h-60 w-full rounded-lg" />
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Button variant="ghost" size="sm" className="mb-4 gap-1.5" onClick={() => navigate("/app/atendimento")}>
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center text-center">
              <Activity className="h-12 w-12 text-muted-foreground/40 mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground">
                {error ? "Erro ao carregar atendimento" : "Atendimento não encontrado"}
              </h3>
              <p className="text-sm text-muted-foreground/70 mt-1">
                {error ? "Tente novamente em alguns instantes." : "Verifique se o link está correto."}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <AttendanceDetailView detail={detail} initialAction={action} />;
}
