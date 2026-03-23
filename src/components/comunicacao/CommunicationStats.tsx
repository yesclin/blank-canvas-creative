import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  Send, 
  CheckCheck, 
  Eye, 
  XCircle,
  TrendingUp,
  MessageCircle,
} from "lucide-react";

interface CommunicationStatsProps {
  stats: {
    total: number;
    sent: number;
    delivered: number;
    read: number;
    failed: number;
    deliveryRate: number;
    readRate: number;
  };
}

export function CommunicationStats({ stats }: CommunicationStatsProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Estatísticas de Comunicação
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <MessageCircle className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
          
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <Send className="h-5 w-5 mx-auto mb-1 text-blue-600" />
            <p className="text-2xl font-bold text-blue-600">{stats.sent}</p>
            <p className="text-xs text-muted-foreground">Enviadas</p>
          </div>
          
          <div className="text-center p-3 bg-cyan-50 rounded-lg">
            <CheckCheck className="h-5 w-5 mx-auto mb-1 text-cyan-600" />
            <p className="text-2xl font-bold text-cyan-600">{stats.delivered}</p>
            <p className="text-xs text-muted-foreground">Entregues</p>
          </div>
          
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <Eye className="h-5 w-5 mx-auto mb-1 text-green-600" />
            <p className="text-2xl font-bold text-green-600">{stats.read}</p>
            <p className="text-xs text-muted-foreground">Lidas</p>
          </div>
          
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <XCircle className="h-5 w-5 mx-auto mb-1 text-red-600" />
            <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
            <p className="text-xs text-muted-foreground">Erros</p>
          </div>
        </div>
        
        <div className="mt-6 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Taxa de Entrega</span>
              <span className="text-sm font-bold text-cyan-600">{stats.deliveryRate}%</span>
            </div>
            <Progress value={stats.deliveryRate} className="h-2" />
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Taxa de Leitura</span>
              <span className="text-sm font-bold text-green-600">{stats.readRate}%</span>
            </div>
            <Progress value={stats.readRate} className="h-2" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
