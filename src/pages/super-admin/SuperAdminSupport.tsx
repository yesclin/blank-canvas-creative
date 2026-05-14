import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertCircle, CheckCircle2, Clock, Download, Inbox, Loader2,
  MessageSquare, Search, Send, Headset, Bug, Lock,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Navigate } from "react-router-dom";
import { usePlatformAdmin } from "@/hooks/usePlatformAdmin";
import { logPlatformAction } from "@/lib/superAdminAudit";

type Status = "aberto" | "em_triagem" | "em_atendimento" | "aguardando_usuario" | "aguardando_suporte" | "resolvido" | "cancelado";
type Priority = "baixa" | "media" | "alta" | "critica";
type Category = "duvida" | "erro_sistema" | "problema_acesso" | "financeiro_assinatura" | "agenda" | "pacientes" | "prontuario" | "whatsapp" | "teleconsulta" | "relatorios" | "estoque" | "sugestao_melhoria" | "outro";

interface Ticket {
  id: string; code: string; clinic_id: string; created_by: string | null;
  requester_name: string | null; requester_email: string | null; requester_role: string | null;
  title: string; description: string; category: Category; priority: Priority; status: Status;
  assigned_to: string | null; route: string | null; module: string | null; environment: string;
  user_agent: string | null; screen_size: string | null; technical_context: any;
  last_error_message: string | null; related_occurrence_id: string | null;
  resolved_at: string | null; resolved_by: string | null; resolution_summary: string | null;
  root_cause: string | null; preventive_action: string | null;
  created_at: string; updated_at: string;
}

interface TicketMessage {
  id: string; ticket_id: string; author_user_id: string | null; author_name: string | null;
  author_email: string | null; author_type: "clinic_user" | "support_user" | "system";
  message: string; is_internal: boolean; created_at: string;
}

interface TicketAttachment {
  id: string; ticket_id: string; file_name: string; file_url: string; file_path: string;
  file_type: string | null; file_size: number | null; created_at: string;
}

interface TicketEvent {
  id: string; ticket_id: string; actor_user_id: string | null; event_type: string;
  old_value: string | null; new_value: string | null; metadata: any; created_at: string;
}

const STATUS_LABEL: Record<Status, string> = {
  aberto: "Aberto", em_triagem: "Em triagem", em_atendimento: "Em atendimento",
  aguardando_usuario: "Aguardando usuário", aguardando_suporte: "Aguardando suporte",
  resolvido: "Resolvido", cancelado: "Cancelado",
};
const STATUS_VARIANT: Record<Status, "default" | "secondary" | "outline" | "destructive"> = {
  aberto: "default", em_triagem: "secondary", em_atendimento: "default",
  aguardando_usuario: "secondary", aguardando_suporte: "destructive",
  resolvido: "outline", cancelado: "outline",
};
const PRIORITY_LABEL: Record<Priority, string> = { baixa: "Baixa", media: "Média", alta: "Alta", critica: "Crítica" };
const PRIORITY_COLOR: Record<Priority, string> = {
  baixa: "bg-muted text-muted-foreground",
  media: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  alta: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  critica: "bg-destructive/10 text-destructive",
};
const CATEGORY_LABEL: Record<Category, string> = {
  duvida: "Dúvida", erro_sistema: "Erro no sistema", problema_acesso: "Problema de acesso",
  financeiro_assinatura: "Financeiro/Assinatura", agenda: "Agenda", pacientes: "Pacientes",
  prontuario: "Prontuário", whatsapp: "WhatsApp", teleconsulta: "Teleconsulta",
  relatorios: "Relatórios", estoque: "Estoque", sugestao_melhoria: "Sugestão de melhoria", outro: "Outro",
};

