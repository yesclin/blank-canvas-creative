import { useNavigate, useOutletContext, useSearchParams } from "react-router-dom";
import { PublicClinicData } from "@/hooks/usePublicClinic";
import { usePublicProfessionals } from "@/hooks/usePublicProfessionals";
import { Loader2, UserRound, ArrowLeft } from "lucide-react";

export default function ProfessionalSelectionStep() {
  const { clinic } = useOutletContext<{ clinic: PublicClinicData }>();
  const [searchParams] = useSearchParams();
  const specialtyId = searchParams.get("specialty") || undefined;
  const { data: professionals, isLoading } = usePublicProfessionals(clinic.id, specialtyId);
  const navigate = useNavigate();

  const settings = clinic.public_booking_settings || {};
  const allowedProfessionals: string[] | undefined = settings.allowed_professionals;

  const filtered = allowedProfessionals?.length
    ? (professionals || []).filter((p) => allowedProfessionals.includes(p.id))
    : professionals || [];

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
        <UserRound className="h-12 w-12 text-muted-foreground mx-auto" />
        <p className="text-muted-foreground">Nenhum profissional disponível para esta especialidade.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(`/agendar/${clinic.slug}/especialidade`)}
          className="h-9 w-9 rounded-lg border bg-card flex items-center justify-center hover:bg-muted transition-colors shrink-0"
        >
          <ArrowLeft className="h-4 w-4 text-foreground" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-foreground">Escolha o profissional</h2>
          <p className="text-muted-foreground text-sm">Selecione o profissional de sua preferência</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filtered.map((prof) => (
          <button
            key={prof.id}
            onClick={() => {
              const params = new URLSearchParams();
              params.set("professional", prof.id);
              if (specialtyId) params.set("specialty", specialtyId);
              navigate(`/agendar/${clinic.slug}/horarios?${params.toString()}`);
            }}
            className="rounded-xl border bg-card hover:border-primary/50 hover:shadow-md transition-all p-4 text-left group"
          >
            <div className="flex items-center gap-3">
              {prof.avatar_url ? (
                <img src={prof.avatar_url} alt={prof.full_name} className="h-10 w-10 rounded-full object-cover" />
              ) : (
                <div
                  className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
                  style={{ backgroundColor: prof.color || "hsl(var(--primary))" }}
                >
                  {prof.full_name.charAt(0)}
                </div>
              )}
              <div>
                <p className="font-semibold text-foreground group-hover:text-primary transition-colors">
                  {prof.full_name}
                </p>
                {prof.registration_number && (
                  <p className="text-xs text-muted-foreground">{prof.registration_number}</p>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
