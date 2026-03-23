import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, TrendingDown, Settings } from 'lucide-react';
import { useMarginAlertConfig, useUpdateMarginAlertConfig, useMarginAlerts } from '@/hooks/useMarginAlerts';
import { useClinicData } from '@/hooks/useClinicData';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/ui/sonner';
import { Badge } from '@/components/ui/badge';

export function MarginAlertSettings() {
  const { clinic } = useClinicData();
  const clinicId = clinic?.id;
  
  const { data: config, isLoading } = useMarginAlertConfig(clinicId || null);
  const { data: alerts } = useMarginAlerts(clinicId || null);
  const { updateConfig } = useUpdateMarginAlertConfig();
  const queryClient = useQueryClient();
  
  const [enabled, setEnabled] = useState(true);
  const [minPercent, setMinPercent] = useState(20);
  const [periodDays, setPeriodDays] = useState(30);
  const [saving, setSaving] = useState(false);
  
  useEffect(() => {
    if (config) {
      setEnabled(config.enabled);
      setMinPercent(config.minPercent);
      setPeriodDays(config.periodDays);
    }
  }, [config]);
  
  const handleSave = async () => {
    if (!clinicId) return;
    
    setSaving(true);
    try {
      await updateConfig(clinicId, { enabled, minPercent, periodDays });
      await queryClient.invalidateQueries({ queryKey: ['margin-alert-config'] });
      await queryClient.invalidateQueries({ queryKey: ['margin-alerts'] });
      toast.success('Configuração de alertas salva com sucesso!');
    } catch (error) {
      toast.error('Erro ao salvar configuração');
    } finally {
      setSaving(false);
    }
  };
  
  const criticalAlerts = alerts?.filter(a => a.alertType === 'critical') || [];
  const warningAlerts = alerts?.filter(a => a.alertType === 'warning') || [];
  
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/3"></div>
            <div className="h-10 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            Alertas de Margem
          </CardTitle>
          <CardDescription>
            Configure alertas automáticos para procedimentos com margem abaixo do esperado
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Toggle de ativação */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="margin-alert-enabled">Ativar alertas de margem</Label>
              <p className="text-sm text-muted-foreground">
                Receba alertas quando procedimentos estiverem com margem baixa ou negativa
              </p>
            </div>
            <Switch
              id="margin-alert-enabled"
              checked={enabled}
              onCheckedChange={setEnabled}
            />
          </div>
          
          {enabled && (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                {/* Margem mínima */}
                <div className="space-y-2">
                  <Label htmlFor="min-percent">Margem mínima aceitável (%)</Label>
                  <Input
                    id="min-percent"
                    type="number"
                    min={0}
                    max={100}
                    value={minPercent}
                    onChange={(e) => setMinPercent(Number(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Alerta quando margem ficar abaixo deste valor
                  </p>
                </div>
                
                {/* Período de análise */}
                <div className="space-y-2">
                  <Label htmlFor="period-days">Período de análise</Label>
                  <Select
                    value={String(periodDays)}
                    onValueChange={(v) => setPeriodDays(Number(v))}
                  >
                    <SelectTrigger id="period-days">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">Últimos 7 dias</SelectItem>
                      <SelectItem value="15">Últimos 15 dias</SelectItem>
                      <SelectItem value="30">Últimos 30 dias</SelectItem>
                      <SelectItem value="60">Últimos 60 dias</SelectItem>
                      <SelectItem value="90">Últimos 90 dias</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Período considerado para análise de margem
                  </p>
                </div>
              </div>
              
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Salvando...' : 'Salvar configuração'}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
      
      {/* Resumo de alertas atuais */}
      {enabled && (criticalAlerts.length > 0 || warningAlerts.length > 0) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Alertas Atuais</CardTitle>
            <CardDescription>
              Baseado nos últimos {periodDays} dias
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Alertas críticos */}
              {criticalAlerts.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      {criticalAlerts.length} procedimento{criticalAlerts.length > 1 ? 's' : ''} com prejuízo
                    </span>
                  </div>
                  <div className="space-y-1 ml-6">
                    {criticalAlerts.slice(0, 5).map((alert) => (
                      <div key={alert.procedureId} className="flex items-center justify-between text-sm">
                        <span>{alert.procedureName}</span>
                        <Badge variant="destructive" className="text-xs">
                          {alert.marginPercent.toFixed(1)}%
                        </Badge>
                      </div>
                    ))}
                    {criticalAlerts.length > 5 && (
                      <p className="text-xs text-muted-foreground">
                        e mais {criticalAlerts.length - 5}...
                      </p>
                    )}
                  </div>
                </div>
              )}
              
              {/* Alertas de atenção */}
              {warningAlerts.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-amber-600">
                    <TrendingDown className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      {warningAlerts.length} procedimento{warningAlerts.length > 1 ? 's' : ''} com margem baixa
                    </span>
                  </div>
                  <div className="space-y-1 ml-6">
                    {warningAlerts.slice(0, 5).map((alert) => (
                      <div key={alert.procedureId} className="flex items-center justify-between text-sm">
                        <span>{alert.procedureName}</span>
                        <Badge variant="secondary" className="text-xs">
                          {alert.marginPercent.toFixed(1)}%
                        </Badge>
                      </div>
                    ))}
                    {warningAlerts.length > 5 && (
                      <p className="text-xs text-muted-foreground">
                        e mais {warningAlerts.length - 5}...
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      
      {enabled && criticalAlerts.length === 0 && warningAlerts.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <TrendingDown className="h-10 w-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Nenhum alerta de margem no período</p>
            <p className="text-xs mt-1">Todos os procedimentos estão com margem acima de {minPercent}%</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
