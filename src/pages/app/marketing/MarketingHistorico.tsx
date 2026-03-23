import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  Search, MessageCircle, Mail, Smartphone,
  CheckCheck, Check, Clock, XCircle, AlertCircle, Loader2,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useMessageHistory, type MessageQueueRow } from "@/hooks/useMessageHistory";

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendente',
  sent: 'Enviada',
  delivered: 'Entregue',
  read: 'Lida',
  failed: 'Erro',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-800',
  sent: 'bg-blue-100 text-blue-800',
  delivered: 'bg-cyan-100 text-cyan-800',
  read: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
};

export default function MarketingHistorico() {
  const { messages, loading } = useMessageHistory();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [channelFilter, setChannelFilter] = useState("all");

  const filteredMessages = messages.filter((m) => {
    const matchesSearch =
      (m.patient?.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.message_body.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.phone.includes(searchTerm);
    const matchesStatus = statusFilter === "all" || m.status === statusFilter;
    const matchesChannel = channelFilter === "all" || m.channel === channelFilter;
    return matchesSearch && matchesStatus && matchesChannel;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'sent': return <Check className="h-4 w-4" />;
      case 'delivered': return <CheckCheck className="h-4 w-4" />;
      case 'read': return <CheckCheck className="h-4 w-4 text-blue-500" />;
      case 'failed': return <XCircle className="h-4 w-4" />;
      default: return null;
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'whatsapp': return <MessageCircle className="h-4 w-4 text-green-600" />;
      case 'email': return <Mail className="h-4 w-4 text-blue-600" />;
      case 'sms': return <Smartphone className="h-4 w-4 text-purple-600" />;
      default: return <MessageCircle className="h-4 w-4" />;
    }
  };

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Histórico de Mensagens</CardTitle>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por paciente, telefone ou mensagem..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Status</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="sent">Enviada</SelectItem>
              <SelectItem value="delivered">Entregue</SelectItem>
              <SelectItem value="read">Lida</SelectItem>
              <SelectItem value="failed">Erro</SelectItem>
            </SelectContent>
          </Select>
          <Select value={channelFilter} onValueChange={setChannelFilter}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Canal" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Canais</SelectItem>
              <SelectItem value="whatsapp">WhatsApp</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="sms">SMS</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px]">
          <div className="space-y-3">
            {filteredMessages.map((msg) => (
              <div key={msg.id} className={`p-4 border rounded-lg transition-colors ${msg.status === 'failed' ? 'border-destructive/50 bg-destructive/5' : ''}`}>
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                      {msg.patient ? getInitials(msg.patient.full_name) : '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-sm">{msg.patient?.full_name || msg.phone}</h4>
                        {getChannelIcon(msg.channel)}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {format(parseISO(msg.created_at), "dd/MM HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className={`text-xs flex items-center gap-1 ${STATUS_COLORS[msg.status] || ''}`}>
                        {getStatusIcon(msg.status)}
                        {STATUS_LABELS[msg.status] || msg.status}
                      </Badge>
                      {msg.scheduled_for && msg.status === 'pending' && (
                        <Badge variant="secondary" className="text-xs">
                          Agendada: {format(parseISO(msg.scheduled_for), "dd/MM HH:mm", { locale: ptBR })}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2 whitespace-pre-wrap">
                      {msg.rendered_message || msg.message_body}
                    </p>
                    {msg.status === 'failed' && msg.error_message && (
                      <div className="mt-2 p-2 bg-destructive/10 rounded text-xs text-destructive flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        {msg.error_message}
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
