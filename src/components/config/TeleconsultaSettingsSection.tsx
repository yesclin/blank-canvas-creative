import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Video, Save, Loader2 } from "lucide-react";
import { useTeleconsultaSettings, useTeleconsultaActions } from "@/hooks/useTeleconsulta";

export function TeleconsultaSettingsSection() {
  const { data: settings, isLoading } = useTeleconsultaSettings();
  const { saveTeleconsultaSettings } = useTeleconsultaActions();

  const [enabled, setEnabled] = useState(false);
  const [defaultProvider, setDefaultProvider] = useState("manual");
  const [requireConsent, setRequireConsent] = useState(true);
  const [requirePrecheck, setRequirePrecheck] = useState(true);
  const [lateTolerance, setLateTolerance] = useState(15);
  const [allowRecording, setAllowRecording] = useState(false);

  useEffect(() => {
    if (settings) {
      setEnabled(settings.enabled);
      setDefaultProvider(settings.default_provider);
      setRequireConsent(settings.require_consent);
      setRequirePrecheck(settings.require_precheck);
      setLateTolerance(settings.late_tolerance_minutes);
      setAllowRecording(settings.allow_recording);
    }
  }, [settings]);

  const handleSave = () => {
    saveTeleconsultaSettings.mutate({
      enabled,
      default_provider: defaultProvider,
      require_consent: requireConsent,
      require_precheck: requirePrecheck,
      late_tolerance_minutes: lateTolerance,
      allow_recording: allowRecording,
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="h-5 w-5" />
          Teleconsulta
        </CardTitle>
        <CardDescription>
          Configure o suporte a teleconsulta para sua clínica
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable/Disable */}
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="tele-enabled">Habilitar Teleconsulta</Label>
            <p className="text-xs text-muted-foreground">Permite agendar atendimentos por teleconsulta</p>
          </div>
          <Switch 
            id="tele-enabled" 
            checked={enabled} 
            onCheckedChange={setEnabled} 
          />
        </div>

        {enabled && (
          <>
            {/* Default Provider */}
            <div className="space-y-2">
              <Label>Provedor Padrão</Label>
              <Select value={defaultProvider} onValueChange={setDefaultProvider}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Link Manual</SelectItem>
                  <SelectItem value="google_meet">Google Meet</SelectItem>
                  <SelectItem value="zoom">Zoom</SelectItem>
                  <SelectItem value="teams">Microsoft Teams</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Consent */}
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="tele-consent">Exigir Termo de Teleatendimento</Label>
                <p className="text-xs text-muted-foreground">Paciente deve aceitar o termo antes da consulta</p>
              </div>
              <Switch 
                id="tele-consent" 
                checked={requireConsent} 
                onCheckedChange={setRequireConsent} 
              />
            </div>

            {/* Precheck */}
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="tele-precheck">Exigir Pré-Check</Label>
                <p className="text-xs text-muted-foreground">Validar câmera, microfone e internet antes da consulta</p>
              </div>
              <Switch 
                id="tele-precheck" 
                checked={requirePrecheck} 
                onCheckedChange={setRequirePrecheck} 
              />
            </div>

            {/* Late tolerance */}
            <div className="space-y-2">
              <Label>Tolerância de Atraso (minutos)</Label>
              <Input 
                type="number" 
                value={lateTolerance} 
                onChange={e => setLateTolerance(parseInt(e.target.value) || 0)} 
                min={0}
                max={60}
              />
            </div>

            {/* Recording */}
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="tele-recording">Permitir Gravação</Label>
                <p className="text-xs text-muted-foreground">Gravar sessões de teleconsulta (requer consentimento)</p>
              </div>
              <Switch 
                id="tele-recording" 
                checked={allowRecording} 
                onCheckedChange={setAllowRecording} 
              />
            </div>
          </>
        )}

        <Button onClick={handleSave} disabled={saveTeleconsultaSettings.isPending} className="w-full">
          {saveTeleconsultaSettings.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Salvar Configurações
        </Button>
      </CardContent>
    </Card>
  );
}
