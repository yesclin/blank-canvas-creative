import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Search, 
  MessageCircle,
  Mail,
  Smartphone,
  CheckCheck,
  Check,
  Clock,
  XCircle,
  AlertCircle,
  Bot,
  Megaphone,
  User,
  Settings,
} from "lucide-react";
import { 
  MESSAGE_STATUS_LABELS,
  MESSAGE_STATUS_COLORS,
  MESSAGE_TYPE_LABELS,
  CHANNEL_LABELS,
  type MessageLog,
  type MessageStatus,
  type MessageType,
} from "@/types/comunicacao";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface MessageHistoryProps {
  messages: MessageLog[];
}

export function MessageHistory({ messages }: MessageHistoryProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const filteredMessages = messages.filter((message) => {
    const matchesSearch = message.patient?.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.content.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || message.status === statusFilter;
    const matchesType = typeFilter === "all" || message.message_type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusIcon = (status: MessageStatus) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'sent':
        return <Check className="h-4 w-4" />;
      case 'delivered':
        return <CheckCheck className="h-4 w-4" />;
      case 'read':
        return <CheckCheck className="h-4 w-4 text-blue-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4" />;
      case 'cancelled':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getTypeIcon = (type: MessageType) => {
    switch (type) {
      case 'automation':
        return <Bot className="h-4 w-4" />;
      case 'campaign':
        return <Megaphone className="h-4 w-4" />;
      case 'manual':
        return <User className="h-4 w-4" />;
      case 'system':
        return <Settings className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'whatsapp':
        return <MessageCircle className="h-4 w-4 text-green-600" />;
      case 'email':
        return <Mail className="h-4 w-4 text-blue-600" />;
      case 'sms':
        return <Smartphone className="h-4 w-4 text-purple-600" />;
      default:
        return <MessageCircle className="h-4 w-4" />;
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Histórico de Mensagens</CardTitle>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar mensagens..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Status</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="sent">Enviada</SelectItem>
              <SelectItem value="delivered">Entregue</SelectItem>
              <SelectItem value="read">Lida</SelectItem>
              <SelectItem value="failed">Erro</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Tipos</SelectItem>
              <SelectItem value="automation">Automação</SelectItem>
              <SelectItem value="campaign">Campanha</SelectItem>
              <SelectItem value="manual">Manual</SelectItem>
              <SelectItem value="system">Sistema</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px]">
          <div className="space-y-3">
            {filteredMessages.map((message) => (
              <div
                key={message.id}
                className={`
                  p-4 border rounded-lg transition-colors
                  ${message.status === 'failed' ? 'border-destructive/50 bg-destructive/5' : ''}
                `}
              >
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                      {message.patient ? getInitials(message.patient.full_name) : '?'}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-sm">
                          {message.patient?.full_name || 'Paciente Desconhecido'}
                        </h4>
                        {getChannelIcon(message.channel)}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {format(parseISO(message.created_at), "dd/MM HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-1">
                      <Badge 
                        variant="outline" 
                        className={`text-xs flex items-center gap-1 ${MESSAGE_STATUS_COLORS[message.status]}`}
                      >
                        {getStatusIcon(message.status)}
                        {MESSAGE_STATUS_LABELS[message.status]}
                      </Badge>
                      
                      <Badge variant="secondary" className="text-xs flex items-center gap-1">
                        {getTypeIcon(message.message_type)}
                        {MESSAGE_TYPE_LABELS[message.message_type]}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2 whitespace-pre-wrap">
                      {message.content}
                    </p>
                    
                    {message.status === 'failed' && message.error_message && (
                      <div className="mt-2 p-2 bg-destructive/10 rounded text-xs text-destructive flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        {message.error_message}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {filteredMessages.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Nenhuma mensagem encontrada</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
