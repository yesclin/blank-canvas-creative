import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Video, ExternalLink, PhoneOff, Clock, Wifi } from "lucide-react";
import { cn } from "@/lib/utils";
import { meetingStatusLabels } from "@/types/agenda";
import type { MeetingStatus } from "@/types/agenda";
import { useTeleconsultaSession, useTeleconsultaActions } from "@/hooks/useTeleconsulta";

interface TeleconsultaContextBarProps {
  appointmentId: string;
  meetingLink?: string;
  meetingStatus: MeetingStatus;
}

export function TeleconsultaContextBar({ 
  appointmentId, 
  meetingLink, 
  meetingStatus 
}: TeleconsultaContextBarProps) {
  const { data: session } = useTeleconsultaSession(appointmentId);
  const { startSession, endSession, copyLink } = useTeleconsultaActions();

  const isActive = meetingStatus === 'em_andamento' || meetingStatus === 'profissional_entrou';
  
  return (
    <div className={cn(
      "flex items-center gap-3 px-4 py-2 rounded-lg border",
      isActive 
        ? "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800"
        : "bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800"
    )}>
      <Video className={cn("h-4 w-4 shrink-0", isActive ? "text-green-600" : "text-blue-600")} />
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Teleconsulta</span>
          <Badge variant="outline" className="text-xs">
            {meetingStatusLabels[meetingStatus] || meetingStatus}
          </Badge>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {meetingLink && (
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={() => window.open(meetingLink, '_blank')}
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Entrar na Sala
          </Button>
        )}
        
        {session && session.status !== 'encerrada' && session.status === 'criada' && (
          <Button
            size="sm"
            className="gap-1"
            onClick={() => startSession.mutate({ appointmentId, sessionId: session.id })}
            disabled={startSession.isPending}
          >
            <Video className="h-3.5 w-3.5" />
            Iniciar
          </Button>
        )}
        
        {session && session.status === 'em_andamento' && (
          <Button
            variant="destructive"
            size="sm"
            className="gap-1"
            onClick={() => endSession.mutate({ appointmentId, sessionId: session.id })}
            disabled={endSession.isPending}
          >
            <PhoneOff className="h-3.5 w-3.5" />
            Encerrar
          </Button>
        )}
      </div>
    </div>
  );
}
