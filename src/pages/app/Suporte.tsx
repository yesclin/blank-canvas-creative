import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertCircle, CheckCircle2, Clock, Inbox, Loader2, MessageSquare,
  Paperclip, Plus, Search, Send, X, Headset,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useClinicData } from "@/hooks/useClinicData";
import { useCurrentUser } from "@/hooks/useClinicUsers";
import { logAudit } from "@/utils/auditLog";

type Status = "aberto" | "em_triagem" | "em_atendimento" | "aguardando_usuario" | "aguardando_suporte" | "resolvido" | "cancelado";
type Priority = "baixa" | "media" | "alta" | "critica";
type Category = "duvida" | "erro_sistema" | "problema_acesso" | "financeiro_assinatura" | "agenda" | "pacientes" | "prontuario" | "whatsapp" | "teleconsulta" | "relatorios" | "estoque" | "sugestao_melhoria" | "outro";

interface Ticket {
  id: string;
  code: string;
  clinic_id: string;
  created_by: string | null;
  requester_name: string | null;
  requester_email: string | null;
  title: string;
  description: string;
  category: Category;
  priority: Priority;
  status: Status;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}

interface TicketMessage {
  id: string;
  ticket_id: string;
  author_user_id: string | null;
  author_name: string | null;
  author_type: "clinic_user" | "support_user" | "system";
  message: string;
  is_internal: boolean;
  created_at: string;
}

interface TicketAttachment {
  id: string;
  ticket_id: string;
  message_id: string | null;
  file_name: string;
  file_url: string;
  file_path: string;
  file_type: string | null;
  file_size: number | null;
  created_at: string;
}

const STATUS_LABEL: Record<Status, string> = {
  aberto: "Aberto",
  em_triagem: "Em triagem",
  em_atendimento: "Em atendimento",
  aguardando_usuario: "Aguardando você",
  aguardando_suporte: "Aguardando suporte",
  resolvido: "Resolvido",
  cancelado: "Cancelado",
};

const STATUS_VARIANT: Record<Status, "default" | "secondary" | "outline" | "destructive"> = {
  aberto: "default",
  em_triagem: "secondary",
  em_atendimento: "default",
  aguardando_usuario: "destructive",
  aguardando_suporte: "secondary",
  resolvido: "outline",
  cancelado: "outline",
};

const PRIORITY_LABEL: Record<Priority, string> = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
  critica: "Crítica",
};

const PRIORITY_COLOR: Record<Priority, string> = {
  baixa: "bg-muted text-muted-foreground",
  media: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  alta: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  critica: "bg-destructive/10 text-destructive",
};

const CATEGORY_LABEL: Record<Category, string> = {
  duvida: "Dúvida",
  erro_sistema: "Erro no sistema",
  problema_acesso: "Problema de acesso",
  financeiro_assinatura: "Financeiro/Assinatura",
  agenda: "Agenda",
  pacientes: "Pacientes",
  prontuario: "Prontuário",
  whatsapp: "WhatsApp",
  teleconsulta: "Teleconsulta",
  relatorios: "Relatórios",
  estoque: "Estoque",
  sugestao_melhoria: "Sugestão de melhoria",
  outro: "Outro",
};

const ALLOWED_EXT = ["png", "jpg", "jpeg", "webp", "pdf", "txt", "log", "csv"];
const MAX_FILES = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024;

