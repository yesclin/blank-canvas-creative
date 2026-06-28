import { useNavigate, useOutletContext, useSearchParams } from "react-router-dom";
import { PublicClinicData } from "@/hooks/usePublicClinic";
import { usePublicProcedures } from "@/hooks/usePublicProcedures";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ClipboardList, Clock, Loader2 } from "lucide-react";

export default function ProcedureSelectionStep() {
  const { clinic } = useOutletContext<{ clinic: PublicClinicData }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const professionalId = searchParams.get("professional") || "";
  const specialtyId = searchParams.get("specialty") || undefined;
  const settings = clinic.public_booking_settings || {};
  const allowedProcedures: string[] | undefined = settings.allowed_procedures;

  const { data: procedures, isLoading } = usePublicProcedures(clinic.id, specialtyId, professionalId || undefined);

  const filtered = allowedProcedures?.length
    ? (procedures || []).filter((procedure) => allowedProcedures.includes(procedure.id))
    : procedures || [];

  const goToTimes = (procedureId?: string) => {
    const params = new URLSearchParams();
    if (professionalId) params.set("professional", professionalId);
    if (specialtyId) params.set("specialty", specialtyId);
    if (procedureId) params.set("procedure", procedureId);
    navigate(`/agendar/${clinic.slug}/horarios?${params.toString()}`);
  };

  const goBack = () => {
    const params = new URLSearchParams();
    if (specialtyId) params.set("specialty", specialtyId);
    navigate(`/agendar/${clinic.slug}/profissional${params.toString() ? `?${params.toString()}` : ""}`);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={goBack}
          className="h-9 w-9 rounded-lg border bg-card flex items-center justify-center hover:bg-muted transition-colors shrink-0"
        >
          <ArrowLeft className="h-4 w-4 text-foreground" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-foreground">Escolha o procedimento</h2>
          <p className="text-muted-foreground text-sm">Selecione o atendimento desejado</p>
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map((procedure) => (
            <button
              key={procedure.id}
              onClick={() => goToTimes(procedure.id)}
              className="rounded-xl border bg-card hover:border-primary/50 hover:shadow-md transition-all p-4 text-left space-y-2 group"
            >
              <div className="flex items-start gap-3">
                <ClipboardList className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    {procedure.name}
                  </p>
                  {procedure.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{procedure.description}</p>
                  )}
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                    <Clock className="h-3 w-3" />
                    <span>{procedure.duration_minutes || 30} min</span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 space-y-3">
          <ClipboardList className="h-10 w-10 text-muted-foreground mx-auto" />
          <p className="text-foreground font-medium">Nenhum procedimento específico encontrado.</p>
          <p className="text-muted-foreground text-sm">Vamos usar a duração padrão de 30 minutos.</p>
          <Button onClick={() => goToTimes()}>Continuar com consulta padrão</Button>
        </div>
      )}
    </div>
  );
}