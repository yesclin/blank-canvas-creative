import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  MessageCircle,
  Wifi,
  WifiOff,
  AlertTriangle,
  Loader2,
  PlugZap,
  Plug,
  RefreshCw,
  RotateCcw,
  TestTube,
  CheckCircle,
  XCircle,
  Webhook,
  Building2,
  ShieldAlert,
  QrCode,
} from "lucide-react";
import { useClinicWhatsAppIntegration } from "@/hooks/useClinicWhatsAppIntegration";
import { useChannelIntegrationCredentials } from "@/hooks/useChannelIntegrationCredentials";
import { usePermissions } from "@/hooks/usePermissions";

function StatusBadge({ status }: { status: string | null | undefined }) {
  const s = (status || "not_configured").toLowerCase();
  const map: Record<string, { label: string; className: string; Icon: any }> = {
    connected: { label: "Conectado", className: "bg-green-500 hover:bg-green-500", Icon: Wifi },
    active: { label: "Conectado", className: "bg-green-500 hover:bg-green-500", Icon: Wifi },
    connecting: { label: "Conectando", className: "bg-amber-500 hover:bg-amber-500", Icon: Loader2 },
    disconnected: { label: "Desconectado", className: "bg-muted text-muted-foreground", Icon: WifiOff },
    not_configured: { label: "Não configurado", className: "bg-muted text-muted-foreground", Icon: WifiOff },
    error: { label: "Erro", className: "bg-destructive text-destructive-foreground", Icon: AlertTriangle },
  };
  const cfg = map[s] || map.not_configured;
  return (
    <Badge className={cfg.className}>
      <cfg.Icon className={`h-3 w-3 mr-1 ${s === "connecting" ? "animate-spin" : ""}`} />
      {cfg.label}
    </Badge>
  );
}

