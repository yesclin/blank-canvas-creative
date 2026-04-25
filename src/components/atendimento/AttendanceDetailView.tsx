import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { AttendanceDetail } from "@/hooks/useAttendanceDetail";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { handleDownloadPDF, handlePrintAttendance } from "@/utils/attendancePdfGenerator";
import { logDocumentAction } from "@/hooks/useDocumentGovernance";
import { AddNoteDialog, NotesHistoryPanel } from "@/components/atendimento/DocumentGovernanceDialogs";
import { UnifiedSignatureWizard } from "@/components/signature/UnifiedSignatureWizard";
import { SignatureAuditTrailDrawer } from "@/components/signature/SignatureAuditTrailDrawer";
import { logSignatureEvent, type SignableDocumentContext } from "@/hooks/useUnifiedDocumentSigning";
import {
  ArrowLeft, FolderOpen, StickyNote, Printer, Download, PenTool,
  GitCompare, History, Clock, Calendar, User, Stethoscope,
  FileText, Activity, AlertTriangle, Image, DollarSign,
  Lock, CheckCircle2, Shield,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export type AttendanceDetailAction =
  | "sign" | "note" | "addendum" | "print" | "pdf" | "history" | null;

interface Props {
  detail: AttendanceDetail;
  initialAction?: AttendanceDetailAction;
}

// ─── Helpers ─────────────────────────────────────────────
function fmtDate(d: string) {
  try { return format(new Date(d), "dd/MM/yyyy", { locale: ptBR }); } catch { return d; }
}
function fmtTime(t: string | null) {
  if (!t) return "—";
  try { return new Date(t).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }); } catch { return t.slice(0, 5); }
}
function fmtDuration(s: number) {
  if (!s || s <= 0) return "0min";
  const h = Math.floor(s / 3600); const m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}h ${m}min` : `${m}min`;
}
const fmtCurrency = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

function statusLabel(s: string) {
  const map: Record<string, string> = { finalizado: "Finalizado", em_atendimento: "Em Atendimento", rascunho: "Rascunho", assinado: "Assinado", signed: "Assinado", draft: "Rascunho", saved: "Salvo" };
  return map[s] || s;
}

function statusBadgeVariant(s: string): "default" | "secondary" | "destructive" | "outline" {
  if (["assinado", "signed"].includes(s)) return "default";
  if (s === "finalizado") return "secondary";
  return "outline";
}

// ─── Main Component ──────────────────────────────────────
export function AttendanceDetailView({ detail, initialAction = null }: Props) {
  const navigate = useNavigate();
  const pending = Math.max(0, detail.amount_expected - detail.amount_received);
  const hasConsolidated = !!detail.consolidated_document;

  const [pdfLoading, setPdfLoading] = useState(false);
  const [printLoading, setPrintLoading] = useState(false);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [noteDialogMode, setNoteDialogMode] = useState<"note" | "addendum">("note");
  const [signDialogOpen, setSignDialogOpen] = useState(false);
  const [historyPanelOpen, setHistoryPanelOpen] = useState(false);
  const [auditTrailOpen, setAuditTrailOpen] = useState(false);

  const snapshotSource = detail.consolidated_document?.snapshot_json || null;
  const docId = detail.consolidated_document?.id || null;
  const clinicId = (snapshotSource as any)?.clinic?.id || "";
  const isDocSigned = !!detail.consolidated_document?.signed_at;

  // Build integrity payload from the persisted signed document so the PDF
  // shows status banner, signer evidence and SHA-256 hash.
  const integrityPayload = (() => {
    if (!isDocSigned || !detail.consolidated_document) return undefined;
    const cd = detail.consolidated_document;
    const sig = cd.signature;
    const meta = cd.signature_metadata || {};
    return {
      is_signed: true,
      is_locked: cd.is_locked,
      document_id: cd.id,
      document_hash: cd.hash_sha256 || sig?.signature_hash || meta.document_hash || null,
      signature_id: sig?.id || meta.signature_id || null,
      signed_at: cd.signed_at,
      signer_name: sig?.signed_by_name || detail.professional_name || null,
      signer_user_id: meta.user_id || null,
      sign_method: sig?.sign_method || meta.method || null,
      sign_method_label: meta.sign_method_label || null,
      ip_address: sig?.ip_address || meta.ip_address || null,
      user_agent: sig?.user_agent || meta.user_agent || null,
      signature_image_data_url: sig?.evidence_snapshot?.signature_data_url || null,
    };
  })();

  // Toolbar actions
  const handleAddNote = () => { setNoteDialogMode("note"); setNoteDialogOpen(true); };
  const handleAddAddendum = () => { setNoteDialogMode("addendum"); setNoteDialogOpen(true); };
  const handlePrint = async () => {
    if (!snapshotSource) { toast.error("Documento consolidado não disponível para impressão."); return; }
    setPrintLoading(true);
    try {
      await handlePrintAttendance(snapshotSource, integrityPayload);
      if (docId) await logDocumentAction({ documentId: docId, clinicId, actionType: "printed" });
      // Audit signature timeline (only when document is signed)
      if (integrityPayload?.signature_id && clinicId) {
        await logSignatureEvent(integrityPayload.signature_id, clinicId, "print_generated", {
          document_id: docId,
          document_hash_preview: integrityPayload.document_hash?.substring(0, 16) || null,
        });
      }
    } finally { setPrintLoading(false); }
  };
  const handlePDF = async () => {
    if (!snapshotSource) { toast.error("Documento consolidado não disponível para PDF."); return; }
    setPdfLoading(true);
    try {
      await handleDownloadPDF(snapshotSource, integrityPayload);
      if (docId) await logDocumentAction({ documentId: docId, clinicId, actionType: "pdf_exported" });
      if (integrityPayload?.signature_id && clinicId) {
        await logSignatureEvent(integrityPayload.signature_id, clinicId, "pdf_generated", {
          document_id: docId,
          document_hash_preview: integrityPayload.document_hash?.substring(0, 16) || null,
        });
      }
    } finally { setPdfLoading(false); }
  };
  const handleSign = () => setSignDialogOpen(true);
  const handleCompare = () => toast.info("Comparação de atendimentos em desenvolvimento.");
  const handleHistory = () => setHistoryPanelOpen(true);

  // Auto-dispara a ação inicial vinda da listagem (?action=sign|note|...)
  useEffect(() => {
    if (!initialAction) return;
    // Aguarda o detalhe estar carregado antes de validar
    if (initialAction === "sign") {
      if (!docId) {
        toast.error("Documento consolidado indisponível para assinatura.");
        return;
      }
      if (isDocSigned) {
        toast.info("Este documento já foi assinado.");
        return;
      }
      setSignDialogOpen(true);
    } else if (initialAction === "note") {
      if (!docId) { toast.error("Documento consolidado indisponível."); return; }
      setNoteDialogMode("note");
      setNoteDialogOpen(true);
    } else if (initialAction === "addendum") {
      if (!docId) { toast.error("Documento consolidado indisponível."); return; }
      setNoteDialogMode("addendum");
      setNoteDialogOpen(true);
    } else if (initialAction === "history") {
      if (!docId) { toast.error("Documento consolidado indisponível."); return; }
      setHistoryPanelOpen(true);
    } else if (initialAction === "print") {
      if (!snapshotSource) { toast.error("Documento consolidado indisponível para impressão."); return; }
      handlePrint();
    } else if (initialAction === "pdf") {
      if (!snapshotSource) { toast.error("Documento consolidado indisponível para PDF."); return; }
      handlePDF();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialAction, docId, isDocSigned, snapshotSource]);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6 print:p-0 print:space-y-4">
      {/* Back + actions toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <Button variant="ghost" size="sm" className="gap-1.5 self-start" onClick={() => navigate("/app/atendimento")}>
          <ArrowLeft className="h-4 w-4" /> Voltar ao Atendimento
        </Button>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate(`/app/prontuario/${detail.patient_id}?appointmentId=${detail.id}`)}>
            <FolderOpen className="h-3.5 w-3.5" /> Abrir prontuário
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handleAddNote} disabled={!docId}>
            <StickyNote className="h-3.5 w-3.5" /> Nota
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handleAddAddendum} disabled={!docId}>
            <FileText className="h-3.5 w-3.5" /> Adendo
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handlePrint} disabled={printLoading || !snapshotSource}>
            <Printer className="h-3.5 w-3.5" /> {printLoading ? "Preparando..." : "Imprimir"}
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handlePDF} disabled={pdfLoading || !snapshotSource}>
            <Download className="h-3.5 w-3.5" /> {pdfLoading ? "Gerando..." : "PDF"}
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handleSign} disabled={!docId || isDocSigned}>
            <PenTool className="h-3.5 w-3.5" /> {isDocSigned ? "Assinado" : "Assinar"}
          </Button>
          {isDocSigned && (
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setAuditTrailOpen(true)}>
              <Shield className="h-3.5 w-3.5" /> Trilha de auditoria
            </Button>
          )}
          <Button variant="ghost" size="sm" className="gap-1.5" onClick={handleCompare} title="Comparar atendimentos">
            <GitCompare className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="sm" className="gap-1.5" onClick={handleHistory} title="Histórico de notas">
            <History className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* ── Institutional Header ── */}
      <Card className="border-none shadow-sm bg-muted/20 print:bg-white print:shadow-none print:border print:border-border">
        <CardContent className="py-5 px-6">
          <div className="flex items-start gap-4">
            {detail.clinic_logo_url && (
              <img src={detail.clinic_logo_url} alt="Logo" className="h-12 w-12 object-contain rounded" />
            )}
            <div className="flex-1">
              <h1 className="text-xl font-bold text-foreground">{detail.clinic_name}</h1>
              <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground mt-1">
                {detail.clinic_cnpj && <span>CNPJ: {detail.clinic_cnpj}</span>}
                {detail.clinic_phone && <span>Tel: {detail.clinic_phone}</span>}
                {detail.clinic_email && <span>{detail.clinic_email}</span>}
              </div>
            </div>
            <div className="text-right shrink-0">
              <Badge variant={statusBadgeVariant(detail.status)} className="text-xs">
                {statusLabel(detail.status)}
              </Badge>
              {hasConsolidated && (
                <div className="mt-1">
                  <Badge variant="outline" className="text-[10px] gap-1">
                    <Lock className="h-2.5 w-2.5" />
                    Documento consolidado
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Appointment Context ── */}
      <Card>
        <CardContent className="py-4 px-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <InfoField icon={User} label="Paciente" value={detail.patient_name} />
            <InfoField icon={User} label="Profissional" value={detail.professional_name} />
            <InfoField icon={Stethoscope} label="Especialidade" value={detail.specialty_name || "—"} />
            <InfoField icon={FileText} label="Procedimento" value={detail.procedure_name || "—"} />
            <InfoField icon={Calendar} label="Data" value={fmtDate(detail.scheduled_date)} />
            <InfoField icon={Clock} label="Início" value={fmtTime(detail.started_at)} />
            <InfoField icon={Clock} label="Término" value={fmtTime(detail.finished_at)} />
            <InfoField icon={Activity} label="Duração" value={fmtDuration(detail.effective_seconds)} highlight />
          </div>
          {detail.paused_seconds > 0 && (
            <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
              <Clock className="h-3 w-3" /> Pausado por {fmtDuration(detail.paused_seconds)}
            </p>
          )}
        </CardContent>
      </Card>

      {/* ── Clinical Alerts ── */}
      {detail.clinical_alerts.length > 0 && (
        <SectionCard title="Alertas Clínicos" icon={AlertTriangle}>
          <div className="space-y-2">
            {detail.clinical_alerts.map((a) => (
              <div key={a.id} className={cn(
                "rounded-lg border p-3 text-sm",
                a.severity === "critical" ? "border-red-300 bg-red-50 dark:bg-red-950/30" :
                a.severity === "warning" ? "border-yellow-300 bg-yellow-50 dark:bg-yellow-950/30" :
                "border-blue-300 bg-blue-50 dark:bg-blue-950/30"
              )}>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px]">{a.alert_type}</Badge>
                  <span className="font-medium">{a.title}</span>
                </div>
                {a.description && <p className="text-xs text-muted-foreground mt-1">{a.description}</p>}
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* ── Anamnesis Records ── */}
      {detail.anamnesis_records.length > 0 && (
        <SectionCard title="Anamnese" icon={FileText}>
          <div className="space-y-4">
            {detail.anamnesis_records.map((rec) => (
              <div key={rec.id} className="rounded-lg border p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {rec.template_name && <Badge variant="secondary" className="text-[10px]">{rec.template_name}</Badge>}
                    <Badge variant={statusBadgeVariant(rec.status)} className="text-[10px]">{statusLabel(rec.status)}</Badge>
                  </div>
                  <span className="text-[10px] text-muted-foreground">{fmtTime(rec.created_at)}</span>
                </div>
                <AnamnesisContent data={rec.responses || rec.data} />
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* ── Evolutions ── */}
      {detail.evolutions.length > 0 && (
        <SectionCard title="Evoluções Clínicas" icon={Activity}>
          <div className="space-y-4">
            {detail.evolutions.map((ev) => (
              <div key={ev.id} className="rounded-lg border p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {ev.evolution_type && <Badge variant="outline" className="text-[10px]">{ev.evolution_type}</Badge>}
                    <Badge variant={statusBadgeVariant(ev.status)} className="text-[10px]">{statusLabel(ev.status)}</Badge>
                    {ev.signed_at && (
                      <span className="text-[10px] text-green-600 flex items-center gap-0.5">
                        <CheckCircle2 className="h-3 w-3" /> Assinado
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground">{fmtTime(ev.created_at)}</span>
                </div>
                <EvolutionContent content={ev.content} notes={ev.notes} />
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* ── Clinical Documents ── */}
      {detail.clinical_documents.length > 0 && (
        <SectionCard title="Documentos Clínicos" icon={FileText}>
          <div className="space-y-2">
            {detail.clinical_documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{doc.title}</span>
                  <Badge variant="outline" className="text-[10px]">{doc.document_type}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={statusBadgeVariant(doc.status)} className="text-[10px]">{statusLabel(doc.status)}</Badge>
                  <span className="text-[10px] text-muted-foreground">{fmtTime(doc.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* ── Clinical Media ── */}
      {detail.clinical_media.length > 0 && (
        <SectionCard title="Imagens e Anexos" icon={Image}>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {detail.clinical_media.map((m) => (
              <div key={m.id} className="rounded-lg border overflow-hidden bg-muted/30">
                {m.file_type?.startsWith("image") ? (
                  <img
                    src={m.file_url}
                    alt={m.description || m.file_name}
                    className="w-full h-32 object-cover"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <div className="w-full h-32 flex items-center justify-center">
                    <FileText className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                )}
                <div className="p-2">
                  <p className="text-[10px] font-medium truncate">{m.file_name}</p>
                  {m.description && <p className="text-[10px] text-muted-foreground truncate">{m.description}</p>}
                  {m.classification && <Badge variant="outline" className="text-[9px] mt-1">{m.classification}</Badge>}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* ── Financial ── */}
      {detail.amount_expected > 0 && (
        <SectionCard title="Financeiro" icon={DollarSign}>
          <div className="grid grid-cols-3 gap-3">
            <FinanceCard label="Previsto" value={fmtCurrency(detail.amount_expected)} />
            <FinanceCard label="Recebido" value={fmtCurrency(detail.amount_received)} color="text-green-600" />
            <FinanceCard label="Pendente" value={fmtCurrency(pending)} color={pending > 0 ? "text-red-600" : "text-muted-foreground"} />
          </div>
        </SectionCard>
      )}

      {/* ── Notes ── */}
      {(detail.notes || detail.session_notes) && (
        <SectionCard title="Observações" icon={StickyNote}>
          {detail.notes && <p className="text-sm text-foreground/80 whitespace-pre-wrap">{detail.notes}</p>}
          {detail.session_notes && detail.session_notes !== detail.notes && (
            <>
              {detail.notes && <Separator className="my-3" />}
              <p className="text-sm text-foreground/80 whitespace-pre-wrap">{detail.session_notes}</p>
            </>
          )}
        </SectionCard>
      )}

      {/* ── Document integrity ── */}
      {hasConsolidated && (
        <Card className={cn(
          "border-dashed",
          isDocSigned && "border-green-300 bg-green-50/40 dark:bg-green-950/20"
        )}>
          <CardContent className="py-3 px-6">
            <div className="flex items-center justify-between gap-2 text-xs flex-wrap">
              <div className="flex items-center gap-2 flex-wrap text-muted-foreground">
                <Shield className="h-3.5 w-3.5" />
                <span>Documento consolidado gerado em {fmtTime(detail.consolidated_document!.generated_at)}</span>
                {detail.consolidated_document!.is_locked && <Badge variant="outline" className="text-[9px]">Travado</Badge>}
                {detail.consolidated_document!.signed_at && (
                  <Badge className="text-[9px] bg-green-100 text-green-800">Assinado</Badge>
                )}
              </div>
              {isDocSigned && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 text-xs"
                  onClick={() => setAuditTrailOpen(true)}
                >
                  <Shield className="h-3 w-3" /> Ver trilha de auditoria
                </Button>
              )}
            </div>
            {isDocSigned && (
              <div className="mt-2 pt-2 border-t border-green-200 dark:border-green-900 flex items-start gap-2 text-xs text-green-800 dark:text-green-300">
                <Lock className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>
                  Este atendimento foi assinado e está bloqueado. Nenhum registro vinculado pode mais ser alterado.
                  Para complementar informações, utilize um <strong>adendo</strong>.
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Procedimentos Realizados (com materiais utilizados) ── */}
      {((detail.procedures_performed?.length ?? 0) > 0 ||
        (detail.materials_used?.length ?? 0) > 0 ||
        (detail.aesthetic_products?.length ?? 0) > 0) && (
        <SectionCard title="Procedimentos Realizados" icon={Activity}>
          <div className="space-y-3">
            {/* Lista de procedimentos. Quando não há registros estruturados,
                ainda exibimos o procedimento principal do agendamento como
                cabeçalho para agrupar os materiais consumidos. */}
            {((detail.procedures_performed?.length ?? 0) > 0
              ? (detail.procedures_performed ?? []).map((p) => ({
                  id: p.id,
                  name: p.procedure_name,
                  status: p.status,
                  region: p.region,
                  technique: p.technique,
                  performed_at: p.performed_at,
                  notes: p.notes,
                }))
              : [{
                  id: "main-procedure",
                  name: detail.procedure_name || "Procedimento do atendimento",
                  status: detail.status,
                  region: null as string | null,
                  technique: null as string | null,
                  performed_at: detail.started_at || detail.scheduled_date,
                  notes: null as string | null,
                }]
            ).map((p, idx, arr) => {
              // Como hoje cada atendimento normalmente tem 1 procedimento,
              // agrupamos todos os materiais utilizados sob ele. Se houver
              // múltiplos procedimentos estruturados, o primeiro recebe os
              // materiais (e listamos abaixo um bloco "global" para garantir
              // que nada seja escondido).
              const isFirst = idx === 0 && arr.length === 1;
              const matsForProc = isFirst ? detail.materials_used : [];
              return (
                <div key={p.id} className="rounded-lg border p-3 text-sm">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="font-medium">{p.name}</span>
                    <Badge variant="outline" className="text-[10px]">{statusLabel(p.status)}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-x-3">
                    {p.region && <span>Região: {p.region}</span>}
                    {p.technique && <span>Técnica: {p.technique}</span>}
                    <span>{fmtTime(p.performed_at)}</span>
                  </div>
                  {p.notes && <p className="text-xs text-foreground/80 mt-1.5">{p.notes}</p>}

                  {/* Materiais utilizados neste procedimento */}
                  <div className="mt-3 pt-3 border-t border-dashed">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2 flex items-center gap-1">
                      <FileText className="h-3 w-3" /> Materiais utilizados
                    </p>
                    {matsForProc.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic">
                        Nenhum material registrado neste procedimento.
                      </p>
                    ) : (
                      <div className="space-y-1.5">
                        {matsForProc.map((m) => (
                          <div key={`mat-${m.id}`} className="rounded-md bg-muted/40 px-2.5 py-1.5 text-xs">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <span className="font-medium">{m.name}</span>
                              <span className="text-foreground/80">
                                {m.quantity}{m.unit ? ` ${m.unit}` : ""}
                              </span>
                            </div>
                            {(m.batch_number || m.expiry_date || m.manufacturer || m.unit_cost != null || m.origin_label) && (
                              <div className="text-[10px] text-muted-foreground mt-0.5 flex flex-wrap gap-x-2">
                                {m.batch_number && <span>Lote: {m.batch_number}</span>}
                                {m.expiry_date && <span>Validade: {fmtDate(m.expiry_date)}</span>}
                                {m.manufacturer && <span>Fabricante: {m.manufacturer}</span>}
                                {m.unit_cost != null && <span>Custo: {fmtCurrency(m.unit_cost)}</span>}
                                {m.total_cost != null && m.total_cost > 0 && <span>Total: {fmtCurrency(m.total_cost)}</span>}
                                <span>Origem: {m.origin_label}</span>
                              </div>
                            )}
                            {m.notes && <p className="text-[10px] text-foreground/70 mt-0.5">{m.notes}</p>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Caso haja vários procedimentos estruturados, listamos os
                materiais globais abaixo para não esconder nada. */}
            {detail.procedures_performed.length > 1 && detail.materials_used.length > 0 && (
              <div className="rounded-lg border border-dashed p-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2 flex items-center gap-1">
                  <FileText className="h-3 w-3" /> Materiais registrados no atendimento
                </p>
                <div className="space-y-1.5">
                  {detail.materials_used.map((m) => (
                    <div key={`gmat-${m.id}`} className="rounded-md bg-muted/40 px-2.5 py-1.5 text-xs">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="font-medium">{m.name}</span>
                        <span className="text-foreground/80">
                          {m.quantity}{m.unit ? ` ${m.unit}` : ""}
                        </span>
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5 flex flex-wrap gap-x-2">
                        {m.batch_number && <span>Lote: {m.batch_number}</span>}
                        {m.expiry_date && <span>Validade: {fmtDate(m.expiry_date)}</span>}
                        {m.manufacturer && <span>Fabricante: {m.manufacturer}</span>}
                        <span>Origem: {m.origin_label}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </SectionCard>
      )}

      {/* ── Antes / Depois ── */}
      {detail.before_after.length > 0 && (
        <SectionCard title="Antes e Depois" icon={Image}>
          <div className="space-y-3">
            {detail.before_after.map((b) => (
              <div key={b.id} className="rounded-lg border p-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground mb-1">Antes</p>
                    {b.before_image_url ? (
                      <img src={b.before_image_url} alt="Antes" className="w-full h-32 object-cover rounded" loading="lazy" />
                    ) : <div className="h-32 bg-muted/40 rounded flex items-center justify-center text-xs text-muted-foreground">—</div>}
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground mb-1">Depois</p>
                    {b.after_image_url ? (
                      <img src={b.after_image_url} alt="Depois" className="w-full h-32 object-cover rounded" loading="lazy" />
                    ) : <div className="h-32 bg-muted/40 rounded flex items-center justify-center text-xs text-muted-foreground">—</div>}
                  </div>
                </div>
                {(b.title || b.description) && (
                  <p className="text-xs text-foreground/80 mt-2">
                    {b.title && <span className="font-medium">{b.title}: </span>}
                    {b.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* ── Mapa Facial (Estética) ── */}
      {detail.facial_maps.length > 0 && (
        <SectionCard title="Mapa Facial" icon={Activity}>
          <div className="space-y-3">
            {detail.facial_maps.map((m) => (
              <div key={m.id} className="rounded-lg border p-3 text-sm">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-[10px]">{m.map_type || "Mapa"}</Badge>
                  <span className="text-[10px] text-muted-foreground">{fmtTime(m.created_at)}</span>
                </div>
                {m.applications.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {m.applications.map((a) => (
                      <div key={a.id} className="text-xs flex flex-wrap gap-x-3">
                        {a.region && <span className="font-medium">{a.region}</span>}
                        {a.product_name && <span>• {a.product_name}</span>}
                        {a.units != null && <span>• {a.units} U</span>}
                        {a.notes && <span className="text-muted-foreground">— {a.notes}</span>}
                      </div>
                    ))}
                  </div>
                )}
                {m.notes && <p className="text-xs text-foreground/80 mt-2">{m.notes}</p>}
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* ── Odontograma ── */}
      {detail.odontogram && detail.odontogram.records.length > 0 && (
        <SectionCard title="Odontograma" icon={Activity}>
          <div className="space-y-1">
            {detail.odontogram.records.map((r) => (
              <div key={r.id} className="text-xs flex flex-wrap gap-x-3 border-b last:border-0 py-1.5">
                <span className="font-medium">Dente {r.tooth_number}</span>
                {r.surface && <span>Face: {r.surface}</span>}
                <span>Condição: {r.condition}</span>
                {r.notes && <span className="text-muted-foreground">— {r.notes}</span>}
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* ── Medidas Corporais ── */}
      {detail.body_measurements.length > 0 && (
        <SectionCard title="Medidas e Avaliações" icon={Activity}>
          <div className="space-y-2">
            {detail.body_measurements.map((b) => (
              <div key={b.id} className="rounded-lg border p-3 text-xs">
                <Badge variant="outline" className="text-[10px] mb-1">{b.measurement_type}</Badge>
                <pre className="text-[11px] text-foreground/80 whitespace-pre-wrap font-sans">{JSON.stringify(b.data, null, 2)}</pre>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* ── Adendos ── */}
      {detail.addendums.length > 0 && (
        <SectionCard title="Adendos" icon={StickyNote}>
          <div className="space-y-2">
            {detail.addendums.map((a) => (
              <div key={a.id} className="rounded-lg border p-3 text-sm">
                <div className="flex items-center justify-between mb-1">
                  <Badge variant="outline" className="text-[10px]">{a.record_type}</Badge>
                  <span className="text-[10px] text-muted-foreground">{fmtTime(a.created_at)}</span>
                </div>
                {a.reason && <p className="text-[11px] text-muted-foreground italic mb-1">Motivo: {a.reason}</p>}
                <p className="text-xs whitespace-pre-wrap">{a.content}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* ── Empty state if no clinical data ── */}
      {detail.anamnesis_records.length === 0 && detail.evolutions.length === 0 &&
       detail.clinical_documents.length === 0 && detail.clinical_media.length === 0 &&
       detail.clinical_alerts.length === 0 && detail.procedures_performed.length === 0 &&
       detail.aesthetic_products.length === 0 && detail.materials_used.length === 0 &&
       detail.before_after.length === 0 && detail.facial_maps.length === 0 &&
       !detail.odontogram && detail.body_measurements.length === 0 && (
        <Card>
          <CardContent className="py-10">
            <div className="text-center text-muted-foreground">
              <Activity className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm font-medium">Nenhum registro clínico vinculado a este atendimento</p>
              <p className="text-xs mt-1">Registros clínicos serão exibidos quando estiverem vinculados ao appointment_id.</p>
            </div>
          </CardContent>
        </Card>
       )}

      {/* ── Governance Dialogs ── */}
      {docId && (
        <>
          <AddNoteDialog
            open={noteDialogOpen}
            onOpenChange={setNoteDialogOpen}
            documentId={docId}
            clinicId={clinicId}
            mode={noteDialogMode}
          />
          <UnifiedSignatureWizard
            open={signDialogOpen}
            onOpenChange={setSignDialogOpen}
            context={
              {
                document_type: "consolidated_document",
                document_id: docId,
                patient_id: detail.patient_id,
                clinic_id: clinicId,
                snapshot: snapshotSource as Record<string, unknown> | null,
                professional_name: detail.professional_name,
              } as SignableDocumentContext
            }
            patientName={detail.patient_name}
            generatedAt={detail.consolidated_document?.generated_at}
          />
          <NotesHistoryPanel
            open={historyPanelOpen}
            onOpenChange={setHistoryPanelOpen}
            documentId={docId}
            clinicId={clinicId}
          />
          <SignatureAuditTrailDrawer
            open={auditTrailOpen}
            onOpenChange={setAuditTrailOpen}
            recordId={docId}
            clinicId={clinicId}
          />
        </>
      )}
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────

function SectionCard({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-3 pt-4 px-6">
        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Icon className="h-4 w-4" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-6 pb-5">
        {children}
      </CardContent>
    </Card>
  );
}

function InfoField({ icon: Icon, label, value, highlight }: { icon: React.ElementType; label: string; value: string; highlight?: boolean }) {
  return (
    <div className="space-y-0.5">
      <p className="text-[10px] text-muted-foreground flex items-center gap-1">
        <Icon className="h-3 w-3" /> {label}
      </p>
      <p className={cn("text-sm font-medium", highlight && "text-primary")}>{value}</p>
    </div>
  );
}

function FinanceCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-lg bg-muted/50 p-3 text-center">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className={cn("text-sm font-semibold", color)}>{value}</p>
    </div>
  );
}

function AnamnesisContent({ data }: { data: any }) {
  if (!data || typeof data !== "object") return <p className="text-xs text-muted-foreground italic">Sem dados registrados</p>;

  const entries = Object.entries(data).filter(([_, v]) => v !== null && v !== undefined && v !== "");

  if (entries.length === 0) return <p className="text-xs text-muted-foreground italic">Sem dados registrados</p>;

  return (
    <div className="space-y-1.5">
      {entries.slice(0, 20).map(([key, value]) => (
        <div key={key} className="text-xs">
          <span className="font-medium text-foreground/70 capitalize">{key.replace(/_/g, " ")}:</span>{" "}
          <span className="text-foreground/80">
            {typeof value === "object" ? JSON.stringify(value) : String(value)}
          </span>
        </div>
      ))}
      {entries.length > 20 && (
        <p className="text-[10px] text-muted-foreground italic">+ {entries.length - 20} campos adicionais</p>
      )}
    </div>
  );
}

function EvolutionContent({ content, notes }: { content: any; notes: string | null }) {
  const hasContent = content && typeof content === "object" && Object.keys(content).length > 0;

  return (
    <div className="space-y-1.5">
      {hasContent && (
        <div className="space-y-1">
          {Object.entries(content).filter(([_, v]) => v !== null && v !== undefined && v !== "").slice(0, 15).map(([key, value]) => (
            <div key={key} className="text-xs">
              <span className="font-medium text-foreground/70 capitalize">{key.replace(/_/g, " ")}:</span>{" "}
              <span className="text-foreground/80">
                {typeof value === "object" ? JSON.stringify(value) : String(value)}
              </span>
            </div>
          ))}
        </div>
      )}
      {notes && (
        <p className="text-xs text-foreground/80 bg-muted/50 rounded p-2 mt-1">{notes}</p>
      )}
      {!hasContent && !notes && (
        <p className="text-xs text-muted-foreground italic">Sem conteúdo registrado</p>
      )}
    </div>
  );
}
