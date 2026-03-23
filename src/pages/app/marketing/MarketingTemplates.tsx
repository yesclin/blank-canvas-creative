import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Plus, Search, Edit2, Copy, Trash2,
  MessageCircle, Mail, Smartphone, Eye, Loader2,
} from "lucide-react";
import { 
  TEMPLATE_CATEGORY_LABELS, 
  CHANNEL_LABELS,
  DYNAMIC_FIELDS,
  type MessageTemplate,
  type TemplateCategory,
  type CommunicationChannel,
} from "@/types/comunicacao";
import { useMessageTemplates, type TemplateFormData } from "@/hooks/useMessageTemplates";

const emptyForm: TemplateFormData = {
  name: '',
  category: 'confirmacao_consulta',
  channel: 'whatsapp',
  subject: '',
  content: '',
  is_active: true,
};

export default function MarketingTemplates() {
  const { templates, loading, saving, createTemplate, updateTemplate, deleteTemplate, duplicateTemplate } = useMessageTemplates();
  const [searchTerm, setSearchTerm] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<TemplateFormData>(emptyForm);

  const filteredTemplates = templates.filter((t) =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    TEMPLATE_CATEGORY_LABELS[t.category]?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'whatsapp': return <MessageCircle className="h-4 w-4" />;
      case 'email': return <Mail className="h-4 w-4" />;
      case 'sms': return <Smartphone className="h-4 w-4" />;
      default: return <MessageCircle className="h-4 w-4" />;
    }
  };

  const getPreviewContent = (content: string) => {
    return content
      .replace(/\{\{nome_paciente\}\}/g, 'Maria Silva')
      .replace(/\{\{primeiro_nome\}\}/g, 'Maria')
      .replace(/\{\{data_consulta\}\}/g, '25/01/2024')
      .replace(/\{\{hora_consulta\}\}/g, '14:00')
      .replace(/\{\{profissional\}\}/g, 'Dr. João Oliveira')
      .replace(/\{\{endereco_clinica\}\}/g, 'Av. Paulista, 1000')
      .replace(/\{\{link_agenda\}\}/g, 'https://clinica.com/agendar')
      .replace(/\{\{nome_clinica\}\}/g, 'Clínica Exemplo');
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const handleOpenEdit = (template: MessageTemplate) => {
    setEditingId(template.id);
    setForm({
      name: template.name,
      category: template.category,
      channel: template.channel,
      subject: template.subject || '',
      content: template.content,
      is_active: template.is_active,
    });
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.content) return;
    if (editingId) {
      await updateTemplate(editingId, form);
    } else {
      await createTemplate(form);
    }
    setFormOpen(false);
  };

  const handleDelete = async () => {
    if (!selectedTemplate) return;
    await deleteTemplate(selectedTemplate.id);
    setDeleteOpen(false);
    setSelectedTemplate(null);
  };

  const insertVariable = (key: string) => {
    setForm(prev => ({ ...prev, content: prev.content + key }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Templates de Mensagens</CardTitle>
            <Button size="sm" onClick={handleOpenCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Template
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <div className="space-y-3">
              {filteredTemplates.map((template) => (
                <div key={template.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-sm">{template.name}</h4>
                        {template.is_system && <Badge variant="secondary" className="text-xs">Sistema</Badge>}
                        {!template.is_active && <Badge variant="outline" className="text-xs text-muted-foreground">Inativo</Badge>}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {TEMPLATE_CATEGORY_LABELS[template.category] || template.category}
                        </Badge>
                        <Badge variant="outline" className="text-xs flex items-center gap-1">
                          {getChannelIcon(template.channel)}
                          {CHANNEL_LABELS[template.channel as CommunicationChannel] || template.channel}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                        {template.content.substring(0, 120)}...
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setSelectedTemplate(template); setPreviewOpen(true); }}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      {!template.is_system && (
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenEdit(template)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => duplicateTemplate(template)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                      {!template.is_system && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => { setSelectedTemplate(template); setDeleteOpen(true); }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {filteredTemplates.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">
                  <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Nenhum template encontrado</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Template' : 'Novo Template'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome</Label>
              <Input value={form.name} onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))} placeholder="Ex: Confirmação de Consulta" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Categoria</Label>
                <Select value={form.category} onValueChange={(v) => setForm(prev => ({ ...prev, category: v as TemplateCategory }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(TEMPLATE_CATEGORY_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Canal</Label>
                <Select value={form.channel} onValueChange={(v) => setForm(prev => ({ ...prev, channel: v as CommunicationChannel }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="email">E-mail</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {form.channel === 'email' && (
              <div>
                <Label>Assunto</Label>
                <Input value={form.subject} onChange={(e) => setForm(prev => ({ ...prev, subject: e.target.value }))} placeholder="Assunto do e-mail" />
              </div>
            )}
            <div>
              <Label>Conteúdo</Label>
              <Textarea value={form.content} onChange={(e) => setForm(prev => ({ ...prev, content: e.target.value }))} placeholder="Escreva a mensagem..." rows={6} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Inserir variável:</Label>
              <div className="flex flex-wrap gap-1 mt-1">
                {DYNAMIC_FIELDS.map((field) => (
                  <Button key={field.key} variant="outline" size="sm" className="text-xs h-7" onClick={() => insertVariable(field.key)}>
                    {field.label}
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm(prev => ({ ...prev, is_active: v }))} />
              <Label>Ativo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving || !form.name || !form.content}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              {editingId ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-green-600" />
              {selectedTemplate?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedTemplate && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Badge variant="outline">{TEMPLATE_CATEGORY_LABELS[selectedTemplate.category] || selectedTemplate.category}</Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  {getChannelIcon(selectedTemplate.channel)}
                  {CHANNEL_LABELS[selectedTemplate.channel as CommunicationChannel] || selectedTemplate.channel}
                </Badge>
              </div>
              <div className="bg-muted/50 border rounded-xl p-4">
                <p className="text-sm whitespace-pre-wrap">{getPreviewContent(selectedTemplate.content)}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-2">Campos dinâmicos utilizados:</h4>
                <div className="flex flex-wrap gap-1">
                  {DYNAMIC_FIELDS.filter(f => selectedTemplate.content.includes(f.key)).map((f) => (
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

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir template?</AlertDialogTitle>
            <AlertDialogDescription>
              O template "{selectedTemplate?.name}" será excluído permanentemente. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
