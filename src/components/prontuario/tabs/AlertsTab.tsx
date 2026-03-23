import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  AlertTriangle,
  Search,
  Plus,
  X,
  Bell,
  Pill,
  Syringe,
  HeartPulse,
  FileSearch,
  RotateCcw,
  Ban,
  Filter,
  Check
} from "lucide-react";
import { 
  ClinicalAlert,
  alertSeverityConfig,
  alertTypeLabels,
  AlertType,
  AlertSeverity
} from "@/types/prontuario";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AlertsTabProps {
  alerts: ClinicalAlert[];
  onAddAlert?: () => void;
  onDismissAlert?: (alertId: string) => void;
  onReactivateAlert?: (alertId: string) => void;
}

const alertTypeIcons: Record<AlertType, React.ReactNode> = {
  allergy: <Syringe className="h-4 w-4" />,
  medication: <Pill className="h-4 w-4" />,
  disease: <HeartPulse className="h-4 w-4" />,
  exam: <FileSearch className="h-4 w-4" />,
  return: <RotateCcw className="h-4 w-4" />,
  contraindication: <Ban className="h-4 w-4" />,
  other: <Bell className="h-4 w-4" />,
};

export function AlertsTab({ 
  alerts, 
  onAddAlert, 
  onDismissAlert,
  onReactivateAlert 
}: AlertsTabProps) {
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [showInactive, setShowInactive] = useState(false);

  const activeAlerts = alerts.filter(a => a.is_active);
  const inactiveAlerts = alerts.filter(a => !a.is_active);

  const displayedAlerts = showInactive ? inactiveAlerts : activeAlerts;

  const filteredAlerts = displayedAlerts.filter(alert => {
    const matchesSearch = search === "" || 
      alert.title.toLowerCase().includes(search.toLowerCase()) ||
      alert.description?.toLowerCase().includes(search.toLowerCase());
    
    const matchesSeverity = severityFilter === "all" || alert.severity === severityFilter;
    const matchesType = typeFilter === "all" || alert.alert_type === typeFilter;

    return matchesSearch && matchesSeverity && matchesType;
  });

  // Group by severity
  const groupedAlerts = {
    critical: filteredAlerts.filter(a => a.severity === 'critical'),
    warning: filteredAlerts.filter(a => a.severity === 'warning'),
    info: filteredAlerts.filter(a => a.severity === 'info'),
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-6 w-6 text-yellow-500" />
          <h2 className="text-xl font-semibold">Alertas Clínicos</h2>
          <Badge variant="secondary">{activeAlerts.length} ativos</Badge>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar alerta..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-48"
            />
          </div>
          <Button onClick={onAddAlert}>
            <Plus className="h-4 w-4 mr-1" />
            Novo Alerta
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-40">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Severidade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="critical">Crítico</SelectItem>
            <SelectItem value="warning">Atenção</SelectItem>
            <SelectItem value="info">Informativo</SelectItem>
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {Object.entries(alertTypeLabels).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button 
          variant={showInactive ? "secondary" : "outline"} 
          size="sm"
          onClick={() => setShowInactive(!showInactive)}
        >
          {showInactive ? "Ver Ativos" : "Ver Inativos"}
          {!showInactive && inactiveAlerts.length > 0 && (
            <Badge variant="secondary" className="ml-2">{inactiveAlerts.length}</Badge>
          )}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">
              {activeAlerts.filter(a => a.severity === 'critical').length}
            </div>
            <div className="text-xs text-muted-foreground">Críticos</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">
              {activeAlerts.filter(a => a.severity === 'warning').length}
            </div>
            <div className="text-xs text-muted-foreground">Atenção</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {activeAlerts.filter(a => a.severity === 'info').length}
            </div>
            <div className="text-xs text-muted-foreground">Informativos</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-muted-foreground">
              {inactiveAlerts.length}
            </div>
            <div className="text-xs text-muted-foreground">Inativos</div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts List */}
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="h-[450px]">
            {filteredAlerts.length > 0 ? (
              <div className="divide-y">
                {(['critical', 'warning', 'info'] as const).map(severity => {
                  const severityAlerts = groupedAlerts[severity];
                  if (severityAlerts.length === 0) return null;

                  const config = alertSeverityConfig[severity];

                  return (
                    <div key={severity}>
                      <div className="sticky top-0 bg-muted/80 backdrop-blur-sm px-4 py-2 border-b">
                        <h3 className={`font-medium text-sm ${config.color}`}>
                          {config.label} ({severityAlerts.length})
                        </h3>
                      </div>
                      {severityAlerts.map(alert => (
                        <div 
                          key={alert.id}
                          className={`p-4 ${!alert.is_active ? 'opacity-60' : ''}`}
                        >
                          <div className={`p-3 rounded-lg border ${config.bgColor}`}>
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-3">
                                <div className={config.color}>
                                  {alertTypeIcons[alert.alert_type]}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className={`font-medium ${config.color}`}>
                                      {alert.title}
                                    </span>
                                    <Badge variant="outline" className="text-xs">
                                      {alertTypeLabels[alert.alert_type]}
                                    </Badge>
                                  </div>
                                  {alert.description && (
                                    <p className="text-sm text-muted-foreground mt-1">
                                      {alert.description}
                                    </p>
                                  )}
                                  <p className="text-xs text-muted-foreground mt-2">
                                    Criado em {format(parseISO(alert.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                {alert.is_active ? (
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => onDismissAlert?.(alert.id)}
                                    title="Desativar alerta"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                ) : (
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => onReactivateAlert?.(alert.id)}
                                    title="Reativar alerta"
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <AlertTriangle className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>
                  {showInactive 
                    ? "Nenhum alerta inativo encontrado" 
                    : "Nenhum alerta ativo encontrado"}
                </p>
                {!showInactive && (
                  <Button variant="outline" className="mt-3" onClick={onAddAlert}>
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar Alerta
                  </Button>
                )}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
