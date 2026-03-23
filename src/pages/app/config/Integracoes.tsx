import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Save,
  Unplug,
  Eye,
  EyeOff,
  Shield,
  Mail,
  Smartphone,
} from "lucide-react";
import { useWhatsAppIntegration, type EvolutionApiFormData } from "@/hooks/useWhatsAppIntegration";

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
          <EvolutionApiConfigCard />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EvolutionApiConfigCard() {
  const { integration, loading, saving, saveIntegration, disconnectIntegration, isConfigured } = useWhatsAppIntegration();
  const [showToken, setShowToken] = useState(false);
  const [form, setForm] = useState<EvolutionApiFormData>({
    api_url: '',
    instance_id: '',
    access_token: '',
    display_phone_number: '',
  });
  const [formInitialized, setFormInitialized] = useState(false);

  if (integration && !formInitialized) {
    setForm({
      api_url: integration.api_url || integration.base_url || '',
      instance_id: integration.instance_id || '',
      access_token: integration.access_token || '',
      display_phone_number: integration.display_phone_number || '',
    });
    setFormInitialized(true);
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Carregando configuração...
        </CardContent>
      </Card>
    );
  }

  const statusBadge = () => {
    const status = integration?.status || 'not_configured';
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500"><Wifi className="h-3 w-3 mr-1" />Ativo</Badge>;
      case 'invalid':
        return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Inválido</Badge>;
      default:
        return <Badge variant="secondary"><WifiOff className="h-3 w-3 mr-1" />Não Configurado</Badge>;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveIntegration(form);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100">
              <MessageCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <CardTitle>WhatsApp via Evolution API</CardTitle>
              <CardDescription>Integração com Evolution API — envio automatizado de mensagens</CardDescription>
            </div>
          </div>
          {statusBadge()}
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg border">
            <Shield className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">Configuração segura</p>
              <p>As credenciais são armazenadas de forma criptografada e isoladas por clínica. 
              Nenhuma outra clínica pode acessar seus dados de integração.</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="display_phone">Número de Exibição</Label>
            <Input
              id="display_phone"
              placeholder="Ex: +55 11 99999-9999"
              value={form.display_phone_number}
              onChange={(e) => setForm({ ...form, display_phone_number: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">O número que será exibido para os pacientes</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="api_url">URL da Evolution API</Label>
            <Input
              id="api_url"
              placeholder="https://sua-evolution-api.com"
              value={form.api_url}
              onChange={(e) => setForm({ ...form, api_url: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              URL base da sua instância Evolution API (ex: https://api.seudominio.com)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="instance_id">Nome da Instância</Label>
            <Input
              id="instance_id"
              placeholder="Nome da sua instância"
              value={form.instance_id}
              onChange={(e) => setForm({ ...form, instance_id: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="access_token">API Key</Label>
            <div className="relative">
              <Input
                id="access_token"
                type={showToken ? "text" : "password"}
                placeholder="Sua API Key da Evolution API"
                value={form.access_token}
                onChange={(e) => setForm({ ...form, access_token: e.target.value })}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                onClick={() => setShowToken(!showToken)}
              >
                {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              API Key de autenticação da sua instância Evolution API
            </p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Salvando...' : 'Salvar Configuração'}
            </Button>

            {isConfigured && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="outline" className="text-destructive" disabled={saving}>
                    <Unplug className="h-4 w-4 mr-2" />
                    Desconectar
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Desconectar WhatsApp?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Todas as credenciais serão removidas e as automações via WhatsApp deixarão de funcionar para esta clínica.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={disconnectIntegration}>
                      Sim, desconectar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>

          {!isConfigured && (
            <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-amber-800 dark:text-amber-200">WhatsApp não configurado</p>
                <p className="text-amber-700 dark:text-amber-300">
                  As automações de mensagens não serão enviadas até que o WhatsApp esteja configurado e ativo.
                </p>
              </div>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
