import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  MessageCircle, Settings, CheckCircle, WifiOff, AlertTriangle, ExternalLink, Loader2,
} from "lucide-react";
import { useClinicWhatsAppIntegration } from "@/hooks/useClinicWhatsAppIntegration";
import { Link } from "react-router-dom";

export default function MarketingIntegracoes() {
  const { integration, loading, isConnected, hasInstance } = useClinicWhatsAppIntegration();

  return (
    <div className="space-y-6 max-w-2xl">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-950">
              <MessageCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="flex-1">
              <CardTitle>WhatsApp via UAZAPI</CardTitle>
              <CardDescription>Integração da clínica para envio de mensagens</CardDescription>
            </div>
            {!loading && (
              <Badge
                variant={isConnected ? "default" : hasInstance ? "secondary" : "outline"}
                className={isConnected ? "bg-green-500" : ""}
              >
                {isConnected ? (
                  <><CheckCircle className="h-3 w-3 mr-1" />Conectado</>
                ) : hasInstance ? (
                  <><AlertTriangle className="h-3 w-3 mr-1" />Aguardando conexão</>
                ) : (
                  <><WifiOff className="h-3 w-3 mr-1" />Não configurado</>
                )}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Verificando integração...
            </div>
          ) : isConnected ? (
            <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">Instância conectada</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {integration?.instance_profile_name || integration?.instance_name || "Instância ativa"}
                    {integration?.instance_phone && ` • ${integration.instance_phone}`}
                  </p>
                </div>
              </div>
            </div>
          ) : hasInstance ? (
            <div className="p-4 border rounded-lg border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-400">
                    Instância criada, mas não conectada
                  </p>
                  <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">
                    Acesse a central de gestão para escanear o QR Code e conectar.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 border rounded-lg bg-muted/30">
              <div className="flex items-start gap-3">
                <MessageCircle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Nenhuma instância configurada</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Crie a instância UAZAPI da sua clínica na central de integrações.
                  </p>
                </div>
              </div>
            </div>
          )}

          <Separator />

          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <Settings className="h-3.5 w-3.5" />
              Gestão completa em Configurações
            </div>
            <Button asChild size="sm">
              <Link to="/app/config/integracoes">
                Abrir central
                <ExternalLink className="h-3.5 w-3.5 ml-2" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
