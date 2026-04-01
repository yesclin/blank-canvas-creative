import { useNavigate, useOutletContext, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CalendarCheck, Clock, UserRound, Shield } from "lucide-react";
import { PublicClinicData } from "@/hooks/usePublicClinic";

export default function PublicClinicBookingPage() {
  const { clinic } = useOutletContext<{ clinic: PublicClinicData }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const professionalId = searchParams.get("professional");

  const settings = clinic.public_booking_settings || {};
  const welcomeText = settings.welcome_text || "Agende sua consulta de forma rápida e segura.";

  const handleStart = () => {
    const basePath = `/agendar/${clinic.slug}`;
    if (professionalId) {
      navigate(`${basePath}/horarios?professional=${professionalId}`);
    } else {
      navigate(`${basePath}/especialidade`);
    }
  };

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="text-center space-y-4 py-8">
        {clinic.logo_url && (
          <img src={clinic.logo_url} alt={clinic.name} className="h-20 w-20 rounded-2xl object-cover mx-auto shadow-lg" />
        )}
        <h1 className="text-3xl font-bold text-foreground">{clinic.name}</h1>
        <p className="text-muted-foreground text-lg max-w-md mx-auto">{welcomeText}</p>
        <Button size="lg" onClick={handleStart} className="mt-4 gap-2">
          <CalendarCheck className="h-5 w-5" />
          Agendar Consulta
        </Button>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: Clock, title: "Rápido", desc: "Agende em poucos minutos" },
          { icon: UserRound, title: "Sem cadastro", desc: "Não precisa criar conta" },
          { icon: Shield, title: "Seguro", desc: "Seus dados estão protegidos" },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="rounded-xl border bg-card p-4 text-center space-y-2">
            <Icon className="h-8 w-8 text-primary mx-auto" />
            <p className="font-semibold text-foreground">{title}</p>
            <p className="text-xs text-muted-foreground">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
