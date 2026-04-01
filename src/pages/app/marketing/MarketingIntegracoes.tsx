import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  MessageCircle, Radio, Settings, AlertTriangle, CheckCircle,
} from "lucide-react";

export default function MarketingIntegracoes() {
  return (
    <div className="space-y-6 max-w-2xl">
      {/* Current Provider */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted">
              <Radio className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <CardTitle>Provider Atual</CardTitle>
              <CardDescription>Modo de operação da comunicação</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-sm">Modo Manual</p>
                <p className="text-xs text-muted-foreground">
                  Mensagens são geradas, copiadas e enviadas manualmente pelo operador
                </p>
              </div>
            </div>
            <Badge variant="outline" className="text-green-700 border-green-200 bg-green-50">
              Ativo
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Future Integration */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-950">
              <MessageCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <CardTitle>WhatsApp via UAZAPI</CardTitle>
              <CardDescription>Integração futura para envio automatizado</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 p-4 border rounded-lg border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-400">
                Integração externa ainda não configurada
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">
                A integração com UAZAPI será habilitada em uma versão futura. 
                Por enquanto, utilize o modo manual para gerar e enviar mensagens.
              </p>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">Quando disponível, a integração permitirá:</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground shrink-0" />
                Envio automático de mensagens via WhatsApp
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground shrink-0" />
                Confirmação de consultas por mensagem
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground shrink-0" />
                Lembretes automáticos antes do horário
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground shrink-0" />
                Acompanhamento de status de entrega e leitura
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground shrink-0" />
                Campanhas com segmentação automática
              </li>
            </ul>
          </div>

          <Separator />

          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <Settings className="h-3.5 w-3.5" />
            Para configurar a integração UAZAPI quando disponível, entre em contato com o suporte.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
