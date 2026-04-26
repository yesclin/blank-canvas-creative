import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ShieldOff } from "lucide-react";
import {
  getConsent,
  setConsent,
  type ConsentValue,
} from "@/lib/analytics";

/**
 * Lets the user view and revoke/grant their analytics consent
 * from the Privacy page (LGPD requirement: easy revocation).
 */
const ConsentManager = () => {
  const [consent, setLocalConsent] = useState<ConsentValue>(null);

  useEffect(() => {
    setLocalConsent(getConsent());
    const onChange = (e: Event) => {
      const detail = (e as CustomEvent<ConsentValue>).detail ?? null;
      setLocalConsent(detail);
    };
    window.addEventListener("yc-consent-change", onChange);
    return () => window.removeEventListener("yc-consent-change", onChange);
  }, []);

  const grant = () => {
    setConsent("granted");
    setLocalConsent("granted");
  };

  const revoke = () => {
    setConsent("denied");
    setLocalConsent("denied");
  };

  const label =
    consent === "granted"
      ? "Você aceitou cookies de analytics."
      : consent === "denied"
        ? "Você recusou cookies de analytics."
        : "Você ainda não definiu suas preferências.";

  return (
    <div className="not-prose mt-4 rounded-xl border border-border/60 bg-card p-5">
      <div className="flex items-start gap-3 mb-4">
        {consent === "granted" ? (
          <CheckCircle2 className="text-primary mt-0.5" size={20} />
        ) : (
          <ShieldOff className="text-muted-foreground mt-0.5" size={20} />
        )}
        <div>
          <div className="font-semibold text-foreground">
            Preferências de cookies
          </div>
          <div className="text-sm text-muted-foreground mt-1">{label}</div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={consent === "granted" ? "secondary" : "default"}
          onClick={grant}
          disabled={consent === "granted"}
        >
          Aceitar analytics
        </Button>
        <Button
          size="sm"
          variant={consent === "denied" ? "secondary" : "outline"}
          onClick={revoke}
          disabled={consent === "denied"}
        >
          Recusar / revogar
        </Button>
      </div>
    </div>
  );
};

export default ConsentManager;
