import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  MessageCircle, 
  Wifi,
  WifiOff,
  AlertTriangle,
  Settings,
  Shield,
} from "lucide-react";
import { useWhatsAppIntegration } from "@/hooks/useWhatsAppIntegration";
import { useNavigate } from "react-router-dom";

export function WhatsAppStatus() {
  const { integration, loading, isConfigured } = useWhatsAppIntegration();
  const navigate = useNavigate();

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground text-sm">
          Verificando conexão...
        </CardContent>
      </Card>
    );
  }

  const status = integration?.status || 'not_configured';

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-green-600" />
            WhatsApp via Evolution API
          </CardTitle>
          <Badge 
            variant={status === 'active' ? "default" : status === 'invalid' ? "destructive" : "secondary"}
            className={status === 'active' ? "bg-green-500" : ""}
          >
            {status === 'active' ? (
              <><Wifi className="h-3 w-3 mr-1" />Conectado</>
            ) : status === 'invalid' ? (
              <><AlertTriangle className="h-3 w-3 mr-1" />Inválido</>
            ) : (
              <><WifiOff className="h-3 w-3 mr-1" />Desconectado</>
            )}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {isConfigured ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
              <div>
                <p className="font-medium text-sm">Instância Conectada</p>
                <p className="text-lg font-bold text-green-700 dark:text-green-400">
                  {integration?.display_phone_number || integration?.instance_id || 'Configurado'}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate('/app/marketing?tab=whatsapp')}>
                <Settings className="h-4 w-4 mr-2" />
                Configurar
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="h-8 w-8 text-muted-foreground" />
            </div>
            
            <h3 className="font-medium mb-2">Conecte seu WhatsApp via Evolution API</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
              Automatize confirmações, lembretes e campanhas diretamente pelo WhatsApp da sua clínica.
            </p>
            
            <Button onClick={() => navigate('/app/marketing?tab=whatsapp')} className="mb-4">
              <MessageCircle className="h-4 w-4 mr-2" />
              Conectar WhatsApp
            </Button>
            
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Shield className="h-3 w-3" />
              <span>Integração via Evolution API — isolamento por clínica</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
