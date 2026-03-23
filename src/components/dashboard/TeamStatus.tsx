import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Users, Play, Coffee, Clock } from 'lucide-react';
import type { DashboardProfessional } from '@/types/dashboard';

interface TeamStatusProps {
  professionals: DashboardProfessional[];
}

export function TeamStatus({ professionals }: TeamStatusProps) {
  const getStatusBadge = (status: DashboardProfessional['status']) => {
    switch (status) {
      case 'em_atendimento':
        return (
          <Badge className="bg-purple-100 text-purple-700 border-purple-300">
            <Play className="h-3 w-3 mr-1" />
            Em atendimento
          </Badge>
        );
      case 'disponivel':
        return (
          <Badge className="bg-green-100 text-green-700 border-green-300">
            <Coffee className="h-3 w-3 mr-1" />
            Disponível
          </Badge>
        );
      case 'ausente':
        return (
          <Badge variant="secondary">
            Ausente
          </Badge>
        );
      case 'ocupado':
        return (
          <Badge className="bg-amber-100 text-amber-700 border-amber-300">
            <Clock className="h-3 w-3 mr-1" />
            Ocupado
          </Badge>
        );
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Equipe
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {professionals.map((professional) => (
          <div
            key={professional.id}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <Avatar className="h-10 w-10 border-2" style={{ borderColor: professional.color }}>
              <AvatarFallback 
                className="text-sm font-medium"
                style={{ backgroundColor: `${professional.color}20`, color: professional.color }}
              >
                {getInitials(professional.name)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm truncate">
                  {professional.name}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                {professional.specialty}
              </div>
            </div>

            <div className="flex flex-col items-end gap-1">
              {getStatusBadge(professional.status)}
              <span className="text-xs text-muted-foreground">
                {professional.completedAppointments}/{professional.todayAppointments} atendimentos
              </span>
            </div>
          </div>
        ))}
        
        {professionals.length === 0 && (
          <div className="text-center py-4 text-muted-foreground">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Nenhum profissional ativo</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
