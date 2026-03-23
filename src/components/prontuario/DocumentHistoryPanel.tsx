import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useClinicData } from "@/hooks/useClinicData";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import {
  FileText,
  ShieldCheck,
  ShieldX,
  Ban,
  RefreshCw,
  Loader2,
  ArrowRight,
  Link2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { replaceDocument } from "@/utils/documentControl";
import { logAudit } from "@/utils/auditLog";

interface ClinicalDoc {
  id: string;
  document_type: string;
  document_reference: string;
  patient_name: string | null;
  professional_name: string | null;
  is_revoked: boolean;
  revoked_at: string | null;
  revoked_reason: string | null;
  replaced_by_document_id: string | null;
  replaced_by_reference: string | null;
  replaces_document_id: string | null;
  replaces_reference: string | null;
  source_record_id: string | null;
  created_at: string;
}

const TYPE_LABELS: Record<string, string> = {
  anamnese: "Anamnese",
  receita: "Receita",
  atestado: "Atestado",
  evolucao: "Evolução Clínica",
  relatorio: "Relatório",
};

interface DocumentHistoryPanelProps {
  patientId: string;
}

export function DocumentHistoryPanel({ patientId }: DocumentHistoryPanelProps) {
  const { clinic } = useClinicData();
  const [docs, setDocs] = useState<ClinicalDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Revoke modal
  const [revokeTarget, setRevokeTarget] = useState<ClinicalDoc | null>(null);
  const [revokeReason, setRevokeReason] = useState("");
  const [revoking, setRevoking] = useState(false);

  // Replace modal
  const [replaceTarget, setReplaceTarget] = useState<ClinicalDoc | null>(null);
  const [replaceReason, setReplaceReason] = useState("");
  const [replacing, setReplacing] = useState(false);

  const fetchDocs = useCallback(async () => {
    if (!patientId || !clinic?.id) return;
    setLoading(true);
    try {
      // Fetch all docs with extra columns via any cast
      const { data, error } = await supabase
        .from("clinical_documents")
        .select("id, document_type, document_reference, patient_name, professional_name, is_revoked, revoked_at, created_at, source_record_id, revoked_reason, replaced_by_document_id, replaces_document_id" as any)
        .eq("patient_id", patientId)
        .eq("clinic_id", clinic.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const rawDocs = (data || []) as any[];

      // Resolve references for replaced_by and replaces links
      const linkedIds = new Set<string>();
      rawDocs.forEach((d) => {
        if (d.replaced_by_document_id) linkedIds.add(d.replaced_by_document_id);
        if (d.replaces_document_id) linkedIds.add(d.replaces_document_id);
      });

      let refMap: Record<string, string> = {};
      if (linkedIds.size > 0) {
        const { data: linked } = await supabase
          .from("clinical_documents")
          .select("id, document_reference")
          .in("id", Array.from(linkedIds));
        if (linked) {
          linked.forEach((l) => {
            refMap[l.id] = l.document_reference;
          });
        }
      }

      setDocs(
        rawDocs.map((d) => ({
          id: d.id,
          document_type: d.document_type,
          document_reference: d.document_reference,
          patient_name: d.patient_name,
          professional_name: d.professional_name,
          is_revoked: d.is_revoked,
          revoked_at: d.revoked_at,
          revoked_reason: d.revoked_reason || null,
          replaced_by_document_id: d.replaced_by_document_id || null,
          replaced_by_reference: d.replaced_by_document_id ? refMap[d.replaced_by_document_id] || null : null,
          replaces_document_id: d.replaces_document_id || null,
          replaces_reference: d.replaces_document_id ? refMap[d.replaces_document_id] || null : null,
          source_record_id: d.source_record_id || null,
          created_at: d.created_at,
        }))
      );
    } catch (err) {
      console.error("Error fetching clinical documents:", err);
    } finally {
      setLoading(false);
    }
  }, [patientId, clinic?.id]);

  useEffect(() => {
    async function checkRole() {
      if (!clinic?.id) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("clinic_id", clinic.id)
        .maybeSingle();
      if (roleData && ["admin", "owner"].includes(roleData.role)) {
        setIsAdmin(true);
      }
    }
    checkRole();
  }, [clinic?.id]);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  // Simple revocation (no replacement)
  const handleRevoke = async () => {
    if (!revokeTarget || !revokeReason.trim() || !clinic?.id) return;
    setRevoking(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      await supabase
        .from("clinical_documents")
        .update({
          is_revoked: true,
          revoked_at: new Date().toISOString(),
          revoked_by: user.id,
          revoked_reason: revokeReason.trim(),
        } as any)
        .eq("id", revokeTarget.id);

      await supabase.from("clinic_audit_logs").insert({
        clinic_id: clinic.id,
        user_id: user.id,
        action: "document_revoked",
        changes: {
          document_id: revokeTarget.id,
          document_reference: revokeTarget.document_reference,
          document_type: revokeTarget.document_type,
          reason: revokeReason.trim(),
        },
      });

      // Also log to new audit_logs table
      await logAudit({
        clinicId: clinic.id,
        action: 'document_revoked',
        entityType: 'clinical_document',
        entityId: revokeTarget.id,
        metadata: {
          document_reference: revokeTarget.document_reference,
          document_type: revokeTarget.document_type,
          reason: revokeReason.trim(),
        },
      });

      toast.success("Documento revogado com sucesso.");
      setRevokeTarget(null);
      setRevokeReason("");
      await fetchDocs();
    } catch (err) {
      console.error("Error revoking document:", err);
      toast.error("Erro ao revogar documento.");
    } finally {
      setRevoking(false);
    }
  };

  // Replace: revoke old + create new linked document
  const handleReplace = async () => {
    if (!replaceTarget || !replaceReason.trim() || !clinic?.id) return;
    setReplacing(true);
    try {
      const result = await replaceDocument({
        oldDocumentId: replaceTarget.id,
        clinicId: clinic.id,
        patientId,
        documentType: replaceTarget.document_type,
        reason: replaceReason.trim(),
        patientName: replaceTarget.patient_name || undefined,
        professionalName: replaceTarget.professional_name || undefined,
        sourceRecordId: replaceTarget.source_record_id || undefined,
      });

      toast.success(`Documento substituído. Novo: ${result.newReference}`);
      setReplaceTarget(null);
      setReplaceReason("");
      await fetchDocs();
    } catch (err) {
      console.error("Error replacing document:", err);
      toast.error("Erro ao substituir documento.");
    } finally {
      setReplacing(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (docs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-5 w-5" />
            Histórico de Documentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-6">
            Nenhum documento registrado para este paciente.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-5 w-5" />
            Histórico de Documentos
            <Badge variant="secondary" className="ml-1">{docs.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="max-h-[400px]">
            <div className="divide-y">
              {docs.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {doc.is_revoked ? (
                      <ShieldX className="h-5 w-5 text-destructive shrink-0" />
                    ) : (
                      <ShieldCheck className="h-5 w-5 text-emerald-500 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-sm font-medium truncate">
                          {doc.document_reference}
                        </span>
                        <Badge
                          variant={doc.is_revoked ? "destructive" : "default"}
                          className="text-[10px] px-1.5 py-0"
                        >
                          {doc.is_revoked ? "Revogado" : "Válido"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {TYPE_LABELS[doc.document_type] || doc.document_type} •{" "}
                        {format(new Date(doc.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </p>

                      {/* Replacement chain info */}
                      {doc.replaces_reference && (
                        <p className="text-xs text-blue-600 mt-0.5 flex items-center gap-1">
                          <Link2 className="h-3 w-3" />
                          Substitui: {doc.replaces_reference}
                        </p>
                      )}
                      {doc.is_revoked && doc.replaced_by_reference && (
                        <p className="text-xs text-amber-600 mt-0.5 flex items-center gap-1">
                          <ArrowRight className="h-3 w-3" />
                          Substituído por: {doc.replaced_by_reference}
                        </p>
                      )}
                      {doc.is_revoked && doc.revoked_reason && !doc.replaced_by_document_id && (
                        <p className="text-xs text-destructive mt-0.5">
                          Motivo: {doc.revoked_reason}
                        </p>
                      )}
                      {doc.is_revoked && doc.revoked_reason && doc.replaced_by_document_id && (
                        <p className="text-xs text-destructive mt-0.5">
                          Motivo substituição: {doc.revoked_reason}
                        </p>
                      )}
                    </div>
                  </div>

                  {isAdmin && !doc.is_revoked && (
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-blue-600 hover:text-blue-700"
                        onClick={() => setReplaceTarget(doc)}
                      >
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Substituir
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setRevokeTarget(doc)}
                      >
                        <Ban className="h-4 w-4 mr-1" />
                        Revogar
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Revocation Modal */}
      <Dialog
        open={!!revokeTarget}
        onOpenChange={(open) => {
          if (!open) { setRevokeTarget(null); setRevokeReason(""); }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ban className="h-5 w-5 text-destructive" />
              Revogar Documento
            </DialogTitle>
            <DialogDescription>
              Você está prestes a revogar o documento{" "}
              <strong>{revokeTarget?.document_reference}</strong>. Esta ação é irreversível.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label htmlFor="revoke-reason">Motivo da revogação <span className="text-destructive">*</span></Label>
            <Textarea
              id="revoke-reason"
              placeholder="Descreva o motivo da revogação..."
              value={revokeReason}
              onChange={(e) => setRevokeReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRevokeTarget(null); setRevokeReason(""); }}>Cancelar</Button>
            <Button variant="destructive" disabled={!revokeReason.trim() || revoking} onClick={handleRevoke}>
              {revoking && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Confirmar Revogação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Replacement Modal */}
      <Dialog
        open={!!replaceTarget}
        onOpenChange={(open) => {
          if (!open) { setReplaceTarget(null); setReplaceReason(""); }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-blue-600" />
              Substituir Documento
            </DialogTitle>
            <DialogDescription>
              O documento <strong>{replaceTarget?.document_reference}</strong> será revogado e um
              novo documento substituto será gerado automaticamente com novo número sequencial e QR Code.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label htmlFor="replace-reason">Motivo da substituição <span className="text-destructive">*</span></Label>
            <Textarea
              id="replace-reason"
              placeholder="Descreva o motivo da substituição..."
              value={replaceReason}
              onChange={(e) => setReplaceReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setReplaceTarget(null); setReplaceReason(""); }}>Cancelar</Button>
            <Button disabled={!replaceReason.trim() || replacing} onClick={handleReplace}>
              {replacing && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Confirmar Substituição
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
