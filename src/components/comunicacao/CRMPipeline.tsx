import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CRM_STATUS_LABELS, 
  CRM_STATUS_COLORS,
  type CRMStatus 
} from "@/types/comunicacao";
import { Users, UserPlus, Stethoscope, Activity, Heart, UserMinus, CheckCircle } from "lucide-react";

interface CRMPipelineProps {
  stats: Record<CRMStatus, number>;
  onStatusClick?: (status: CRMStatus) => void;
  selectedStatus?: CRMStatus | null;
}

const STATUS_ICONS: Record<CRMStatus, React.ElementType> = {
  novo_contato: UserPlus,
  primeira_consulta_agendada: Users,
  em_atendimento: Stethoscope,
  tratamento_em_andamento: Activity,
  em_acompanhamento: Heart,
  inativo: UserMinus,
  alta_finalizado: CheckCircle,
};

export function CRMPipeline({ stats, onStatusClick, selectedStatus }: CRMPipelineProps) {
  const statusOrder: CRMStatus[] = [
    'novo_contato',
    'primeira_consulta_agendada',
    'em_atendimento',
    'tratamento_em_andamento',
    'em_acompanhamento',
    'inativo',
    'alta_finalizado',
  ];

  const total = Object.values(stats).reduce((a, b) => a + b, 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <span>Pipeline CRM</span>
          <Badge variant="secondary">{total} pacientes</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2">
          {statusOrder.map((status) => {
            const Icon = STATUS_ICONS[status];
            const count = stats[status] || 0;
            const isSelected = selectedStatus === status;
            
            return (
              <button
                key={status}
                onClick={() => onStatusClick?.(status)}
                className={`
                  p-3 rounded-lg border transition-all text-left
                  ${CRM_STATUS_COLORS[status]}
                  ${isSelected ? 'ring-2 ring-primary ring-offset-2' : ''}
                  hover:shadow-md
                `}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="h-4 w-4" />
                  <span className="text-lg font-bold">{count}</span>
                </div>
                <p className="text-xs font-medium line-clamp-2">
                  {CRM_STATUS_LABELS[status]}
                </p>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