export function WhatsAppUazapiManager() {
  const { canManageClinic } = usePermissions();
  const {
    integration,
    loading,
    actionLoading,
    qrcode,
    paircode,
    isConnected,
    hasInstance,
    createInstance,
    linkExistingInstance,
    connectInstance,
    refreshStatus,
    disconnectInstance,
    resetInstance,
    sendTestMessage,
  } = useClinicWhatsAppIntegration();

  const [instanceName, setInstanceName] = useState("");
  const [connectPhone, setConnectPhone] = useState("");
  const [testPhone, setTestPhone] = useState("");
  const [testMessage, setTestMessage] = useState("✅ Teste de conexão YesClin via UAZAPI");
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [linkName, setLinkName] = useState("");
  const [linkToken, setLinkToken] = useState("");
  const [linkExternalId, setLinkExternalId] = useState("");

  if (!canManageClinic) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <ShieldAlert className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-medium">Acesso restrito</p>
          <p className="text-sm text-muted-foreground">Apenas owner ou admin podem configurar a integração de WhatsApp.</p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
          Carregando integração...
        </CardContent>
      </Card>
    );
  }

  const handleTest = async () => {
    setTestResult(null);
    const res = await sendTestMessage(testPhone, testMessage);
    if (res?.success) setTestResult({ success: true, message: "Mensagem enviada com sucesso!" });
    else setTestResult({ success: false, message: res?.response?.message || "Falha no envio" });
  };

  const lastCheck = integration?.last_connection_check_at
    ? new Date(integration.last_connection_check_at).toLocaleString("pt-BR")
    : null;

  return (
    <div className="space-y-6">
      {/* 1. Resumo da Integração */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-950 rounded-lg">
                <MessageCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <CardTitle>WhatsApp via UAZAPI</CardTitle>
                <CardDescription>Conecte e gerencie a instância de WhatsApp da sua clínica</CardDescription>
              </div>
            </div>
            <StatusBadge status={integration?.instance_status || integration?.status} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Provider</p>
              <p className="font-medium">UAZAPI</p>
            </div>
            <div>
              <p className="text-muted-foreground">Nome da instância</p>
              <p className="font-medium">{integration?.instance_name || "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Número conectado</p>
              <p className="font-medium">{integration?.instance_phone || "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Perfil WhatsApp</p>
              <p className="font-medium">{integration?.instance_profile_name || "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Conta business</p>
              <p className="font-medium flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5" />
                {integration?.is_business ? "Sim" : "Não"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Última verificação</p>
              <p className="font-medium">{lastCheck || "—"}</p>
            </div>
          </div>

          {integration?.last_error && (
            <div className="flex items-start gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Último erro</p>
                <p className="text-xs break-all">{integration.last_error}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 2. Dados da Instância */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Dados da Instância</CardTitle>
          <CardDescription>Identificadores técnicos da instância na UAZAPI</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!hasInstance ? (
            <div className="space-y-6">
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                  <PlugZap className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-medium mb-1">Nenhuma instância criada</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Crie uma nova instância ou vincule uma já existente na UAZAPI.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-2 justify-center">
                  <Input
                    placeholder="Nome opcional (ex: clinica-central)"
                    value={instanceName}
                    onChange={(e) => setInstanceName(e.target.value)}
                    className="max-w-xs"
                  />
                  <Button
                    onClick={() => createInstance(instanceName.trim() || undefined)}
                    disabled={actionLoading === "create"}
                  >
                    {actionLoading === "create" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <PlugZap className="h-4 w-4 mr-2" />}
                    Criar instância da clínica
                  </Button>
                </div>
                <Button variant="link" size="sm" onClick={() => setShowLinkForm((v) => !v)}>
                  {showLinkForm ? "Cancelar vínculo manual" : "Já tenho uma instância na UAZAPI — vincular"}
                </Button>
              </div>

              {showLinkForm && (
                <div className="border rounded-lg p-4 space-y-3 bg-muted/20">
                  <div>
                    <p className="font-medium text-sm">Vincular instância existente</p>
                    <p className="text-xs text-muted-foreground">
                      Use esta opção se a instância já foi criada diretamente no painel da UAZAPI.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="link_name">instance_name *</Label>
                      <Input id="link_name" value={linkName} onChange={(e) => setLinkName(e.target.value)} placeholder="nome-da-instancia" />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="link_token">instance_token *</Label>
                      <Input id="link_token" value={linkToken} onChange={(e) => setLinkToken(e.target.value)} placeholder="token UAZAPI da instância" />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <Label htmlFor="link_ext">instance_external_id (opcional)</Label>
                      <Input id="link_ext" value={linkExternalId} onChange={(e) => setLinkExternalId(e.target.value)} placeholder="id externo (se houver)" />
                    </div>
                  </div>
                  <Button
                    onClick={() =>
                      linkExistingInstance({
                        instance_name: linkName.trim(),
                        instance_token: linkToken.trim(),
                        instance_external_id: linkExternalId.trim() || undefined,
                      })
                    }
                    disabled={actionLoading === "link_existing" || !linkName.trim() || !linkToken.trim()}
                  >
                    {actionLoading === "link_existing" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plug className="h-4 w-4 mr-2" />}
                    Vincular instância
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">instance_name</Label>
                <Input value={integration?.instance_name || ""} readOnly />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">instance_external_id</Label>
                <Input value={integration?.instance_external_id || ""} readOnly />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">instance_status</Label>
                <Input value={integration?.instance_status || ""} readOnly />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">instance_phone</Label>
                <Input value={integration?.instance_phone || ""} readOnly />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">instance_profile_name</Label>
                <Input value={integration?.instance_profile_name || ""} readOnly />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">is_business</Label>
                <Input value={integration?.is_business ? "true" : "false"} readOnly />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 3. Conexão do WhatsApp */}
      {hasInstance && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Conexão do WhatsApp</CardTitle>
            <CardDescription>Inicie ou gerencie a sessão da instância</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => connectInstance(connectPhone || undefined)} disabled={actionLoading === "connect" || isConnected}>
                {actionLoading === "connect" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plug className="h-4 w-4 mr-2" />}
                Conectar instância
              </Button>
              <Button variant="outline" onClick={refreshStatus} disabled={actionLoading === "status"}>
                {actionLoading === "status" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                Atualizar status
              </Button>
              <Button variant="outline" onClick={disconnectInstance} disabled={actionLoading === "disconnect" || !isConnected} className="text-destructive">
                <WifiOff className="h-4 w-4 mr-2" />
                Desconectar
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="text-destructive">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Resetar instância
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Resetar instância?</AlertDialogTitle>
                    <AlertDialogDescription>
                      A sessão será encerrada e o token da instância será removido. Você precisará criar uma nova instância para reconectar.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={resetInstance}>Sim, resetar</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            <div className="space-y-1 max-w-sm">
              <Label htmlFor="connect_phone">Telefone (opcional, para pair code)</Label>
              <Input
                id="connect_phone"
                placeholder="Ex: 5511999999999"
                value={connectPhone}
                onChange={(e) => setConnectPhone(e.target.value)}
              />
            </div>

            {(qrcode || paircode) && !isConnected && (
              <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <QrCode className="h-4 w-4" /> Escaneie ou use o pair code
                </div>
                {qrcode && (
                  <div className="flex justify-center">
                    <img
                      src={qrcode.startsWith("data:") ? qrcode : `data:image/png;base64,${qrcode}`}
                      alt="QR Code WhatsApp"
                      className="w-56 h-56 bg-white p-2 rounded"
                    />
                  </div>
                )}
                {paircode && (
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">Pair code</p>
                    <p className="font-mono text-2xl tracking-widest">{paircode}</p>
                  </div>
                )}
                <ol className="text-xs text-muted-foreground list-decimal pl-4 space-y-1">
                  <li>Abra o WhatsApp no celular</li>
                  <li>Vá em Configurações → Aparelhos conectados</li>
                  <li>Toque em "Conectar um aparelho" e escaneie o QR</li>
                </ol>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 4. Webhook */}
      {hasInstance && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Webhook className="h-5 w-5" /> Webhook
            </CardTitle>
            <CardDescription>Recebimento de eventos da instância</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Webhook ativo</p>
                <p className="text-xs text-muted-foreground">Recebe eventos de mensagens, status e conexão</p>
              </div>
              <Switch checked={!!integration?.webhook_enabled} disabled />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">URL configurada</Label>
              <Input value={integration?.webhook_url || "—"} readOnly />
            </div>
            <div className="text-xs text-muted-foreground">
              Eventos monitorados: <span className="font-medium">connection.update, messages.upsert, qrcode.updated</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 5. Teste de Envio */}
      {isConnected && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TestTube className="h-5 w-5" /> Teste de Envio
            </CardTitle>
            <CardDescription>Envie uma mensagem para validar a conexão</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="test_phone">Número (com DDI)</Label>
                <Input
                  id="test_phone"
                  placeholder="5511999999999"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="test_msg">Mensagem</Label>
                <Input
                  id="test_msg"
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                />
              </div>
            </div>
            <Button onClick={handleTest} disabled={actionLoading === "send_test" || !testPhone}>
              {actionLoading === "send_test" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <TestTube className="h-4 w-4 mr-2" />}
              Enviar mensagem de teste
            </Button>
            {testResult && (
              <div
                className={`p-3 rounded-lg flex items-center gap-2 text-sm ${
                  testResult.success
                    ? "bg-green-50 text-green-800 dark:bg-green-950/30 dark:text-green-400"
                    : "bg-destructive/10 text-destructive"
                }`}
              >
                {testResult.success ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                {testResult.message}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 6. Ações Avançadas */}
      {hasInstance && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ações Avançadas</CardTitle>
            <CardDescription>Operações de manutenção da instância</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={refreshStatus} disabled={actionLoading === "status"}>
                <RefreshCw className="h-4 w-4 mr-2" /> Revalidar status
              </Button>
              <Button variant="outline" onClick={disconnectInstance} disabled={actionLoading === "disconnect"}>
                <WifiOff className="h-4 w-4 mr-2" /> Desconectar sessão
              </Button>
            </div>
            <Separator />
            <div className="text-xs text-muted-foreground space-y-1">
              <p>• Revalidar status: força sincronização com a UAZAPI</p>
              <p>• Desconectar sessão: encerra a sessão atual mantendo a instância</p>
              <p>• Resetar instância: remove o token e exige nova criação</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
