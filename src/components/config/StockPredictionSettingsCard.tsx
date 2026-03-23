import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Loader2, Save } from "lucide-react";
import { 
  useStockPredictionSettings, 
  useUpdateStockPredictionSettings 
} from "@/hooks/useStockPredictionAlerts";

export function StockPredictionSettingsCard() {
  const { data: settings, isLoading } = useStockPredictionSettings();
  const updateSettings = useUpdateStockPredictionSettings();
  
  const [enabled, setEnabled] = useState(true);
  const [predictionDays, setPredictionDays] = useState(15);
  const [alertLevel, setAlertLevel] = useState<'info' | 'warning' | 'critical'>('warning');
  const [hasChanges, setHasChanges] = useState(false);
  
  useEffect(() => {
    if (settings) {
      setEnabled(settings.enabled);
      setPredictionDays(settings.prediction_days);
      setAlertLevel(settings.alert_level);
      setHasChanges(false);
    }
  }, [settings]);
  
  const handleChange = () => {
    setHasChanges(true);
  };
  
  const handleSave = () => {
    updateSettings.mutate({
      enabled,
      prediction_days: predictionDays,
      alert_level: alertLevel,
    }, {
      onSuccess: () => setHasChanges(false),
    });
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          <CardTitle>Previsão de Estoque</CardTitle>
        </div>
        <CardDescription>
          Configure alertas baseados na agenda futura para antecipar falta de insumos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable/Disable */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="prediction-enabled">Ativar previsão por agenda</Label>
            <p className="text-sm text-muted-foreground">
              Analisa procedimentos agendados para prever consumo de insumos
            </p>
          </div>
          <Switch
            id="prediction-enabled"
            checked={enabled}
            onCheckedChange={(checked) => {
              setEnabled(checked);
              handleChange();
            }}
          />
        </div>
        
        {enabled && (
          <>
            {/* Prediction Period */}
            <div className="space-y-2">
              <Label>Período de previsão</Label>
              <Select 
                value={predictionDays.toString()} 
                onValueChange={(v) => {
                  setPredictionDays(parseInt(v));
                  handleChange();
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Próximos 7 dias</SelectItem>
                  <SelectItem value="15">Próximos 15 dias</SelectItem>
                  <SelectItem value="30">Próximos 30 dias</SelectItem>
                  <SelectItem value="60">Próximos 60 dias</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Define quantos dias à frente o sistema deve analisar a agenda
              </p>
            </div>
            
            {/* Alert Level */}
            <div className="space-y-2">
              <Label>Nível mínimo de alerta</Label>
              <Select 
                value={alertLevel} 
                onValueChange={(v: 'info' | 'warning' | 'critical') => {
                  setAlertLevel(v);
                  handleChange();
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="critical">Apenas críticos (falta prevista)</SelectItem>
                  <SelectItem value="warning">Críticos e avisos (abaixo do mínimo)</SelectItem>
                  <SelectItem value="info">Todos os alertas</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Define quais alertas serão exibidos no dashboard e estoque
              </p>
            </div>
          </>
        )}
        
        {hasChanges && (
          <Button onClick={handleSave} disabled={updateSettings.isPending} className="w-full">
            {updateSettings.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Salvar Configurações
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
