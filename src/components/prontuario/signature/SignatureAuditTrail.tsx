import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Shield, Clock, User, Fingerprint, Monitor, MapPin,
  Camera, PenTool, Hash, FileCheck, CheckCircle2,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface SignatureAuditTrailProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  signatureId: string;
  clinicId: string;
}

export function SignatureAuditTrail({ open, onOpenChange, signatureId, clinicId }: SignatureAuditTrailProps) {
  const [signature, setSignature] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [evidence, setEvidence] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open || !signatureId) return;
    setLoading(true);

    Promise.all([
      supabase.from('medical_record_signatures').select('*').eq('id', signatureId).single(),
      supabase.from('medical_signature_events').select('*').eq('signature_id', signatureId).order('created_at', { ascending: true }),
      supabase.from('signature_evidence').select('*').eq('signature_id', signatureId).order('collected_at', { ascending: true }),
    ]).then(([sigRes, evtRes, evidRes]) => {
      setSignature(sigRes.data);
      setEvents(evtRes.data || []);
      setEvidence(evidRes.data || []);
      setLoading(false);
    });
  }, [open, signatureId]);

  const fmt = (d: string) => new Date(d).toLocaleString('pt-BR');

  const eventIcon: Record<string, any> = {
    signature_requested: Clock,
    reauth_passed: Fingerprint,
    selfie_captured: Camera,
    handwritten_captured: PenTool,
    document_hashed: Hash,
    document_signed: CheckCircle2,
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Trilha de Auditoria da Assinatura
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[65vh] pr-2">
          {loading ? (
            <div className="py-8 text-center text-muted-foreground">Carregando...</div>
          ) : !signature ? (
            <div className="py-8 text-center text-muted-foreground">Assinatura não encontrada.</div>
          ) : (
            <div className="space-y-6">
              {/* Header */}
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="default" className="text-xs">
                    {signature.signature_level?.toUpperCase() || 'AVANÇADA'}
                  </Badge>
                  <span className="text-xs text-muted-foreground font-mono">{signature.id?.slice(0, 8)}</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-muted-foreground">Signatário:</span><p className="font-medium">{signature.signed_by_name}</p></div>
                  <div><span className="text-muted-foreground">Data:</span><p className="font-medium">{fmt(signature.signed_at)}</p></div>
                  <div><span className="text-muted-foreground">Método Auth:</span><p className="font-medium">{signature.sign_method || 'password_reauth'}</p></div>
                  <div><span className="text-muted-foreground">IP:</span><p className="font-medium font-mono text-xs">{signature.ip_address || '-'}</p></div>
                </div>
              </div>

              {/* Hash */}
              <div className="rounded-lg bg-muted/50 p-3 space-y-1">
                <div className="flex items-center gap-2 text-sm font-medium"><Hash className="h-4 w-4" /> SHA-256</div>
                <p className="text-xs font-mono break-all text-muted-foreground">{signature.signature_hash || '-'}</p>
              </div>

              {/* Evidence */}
              {evidence.length > 0 && (
                <>
                  <Separator />
                  <h4 className="font-medium text-sm flex items-center gap-2"><FileCheck className="h-4 w-4" /> Evidências Coletadas</h4>
                  <div className="space-y-2">
                    {evidence.map(ev => (
                      <div key={ev.id} className="flex items-center gap-3 p-2 rounded border text-sm">
                        {ev.evidence_type === 'selfie' && <Camera className="h-4 w-4 text-blue-500" />}
                        {ev.evidence_type === 'handwritten_signature' && <PenTool className="h-4 w-4 text-purple-500" />}
                        {ev.evidence_type === 'geolocation' && <MapPin className="h-4 w-4 text-green-500" />}
                        <div className="flex-1">
                          <span className="capitalize">{ev.evidence_type.replace(/_/g, ' ')}</span>
                          <p className="text-xs text-muted-foreground">{fmt(ev.collected_at)}</p>
                        </div>
                        {ev.file_path && <Badge variant="outline" className="text-xs">Arquivo salvo</Badge>}
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Timeline */}
              <Separator />
              <h4 className="font-medium text-sm flex items-center gap-2"><Clock className="h-4 w-4" /> Timeline de Eventos</h4>
              <div className="space-y-0">
                {events.map((evt, i) => {
                  const Icon = eventIcon[evt.event_type] || Clock;
                  return (
                    <div key={evt.id} className="flex gap-3 pb-3">
                      <div className="flex flex-col items-center">
                        <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
                          <Icon className="h-3.5 w-3.5 text-primary" />
                        </div>
                        {i < events.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}
                      </div>
                      <div className="flex-1 pb-1">
                        <p className="text-sm font-medium">{evt.event_type.replace(/_/g, ' ')}</p>
                        <p className="text-xs text-muted-foreground">{fmt(evt.created_at)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Device info */}
              <div className="rounded-lg bg-muted/30 p-3 space-y-1">
                <div className="flex items-center gap-2 text-sm font-medium"><Monitor className="h-4 w-4" /> Dispositivo</div>
                <p className="text-xs text-muted-foreground break-all">{signature.user_agent || '-'}</p>
              </div>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
