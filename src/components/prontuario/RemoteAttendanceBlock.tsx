import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Video, CheckCircle2, XCircle, Wifi, Clock, AlertTriangle, FileText } from "lucide-react";

interface RemoteAttendanceBlockProps {
  appointment: {
    id: string;
    care_mode: string;
    precheck_status: string;
    consent_telehealth_accepted: boolean;
    consent_telehealth_accepted_at?: string;
    technical_issue_count: number;
    teleconsultation_notes?: string;
    meeting_status: string;
    meeting_started_at?: string;
    meeting_ended_at?: string;
  };
}

export function RemoteAttendanceBlock({ appointment }: RemoteAttendanceBlockProps) {
  if (appointment.care_mode !== 'teleconsulta') return null;

  const formatTimestamp = (ts?: string) => {
    if (!ts) return '—';
    return new Date(ts).toLocaleString('pt-BR', { 
      dateStyle: 'short', 
      timeStyle: 'short' 
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Video className="h-4 w-4" />
          Atendimento Remoto
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Pre-check status */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">Pré-Consulta</p>
          <div className="flex items-center gap-2">
            {appointment.precheck_status === 'concluido' ? (
              <Badge variant="secondary" className="gap-1">
                <CheckCircle2 className="h-3 w-3 text-green-600" />
                Pré-check concluído
              </Badge>
            ) : appointment.precheck_status === 'falhou' ? (
              <Badge variant="destructive" className="gap-1">
                <XCircle className="h-3 w-3" />
                Pré-check com falha
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1">
                <Clock className="h-3 w-3" />
                Pré-check pendente
              </Badge>
            )}
          </div>
        </div>

        <Separator />

        {/* Consent */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">Consentimento Teleatendimento</p>
          <div className="flex items-center gap-2">
            {appointment.consent_telehealth_accepted ? (
              <Badge variant="secondary" className="gap-1">
                <CheckCircle2 className="h-3 w-3 text-green-600" />
                Aceito em {formatTimestamp(appointment.consent_telehealth_accepted_at)}
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1">
                <Clock className="h-3 w-3" />
                Pendente
              </Badge>
            )}
          </div>
        </div>

        <Separator />

        {/* Connection quality / technical issues */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">Qualidade da Conexão</p>
          {appointment.technical_issue_count > 0 ? (
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <span className="text-sm">{appointment.technical_issue_count} intercorrência(s) técnica(s)</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Wifi className="h-4 w-4 text-green-600" />
              <span className="text-sm text-muted-foreground">Sem intercorrências registradas</span>
            </div>
          )}
        </div>

        {/* Session timestamps */}
        {(appointment.meeting_started_at || appointment.meeting_ended_at) && (
          <>
            <Separator />
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Sessão</p>
              <div className="space-y-1 text-sm">
                {appointment.meeting_started_at && (
                  <p className="text-muted-foreground">Iniciada: {formatTimestamp(appointment.meeting_started_at)}</p>
                )}
                {appointment.meeting_ended_at && (
                  <p className="text-muted-foreground">Encerrada: {formatTimestamp(appointment.meeting_ended_at)}</p>
                )}
              </div>
            </div>
          </>
        )}

        {/* Notes */}
        {appointment.teleconsultation_notes && (
          <>
            <Separator />
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Observações de Teletriagem</p>
              <p className="text-sm whitespace-pre-wrap">{appointment.teleconsultation_notes}</p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
