import { useState, useEffect } from 'react';
import { Shield, Save, Lock, Eye, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSecurity } from '@/hooks/prontuario';

export function SecuritySection() {
  const { settings, defaults, loading, saving, save } = useSecurity();

  const [lockAfterSignature, setLockAfterSignature] = useState(defaults.lock_after_signature);
  const [signatureLockHours, setSignatureLockHours] = useState(defaults.signature_lock_hours);
  const [requireConsent, setRequireConsent] = useState(defaults.require_consent_before_access);
  const [auditEnabled, setAuditEnabled] = useState(defaults.audit_enabled);
  const [auditRetentionDays, setAuditRetentionDays] = useState(defaults.audit_retention_days);
  const [allowEditMinutes, setAllowEditMinutes] = useState(defaults.allow_evolution_edit_minutes);
  const [requireJustification, setRequireJustification] = useState(defaults.require_justification_for_edit);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!loading && !initialized) {
      if (settings) {
        setLockAfterSignature(settings.lock_after_signature);
        setSignatureLockHours(settings.signature_lock_hours);
        setRequireConsent(settings.require_consent_before_access);
        setAuditEnabled(settings.audit_enabled);
        setAuditRetentionDays(settings.audit_retention_days);
        setAllowEditMinutes(settings.allow_evolution_edit_minutes);
        setRequireJustification(settings.require_justification_for_edit);
      }
      setInitialized(true);
    }
  }, [loading, settings, initialized]);

  const handleSave = () => {
    save({
      lock_after_signature: lockAfterSignature,
      signature_lock_hours: signatureLockHours,
      require_consent_before_access: requireConsent,
      audit_enabled: auditEnabled,
      audit_retention_days: auditRetentionDays,
      allow_evolution_edit_minutes: allowEditMinutes,
      require_justification_for_edit: requireJustification,
    });
  };

  if (loading && !initialized) {
    return <Card><CardContent className="py-8"><Skeleton className="h-32 w-full" /></CardContent></Card>;
  }

  return (
    <div className="space-y-6">
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Estas configurações afetam a conformidade com a <strong>LGPD</strong> e regulamentações de saúde.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Lock className="h-5 w-5" />Bloqueio de Edição</CardTitle>
          <CardDescription>Configure quando registros são bloqueados</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label className="font-medium">Bloquear após assinatura</Label>
              <p className="text-sm text-muted-foreground">Impede edições após assinar</p>
            </div>
            <Switch checked={lockAfterSignature} onCheckedChange={setLockAfterSignature} />
          </div>

          {lockAfterSignature && (
            <div className="pl-4 border-l-2 border-primary/20 space-y-2">
              <Label>Período de graça (horas)</Label>
              <Input
                type="number"
                value={signatureLockHours}
                onChange={e => setSignatureLockHours(Number(e.target.value))}
                className="w-32"
                min={0}
                max={168}
              />
            </div>
          )}

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label className="font-medium">Exigir justificativa</Label>
              <p className="text-sm text-muted-foreground">Obriga informar motivo da alteração</p>
            </div>
            <Switch checked={requireJustification} onCheckedChange={setRequireJustification} />
          </div>

          <div className="space-y-2">
            <Label>Janela de edição (minutos)</Label>
            <Input
              type="number"
              value={allowEditMinutes}
              onChange={e => setAllowEditMinutes(Number(e.target.value))}
              className="w-32"
              min={0}
              max={1440}
            />
            <p className="text-xs text-muted-foreground">Tempo após criação em que evoluções podem ser editadas</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />LGPD & Consentimento
            <Badge variant="secondary" className="ml-2">LGPD</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label className="font-medium">Exigir consentimento</Label>
              <p className="text-sm text-muted-foreground">Paciente deve aceitar termos antes de visualizar</p>
            </div>
            <Switch checked={requireConsent} onCheckedChange={setRequireConsent} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Eye className="h-5 w-5" />Auditoria</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label className="font-medium">Habilitar logs de auditoria</Label>
              <p className="text-sm text-muted-foreground">Registra acessos e alterações</p>
            </div>
            <Switch checked={auditEnabled} onCheckedChange={setAuditEnabled} />
          </div>

          {auditEnabled && (
            <div className="space-y-2">
              <Label>Retenção (dias)</Label>
              <Input
                type="number"
                value={auditRetentionDays}
                onChange={e => setAuditRetentionDays(Number(e.target.value))}
                className="w-32"
                min={30}
                max={3650}
              />
              <p className="text-xs text-muted-foreground">Regulamentações exigem mínimo de 20 anos (7300 dias)</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg">
          <Save className="h-4 w-4 mr-2" />{saving ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>
    </div>
  );
}
