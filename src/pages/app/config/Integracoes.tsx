import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageCircle, Mail, Smartphone } from "lucide-react";
import { WhatsAppUazapiManager } from "@/components/integrations/whatsapp/WhatsAppUazapiManager";

export default function ConfigIntegracoes() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Integrações</h1>
        <p className="text-muted-foreground">Configure os canais de comunicação da sua clínica</p>
      </div>

      <Tabs defaultValue="whatsapp" className="space-y-4">
        <TabsList>
          <TabsTrigger value="whatsapp" className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </TabsTrigger>
          <TabsTrigger value="email" disabled className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            E-mail
            <Badge variant="outline" className="ml-1 text-xs">Em breve</Badge>
          </TabsTrigger>
          <TabsTrigger value="sms" disabled className="flex items-center gap-2">
            <Smartphone className="h-4 w-4" />
            SMS
            <Badge variant="outline" className="ml-1 text-xs">Em breve</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="whatsapp">
          <WhatsAppUazapiManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
