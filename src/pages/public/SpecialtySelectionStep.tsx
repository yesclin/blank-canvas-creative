import { useNavigate, useOutletContext } from "react-router-dom";
import { PublicClinicData } from "@/hooks/usePublicClinic";
import { usePublicSpecialties } from "@/hooks/usePublicSpecialties";
import { Loader2, Stethoscope } from "lucide-react";

export default function SpecialtySelectionStep() {
  const { clinic } = useOutletContext<{ clinic: PublicClinicData }>();
  const { data: specialties, isLoading } = usePublicSpecialties(clinic.id);
  const navigate = useNavigate();

  const settings = clinic.public_booking_settings || {};
  const allowedSpecialties: string[] | undefined = settings.allowed_specialties;

  const filtered = allowedSpecialties?.length
    ? (specialties || []).filter((s) => allowedSpecialties.includes(s.id))
    : specialties || [];

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!filtered.length) {
    return (
      <div className="text-center py-16 space-y-2">
        <Stethoscope className="h-12 w-12 text-muted-foreground mx-auto" />
        <p className="text-muted-foreground">Nenhuma especialidade disponível para agendamento.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Escolha a especialidade</h2>
        <p className="text-muted-foreground text-sm">Selecione a área desejada para sua consulta</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filtered.map((specialty) => (
          <button
            key={specialty.id}
            onClick={() => navigate(`/agendar/${clinic.slug}/profissional?specialty=${specialty.id}`)}
            className="rounded-xl border bg-card hover:border-primary/50 hover:shadow-md transition-all p-4 text-left space-y-1 group"
          >
            <div className="flex items-center gap-3">
              <div
                className="h-3 w-3 rounded-full shrink-0"
                style={{ backgroundColor: specialty.color || "hsl(var(--primary))" }}
              />
              <span className="font-semibold text-foreground group-hover:text-primary transition-colors">
                {specialty.name}
              </span>
            </div>
            {specialty.description && (
              <p className="text-xs text-muted-foreground pl-6">{specialty.description}</p>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
