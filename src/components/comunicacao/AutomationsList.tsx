import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Plus, 
  Settings2,
  CalendarPlus,
  Bell,
  CheckCircle,
  RotateCcw,
  Clock,
  Package,
  AlertTriangle,
  XCircle,
  UserX,
  Cake,
  UserMinus,
} from "lucide-react";
import { 
  TRIGGER_TYPE_LABELS,
  type AutomationRule,
  type TriggerType,
} from "@/types/comunicacao";

interface AutomationsListProps {
  automations: AutomationRule[];
  onToggle: (id: string) => void;
}

const TRIGGER_ICONS: Record<TriggerType, React.ElementType> = {
  appointment_created: CalendarPlus,
  appointment_reminder: Bell,
  appointment_finished: CheckCircle,
  return_reminder: RotateCcw,
  return_expiring: Clock,
  package_80_percent: Package,
  package_expiring: AlertTriangle,
  package_expired: XCircle,
  patient_missed: UserX,
  patient_birthday: Cake,
  patient_inactive: UserMinus,
};

export function AutomationsList({ automations, onToggle }: AutomationsListProps) {
  const activeCount = automations.filter((a) => a.is_active).length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Automações</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {activeCount} de {automations.length} ativas
            </p>
          </div>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Nova Automação
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <div className="space-y-3">
            {automations.map((automation) => {
              const Icon = TRIGGER_ICONS[automation.trigger_type];
              
              return (
                <div
                  key={automation.id}
                  className={`
                    p-4 border rounded-lg transition-all
                    ${automation.is_active ? 'bg-background' : 'bg-muted/30 opacity-75'}
                  `}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className={`
                        p-2 rounded-lg
                        ${automation.is_active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}
                      `}>
                        <Icon className="h-5 w-5" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm">{automation.name}</h4>
                        {automation.description && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {automation.description}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {TRIGGER_TYPE_LABELS[automation.trigger_type]}
                          </Badge>
                          
                          {automation.trigger_config.hours_before && (
                            <Badge variant="secondary" className="text-xs">
                              {automation.trigger_config.hours_before}h antes
                            </Badge>
                          )}
                          
                          {automation.trigger_config.days_after && (
                            <Badge variant="secondary" className="text-xs">
                              {automation.trigger_config.days_after} dias depois
                            </Badge>
                          )}
                          
                          {automation.template && (
                            <Badge variant="secondary" className="text-xs">
                              📝 {automation.template.name}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Settings2 className="h-4 w-4" />
                      </Button>
                      <Switch
                        checked={automation.is_active}
                        onCheckedChange={() => onToggle(automation.id)}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