function fmt(s: string) {
  return new Date(s).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export default function SuperAdminSupport() {
  const { isPlatformAdmin, loading: adminLoading, userId, email } = usePlatformAdmin();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [clinics, setClinics] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [priorityFilter, setPriorityFilter] = useState("todos");
  const [categoryFilter, setCategoryFilter] = useState("todos");
  const [unassigned, setUnassigned] = useState(false);
  const [detail, setDetail] = useState<Ticket | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("support_tickets")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000);
      if (error) throw error;
      setTickets((data ?? []) as Ticket[]);
      // load clinic names
      const ids = Array.from(new Set((data ?? []).map((d: any) => d.clinic_id)));
      if (ids.length > 0) {
        const { data: cs } = await supabase.from("clinics").select("id,name").in("id", ids);
        const map: Record<string, string> = {};
        (cs ?? []).forEach((c: any) => { map[c.id] = c.name; });
        setClinics(map);
      }
    } catch (e: any) {
      console.error("[SuperAdminSupport]", e);
      toast.error("Não foi possível carregar os chamados.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (isPlatformAdmin) fetchAll(); }, [isPlatformAdmin, fetchAll]);

  const filtered = useMemo(() => tickets.filter((t) => {
    if (statusFilter !== "todos" && t.status !== statusFilter) return false;
    if (priorityFilter !== "todos" && t.priority !== priorityFilter) return false;
    if (categoryFilter !== "todos" && t.category !== categoryFilter) return false;
    if (unassigned && t.assigned_to) return false;
    if (search) {
      const q = search.toLowerCase();
      return t.code.toLowerCase().includes(q) ||
        t.title.toLowerCase().includes(q) ||
        (t.requester_email ?? "").toLowerCase().includes(q) ||
        (t.requester_name ?? "").toLowerCase().includes(q) ||
        (clinics[t.clinic_id] ?? "").toLowerCase().includes(q);
    }
    return true;
  }), [tickets, search, statusFilter, priorityFilter, categoryFilter, unassigned, clinics]);

  const counts = useMemo(() => {
    const sevenAgo = Date.now() - 7 * 86400000;
    return {
      abertos: tickets.filter((t) => t.status === "aberto" || t.status === "em_triagem").length,
      em_atendimento: tickets.filter((t) => t.status === "em_atendimento").length,
      aguardando_usuario: tickets.filter((t) => t.status === "aguardando_usuario").length,
      criticos: tickets.filter((t) => t.priority === "critica" && t.status !== "resolvido" && t.status !== "cancelado").length,
      resolvidos7: tickets.filter((t) => t.resolved_at && new Date(t.resolved_at).getTime() > sevenAgo).length,
    };
  }, [tickets]);

  const exportCsv = () => {
    const headers = ["Código", "Clínica", "Solicitante", "E-mail", "Categoria", "Prioridade", "Status", "Criado em", "Atualizado em"];
    const rows = filtered.map((t) => [
      t.code, clinics[t.clinic_id] ?? t.clinic_id, t.requester_name ?? "", t.requester_email ?? "",
      CATEGORY_LABEL[t.category], PRIORITY_LABEL[t.priority], STATUS_LABEL[t.status], fmt(t.created_at), fmt(t.updated_at),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `chamados-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (adminLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-5 w-5 animate-spin" /></div>;
  }
  if (!isPlatformAdmin) return <Navigate to="/app" replace />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Headset className="h-6 w-6" /> Central de Suporte
          </h1>
          <p className="text-sm text-muted-foreground">
            Atendimento e acompanhamento dos chamados enviados pelas clínicas.
          </p>
        </div>
        <Button variant="outline" onClick={exportCsv}>
          <Download className="h-4 w-4 mr-2" /> Exportar CSV
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard icon={<Inbox className="h-4 w-4" />} label="Abertos" value={counts.abertos} />
        <KpiCard icon={<Clock className="h-4 w-4" />} label="Em atendimento" value={counts.em_atendimento} />
        <KpiCard icon={<MessageSquare className="h-4 w-4" />} label="Aguardando usuário" value={counts.aguardando_usuario} />
        <KpiCard icon={<AlertCircle className="h-4 w-4" />} label="Críticos" value={counts.criticos} highlight />
        <KpiCard icon={<CheckCircle2 className="h-4 w-4" />} label="Resolvidos (7d)" value={counts.resolvidos7} />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Chamados</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 md:grid-cols-5">
            <div className="relative md:col-span-2">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar por código, clínica, e-mail..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos status</SelectItem>
                {Object.entries(STATUS_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger><SelectValue placeholder="Prioridade" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas prioridades</SelectItem>
                {Object.entries(PRIORITY_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger><SelectValue placeholder="Categoria" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas categorias</SelectItem>
                {Object.entries(CATEGORY_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Button variant={unassigned ? "default" : "outline"} size="sm" onClick={() => setUnassigned((v) => !v)}>
              Sem responsável
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando...
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">Nenhum chamado encontrado.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Clínica</TableHead>
                  <TableHead>Solicitante</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Atualizado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((t) => (
                  <TableRow key={t.id} className="cursor-pointer" onClick={() => setDetail(t)}>
                    <TableCell className="font-mono text-xs">{t.code}</TableCell>
                    <TableCell className="font-medium max-w-[260px] truncate">{t.title}</TableCell>
                    <TableCell className="text-sm">{clinics[t.clinic_id] ?? "—"}</TableCell>
                    <TableCell className="text-xs">
                      <div>{t.requester_name ?? "—"}</div>
                      <div className="text-muted-foreground">{t.requester_email ?? ""}</div>
                    </TableCell>
                    <TableCell className="text-xs">{CATEGORY_LABEL[t.category]}</TableCell>
                    <TableCell><span className={`px-2 py-0.5 rounded text-xs ${PRIORITY_COLOR[t.priority]}`}>{PRIORITY_LABEL[t.priority]}</span></TableCell>
                    <TableCell><Badge variant={STATUS_VARIANT[t.status]}>{STATUS_LABEL[t.status]}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{fmt(t.updated_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <SupportDetailSheet
        ticket={detail}
        clinicName={detail ? clinics[detail.clinic_id] : null}
        onOpenChange={(o) => !o && setDetail(null)}
        adminUserId={userId}
        adminEmail={email}
        onChange={fetchAll}
      />
    </div>
  );
}

function KpiCard({ icon, label, value, highlight }: { icon: React.ReactNode; label: string; value: number; highlight?: boolean }) {
  return (
    <Card className={highlight && value > 0 ? "border-destructive" : undefined}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">{icon}{label}</div>
        <div className="text-2xl font-semibold mt-1">{value}</div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// SUPPORT DETAIL SHEET
// ============================================================================

interface DetailProps {
  ticket: Ticket | null;
  clinicName: string | null;
  onOpenChange: (o: boolean) => void;
  adminUserId: string | null;
  adminEmail: string | null;
  onChange: () => void;
}

function SupportDetailSheet({ ticket, clinicName, onOpenChange, adminUserId, adminEmail, onChange }: DetailProps) {
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [attachments, setAttachments] = useState<TicketAttachment[]>([]);
  const [events, setEvents] = useState<TicketEvent[]>([]);
  const [reply, setReply] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState("conversa");

  // resolution form
  const [rootCause, setRootCause] = useState("");
  const [resolutionSummary, setResolutionSummary] = useState("");
  const [preventive, setPreventive] = useState("");

  const open = !!ticket;

  useEffect(() => {
    if (!ticket) return;
    setRootCause(ticket.root_cause ?? "");
    setResolutionSummary(ticket.resolution_summary ?? "");
    setPreventive(ticket.preventive_action ?? "");
    (async () => {
      const [m, a, e] = await Promise.all([
        supabase.from("support_ticket_messages").select("*").eq("ticket_id", ticket.id).order("created_at"),
        supabase.from("support_ticket_attachments").select("*").eq("ticket_id", ticket.id).order("created_at"),
        supabase.from("support_ticket_events").select("*").eq("ticket_id", ticket.id).order("created_at", { ascending: false }),
      ]);
      setMessages((m.data ?? []) as TicketMessage[]);
      setAttachments((a.data ?? []) as TicketAttachment[]);
      setEvents((e.data ?? []) as TicketEvent[]);
    })();
  }, [ticket]);

  if (!ticket) return null;

  const refresh = async () => {
    const { data } = await supabase.from("support_tickets").select("*").eq("id", ticket.id).maybeSingle();
    if (data) {
      onChange();
      // reload conversation/events
      const [m, e] = await Promise.all([
        supabase.from("support_ticket_messages").select("*").eq("ticket_id", ticket.id).order("created_at"),
        supabase.from("support_ticket_events").select("*").eq("ticket_id", ticket.id).order("created_at", { ascending: false }),
      ]);
      setMessages((m.data ?? []) as TicketMessage[]);
      setEvents((e.data ?? []) as TicketEvent[]);
    }
  };

  const audit = async (action: string, meta: Record<string, any> = {}) => {
    try {
      await logPlatformAction({
        action,
        target_type: "support_ticket",
        target_id: ticket.id,
        metadata: { code: ticket.code, ...meta },
      });
    } catch (e) { console.error(e); }
  };

  const sendReply = async () => {
    if (!reply.trim() || !adminUserId) return;
    setBusy(true);
    try {
      await supabase.from("support_ticket_messages").insert({
        ticket_id: ticket.id, author_user_id: adminUserId, author_name: adminEmail,
        author_email: adminEmail, author_type: "support_user", message: reply.trim(), is_internal: false,
      });
      await supabase.from("support_tickets").update({
        status: "aguardando_usuario", updated_at: new Date().toISOString(),
        ...(ticket.assigned_to ? {} : { assigned_to: adminUserId }),
      } as any).eq("id", ticket.id);
      await supabase.from("support_ticket_events").insert({
        ticket_id: ticket.id, actor_user_id: adminUserId, event_type: "support_replied",
      });
      await audit("support_ticket_message_sent");
      toast.success("Resposta enviada.");
      setReply("");
      await refresh();
    } catch (e) { console.error(e); toast.error("Falha ao enviar resposta."); }
    finally { setBusy(false); }
  };

  const addInternalNote = async () => {
    if (!internalNote.trim() || !adminUserId) return;
    setBusy(true);
    try {
      await supabase.from("support_ticket_messages").insert({
        ticket_id: ticket.id, author_user_id: adminUserId, author_name: adminEmail,
        author_email: adminEmail, author_type: "support_user", message: internalNote.trim(), is_internal: true,
      });
      await supabase.from("support_ticket_events").insert({
        ticket_id: ticket.id, actor_user_id: adminUserId, event_type: "internal_note_added",
      });
      await audit("support_ticket_internal_note_added");
      toast.success("Nota interna adicionada.");
      setInternalNote("");
      await refresh();
    } catch (e) { console.error(e); toast.error("Falha ao adicionar nota."); }
    finally { setBusy(false); }
  };

  const updateField = async (patch: Record<string, any>, eventType: string, meta: Record<string, any> = {}) => {
    setBusy(true);
    try {
      await supabase.from("support_tickets").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", ticket.id);
      await supabase.from("support_ticket_events").insert({
        ticket_id: ticket.id, actor_user_id: adminUserId, event_type: eventType, metadata: meta,
      });
      await audit(`support_ticket_${eventType}`, meta);
      await refresh();
    } catch (e) { console.error(e); toast.error("Falha ao atualizar."); }
    finally { setBusy(false); }
  };

  const assumeTicket = () => updateField({ assigned_to: adminUserId, status: "em_atendimento" }, "assigned", { to: adminEmail });
  const changeStatus = (s: Status) => updateField({ status: s }, "status_changed", { new: s });
  const changePriority = (p: Priority) => updateField({ priority: p }, "priority_changed", { new: p });

  const resolve = async () => {
    if (!resolutionSummary.trim()) { toast.error("Informe o resumo da solução."); return; }
    setBusy(true);
    try {
      await supabase.from("support_tickets").update({
        status: "resolvido",
        resolved_at: new Date().toISOString(),
        resolved_by: adminUserId,
        root_cause: rootCause || null,
        resolution_summary: resolutionSummary,
        preventive_action: preventive || null,
        updated_at: new Date().toISOString(),
      } as any).eq("id", ticket.id);
      await supabase.from("support_ticket_events").insert({
        ticket_id: ticket.id, actor_user_id: adminUserId, event_type: "ticket_resolved",
      });
      await audit("support_ticket_resolved");
      toast.success("Chamado resolvido.");
      await refresh();
    } catch (e) { console.error(e); toast.error("Falha ao resolver."); }
    finally { setBusy(false); }
  };

  const reopen = () => updateField({ status: "em_atendimento", resolved_at: null, resolved_by: null }, "ticket_reopened");

  const createOccurrence = async () => {
    setBusy(true);
    try {
      const { data: occ, error } = await supabase.from("platform_occurrences").insert({
        clinic_id: ticket.clinic_id,
        title: `[${ticket.code}] ${ticket.title}`,
        description: ticket.description,
        category: ticket.category === "erro_sistema" ? "bug" : "outro",
        priority: ticket.priority,
        status: "aberta",
        module: ticket.module,
        route: ticket.route,
        environment: ticket.environment,
        user_agent: ticket.user_agent,
        technical_context: ticket.technical_context,
        reported_by_user_id: ticket.created_by,
        reported_by_name: ticket.requester_name,
        reported_by_email: ticket.requester_email,
        created_by: adminUserId,
      } as any).select("id").maybeSingle();
      if (error) throw error;
      if (occ) {
        await supabase.from("support_tickets").update({ related_occurrence_id: occ.id }).eq("id", ticket.id);
        await supabase.from("support_ticket_events").insert({
          ticket_id: ticket.id, actor_user_id: adminUserId, event_type: "occurrence_created",
          new_value: occ.id,
        });
        await audit("support_ticket_occurrence_created", { occurrence_id: occ.id });
        toast.success("Ocorrência criada a partir deste chamado.");
        await refresh();
      }
    } catch (e) { console.error(e); toast.error("Falha ao criar ocorrência."); }
    finally { setBusy(false); }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-3xl overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center gap-2 flex-wrap">
            <SheetTitle className="font-mono text-sm">{ticket.code}</SheetTitle>
            <Badge variant={STATUS_VARIANT[ticket.status]}>{STATUS_LABEL[ticket.status]}</Badge>
            <span className={`px-2 py-0.5 rounded text-xs ${PRIORITY_COLOR[ticket.priority]}`}>{PRIORITY_LABEL[ticket.priority]}</span>
            {ticket.related_occurrence_id && <Badge variant="secondary"><Bug className="h-3 w-3 mr-1" />Ocorrência vinculada</Badge>}
          </div>
          <SheetDescription className="text-foreground font-medium text-base">{ticket.title}</SheetDescription>
        </SheetHeader>

        <div className="mt-4 grid grid-cols-2 gap-2 text-xs border rounded p-3 bg-muted/20">
          <div><span className="text-muted-foreground">Clínica:</span> {clinicName ?? ticket.clinic_id}</div>
          <div><span className="text-muted-foreground">Solicitante:</span> {ticket.requester_name ?? "—"}</div>
          <div><span className="text-muted-foreground">E-mail:</span> {ticket.requester_email ?? "—"}</div>
          <div><span className="text-muted-foreground">Papel:</span> {ticket.requester_role ?? "—"}</div>
          <div><span className="text-muted-foreground">Categoria:</span> {CATEGORY_LABEL[ticket.category]}</div>
          <div><span className="text-muted-foreground">Aberto em:</span> {fmt(ticket.created_at)}</div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={assumeTicket} disabled={busy}>Assumir</Button>
          <Select value={ticket.status} onValueChange={(v) => changeStatus(v as Status)}>
            <SelectTrigger className="h-8 w-44"><SelectValue /></SelectTrigger>
            <SelectContent>{Object.entries(STATUS_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={ticket.priority} onValueChange={(v) => changePriority(v as Priority)}>
            <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
            <SelectContent>{Object.entries(PRIORITY_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
          </Select>
          {!ticket.related_occurrence_id && (
            <Button size="sm" variant="outline" onClick={createOccurrence} disabled={busy}>
              <Bug className="h-3 w-3 mr-1" /> Criar ocorrência
            </Button>
          )}
          {ticket.status === "resolvido" && (
            <Button size="sm" variant="outline" onClick={reopen} disabled={busy}>Reabrir</Button>
          )}
        </div>

        <Tabs value={tab} onValueChange={setTab} className="mt-5">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="conversa">Conversa</TabsTrigger>
            <TabsTrigger value="tecnico">Técnico</TabsTrigger>
            <TabsTrigger value="historico">Histórico</TabsTrigger>
            <TabsTrigger value="resolucao">Resolução</TabsTrigger>
          </TabsList>

          <TabsContent value="conversa" className="space-y-4">
            <ScrollArea className="h-72 rounded border p-3 bg-muted/20">
              <div className="space-y-3">
                {messages.length === 0 && <p className="text-xs text-muted-foreground text-center py-6">Sem mensagens.</p>}
                {messages.map((m) => (
                  <div key={m.id} className={`rounded-md p-3 text-sm ${
                    m.is_internal ? "bg-amber-500/10 border border-amber-500/30" :
                    m.author_type === "support_user" ? "bg-card border" :
                    m.author_type === "clinic_user" ? "bg-primary/5 border border-primary/20" :
                    "bg-muted text-muted-foreground italic"
                  }`}>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                      <span className="font-medium flex items-center gap-1">
                        {m.is_internal && <Lock className="h-3 w-3" />}
                        {m.author_type === "support_user" ? (m.is_internal ? "Nota interna" : "Suporte") : m.author_type === "clinic_user" ? (m.author_name ?? "Cliente") : "Sistema"}
                        {" · "}{m.author_email ?? ""}
                      </span>
                      <span>{fmt(m.created_at)}</span>
                    </div>
                    <p className="whitespace-pre-wrap">{m.message}</p>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {attachments.length > 0 && (
              <div>
                <Label className="text-xs">Anexos do chamado</Label>
                <ul className="mt-1 space-y-1">
                  {attachments.map((a) => (
                    <li key={a.id} className="text-xs flex items-center gap-2 bg-muted/40 rounded px-2 py-1">
                      <a href={a.file_url} target="_blank" rel="noreferrer" className="text-primary hover:underline truncate">{a.file_name}</a>
                      {a.file_size && <span className="text-muted-foreground">({(a.file_size / 1024).toFixed(1)} KB)</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="space-y-2">
              <Label>Responder ao usuário</Label>
              <Textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={3} placeholder="Resposta visível para a clínica..." />
              <div className="text-right">
                <Button onClick={sendReply} disabled={busy || !reply.trim()}>
                  {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}Responder
                </Button>
              </div>
            </div>

            <div className="space-y-2 border-t pt-4">
              <Label className="flex items-center gap-1"><Lock className="h-3 w-3" /> Nota interna</Label>
              <Textarea value={internalNote} onChange={(e) => setInternalNote(e.target.value)} rows={2} placeholder="Apenas para a equipe de suporte..." />
              <div className="text-right">
                <Button variant="outline" onClick={addInternalNote} disabled={busy || !internalNote.trim()}>Adicionar nota interna</Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="tecnico" className="space-y-2 text-xs">
            <div><span className="text-muted-foreground">Rota:</span> {ticket.route ?? "—"}</div>
            <div><span className="text-muted-foreground">Módulo:</span> {ticket.module ?? "—"}</div>
            <div><span className="text-muted-foreground">Ambiente:</span> {ticket.environment}</div>
            <div><span className="text-muted-foreground">Tela:</span> {ticket.screen_size ?? "—"}</div>
            <div><span className="text-muted-foreground">User-Agent:</span> {ticket.user_agent ?? "—"}</div>
            {ticket.last_error_message && <div><span className="text-muted-foreground">Último erro:</span> {ticket.last_error_message}</div>}
            <div>
              <span className="text-muted-foreground">Metadata:</span>
              <pre className="mt-1 bg-muted/40 p-2 rounded overflow-auto text-[11px]">{JSON.stringify(ticket.technical_context, null, 2)}</pre>
            </div>
          </TabsContent>

          <TabsContent value="historico" className="space-y-2 text-xs">
            {events.length === 0 ? <p className="text-muted-foreground">Sem eventos.</p> : events.map((ev) => (
              <div key={ev.id} className="border rounded p-2">
                <div className="flex justify-between"><span className="font-medium">{ev.event_type}</span><span className="text-muted-foreground">{fmt(ev.created_at)}</span></div>
                {(ev.old_value || ev.new_value) && (
                  <div className="text-muted-foreground">{ev.old_value ?? "—"} → {ev.new_value ?? "—"}</div>
                )}
              </div>
            ))}
          </TabsContent>

          <TabsContent value="resolucao" className="space-y-3">
            <div>
              <Label>Causa raiz</Label>
              <Textarea value={rootCause} onChange={(e) => setRootCause(e.target.value)} rows={2} />
            </div>
            <div>
              <Label>Solução aplicada *</Label>
              <Textarea value={resolutionSummary} onChange={(e) => setResolutionSummary(e.target.value)} rows={3} />
            </div>
            <div>
              <Label>Ação preventiva</Label>
              <Textarea value={preventive} onChange={(e) => setPreventive(e.target.value)} rows={2} />
            </div>
            <div className="text-right">
              <Button onClick={resolve} disabled={busy || ticket.status === "resolvido"}>
                {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Resolver chamado
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