function formatDate(s: string) {
  return new Date(s).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

function getModuleFromPath(p: string): string {
  if (p.startsWith("/app/agenda")) return "agenda";
  if (p.startsWith("/app/pacientes")) return "pacientes";
  if (p.startsWith("/app/prontuario") || p.startsWith("/app/atendimento")) return "prontuario";
  if (p.startsWith("/app/marketing")) return "marketing";
  if (p.startsWith("/app/gestao/financas") || p.startsWith("/app/meu-financeiro")) return "financeiro";
  if (p.startsWith("/app/gestao/estoque")) return "estoque";
  if (p.startsWith("/app/teleconsulta")) return "teleconsulta";
  if (p.startsWith("/app/config")) return "configuracoes";
  if (p.startsWith("/app/suporte")) return "suporte";
  return "geral";
}

export default function Suporte() {
  const { clinic } = useClinicData();
  const { user: currentUser } = useCurrentUser();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [priorityFilter, setPriorityFilter] = useState<string>("todos");
  const [categoryFilter, setCategoryFilter] = useState<string>("todos");

  const [createOpen, setCreateOpen] = useState(false);
  const [detailTicket, setDetailTicket] = useState<Ticket | null>(null);

  const fetchTickets = useCallback(async () => {
    if (!clinic?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("support_tickets")
        .select("*")
        .eq("clinic_id", clinic.id)
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      setTickets((data ?? []) as Ticket[]);
    } catch (e: any) {
      console.error("[Suporte] erro ao listar", e);
      toast.error("Não foi possível carregar os chamados.");
    } finally {
      setLoading(false);
    }
  }, [clinic?.id]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const filtered = useMemo(() => {
    return tickets.filter((t) => {
      if (statusFilter !== "todos" && t.status !== statusFilter) return false;
      if (priorityFilter !== "todos" && t.priority !== priorityFilter) return false;
      if (categoryFilter !== "todos" && t.category !== categoryFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          t.code.toLowerCase().includes(q) ||
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [tickets, search, statusFilter, priorityFilter, categoryFilter]);

  const counts = useMemo(() => {
    return {
      abertos: tickets.filter((t) => t.status === "aberto" || t.status === "em_triagem").length,
      em_atendimento: tickets.filter((t) => t.status === "em_atendimento" || t.status === "aguardando_suporte").length,
      aguardando: tickets.filter((t) => t.status === "aguardando_usuario").length,
      resolvidos: tickets.filter((t) => t.status === "resolvido").length,
    };
  }, [tickets]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Headset className="h-6 w-6" /> Suporte técnico
          </h1>
          <p className="text-sm text-muted-foreground">
            Abra chamados, acompanhe respostas e envie informações para nossa equipe.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Novo chamado
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard icon={<Inbox className="h-4 w-4" />} label="Chamados abertos" value={counts.abertos} />
        <SummaryCard icon={<Clock className="h-4 w-4" />} label="Em atendimento" value={counts.em_atendimento} />
        <SummaryCard icon={<AlertCircle className="h-4 w-4" />} label="Aguardando você" value={counts.aguardando} highlight />
        <SummaryCard icon={<CheckCircle2 className="h-4 w-4" />} label="Resolvidos" value={counts.resolvidos} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Meus chamados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 md:grid-cols-4">
            <div className="relative md:col-span-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por código ou título"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os status</SelectItem>
                {Object.entries(STATUS_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger><SelectValue placeholder="Prioridade" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas</SelectItem>
                {Object.entries(PRIORITY_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger><SelectValue placeholder="Categoria" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas</SelectItem>
                {Object.entries(CATEGORY_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando chamados...
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center text-muted-foreground">
              <MessageSquare className="h-10 w-10 mb-3 opacity-50" />
              <p className="font-medium">Nenhum chamado encontrado</p>
              <p className="text-sm">Abra um novo chamado se precisar de ajuda.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Atualizado</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((t) => (
                  <TableRow key={t.id} className="cursor-pointer" onClick={() => setDetailTicket(t)}>
                    <TableCell className="font-mono text-xs">{t.code}</TableCell>
                    <TableCell className="font-medium max-w-[280px] truncate">{t.title}</TableCell>
                    <TableCell className="text-sm">{CATEGORY_LABEL[t.category]}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${PRIORITY_COLOR[t.priority]}`}>
                        {PRIORITY_LABEL[t.priority]}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[t.status]}>{STATUS_LABEL[t.status]}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDate(t.updated_at)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setDetailTicket(t); }}>
                        Ver
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <CreateTicketDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        clinicId={clinic?.id ?? null}
        userId={currentUser?.user_id ?? null}
        userName={currentUser?.full_name ?? null}
        userEmail={currentUser?.email ?? null}
        userRole={currentUser?.role ?? null}
        onCreated={() => {
          fetchTickets();
        }}
      />

      <TicketDetailSheet
        ticket={detailTicket}
        onOpenChange={(o) => !o && setDetailTicket(null)}
        currentUserId={currentUser?.user_id ?? null}
        currentUserName={currentUser?.full_name ?? null}
        currentUserEmail={currentUser?.email ?? null}
        clinicId={clinic?.id ?? null}
        onChange={() => fetchTickets()}
      />
    </div>
  );
}

function SummaryCard({ icon, label, value, highlight }: { icon: React.ReactNode; label: string; value: number; highlight?: boolean }) {
  return (
    <Card className={highlight && value > 0 ? "border-destructive" : undefined}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">{icon}{label}</div>
        <div className="text-2xl font-semibold mt-2">{value}</div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// CREATE TICKET DIALOG
// ============================================================================

interface CreateTicketDialogProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  clinicId: string | null;
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  userRole: string | null;
  onCreated: () => void;
  // optional initial values for quick mode
  initialCategory?: Category;
  initialTitle?: string;
}

export function CreateTicketDialog({
  open, onOpenChange, clinicId, userId, userName, userEmail, userRole, onCreated,
  initialCategory, initialTitle,
}: CreateTicketDialogProps) {
  const [title, setTitle] = useState(initialTitle ?? "");
  const [category, setCategory] = useState<Category>(initialCategory ?? "duvida");
  const [priority, setPriority] = useState<Priority>("media");
  const [description, setDescription] = useState("");
  const [includeContext, setIncludeContext] = useState(true);
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(initialTitle ?? "");
      setCategory(initialCategory ?? "duvida");
      setPriority("media");
      setDescription("");
      setIncludeContext(true);
      setFiles([]);
    }
  }, [open, initialCategory, initialTitle]);

  const onPickFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    e.target.value = "";
    const accepted: File[] = [];
    for (const f of picked) {
      const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
      if (!ALLOWED_EXT.includes(ext)) {
        toast.error(`Tipo de arquivo não permitido: ${f.name}`);
        continue;
      }
      if (f.size > MAX_FILE_SIZE) {
        toast.error(`Arquivo muito grande. O limite é de 10MB: ${f.name}`);
        continue;
      }
      accepted.push(f);
    }
    const merged = [...files, ...accepted].slice(0, MAX_FILES);
    if (files.length + accepted.length > MAX_FILES) {
      toast.error(`Máximo de ${MAX_FILES} arquivos por chamado.`);
    }
    setFiles(merged);
  };

  const removeFile = (idx: number) => setFiles((p) => p.filter((_, i) => i !== idx));

  const handleSubmit = async () => {
    if (!clinicId || !userId) {
      toast.error("Sessão inválida. Faça login novamente.");
      return;
    }
    if (!title.trim() || !description.trim()) {
      toast.error("Preencha título e descrição.");
      return;
    }
    setSubmitting(true);
    try {
      const route = window.location.pathname + window.location.search;
      const technicalContext: Record<string, any> = includeContext ? {
        url: window.location.href,
        timestamp: new Date().toISOString(),
        viewport: { width: window.innerWidth, height: window.innerHeight },
        device_pixel_ratio: window.devicePixelRatio,
        language: navigator.language,
        platform: navigator.platform,
      } : {};

      const insertPayload: any = {
        clinic_id: clinicId,
        created_by: userId,
        requester_name: userName,
        requester_email: userEmail,
        requester_role: userRole,
        title: title.trim(),
        description: description.trim(),
        category,
        priority,
        status: "aberto",
        route: includeContext ? route : null,
        module: includeContext ? getModuleFromPath(window.location.pathname) : null,
        environment: import.meta.env.MODE === "production" ? "production" : "development",
        user_agent: includeContext ? navigator.userAgent : null,
        screen_size: includeContext ? `${window.innerWidth}x${window.innerHeight}` : null,
        technical_context: technicalContext,
      };

      const { data: ticketData, error: insertError } = await supabase
        .from("support_tickets")
        .insert(insertPayload)
        .select("*")
        .maybeSingle();
      if (insertError) throw insertError;
      if (!ticketData) throw new Error("Falha ao criar chamado");

      const ticket = ticketData as Ticket;

      // first message
      await supabase.from("support_ticket_messages").insert({
        ticket_id: ticket.id,
        author_user_id: userId,
        author_name: userName,
        author_email: userEmail,
        author_type: "clinic_user",
        message: description.trim(),
        is_internal: false,
      });

      // event
      await supabase.from("support_ticket_events").insert({
        ticket_id: ticket.id,
        actor_user_id: userId,
        event_type: "ticket_created",
        new_value: ticket.code,
        metadata: { category, priority },
      });

      // upload attachments
      for (const f of files) {
        const safeName = f.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const path = `${clinicId}/${ticket.id}/${Date.now()}_${safeName}`;
        const { error: upErr } = await supabase.storage
          .from("support-attachments")
          .upload(path, f, { contentType: f.type, upsert: false });
        if (upErr) {
          console.error("[Suporte] upload falhou", upErr);
          toast.error(`Falha ao enviar anexo ${f.name}`);
          continue;
        }
        const { data: signed } = await supabase.storage
          .from("support-attachments")
          .createSignedUrl(path, 60 * 60 * 24 * 7);
        await supabase.from("support_ticket_attachments").insert({
          ticket_id: ticket.id,
          file_name: f.name,
          file_path: path,
          file_url: signed?.signedUrl ?? path,
          file_type: f.type || null,
          file_size: f.size,
          uploaded_by: userId,
        });
        toast.success("Anexo enviado com sucesso.");
      }

      try {
        await logAudit({
          clinicId,
          action: "support_ticket_created",
          entityType: "support_tickets",
          entityId: ticket.id,
          metadata: { code: ticket.code, category, priority },
        });
      } catch { /* non-blocking */ }

      toast.success(`Chamado ${ticket.code} aberto com sucesso. Você pode acompanhar pelo menu Suporte.`);
      onOpenChange(false);
      onCreated();
    } catch (e: any) {
      console.error("[Suporte] criação falhou", e);
      toast.error("Não foi possível abrir o chamado.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Novo chamado de suporte</DialogTitle>
          <DialogDescription>
            Descreva o que aconteceu para que nossa equipe possa ajudar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Título *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={150} placeholder="Resuma seu problema" />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <Label>Categoria *</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORY_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Prioridade *</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(PRIORITY_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Descrição *</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              maxLength={5000}
              placeholder="Descreva o que aconteceu, o que você estava tentando fazer e, se possível, informe o passo a passo."
            />
          </div>
          <div>
            <Label>Anexos (opcional)</Label>
            <p className="text-xs text-muted-foreground mb-2">
              Evite enviar imagens com informações clínicas sensíveis. Revise os anexos antes de abrir o chamado.
              Máx. {MAX_FILES} arquivos, 10MB cada. Tipos: png, jpg, jpeg, webp, pdf, txt, log, csv.
            </p>
            <Input type="file" multiple onChange={onPickFiles} accept=".png,.jpg,.jpeg,.webp,.pdf,.txt,.log,.csv" />
            {files.length > 0 && (
              <ul className="mt-2 space-y-1">
                {files.map((f, i) => (
                  <li key={i} className="flex items-center justify-between text-xs bg-muted/50 rounded px-2 py-1">
                    <span className="truncate flex items-center gap-2">
                      <Paperclip className="h-3 w-3" />{f.name} ({(f.size / 1024).toFixed(1)} KB)
                    </span>
                    <Button variant="ghost" size="sm" onClick={() => removeFile(i)} type="button">
                      <X className="h-3 w-3" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="flex items-start gap-2">
            <Checkbox id="ctx" checked={includeContext} onCheckedChange={(v) => setIncludeContext(!!v)} />
            <div>
              <Label htmlFor="ctx" className="cursor-pointer">Enviar informações técnicas desta tela para ajudar o suporte</Label>
              <p className="text-xs text-muted-foreground">URL atual, navegador e tamanho da tela. Nenhum conteúdo clínico é enviado.</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Abrir chamado
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// TICKET DETAIL SHEET (CLINIC USER VIEW)
// ============================================================================

interface DetailProps {
  ticket: Ticket | null;
  onOpenChange: (o: boolean) => void;
  currentUserId: string | null;
  currentUserName: string | null;
  currentUserEmail: string | null;
  clinicId: string | null;
  onChange: () => void;
}

function TicketDetailSheet({ ticket, onOpenChange, currentUserId, currentUserName, currentUserEmail, clinicId, onChange }: DetailProps) {
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [attachments, setAttachments] = useState<TicketAttachment[]>([]);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [closing, setClosing] = useState(false);

  const open = !!ticket;

  useEffect(() => {
    if (!ticket) return;
    (async () => {
      const [{ data: msgs }, { data: atts }] = await Promise.all([
        supabase.from("support_ticket_messages").select("*").eq("ticket_id", ticket.id).order("created_at"),
        supabase.from("support_ticket_attachments").select("*").eq("ticket_id", ticket.id).order("created_at"),
      ]);
      setMessages((msgs ?? []) as TicketMessage[]);
      setAttachments((atts ?? []) as TicketAttachment[]);
    })();
  }, [ticket]);

  if (!ticket) return null;

  const canClose = ticket.status !== "resolvido" && ticket.status !== "cancelado";

  const sendReply = async () => {
    if (!reply.trim() || !currentUserId || !clinicId) return;
    setSending(true);
    try {
      const { error } = await supabase.from("support_ticket_messages").insert({
        ticket_id: ticket.id,
        author_user_id: currentUserId,
        author_name: currentUserName,
        author_email: currentUserEmail,
        author_type: "clinic_user",
        message: reply.trim(),
        is_internal: false,
      });
      if (error) throw error;
      // status -> aguardando_suporte
      await supabase.from("support_tickets").update({ status: "aguardando_suporte", updated_at: new Date().toISOString() }).eq("id", ticket.id);
      await supabase.from("support_ticket_events").insert({
        ticket_id: ticket.id,
        actor_user_id: currentUserId,
        event_type: "message_sent",
        metadata: { author_type: "clinic_user" },
      });
      try { await logAudit({ clinicId, action: "support_ticket_message_sent", entityType: "support_tickets", entityId: ticket.id }); } catch {/**/}
      toast.success("Mensagem enviada com sucesso.");
      setReply("");
      const { data: msgs } = await supabase.from("support_ticket_messages").select("*").eq("ticket_id", ticket.id).order("created_at");
      setMessages((msgs ?? []) as TicketMessage[]);
      onChange();
    } catch (e) {
      console.error(e);
      toast.error("Falha ao enviar mensagem.");
    } finally {
      setSending(false);
    }
  };

  const closeTicket = async () => {
    if (!currentUserId || !clinicId) return;
    setClosing(true);
    try {
      await supabase.from("support_tickets").update({
        status: "cancelado",
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as any).eq("id", ticket.id);
      await supabase.from("support_ticket_events").insert({
        ticket_id: ticket.id,
        actor_user_id: currentUserId,
        event_type: "ticket_cancelled",
      });
      try { await logAudit({ clinicId, action: "support_ticket_cancelled", entityType: "support_tickets", entityId: ticket.id }); } catch {/**/}
      toast.success("Chamado encerrado com sucesso.");
      onOpenChange(false);
      onChange();
    } catch (e) {
      console.error(e);
      toast.error("Falha ao encerrar chamado.");
    } finally {
      setClosing(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center gap-2 flex-wrap">
            <SheetTitle className="font-mono text-sm">{ticket.code}</SheetTitle>
            <Badge variant={STATUS_VARIANT[ticket.status]}>{STATUS_LABEL[ticket.status]}</Badge>
            <span className={`px-2 py-0.5 rounded text-xs ${PRIORITY_COLOR[ticket.priority]}`}>{PRIORITY_LABEL[ticket.priority]}</span>
          </div>
          <SheetDescription className="text-foreground font-medium text-base">{ticket.title}</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-5">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div><span className="text-muted-foreground">Categoria:</span> {CATEGORY_LABEL[ticket.category]}</div>
            <div><span className="text-muted-foreground">Aberto em:</span> {formatDate(ticket.created_at)}</div>
            <div><span className="text-muted-foreground">Atualizado:</span> {formatDate(ticket.updated_at)}</div>
            {ticket.resolved_at && <div><span className="text-muted-foreground">Resolvido em:</span> {formatDate(ticket.resolved_at)}</div>}
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-2">Conversa</h4>
            <ScrollArea className="h-72 rounded border p-3 bg-muted/20">
              <div className="space-y-3">
                {messages.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6">Sem mensagens ainda.</p>
                ) : messages.map((m) => (
                  <div
                    key={m.id}
                    className={`rounded-md p-3 text-sm ${
                      m.author_type === "clinic_user" ? "bg-primary/5 border border-primary/20" :
                      m.author_type === "support_user" ? "bg-card border" :
                      "bg-muted text-muted-foreground italic"
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                      <span className="font-medium">
                        {m.author_type === "support_user" ? "Suporte YesClin" :
                         m.author_type === "clinic_user" ? (m.author_name ?? "Usuário") : "Sistema"}
                      </span>
                      <span>{formatDate(m.created_at)}</span>
                    </div>
                    <p className="whitespace-pre-wrap">{m.message}</p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {attachments.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2">Anexos</h4>
              <ul className="space-y-1">
                {attachments.map((a) => (
                  <li key={a.id} className="text-xs flex items-center gap-2 bg-muted/40 rounded px-2 py-1">
                    <Paperclip className="h-3 w-3" />
                    <a href={a.file_url} target="_blank" rel="noreferrer" className="text-primary hover:underline truncate">
                      {a.file_name}
                    </a>
                    {a.file_size && <span className="text-muted-foreground">({(a.file_size / 1024).toFixed(1)} KB)</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {canClose && (
            <div className="space-y-2">
              <Label>Responder ao suporte</Label>
              <Textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={3} placeholder="Escreva sua resposta..." />
              <div className="flex justify-between">
                <Button variant="outline" size="sm" onClick={closeTicket} disabled={closing}>
                  {closing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Encerrar chamado
                </Button>
                <Button onClick={sendReply} disabled={sending || !reply.trim()}>
                  {sending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                  Enviar resposta
                </Button>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
