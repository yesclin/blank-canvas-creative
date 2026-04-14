import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Shield,
  KeyRound,
  FileCheck,
  CheckCircle2,
  XCircle,
  FileText,
  Eye,
  AlertTriangle,
  Clock,
} from 'lucide-react';

interface AuditEvent {
  id: string;
  event_type: string;
  metadata: Record<string, unknown>;
  created_at: string;
  created_by: string | null;
}

interface SignatureAuditTrailProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  signatureId: string | null;
  clinicId: string;
}

const EVENT_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  signature_requested: { label: 'Assinatura solicitada', icon: FileText, color: 'text-blue-600' },
  reauth_passed: { label: 'Identidade verificada', icon: KeyRound, color: 'text-green-600' },
  reauth_failed: { label: 'Falha na autenticação', icon: XCircle, color: 'text-red-600' },
  document_hashed: { label: 'Hash de integridade gerado', icon: FileCheck, color: 'text-purple-600' },
  document_signed: { label: 'Documento assinado', icon: CheckCircle2, color: 'text-green-700' },
  pdf_generated: { label: 'PDF gerado', icon: FileText, color: 'text-blue-500' },
  public_validation_viewed: { label: 'Validação pública consultada', icon: Eye, color: 'text-amber-600' },
  signature_revoked: { label: 'Assinatura revogada', icon: AlertTriangle, color: 'text-red-700' },
};

export function SignatureAuditTrail({ open, onOpenChange, signatureId, clinicId }: SignatureAuditTrailProps) {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !signatureId) return;

    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('medical_signature_events')
        .select('*')
        .eq('signature_id', signatureId)
        .eq('clinic_id', clinicId)
        .order('created_at', { ascending: true });

      setEvents((data as AuditEvent[]) || []);
      setLoading(false);
    };
    load();
  }, [open, signatureId, clinicId]);

  const formatDate = (d: string) =>
    new Date(d).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Trilha de Auditoria da Assinatura
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          ) : events.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhum evento registrado
            </p>
          ) : (
            <div className="relative pl-6 space-y-0">
              {/* Timeline line */}
              <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border" />

              {events.map((event, idx) => {
                const config = EVENT_CONFIG[event.event_type] || {
                  label: event.event_type,
                  icon: Clock,
                  color: 'text-muted-foreground',
                };
                const Icon = config.icon;

                return (
                  <div key={event.id} className="relative pb-4">
                    {/* Dot */}
                    <div className={`absolute -left-6 top-1 h-[22px] w-[22px] rounded-full bg-background border-2 flex items-center justify-center ${config.color}`}>
                      <Icon className="h-3 w-3" />
                    </div>

                    <div className="ml-2">
                      <p className={`text-sm font-medium ${config.color}`}>{config.label}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(event.created_at)}</p>

                      {event.metadata && Object.keys(event.metadata).length > 0 && (
                        <div className="mt-1 text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1 font-mono">
                          {Object.entries(event.metadata).map(([k, v]) => (
                            <div key={k}>
                              <span className="text-muted-foreground">{k}:</span>{' '}
                              <span>{String(v)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
