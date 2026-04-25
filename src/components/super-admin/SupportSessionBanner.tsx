/**
 * Banner global do Modo Suporte (impersonação).
 * Aparece em TODA tela (incluindo /app) sempre que houver uma sessão ativa,
 * para deixar claro que o Super Admin está agindo dentro de uma clínica cliente.
 */
import { useEffect, useState } from 'react';
import { ShieldAlert, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getActiveSupportSession, endSupportSession } from '@/lib/supportSession';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function SupportSessionBanner() {
  const [active, setActive] = useState(getActiveSupportSession());
  const [clinicName, setClinicName] = useState<string | null>(null);
  const [ending, setEnding] = useState(false);

  useEffect(() => {
    const onChange = () => setActive(getActiveSupportSession());
    window.addEventListener('yesclin:support-session-changed', onChange);
    window.addEventListener('storage', onChange);
    return () => {
      window.removeEventListener('yesclin:support-session-changed', onChange);
      window.removeEventListener('storage', onChange);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!active) {
      setClinicName(null);
      return;
    }
    supabase
      .from('clinics')
      .select('name')
      .eq('id', active.clinicId)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setClinicName(data?.name ?? active.clinicId);
      });
    return () => { cancelled = true; };
  }, [active]);

  const handleEnd = async () => {
    setEnding(true);
    try {
      await endSupportSession();
      toast.success('Modo suporte encerrado.');
      // Forçar reload para limpar todos os caches/queries da sessão impersonada
      setTimeout(() => window.location.assign('/super-admin/clinicas'), 200);
    } catch (e) {
      toast.error('Erro ao encerrar modo suporte.');
    } finally {
      setEnding(false);
    }
  };

  if (!active) return null;

  return (
    <div className="sticky top-0 z-50 w-full bg-destructive text-destructive-foreground shadow-md">
      <div className="container mx-auto flex items-center justify-between gap-3 px-4 py-2 text-sm">
        <div className="flex items-center gap-2 min-w-0">
          <ShieldAlert className="h-4 w-4 flex-shrink-0" />
          <span className="font-semibold">Modo Suporte ativo</span>
          <span className="opacity-90 truncate">
            • Você está navegando como {clinicName ?? 'clínica'}. Todas as ações são auditadas.
          </span>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="bg-background/10 border-background/30 text-destructive-foreground hover:bg-background/20"
          onClick={handleEnd}
          disabled={ending}
        >
          <X className="h-3.5 w-3.5 mr-1" />
          Encerrar
        </Button>
      </div>
    </div>
  );
}
