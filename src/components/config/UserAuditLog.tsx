import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  UserPlus,
  UserMinus,
  UserCheck,
  Mail,
  Shield,
  RefreshCw,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  Filter,
  Loader2,
  History,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useUserAuditLogs, type UserAuditLog as UserAuditLogType } from "@/hooks/useUserAuditLogs";

interface UserAuditLogProps {
  clinicId: string | null;
}

const actionIcons: Record<string, React.ReactNode> = {
  user_invited: <Mail className="h-4 w-4" />,
  user_joined: <UserPlus className="h-4 w-4" />,
  user_activated: <UserCheck className="h-4 w-4" />,
  user_deactivated: <UserMinus className="h-4 w-4" />,
  user_role_changed: <Shield className="h-4 w-4" />,
  user_permissions_changed: <Shield className="h-4 w-4" />,
  invitation_cancelled: <XCircle className="h-4 w-4" />,
  invitation_resent: <RefreshCw className="h-4 w-4" />,
};

const actionColors: Record<string, string> = {
  user_invited: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  user_joined: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  user_activated: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  user_deactivated: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  user_role_changed: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  user_permissions_changed: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  invitation_cancelled: "bg-destructive/10 text-destructive border-destructive/20",
  invitation_resent: "bg-blue-500/10 text-blue-600 border-blue-500/20",
};

const roleLabels: Record<string, string> = {
  owner: "Proprietário",
  admin: "Administrador",
  profissional: "Profissional",
  recepcionista: "Recepção",
};

export function UserAuditLog({ clinicId }: UserAuditLogProps) {
  const { logs, isLoading, actionLabels, fetchLogs } = useUserAuditLogs(clinicId);
  const [filterAction, setFilterAction] = useState<string>("all");
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  const filteredLogs = filterAction === "all"
    ? logs
    : logs.filter(log => log.action === filterAction);

  const formatDetails = (log: UserAuditLogType): string[] => {
    const details: string[] = [];
    
    if (log.details.full_name) {
      details.push(`Nome: ${log.details.full_name}`);
    }
    if (log.details.role) {
      details.push(`Perfil: ${roleLabels[log.details.role] || log.details.role}`);
    }
    if (log.details.old_role && log.details.new_role) {
      details.push(`Perfil alterado de ${roleLabels[log.details.old_role] || log.details.old_role} para ${roleLabels[log.details.new_role] || log.details.new_role}`);
    }
    if (log.details.permissions && log.details.permissions.length > 0) {
      details.push(`Permissões: ${log.details.permissions.join(", ")}`);
    }
    if (log.details.invitation_id) {
      details.push(`ID do convite: ${log.details.invitation_id.substring(0, 8)}...`);
    }
    if (log.details.invited_by) {
      details.push(`Convidado por: ${log.details.invited_by.substring(0, 8)}...`);
    }
    
    return details;
  };

  const getTargetInfo = (log: UserAuditLogType): string => {
    if (log.target_email) return log.target_email;
    if (log.details.full_name) return log.details.full_name;
    if (log.target_user_id) return `Usuário ${log.target_user_id.substring(0, 8)}...`;
    return "—";
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              Histórico de Auditoria
            </CardTitle>
            <CardDescription>
              Registro de todas as ações realizadas na gestão de usuários
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={filterAction} onValueChange={setFilterAction}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrar por ação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as ações</SelectItem>
                {Object.entries(actionLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={fetchLogs}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <History className="h-12 w-12 text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">Nenhum registro de auditoria encontrado</p>
            <p className="text-sm text-muted-foreground/70">
              As ações de gestão de usuários serão registradas aqui
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-2">
              {filteredLogs.map((log) => {
                const details = formatDetails(log);
                const hasDetails = details.length > 0;
                const isExpanded = expandedLog === log.id;

                return (
                  <Collapsible
                    key={log.id}
                    open={isExpanded}
                    onOpenChange={() => setExpandedLog(isExpanded ? null : log.id)}
                  >
                    <div className="border rounded-lg overflow-hidden">
                      <CollapsibleTrigger asChild>
                        <div className="flex items-center justify-between p-3 hover:bg-muted/50 cursor-pointer transition-colors">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${actionColors[log.action] || "bg-muted"}`}>
                              {actionIcons[log.action] || <Clock className="h-4 w-4" />}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">
                                  {actionLabels[log.action] || log.action}
                                </span>
                                <Badge variant="outline" className="text-xs font-normal">
                                  {getTargetInfo(log)}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                por <span className="font-medium">{log.performer_name}</span>
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(log.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </span>
                            {hasDetails && (
                              isExpanded ? (
                                <ChevronUp className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              )
                            )}
                          </div>
                        </div>
                      </CollapsibleTrigger>
                      {hasDetails && (
                        <CollapsibleContent>
                          <div className="px-3 pb-3 pt-0">
                            <div className="bg-muted/30 rounded-md p-3 ml-11">
                              <p className="text-xs font-medium text-muted-foreground mb-2">Detalhes:</p>
                              <ul className="text-sm space-y-1">
                                {details.map((detail, i) => (
                                  <li key={i} className="text-muted-foreground">{detail}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </CollapsibleContent>
                      )}
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
