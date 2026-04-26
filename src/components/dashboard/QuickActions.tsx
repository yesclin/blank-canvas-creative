import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  CalendarPlus,
  MessageSquare,
  CreditCard,
  FileText,
  Zap,
  BellRing,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface QuickActionsProps {
  pendingConfirmations?: number;
}

export function QuickActions({ pendingConfirmations = 0 }: QuickActionsProps) {
  const navigate = useNavigate();

  const actions = [
    {
      icon: CalendarPlus,
      label: 'Novo Agendamento',
      onClick: () => navigate('/app/agenda'),
      variant: 'default' as const,
    },
    {
      icon: MessageSquare,
      label: 'Enviar Lembrete',
      onClick: () => navigate('/app/marketing'),
      variant: 'outline' as const,
    },
    {
      icon: CreditCard,
      label: 'Registrar Pagamento',
      onClick: () => navigate('/app/gestao/financas'),
      variant: 'outline' as const,
    },
    {
      icon: FileText,
      label: 'Abrir Prontuário',
      onClick: () => navigate('/app/prontuario'),
      variant: 'outline' as const,
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          Ações Rápidas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {pendingConfirmations > 0 && (
          <Button
            variant="default"
            className="w-full justify-between bg-amber-500 hover:bg-amber-600 text-white"
            onClick={() => navigate('/app/marketing')}
          >
            <span className="flex items-center gap-2">
              <BellRing className="h-4 w-4" />
              Confirmar agendamentos pendentes
            </span>
            <Badge variant="secondary" className="bg-white/20 text-white border-0">
              {pendingConfirmations}
            </Badge>
          </Button>
        )}

        <div className="grid grid-cols-2 gap-2">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant}
              className="h-auto py-3 flex-col gap-1"
              onClick={action.onClick}
            >
              <action.icon className="h-5 w-5" />
              <span className="text-xs">{action.label}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
