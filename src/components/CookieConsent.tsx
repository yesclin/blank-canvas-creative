import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Cookie, X } from "lucide-react";
import { getConsent, setConsent } from "@/lib/analytics";

/**
 * LGPD cookie/analytics consent banner.
 *
 * Shown once until the user grants or denies analytics tracking.
 * Persists the decision via the analytics module (localStorage).
 */
const CookieConsent = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (getConsent() === null) {
      // Small delay so it doesn't compete with hero animations.
      const t = window.setTimeout(() => setVisible(true), 600);
      return () => window.clearTimeout(t);
    }
  }, []);

  const handleAccept = () => {
    setConsent("granted");
    setVisible(false);
  };

  const handleReject = () => {
    setConsent("denied");
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 22, stiffness: 220 }}
          className="fixed inset-x-0 bottom-0 z-[60] p-3 sm:p-5"
          role="dialog"
          aria-live="polite"
          aria-label="Aviso de cookies e analytics"
        >
          <div className="mx-auto max-w-4xl rounded-2xl border border-border/60 bg-card shadow-lg backdrop-blur supports-[backdrop-filter]:bg-card/95">
            <div className="flex flex-col sm:flex-row items-start gap-4 p-5 sm:p-6">
              <div className="hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Cookie size={20} />
              </div>

              <div className="flex-1 text-sm text-foreground/90 leading-relaxed">
                <p className="font-semibold text-foreground mb-1">
                  Sua privacidade importa
                </p>
                <p className="text-muted-foreground">
                  Usamos cookies e ferramentas de analytics (PostHog) para
                  entender como você navega e melhorar o YesClin. Nada é
                  carregado sem o seu consentimento. Saiba mais na{" "}
                  <Link
                    to="/privacidade"
                    className="text-primary font-medium hover:underline"
                  >
                    Política de Privacidade
                  </Link>
                  .
                </p>
              </div>

              <div className="flex w-full sm:w-auto gap-2 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReject}
                  className="flex-1 sm:flex-none"
                >
                  Recusar
                </Button>
                <Button
                  size="sm"
                  onClick={handleAccept}
                  className="flex-1 sm:flex-none"
                >
                  Aceitar todos
                </Button>
                <button
                  type="button"
                  aria-label="Fechar (equivale a recusar)"
                  onClick={handleReject}
                  className="hidden sm:inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CookieConsent;
