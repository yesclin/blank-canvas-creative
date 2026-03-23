import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Search, 
  MoreVertical, 
  MessageCircle, 
  Calendar, 
  FileText,
  Phone,
  Mail,
  Tag,
  AlertCircle,
} from "lucide-react";
import { 
  CRM_STATUS_LABELS, 
  CRM_STATUS_COLORS,
  CHANNEL_LABELS,
  type CRMPatient,
  type CRMStatus,
} from "@/types/comunicacao";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CRMPatientListProps {
  patients: CRMPatient[];
  selectedStatus?: CRMStatus | null;
  onPatientClick?: (patient: CRMPatient) => void;
}

export function CRMPatientList({ patients, selectedStatus, onPatientClick }: CRMPatientListProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredPatients = patients.filter((patient) => {
    const matchesSearch = patient.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.phone?.includes(searchTerm) ||
      patient.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !selectedStatus || patient.crm_status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <span>Pacientes no CRM</span>
          <Badge variant="outline">{filteredPatients.length}</Badge>
        </CardTitle>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar paciente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          <div className="divide-y">
            {filteredPatients.map((patient) => (
              <div
                key={patient.id}
                className="p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => onPatientClick?.(patient)}
              >
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                      {getInitials(patient.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-medium text-sm truncate">{patient.full_name}</h4>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <MessageCircle className="h-4 w-4 mr-2" />
                            Enviar Mensagem
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Calendar className="h-4 w-4 mr-2" />
                            Agendar Consulta
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <FileText className="h-4 w-4 mr-2" />
                            Abrir Prontuário
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      {patient.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {patient.phone}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${CRM_STATUS_COLORS[patient.crm_status]}`}
                      >
                        {CRM_STATUS_LABELS[patient.crm_status]}
                      </Badge>
                      
                      {patient.opt_out_messages && (
                        <Badge variant="destructive" className="text-xs">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Opt-out
                        </Badge>
                      )}
                      
                      {patient.tags.slice(0, 2).map((tag) => (
                        <Badge 
                          key={tag.id} 
                          variant="secondary" 
                          className="text-xs"
                          style={{ backgroundColor: tag.color + '20', color: tag.color, borderColor: tag.color }}
                        >
                          {tag.name}
                        </Badge>
                      ))}
                      {patient.tags.length > 2 && (
                        <Badge variant="secondary" className="text-xs">
                          +{patient.tags.length - 2}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                      <span>{patient.total_appointments} consultas</span>
                      {patient.missed_appointments > 0 && (
                        <span className="text-destructive">{patient.missed_appointments} faltas</span>
                      )}
                      {patient.last_message_at && (
                        <span>
                          Msg: {formatDistanceToNow(parseISO(patient.last_message_at), { addSuffix: true, locale: ptBR })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {filteredPatients.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Nenhum paciente encontrado</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
