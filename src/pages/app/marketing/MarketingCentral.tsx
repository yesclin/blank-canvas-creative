import { useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search, Send, Copy, CheckCheck, XCircle,
  MessageCircle, Eye, Loader2, ExternalLink, AlertCircle,
} from "lucide-react";
import { useCRMPatients } from "@/hooks/useComunicacaoRealData";
import { useMessageTemplates } from "@/hooks/useMessageTemplates";
import { useMessageQueue } from "@/hooks/useMessageQueue";
import { useClinicData } from "@/hooks/useClinicData";
import { TEMPLATE_CATEGORY_LABELS, DYNAMIC_FIELDS, type MessageTemplate } from "@/types/comunicacao";
import { toast } from "sonner";

export default function MarketingCentral() {
  const { data: patients, isLoading: loadingPatients } = useCRMPatients();
  const { templates, loading: loadingTemplates } = useMessageTemplates();
  const { createMessage, createBatch, markAsSent, markAsFailed, markBatchAsSent, messages, loading: loadingQueue, saving } = useMessageQueue();
  const { clinic } = useClinicData();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewPatientId, setPreviewPatientId] = useState<string | null>(null);
  const [failDialogOpen, setFailDialogOpen] = useState(false);
  const [failMessageId, setFailMessageId] = useState<string | null>(null);
  const [failReason, setFailReason] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const activeTemplates = useMemo(() => templates.filter((t) => t.is_active), [templates]);

  const selectedTemplate = useMemo(
    () => activeTemplates.find((t) => t.id === selectedTemplateId) || null,
    [activeTemplates, selectedTemplateId]
  );

  const filteredPatients = useMemo(() => {
    if (!patients) return [];
    return patients.filter((p) => {
      const matchesSearch =
        p.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.phone?.includes(searchTerm) ||
        p.email?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  }, [patients, searchTerm]);

  // Pending messages from queue
  const pendingMessages = useMemo(
    () => messages.filter((m) => statusFilter === 'all' || m.status === statusFilter),
    [messages, statusFilter]
  );

  const renderTemplate = useCallback((content: string, patient: { full_name: string; phone?: string }) => {
    return content
      .replace(/\{\{nome_paciente\}\}/g, patient.full_name)
      .replace(/\{\{primeiro_nome\}\}/g, patient.full_name.split(' ')[0])
      .replace(/\{\{nome_clinica\}\}/g, clinic?.name || '')
      .replace(/\{\{telefone_clinica\}\}/g, clinic?.phone || '')
      .replace(/\{\{data_consulta\}\}/g, '')
      .replace(/\{\{hora_consulta\}\}/g, '')
      .replace(/\{\{profissional\}\}/g, '')
      .replace(/\{\{especialidade\}\}/g, '')
      .replace(/\{\{endereco_clinica\}\}/g, '');
  }, [clinic]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === filteredPatients.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredPatients.map((p) => p.id)));
    }
  };

  const handleGenerateMessages = async () => {
    if (!selectedTemplate) {
      toast.error("Selecione um template");
      return;
    }
    if (selectedIds.size === 0) {
      toast.error("Selecione pelo menos um paciente");
      return;
    }

    const selectedPatients = filteredPatients.filter((p) => selectedIds.has(p.id));
    const msgs = selectedPatients
      .filter((p) => p.phone)
      .map((p) => ({
        patient_id: p.id,
        phone: p.phone!,
        message_body: selectedTemplate.content,
        rendered_message: renderTemplate(selectedTemplate.content, p),
        template_id: selectedTemplate.id,
        channel: selectedTemplate.channel || 'whatsapp',
      }));

    if (msgs.length === 0) {
      toast.error("Nenhum paciente selecionado possui telefone");
      return;
    }

    await createBatch(msgs);
    setSelectedIds(new Set());
  };

  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success("Mensagem copiada");
  };

  const handleOpenWhatsApp = (phone: string, message: string) => {
    const cleaned = phone.replace(/\D/g, '');
    const url = `https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleMarkFailed = async () => {
    if (!failMessageId || !failReason.trim()) return;
    await markAsFailed(failMessageId, failReason);
    setFailDialogOpen(false);
    setFailMessageId(null);
    setFailReason("");
  };

  if (loadingPatients || loadingTemplates) {
    return <Skeleton className="h-96 w-full" />;
  }

  return (
    <div className="space-y-6">
      {/* Top: Select template + generate */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Central de Mensagens</CardTitle>
          <p className="text-sm text-muted-foreground">
            Selecione pacientes, escolha um template e gere mensagens para envio manual.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Selecione um template..." />
              </SelectTrigger>
              <SelectContent>
                {activeTemplates.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name} — {TEMPLATE_CATEGORY_LABELS[t.category] || t.category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedTemplate && (
              <Button variant="outline" size="sm" onClick={() => { setPreviewPatientId(null); setPreviewOpen(true); }}>
                <Eye className="h-4 w-4 mr-1" /> Preview
              </Button>
            )}
          </div>

          {/* Patient selection */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar pacientes..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
            </div>
            <Badge variant="secondary">{selectedIds.size} selecionado(s)</Badge>
          </div>

          <ScrollArea className="h-[250px] border rounded-lg">
            <div className="divide-y">
              <div className="p-2 flex items-center gap-2 bg-muted/50 sticky top-0 z-10">
                <Checkbox
                  checked={filteredPatients.length > 0 && selectedIds.size === filteredPatients.length}
                  onCheckedChange={toggleAll}
                />
                <span className="text-xs font-medium text-muted-foreground">Selecionar todos ({filteredPatients.length})</span>
              </div>
              {filteredPatients.map((p) => (
                <div key={p.id} className="p-2 flex items-center gap-3 hover:bg-muted/30 transition-colors">
                  <Checkbox
                    checked={selectedIds.has(p.id)}
                    onCheckedChange={() => toggleSelect(p.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.full_name}</p>
                    <p className="text-xs text-muted-foreground">{p.phone || 'Sem telefone'}</p>
                  </div>
                </div>
              ))}
              {filteredPatients.length === 0 && (
                <p className="p-4 text-center text-sm text-muted-foreground">Nenhum paciente encontrado</p>
              )}
            </div>
          </ScrollArea>

          <Button onClick={handleGenerateMessages} disabled={saving || selectedIds.size === 0 || !selectedTemplate} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Gerar {selectedIds.size} Mensagem(ns)
          </Button>
        </CardContent>
      </Card>

      {/* Message Queue */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Fila de Mensagens</CardTitle>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="sent">Enviadas</SelectItem>
                <SelectItem value="failed">Com Falha</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loadingQueue ? (
            <Skeleton className="h-48 w-full" />
          ) : pendingMessages.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhuma mensagem na fila</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {pendingMessages.map((msg) => (
                  <div key={msg.id} className={`p-3 border rounded-lg text-sm ${msg.status === 'failed' ? 'border-destructive/30 bg-destructive/5' : ''}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">{msg.patient?.full_name || msg.phone}</p>
                          <Badge variant="outline" className="text-xs">
                            {msg.status === 'pending' ? 'Pendente' : msg.status === 'sent' ? 'Enviada' : msg.status === 'failed' ? 'Falha' : msg.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{msg.rendered_message || msg.message_body}</p>
                        {msg.error_message && (
                          <div className="flex items-center gap-1 mt-1 text-xs text-destructive">
                            <AlertCircle className="h-3 w-3" />
                            {msg.error_message}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button variant="ghost" size="icon" className="h-7 w-7" title="Copiar mensagem"
                          onClick={() => handleCopyMessage(msg.rendered_message || msg.message_body)}>
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                        {msg.phone && (
                          <Button variant="ghost" size="icon" className="h-7 w-7" title="Abrir WhatsApp"
                            onClick={() => handleOpenWhatsApp(msg.phone, msg.rendered_message || msg.message_body)}>
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {msg.status === 'pending' && (
                          <>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-green-600" title="Marcar como enviada"
                              onClick={() => markAsSent(msg.id)} disabled={saving}>
                              <CheckCheck className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" title="Registrar falha"
                              onClick={() => { setFailMessageId(msg.id); setFailReason(""); setFailDialogOpen(true); }}>
                              <XCircle className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-green-600" />
              Preview do Template
            </DialogTitle>
          </DialogHeader>
          {selectedTemplate && (
            <div className="space-y-3">
              <Badge variant="outline">{selectedTemplate.name}</Badge>
              <div className="bg-muted/50 border rounded-xl p-4">
                <p className="text-sm whitespace-pre-wrap">
                  {renderTemplate(selectedTemplate.content, { full_name: 'Maria Silva', phone: '11999999999' })}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Variáveis utilizadas:</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {DYNAMIC_FIELDS.filter((f) => selectedTemplate.content.includes(f.key)).map((f) => (
                    <Badge key={f.key} variant="secondary" className="text-xs">{f.label}</Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fail Reason Dialog */}
      <Dialog open={failDialogOpen} onOpenChange={setFailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Motivo da Falha</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="Descreva o motivo da falha..."
            value={failReason}
            onChange={(e) => setFailReason(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setFailDialogOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleMarkFailed} disabled={!failReason.trim() || saving}>
              Registrar Falha
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
