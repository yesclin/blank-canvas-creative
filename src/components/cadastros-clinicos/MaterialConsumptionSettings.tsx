import { Package, Settings, AlertTriangle, CheckCircle2, Info, History } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  useAutoConsumptionConfig, 
  useUpdateAutoConsumptionConfig,
  useStockAlerts,
  useResolveStockAlert,
  useMaterialConsumptionHistory,
} from "@/hooks/useMaterialConsumption";
import { usePermissions } from "@/hooks/usePermissions";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function MaterialConsumptionSettings() {
  const { data: autoConsumptionEnabled, isLoading: loadingConfig } = useAutoConsumptionConfig();
  const { data: stockAlerts = [], isLoading: loadingAlerts } = useStockAlerts(true);
  const { data: recentConsumption = [], isLoading: loadingHistory } = useMaterialConsumptionHistory();
  
  const updateConfigMutation = useUpdateAutoConsumptionConfig();
  const resolveAlertMutation = useResolveStockAlert();
  
  const { isOwner, can } = usePermissions();
  // Permissão para gerenciar configurações de consumo de estoque: owner tem bypass total
  const canManage = isOwner || (can("configuracoes", "edit") && can("estoque", "edit"));

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getAlertTypeLabel = (type: string) => {
    switch (type) {
      case 'out_of_stock': return 'Sem estoque';
      case 'low_stock': return 'Estoque baixo';
      case 'insufficient': return 'Insuficiente';
      default: return type;
    }
  };

  const getAlertVariant = (type: string) => {
    switch (type) {
      case 'out_of_stock': return 'destructive';
      case 'low_stock': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      {/* Configuração Principal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Baixa Automática de Materiais
          </CardTitle>
          <CardDescription>
            Configure o comportamento de consumo de materiais nos atendimentos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {loadingConfig ? (
            <Skeleton className="h-20 w-full" />
          ) : (
            <div className="flex items-start justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Label className="text-base font-medium">Ativar baixa automática</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>Quando ativado, ao finalizar um atendimento o sistema registrará automaticamente o consumo dos materiais vinculados ao procedimento.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <p className="text-sm text-muted-foreground">
                  {autoConsumptionEnabled 
                    ? "Os materiais serão baixados automaticamente ao finalizar atendimentos"
                    : "Os materiais serão apenas exibidos para referência, sem baixa automática"
                  }
                </p>
              </div>
              <Switch
                checked={autoConsumptionEnabled}
                onCheckedChange={(checked) => updateConfigMutation.mutate(checked)}
                disabled={!canManage || updateConfigMutation.isPending}
              />
            </div>
          )}

          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Como funciona</AlertTitle>
            <AlertDescription className="space-y-2">
              <p>• O sistema identifica os materiais e kits vinculados ao procedimento realizado</p>
              <p>• Antes de finalizar, você pode ajustar quantidades ou adicionar materiais extras</p>
              <p>• Após finalização, o consumo é registrado e o estoque é atualizado</p>
              <p>• Alertas são gerados quando o estoque fica baixo ou zerado</p>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Alertas de Estoque */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Alertas de Estoque
            {stockAlerts.length > 0 && (
              <Badge variant="destructive">{stockAlerts.length}</Badge>
            )}
          </CardTitle>
          <CardDescription>
            Materiais que precisam de atenção
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingAlerts ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : stockAlerts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-primary opacity-50" />
              <p>Nenhum alerta de estoque pendente</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Material</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Qtd. Atual</TableHead>
                  <TableHead>Qtd. Mínima</TableHead>
                  <TableHead>Data</TableHead>
                  {canManage && <TableHead className="text-right">Ações</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {stockAlerts.map((alert) => (
                  <TableRow key={alert.id}>
                    <TableCell className="font-medium">{alert.material_name}</TableCell>
                    <TableCell>
                      <Badge variant={getAlertVariant(alert.alert_type) as "destructive" | "secondary" | "outline"}>
                        {getAlertTypeLabel(alert.alert_type)}
                      </Badge>
                    </TableCell>
                    <TableCell>{alert.current_quantity}</TableCell>
                    <TableCell>{alert.min_quantity}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(alert.created_at), "dd/MM HH:mm", { locale: ptBR })}
                    </TableCell>
                    {canManage && (
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => resolveAlertMutation.mutate(alert.id)}
                          disabled={resolveAlertMutation.isPending}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Resolver
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Histórico Recente */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Consumo Recente
          </CardTitle>
          <CardDescription>
            Últimos materiais consumidos nos atendimentos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingHistory ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : recentConsumption.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-2 opacity-30" />
              <p>Nenhum consumo registrado ainda</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Material</TableHead>
                  <TableHead>Procedimento</TableHead>
                  <TableHead>Quantidade</TableHead>
                  <TableHead>Custo</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentConsumption.slice(0, 10).map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">{record.material_name}</TableCell>
                    <TableCell className="text-muted-foreground">{record.procedure_name || '-'}</TableCell>
                    <TableCell>
                      {record.quantity} {record.unit}
                    </TableCell>
                    <TableCell>{formatCurrency(record.total_cost)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(record.consumed_at), "dd/MM HH:mm", { locale: ptBR })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
