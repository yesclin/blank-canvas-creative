import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Plus, 
  Send,
  Calendar,
  Users,
  CheckCircle,
  XCircle,
  Eye,
  Edit2,
  Play,
  Pause,
} from "lucide-react";
import { 
  CAMPAIGN_STATUS_LABELS,
  CAMPAIGN_STATUS_COLORS,
  type MarketingCampaign,
} from "@/types/comunicacao";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CampaignsListProps {
  campaigns: MarketingCampaign[];
}

export function CampaignsList({ campaigns }: CampaignsListProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return <Edit2 className="h-4 w-4" />;
      case 'scheduled':
        return <Calendar className="h-4 w-4" />;
      case 'sending':
        return <Send className="h-4 w-4 animate-pulse" />;
      case 'sent':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Campanhas</CardTitle>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Nova Campanha
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <div className="space-y-4">
            {campaigns.map((campaign) => {
              const deliveryRate = campaign.sent_count > 0 
                ? Math.round((campaign.delivered_count / campaign.sent_count) * 100) 
                : 0;
              const readRate = campaign.delivered_count > 0 
                ? Math.round((campaign.read_count / campaign.delivered_count) * 100) 
                : 0;
              
              return (
                <div
                  key={campaign.id}
                  className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-sm">{campaign.name}</h4>
                        <Badge 
                          variant="outline" 
                          className={`text-xs flex items-center gap-1 ${CAMPAIGN_STATUS_COLORS[campaign.status]}`}
                        >
                          {getStatusIcon(campaign.status)}
                          {CAMPAIGN_STATUS_LABELS[campaign.status]}
                        </Badge>
                      </div>
                      
                      {campaign.description && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {campaign.description}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {campaign.total_recipients || '—'} destinatários
                        </span>
                        
                        {campaign.scheduled_at && campaign.status === 'scheduled' && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Agendada: {format(parseISO(campaign.scheduled_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                          </span>
                        )}
                        
                        {campaign.sent_at && (
                          <span className="flex items-center gap-1">
                            <Send className="h-3 w-3" />
                            Enviada: {format(parseISO(campaign.sent_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                          </span>
                        )}
                      </div>
                      
                      {campaign.status === 'sent' && (
                        <div className="mt-3 space-y-2">
                          <div className="grid grid-cols-4 gap-2 text-center">
                            <div>
                              <p className="text-lg font-bold text-foreground">{campaign.sent_count}</p>
                              <p className="text-xs text-muted-foreground">Enviadas</p>
                            </div>
                            <div>
                              <p className="text-lg font-bold text-cyan-600">{campaign.delivered_count}</p>
                              <p className="text-xs text-muted-foreground">Entregues</p>
                            </div>
                            <div>
                              <p className="text-lg font-bold text-green-600">{campaign.read_count}</p>
                              <p className="text-xs text-muted-foreground">Lidas</p>
                            </div>
                            <div>
                              <p className="text-lg font-bold text-destructive">{campaign.error_count}</p>
                              <p className="text-xs text-muted-foreground">Erros</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground w-16">Entrega</span>
                            <Progress value={deliveryRate} className="h-2 flex-1" />
                            <span className="text-xs font-medium w-10 text-right">{deliveryRate}%</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground w-16">Leitura</span>
                            <Progress value={readRate} className="h-2 flex-1" />
                            <span className="text-xs font-medium w-10 text-right">{readRate}%</span>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Eye className="h-4 w-4" />
                      </Button>
                      {campaign.status === 'draft' && (
                        <>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-primary">
                            <Send className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {campaign.status === 'scheduled' && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                          <Pause className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            
            {campaigns.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                <Send className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Nenhuma campanha criada</p>
                <Button variant="outline" size="sm" className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeira Campanha
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
