import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronDown, ChevronUp, History, Loader2, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { translateError } from "@/lib/translateError";
import { toast } from "sonner";

interface SystemAuditLogProps {
  clinicId: string | null;
}

interface AuditRow {
  id: string;
  clinic_id: string;
  user_id: string | null;
  user_name: string | null;
  user_email: string | null;
  user_role: string | null;
  module: string | null;
  action: string;
  entity_type: string | null;
  table_name: string;
  record_id: string | null;
  patient_id: string | null;
  appointment_id: string | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  created_at: string;
}

const MODULE_LABELS: Record<string, string> = {
  pacientes: "Pacientes",
  agenda: "Agenda",
  financeiro: "Financeiro",
  prontuario: "Prontuário",
  configuracoes: "Configurações",
  usuarios: "Usuários & Permissões",
};

const ACTION_LABELS: Record<string, { label: string; cls: string }> = {
  created: { label: "Criou",    cls: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  updated: { label: "Editou",   cls: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  deleted: { label: "Excluiu",  cls: "bg-destructive/10 text-destructive border-destructive/20" },
};

const ROLE_LABELS: Record<string, string> = {
  owner: "Proprietário",
  admin: "Administrador",
  profissional: "Profissional",
  recepcionista: "Recepção",
};

function fmtDate(iso: string) {
  try {
    return format(new Date(iso), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  } catch {
    return iso;
  }
}

function diffEntries(oldData: Record<string, unknown> | null, newData: Record<string, unknown> | null) {
  const keys = new Set<string>([
    ...Object.keys(oldData || {}),
    ...Object.keys(newData || {}),
  ]);
  const ignore = new Set(["updated_at", "created_at", "id"]);
  const result: Array<{ field: string; before: unknown; after: unknown }> = [];
  for (const k of keys) {
    if (ignore.has(k)) continue;
    const before = oldData?.[k];
    const after = newData?.[k];
    if (JSON.stringify(before) !== JSON.stringify(after)) {
      result.push({ field: k, before, after });
    }
  }
  return result.slice(0, 30);
}

export function SystemAuditLog({ clinicId }: SystemAuditLogProps) {
  const [moduleFilter, setModuleFilter] = useState<string>("all");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["system-audit-logs", clinicId, moduleFilter, actionFilter],
    enabled: !!clinicId,
    queryFn: async (): Promise<AuditRow[]> => {
      let q = supabase
        .from("audit_logs")
        .select("*")
        .eq("clinic_id", clinicId!)
        .order("created_at", { ascending: false })
        .limit(300);
      if (moduleFilter !== "all") q = q.eq("module", moduleFilter);
      if (actionFilter !== "all") q = q.eq("action", actionFilter);
      const { data, error } = await q;
      if (error) {
        toast.error(translateError(error));
        throw error;
      }
      return (data || []) as AuditRow[];
    },
  });

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return data || [];
    return (data || []).filter((r) =>
      [r.user_name, r.user_email, r.module, r.entity_type, r.table_name]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term)),
    );
  }, [data, search]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" /> Auditoria do Sistema
        </CardTitle>
        <CardDescription>
          Histórico de ações feitas pelos usuários da clínica (pacientes, agenda, prontuário, financeiro,
          configurações e permissões).
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex flex-col md:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por usuário, e-mail ou módulo…"
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={moduleFilter} onValueChange={setModuleFilter}>
            <SelectTrigger className="w-full md:w-[220px]"><SelectValue placeholder="Módulo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os módulos</SelectItem>
              {Object.entries(MODULE_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="Ação" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as ações</SelectItem>
              <SelectItem value="created">Criou</SelectItem>
              <SelectItem value="updated">Editou</SelectItem>
              <SelectItem value="deleted">Excluiu</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando…
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-10">
            Nenhum registro de auditoria encontrado.
          </p>
        ) : (
          <ScrollArea className="h-[520px] pr-2">
            <div className="space-y-2">
              {filtered.map((row) => {
                const meta = ACTION_LABELS[row.action] || { label: row.action, cls: "" };
                const moduleLabel = MODULE_LABELS[row.module || ""] || row.module || row.table_name;
                const roleLabel = ROLE_LABELS[row.user_role || ""] || row.user_role || "—";
                const diffs = diffEntries(row.old_data, row.new_data);
                return (
                  <Collapsible
                    key={row.id}
                    open={openId === row.id}
                    onOpenChange={(o) => setOpenId(o ? row.id : null)}
                  >
                    <div className="border rounded-lg p-3 bg-card">
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        <Badge variant="outline" className={meta.cls}>{meta.label}</Badge>
                        <Badge variant="outline">{moduleLabel}</Badge>
                        <span className="font-medium">{row.user_name || "Usuário"}</span>
                        <span className="text-muted-foreground">({roleLabel})</span>
                        <span className="text-muted-foreground">em</span>
                        <span className="text-muted-foreground">{fmtDate(row.created_at)}</span>
                        <CollapsibleTrigger asChild>
                          <button className="ml-auto text-muted-foreground hover:text-foreground inline-flex items-center text-xs">
                            Detalhes
                            {openId === row.id
                              ? <ChevronUp className="h-3 w-3 ml-1" />
                              : <ChevronDown className="h-3 w-3 ml-1" />}
                          </button>
                        </CollapsibleTrigger>
                      </div>
                      <CollapsibleContent className="mt-3 space-y-2">
                        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                          <div><b>E-mail:</b> {row.user_email || "—"}</div>
                          <div><b>Tabela:</b> {row.table_name}</div>
                          <div><b>Registro:</b> {row.record_id || "—"}</div>
                          <div><b>Paciente:</b> {row.patient_id || "—"}</div>
                        </div>
                        {row.action === "updated" && diffs.length > 0 && (
                          <div className="border rounded-md p-2 bg-muted/30">
                            <p className="text-xs font-semibold mb-1">Alterações</p>
                            <div className="space-y-1 text-xs font-mono">
                              {diffs.map((d) => (
                                <div key={d.field} className="grid grid-cols-[140px_1fr] gap-2">
                                  <span className="text-muted-foreground">{d.field}</span>
                                  <span>
                                    <span className="line-through text-destructive/80">{JSON.stringify(d.before) ?? "—"}</span>
                                    {" → "}
                                    <span className="text-emerald-600">{JSON.stringify(d.after) ?? "—"}</span>
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {row.action !== "updated" && (row.new_data || row.old_data) && (
                          <pre className="text-[11px] bg-muted/30 p-2 rounded overflow-auto max-h-60">
{JSON.stringify(row.new_data ?? row.old_data, null, 2)}
                          </pre>
                        )}
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
