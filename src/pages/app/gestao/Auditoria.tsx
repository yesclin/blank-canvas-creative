import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useClinicData } from "@/hooks/useClinicData";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Search,
  Filter,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Eye,
  ShieldAlert,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

const PAGE_SIZE = 25;

const ACTION_LABELS: Record<string, string> = {
  document_created: "Documento criado",
  document_revoked: "Documento revogado",
  document_replaced: "Documento substituído",
  patient_updated: "Paciente atualizado",
  settings_updated: "Configurações alteradas",
  user_permission_changed: "Permissão alterada",
};

const ENTITY_LABELS: Record<string, string> = {
  clinical_document: "Documento Clínico",
  patient: "Paciente",
  clinic_settings: "Configurações",
  user_role: "Permissão de Usuário",
};

interface AuditLog {
  id: string;
  clinic_id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, any>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  user_name?: string;
}

export default function Auditoria() {
  const { clinic, isLoading: clinicLoading } = useClinicData();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);

  // Filters
  const [filterAction, setFilterAction] = useState("all");
  const [filterEntity, setFilterEntity] = useState("all");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [filterUserId, setFilterUserId] = useState("all");

  // Users list for filter
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);

  // Metadata modal
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const fetchUsers = useCallback(async () => {
    if (!clinic?.id) return;
    const { data } = await supabase
      .from("profiles")
      .select("user_id, full_name")
      .not("user_id", "is", null);
    if (data) {
      setUsers(data.map((p) => ({ id: p.user_id, name: p.full_name || "Usuário" })));
    }
  }, [clinic?.id]);

  const fetchLogs = useCallback(async () => {
    if (!clinic?.id) return;
    setLoading(true);
    try {
      // Count query
      let countQuery = supabase
        .from("audit_logs")
        .select("id", { count: "exact", head: true })
        .eq("clinic_id", clinic.id);

      let dataQuery = supabase
        .from("audit_logs")
        .select("*")
        .eq("clinic_id", clinic.id)
        .order("created_at", { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      // Apply filters
      if (filterAction !== "all") {
        countQuery = countQuery.eq("action", filterAction);
        dataQuery = dataQuery.eq("action", filterAction);
      }
      if (filterEntity !== "all") {
        countQuery = countQuery.eq("entity_type", filterEntity);
        dataQuery = dataQuery.eq("entity_type", filterEntity);
      }
      if (filterUserId !== "all") {
        countQuery = countQuery.eq("user_id", filterUserId);
        dataQuery = dataQuery.eq("user_id", filterUserId);
      }
      if (filterStartDate) {
        countQuery = countQuery.gte("created_at", filterStartDate);
        dataQuery = dataQuery.gte("created_at", filterStartDate);
      }
      if (filterEndDate) {
        countQuery = countQuery.lte("created_at", filterEndDate + "T23:59:59");
        dataQuery = dataQuery.lte("created_at", filterEndDate + "T23:59:59");
      }

      const [{ count }, { data, error }] = await Promise.all([countQuery, dataQuery]);

      if (error) throw error;

      setTotalCount(count || 0);

      // Enrich with user names
      const userIds = [...new Set((data || []).map((l: any) => l.user_id))];
      let profileMap = new Map<string, string>();
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", userIds);
        profileMap = new Map((profiles || []).map((p) => [p.user_id, p.full_name || "Usuário"]));
      }

      setLogs(
        (data || []).map((l: any) => ({
          ...l,
          metadata: typeof l.metadata === "object" && l.metadata !== null ? l.metadata : {},
          user_name: profileMap.get(l.user_id) || "Usuário",
        }))
      );
    } catch (err) {
      console.error("Error fetching audit logs:", err);
    } finally {
      setLoading(false);
    }
  }, [clinic?.id, page, filterAction, filterEntity, filterUserId, filterStartDate, filterEndDate]);

  useEffect(() => {
    if (!clinicLoading && clinic?.id) {
      fetchUsers();
    }
  }, [clinicLoading, clinic?.id, fetchUsers]);

  useEffect(() => {
    if (!clinicLoading && clinic?.id) {
      fetchLogs();
    }
  }, [clinicLoading, clinic?.id, fetchLogs]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const clearFilters = () => {
    setFilterAction("all");
    setFilterEntity("all");
    setFilterUserId("all");
    setFilterStartDate("");
    setFilterEndDate("");
    setPage(0);
  };

  const formatMetadata = (metadata: Record<string, any>): string => {
    return JSON.stringify(metadata, null, 2);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ShieldAlert className="h-6 w-6 text-primary" />
          Auditoria do Sistema
        </h1>
        <p className="text-muted-foreground mt-1">
          Rastreabilidade completa de ações críticas no sistema
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Período - Início</Label>
              <Input
                type="date"
                value={filterStartDate}
                onChange={(e) => { setFilterStartDate(e.target.value); setPage(0); }}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Período - Fim</Label>
              <Input
                type="date"
                value={filterEndDate}
                onChange={(e) => { setFilterEndDate(e.target.value); setPage(0); }}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Ação</Label>
              <Select value={filterAction} onValueChange={(v) => { setFilterAction(v); setPage(0); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as ações</SelectItem>
                  {Object.entries(ACTION_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Entidade</Label>
              <Select value={filterEntity} onValueChange={(v) => { setFilterEntity(v); setPage(0); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as entidades</SelectItem>
                  {Object.entries(ENTITY_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Usuário</Label>
              <Select value={filterUserId} onValueChange={(v) => { setFilterUserId(v); setPage(0); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os usuários</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center justify-between mt-4">
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Limpar filtros
            </Button>
            <Button variant="outline" size="sm" onClick={fetchLogs}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Atualizar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              Registros de Auditoria
            </CardTitle>
            <Badge variant="secondary">{totalCount} registro(s)</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
              <ShieldAlert className="h-12 w-12 text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground">Nenhum registro de auditoria encontrado</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                As ações críticas do sistema serão registradas aqui automaticamente
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Ação</TableHead>
                      <TableHead>Entidade</TableHead>
                      <TableHead className="text-center">Detalhes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-sm whitespace-nowrap">
                          {format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                        </TableCell>
                        <TableCell className="text-sm">
                          {log.user_name}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs whitespace-nowrap">
                            {ACTION_LABELS[log.action] || log.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {ENTITY_LABELS[log.entity_type] || log.entity_type}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setSelectedLog(log)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <p className="text-sm text-muted-foreground">
                    Página {page + 1} de {totalPages}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 0}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages - 1}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Metadata Modal */}
      <Dialog open={!!selectedLog} onOpenChange={(open) => { if (!open) setSelectedLog(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhes do Registro</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Data/Hora</p>
                  <p className="font-medium">
                    {format(new Date(selectedLog.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Usuário</p>
                  <p className="font-medium">{selectedLog.user_name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Ação</p>
                  <p className="font-medium">{ACTION_LABELS[selectedLog.action] || selectedLog.action}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Entidade</p>
                  <p className="font-medium">{ENTITY_LABELS[selectedLog.entity_type] || selectedLog.entity_type}</p>
                </div>
                {selectedLog.entity_id && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground text-xs">ID da Entidade</p>
                    <p className="font-mono text-xs">{selectedLog.entity_id}</p>
                  </div>
                )}
                {selectedLog.user_agent && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground text-xs">User Agent</p>
                    <p className="text-xs text-muted-foreground truncate">{selectedLog.user_agent}</p>
                  </div>
                )}
              </div>
              <div>
                <p className="text-muted-foreground text-xs mb-2">Metadata</p>
                <ScrollArea className="max-h-[300px]">
                  <pre className="bg-muted rounded-md p-3 text-xs overflow-x-auto whitespace-pre-wrap">
                    {formatMetadata(selectedLog.metadata)}
                  </pre>
                </ScrollArea>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
