import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Clock, Save, TrendingDown, Loader2 } from "lucide-react";
import { useIdleAlertSettings, IdleAlertSettingsFormData } from "@/hooks/useIdleAlertSettings";
import { Skeleton } from "@/components/ui/skeleton";

export function IdleAlertSettingsCard() {
  const { currentSettings, isLoading, isSaving, saveSettings } = useIdleAlertSettings();
  const initializedRef = useRef(false);
  
  const [formData, setFormData] = useState<IdleAlertSettingsFormData>({
    enabled: true,
    min_idle_hours: 2,
    min_continuous_minutes: 60,
    min_occupancy_percent: 60,
  });

  // Only update form when data loads for the first time
  useEffect(() => {
    if (!isLoading && !initializedRef.current) {
      setFormData(currentSettings);
      initializedRef.current = true;
    }
  }, [isLoading, currentSettings]);

  const handleInputChange = (field: keyof IdleAlertSettingsFormData, value: string | boolean) => {
    if (typeof value === 'boolean') {
      setFormData(prev => ({ ...prev, [field]: value }));
    } else {
      const numValue = parseFloat(value);
      if (!isNaN(numValue) && numValue >= 0) {
        // Clamp percentage to 0-100
        if (field === 'min_occupancy_percent') {
          setFormData(prev => ({ ...prev, [field]: Math.min(100, Math.max(0, numValue)) }));
        } else {
          setFormData(prev => ({ ...prev, [field]: numValue }));
        }
      }
    }
  };

  const handleSave = async () => {
    await saveSettings(formData);
  };

  const hasChanges = 
    formData.enabled !== currentSettings.enabled ||
    formData.min_idle_hours !== currentSettings.min_idle_hours ||
    formData.min_continuous_minutes !== currentSettings.min_continuous_minutes ||
    formData.min_occupancy_percent !== currentSettings.min_occupancy_percent;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-warning" />
            Alertas de Agenda Ociosa
          </CardTitle>
          <CardDescription>
            Configure quando o sistema deve alertar sobre horários livres
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Skeleton className="h-12 w-full" />
          <div className="grid gap-6 sm:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingDown className="h-5 w-5 text-warning" />
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
            checked={formData.enabled}
            onCheckedChange={(checked) => handleInputChange('enabled', checked)}
          />
        </div>
        
        {formData.enabled && (
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
                  value={formData.min_idle_hours}
                  onChange={(e) => handleInputChange('min_idle_hours', e.target.value)}
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
                  value={formData.min_continuous_minutes}
                  onChange={(e) => handleInputChange('min_continuous_minutes', e.target.value)}
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
                  value={formData.min_occupancy_percent}
                  onChange={(e) => handleInputChange('min_occupancy_percent', e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Alertar quando a taxa de ocupação estiver abaixo deste percentual
                </p>
              </div>
            </div>
            
            {/* Dynamic Summary */}
            <div className="p-4 rounded-lg bg-muted/50 border border-dashed">
              <p className="text-sm font-medium mb-2">Resumo da configuração:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Alerta se ocupação abaixo de <strong>{formData.min_occupancy_percent}%</strong></li>
                <li>• Alerta se mais de <strong>{formData.min_idle_hours}h</strong> livres no dia</li>
                <li>• Alerta se período livre contínuo maior que <strong>{formData.min_continuous_minutes}min</strong></li>
              </ul>
            </div>
          </>
        )}
        
        <div className="flex justify-end pt-4 border-t">
          <Button onClick={handleSave} disabled={isSaving || !hasChanges}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Salvar Configurações
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
