import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  History,
  Search,
  Filter,
  User,
  FileText,
  AlertTriangle,
  Paperclip,
  Edit,
  Trash,
  Plus,
  Eye,
  Check,
  Clock
} from "lucide-react";
import { 
  ClinicalEvolution,
  ClinicalAlert,
  MedicalAttachment,
  evolutionTypeLabels,
  alertTypeLabels
} from "@/types/prontuario";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AuditEntry {
  id: string;
  timestamp: string;
  action: 'create' | 'update' | 'delete' | 'view' | 'sign';
  entity_type: 'evolution' | 'alert' | 'attachment' | 'clinical_data';
  entity_id: string;
  entity_name: string;
  user_name: string;
  details?: string;
}

interface HistoryAuditTabProps {
  evolutions: ClinicalEvolution[];
  alerts: ClinicalAlert[];
  attachments: MedicalAttachment[];
}

export function HistoryAuditTab({ evolutions, alerts, attachments }: HistoryAuditTabProps) {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [entityFilter, setEntityFilter] = useState<string>("all");

  // Generate mock audit entries from existing data
  const generateAuditEntries = (): AuditEntry[] => {
    const entries: AuditEntry[] = [];

    // Evolution entries
    evolutions.forEach(evo => {
      entries.push({
        id: `evo-create-${evo.id}`,
        timestamp: evo.created_at,
        action: 'create',
        entity_type: 'evolution',
        entity_id: evo.id,
        entity_name: evolutionTypeLabels[evo.evolution_type],
        user_name: evo.professional_name || 'Sistema',
        details: 'Evolução clínica registrada'
      });

      if (evo.status === 'signed' && evo.signed_at) {
        entries.push({
          id: `evo-sign-${evo.id}`,
          timestamp: evo.signed_at,
          action: 'sign',
          entity_type: 'evolution',
          entity_id: evo.id,
          entity_name: evolutionTypeLabels[evo.evolution_type],
          user_name: evo.professional_name || 'Sistema',
          details: 'Evolução assinada digitalmente'
        });
      }

      if (evo.updated_at !== evo.created_at) {
        entries.push({
          id: `evo-update-${evo.id}`,
          timestamp: evo.updated_at,
          action: 'update',
          entity_type: 'evolution',
          entity_id: evo.id,
          entity_name: evolutionTypeLabels[evo.evolution_type],
          user_name: evo.professional_name || 'Sistema',
          details: 'Evolução atualizada'
        });
      }
    });

    // Alert entries
    alerts.forEach(alert => {
      entries.push({
        id: `alert-create-${alert.id}`,
        timestamp: alert.created_at,
        action: 'create',
        entity_type: 'alert',
        entity_id: alert.id,
        entity_name: alert.title,
        user_name: 'Sistema',
        details: `Alerta ${alertTypeLabels[alert.alert_type]} criado`
      });
    });

    // Attachment entries
    attachments.forEach(att => {
      entries.push({
        id: `att-create-${att.id}`,
        timestamp: att.created_at,
        action: 'create',
        entity_type: 'attachment',
        entity_id: att.id,
        entity_name: att.file_name,
        user_name: 'Sistema',
        details: `Documento "${att.description || att.file_name}" anexado`
      });
    });

    return entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  const auditEntries = generateAuditEntries();

  const filteredEntries = auditEntries.filter(entry => {
    const matchesSearch = search === "" || 
      entry.entity_name.toLowerCase().includes(search.toLowerCase()) ||
      entry.user_name.toLowerCase().includes(search.toLowerCase()) ||
      entry.details?.toLowerCase().includes(search.toLowerCase());
    
    const matchesAction = actionFilter === "all" || entry.action === actionFilter;
    const matchesEntity = entityFilter === "all" || entry.entity_type === entityFilter;

    return matchesSearch && matchesAction && matchesEntity;
  });

  const getActionIcon = (action: AuditEntry['action']) => {
    switch (action) {
      case 'create': return <Plus className="h-4 w-4 text-green-500" />;
      case 'update': return <Edit className="h-4 w-4 text-blue-500" />;
      case 'delete': return <Trash className="h-4 w-4 text-red-500" />;
      case 'view': return <Eye className="h-4 w-4 text-gray-500" />;
      case 'sign': return <Check className="h-4 w-4 text-purple-500" />;
    }
  };

  const getEntityIcon = (entityType: AuditEntry['entity_type']) => {
    switch (entityType) {
      case 'evolution': return <FileText className="h-4 w-4" />;
      case 'alert': return <AlertTriangle className="h-4 w-4" />;
      case 'attachment': return <Paperclip className="h-4 w-4" />;
      case 'clinical_data': return <User className="h-4 w-4" />;
    }
  };

  const getActionLabel = (action: AuditEntry['action']) => {
    switch (action) {
      case 'create': return 'Criação';
      case 'update': return 'Atualização';
      case 'delete': return 'Exclusão';
      case 'view': return 'Visualização';
      case 'sign': return 'Assinatura';
    }
  };

  const getActionColor = (action: AuditEntry['action']) => {
    switch (action) {
      case 'create': return 'bg-green-100 text-green-700 border-green-200';
      case 'update': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'delete': return 'bg-red-100 text-red-700 border-red-200';
      case 'view': return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'sign': return 'bg-purple-100 text-purple-700 border-purple-200';
    }
  };

  // Group by date
  const groupedByDate = filteredEntries.reduce((acc, entry) => {
    const date = format(parseISO(entry.timestamp), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    if (!acc[date]) acc[date] = [];
    acc[date].push(entry);
    return acc;
  }, {} as Record<string, AuditEntry[]>);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <History className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-semibold">Histórico e Auditoria</h2>
          <Badge variant="secondary">{auditEntries.length} registros</Badge>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-48"
            />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-40">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Ação" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas Ações</SelectItem>
            <SelectItem value="create">Criação</SelectItem>
            <SelectItem value="update">Atualização</SelectItem>
            <SelectItem value="delete">Exclusão</SelectItem>
            <SelectItem value="sign">Assinatura</SelectItem>
            <SelectItem value="view">Visualização</SelectItem>
          </SelectContent>
        </Select>

        <Select value={entityFilter} onValueChange={setEntityFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Tipos</SelectItem>
            <SelectItem value="evolution">Evoluções</SelectItem>
            <SelectItem value="alert">Alertas</SelectItem>
            <SelectItem value="attachment">Anexos</SelectItem>
            <SelectItem value="clinical_data">Dados Clínicos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Timeline */}
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
            {Object.keys(groupedByDate).length > 0 ? (
              Object.entries(groupedByDate).map(([date, entries]) => (
                <div key={date}>
                  <div className="sticky top-0 bg-muted/80 backdrop-blur-sm px-4 py-2 border-b">
                    <h3 className="font-medium text-sm">{date}</h3>
                  </div>
                  <div className="divide-y">
                    {entries.map(entry => (
                      <div 
                        key={entry.id}
                        className="p-4 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex flex-col items-center">
                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                              {getActionIcon(entry.action)}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge className={getActionColor(entry.action)}>
                                {getActionLabel(entry.action)}
                              </Badge>
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                {getEntityIcon(entry.entity_type)}
                                <span className="font-medium text-foreground">{entry.entity_name}</span>
                              </div>
                            </div>
                            {entry.details && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {entry.details}
                              </p>
                            )}
                            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                <span>{entry.user_name}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>
                                  {format(parseISO(entry.timestamp), "HH:mm", { locale: ptBR })}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <History className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Nenhum registro de auditoria encontrado</p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
