import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Clock, Save, TrendingDown } from "lucide-react";
import { toast } from "sonner";
import { DEFAULT_IDLE_ALERT_CONFIG, IdleAlertConfig } from "@/hooks/useIdleAgendaAlerts";

interface IdleAlertSettingsProps {
  initialConfig?: Partial<IdleAlertConfig>;
  onSave?: (config: IdleAlertConfig) => void;
}

export function IdleAlertSettings({ initialConfig = {}, onSave }: IdleAlertSettingsProps) {
  const [config, setConfig] = useState<IdleAlertConfig>({
    ...DEFAULT_IDLE_ALERT_CONFIG,
    ...initialConfig,
  });
  const [isSaving, setIsSaving] = useState(false);
  
  const handleSave = async () => {
    setIsSaving(true);
    try {
      onSave?.(config);
      toast.success("Configurações de alerta salvas com sucesso!");
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingDown className="h-5 w-5 text-amber-500" />
          Alertas de Agenda Ociosa
        </CardTitle>
        <CardDescription>
          Configure quando o sistema deve alertar sobre horários livres
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable/Disable */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="idle-alerts-enabled">Ativar alertas de ociosidade</Label>
            <p className="text-sm text-muted-foreground">
              Mostra avisos quando profissionais têm muitos horários livres
            </p>
          </div>
          <Switch
            id="idle-alerts-enabled"
            checked={config.enabled}
            onCheckedChange={(checked) => setConfig(prev => ({ ...prev, enabled: checked }))}
          />
        </div>
        
        {config.enabled && (
          <>
            <div className="grid gap-6 sm:grid-cols-3 pt-4 border-t">
              {/* Min Idle Hours */}
              <div className="space-y-2">
                <Label htmlFor="min-idle-hours" className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  Mínimo de horas livres
                </Label>
                <Input
                  id="min-idle-hours"
                  type="number"
                  min={0.5}
                  max={8}
                  step={0.5}
                  value={config.minIdleHours}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    minIdleHours: parseFloat(e.target.value) || 2,
                  }))}
                />
                <p className="text-xs text-muted-foreground">
                  Alertar quando o profissional tiver este total de horas livres no dia
                </p>
              </div>
              
              {/* Min Continuous Minutes */}
              <div className="space-y-2">
                <Label htmlFor="min-continuous-minutes" className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  Período contínuo (min)
                </Label>
                <Input
                  id="min-continuous-minutes"
                  type="number"
                  min={30}
                  max={240}
                  step={15}
                  value={config.minContinuousMinutes}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    minContinuousMinutes: parseInt(e.target.value) || 60,
                  }))}
                />
                <p className="text-xs text-muted-foreground">
                  Alertar quando houver um período livre contínuo maior que este valor
                </p>
              </div>
              
              {/* Min Occupancy Percent */}
              <div className="space-y-2">
                <Label htmlFor="min-occupancy" className="flex items-center gap-1">
                  <TrendingDown className="h-3.5 w-3.5 text-muted-foreground" />
                  Ocupação mínima (%)
                </Label>
                <Input
                  id="min-occupancy"
                  type="number"
                  min={10}
                  max={100}
                  step={5}
                  value={config.minOccupancyPercent}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    minOccupancyPercent: parseInt(e.target.value) || 60,
                  }))}
                />
                <p className="text-xs text-muted-foreground">
                  Alertar quando a taxa de ocupação estiver abaixo deste percentual
                </p>
              </div>
            </div>
            
            {/* Preview */}
            <div className="p-4 rounded-lg bg-muted/50 border border-dashed">
              <p className="text-sm font-medium mb-2">Resumo da configuração:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Alerta se ocupação abaixo de <strong>{config.minOccupancyPercent}%</strong></li>
                <li>• Alerta se mais de <strong>{config.minIdleHours}h</strong> livres no dia</li>
                <li>• Alerta se período livre contínuo maior que <strong>{config.minContinuousMinutes}min</strong></li>
              </ul>
            </div>
          </>
        )}
        
        <div className="flex justify-end pt-4">
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Salvando..." : "Salvar Configurações"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
