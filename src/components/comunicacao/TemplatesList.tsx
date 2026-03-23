import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  Plus, 
  Search, 
  Edit2, 
  Copy,
  MessageCircle,
  Mail,
  Smartphone,
  Eye,
} from "lucide-react";
import { 
  TEMPLATE_CATEGORY_LABELS, 
  CHANNEL_LABELS,
  DYNAMIC_FIELDS,
  type MessageTemplate,
  type TemplateCategory,
} from "@/types/comunicacao";

interface TemplatesListProps {
  templates: MessageTemplate[];
}

export function TemplatesList({ templates }: TemplatesListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const filteredTemplates = templates.filter((template) =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    TEMPLATE_CATEGORY_LABELS[template.category].toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'whatsapp':
        return <MessageCircle className="h-4 w-4" />;
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'sms':
        return <Smartphone className="h-4 w-4" />;
      default:
        return <MessageCircle className="h-4 w-4" />;
    }
  };

  const handlePreview = (template: MessageTemplate) => {
    setSelectedTemplate(template);
    setPreviewOpen(true);
  };

  // Preview com campos preenchidos
  const getPreviewContent = (content: string) => {
    return content
      .replace('{{nome_paciente}}', 'Maria Silva')
      .replace('{{primeiro_nome}}', 'Maria')
      .replace('{{data_consulta}}', '25/01/2024')
      .replace('{{hora_consulta}}', '14:00')
      .replace('{{profissional}}', 'Dr. João Oliveira')
      .replace('{{endereco_clinica}}', 'Av. Paulista, 1000 - São Paulo')
      .replace('{{link_agenda}}', 'https://clinica.com/agendar')
      .replace('{{nome_clinica}}', 'Clínica Exemplo');
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Templates de Mensagens</CardTitle>
            <Button size="sm">
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
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-sm">{template.name}</h4>
                        {template.is_system && (
                          <Badge variant="secondary" className="text-xs">Sistema</Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {TEMPLATE_CATEGORY_LABELS[template.category]}
                        </Badge>
                        <Badge variant="outline" className="text-xs flex items-center gap-1">
                          {getChannelIcon(template.channel)}
                          {CHANNEL_LABELS[template.channel]}
                        </Badge>
                      </div>
                      
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                        {template.content.substring(0, 100)}...
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => handlePreview(template)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {!template.is_system && (
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

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
                <Badge variant="outline">
                  {TEMPLATE_CATEGORY_LABELS[selectedTemplate.category]}
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  {getChannelIcon(selectedTemplate.channel)}
                  {CHANNEL_LABELS[selectedTemplate.channel]}
                </Badge>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <p className="text-sm whitespace-pre-wrap">
                  {getPreviewContent(selectedTemplate.content)}
                </p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2">Campos dinâmicos utilizados:</h4>
                <div className="flex flex-wrap gap-1">
                  {DYNAMIC_FIELDS.filter(field => 
                    selectedTemplate.content.includes(field.key)
                  ).map((field) => (
                    <Badge key={field.key} variant="secondary" className="text-xs">
                      {field.label}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
