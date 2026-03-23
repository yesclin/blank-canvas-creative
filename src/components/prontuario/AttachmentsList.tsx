import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Paperclip, 
  Plus, 
  Search,
  FileText,
  Image,
  File,
  Download,
  Eye,
  Trash2,
  Filter
} from "lucide-react";
import { 
  MedicalAttachment, 
  attachmentCategoryLabels, 
  AttachmentCategory 
} from "@/types/prontuario";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AttachmentsListProps {
  attachments: MedicalAttachment[];
  onUpload?: () => void;
  onView?: (attachment: MedicalAttachment) => void;
  onDelete?: (attachmentId: string) => void;
}

export function AttachmentsList({ attachments, onUpload, onView, onDelete }: AttachmentsListProps) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const filteredAttachments = attachments.filter(attachment => {
    const matchesSearch = attachment.file_name.toLowerCase().includes(search.toLowerCase()) ||
      attachment.description?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || attachment.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <Image className="h-8 w-8 text-blue-500" />;
    if (fileType.includes('pdf')) return <FileText className="h-8 w-8 text-red-500" />;
    return <File className="h-8 w-8 text-muted-foreground" />;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Group attachments by category
  const groupedAttachments = filteredAttachments.reduce((acc, attachment) => {
    if (!acc[attachment.category]) {
      acc[attachment.category] = [];
    }
    acc[attachment.category].push(attachment);
    return acc;
  }, {} as Record<string, MedicalAttachment[]>);

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Paperclip className="h-5 w-5" />
            Anexos e Documentos
            <Badge variant="secondary">{attachments.length}</Badge>
          </CardTitle>
          <Button size="sm" onClick={onUpload}>
            <Plus className="h-4 w-4 mr-1" />
            Anexar
          </Button>
        </div>

        <div className="flex gap-2 mt-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar anexos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {Object.entries(attachmentCategoryLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        <ScrollArea className="h-[400px]">
          {filteredAttachments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Paperclip className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Nenhum anexo encontrado</p>
              <Button variant="link" onClick={onUpload} className="mt-2">
                Adicionar primeiro anexo
              </Button>
            </div>
          ) : categoryFilter === 'all' ? (
            // Grouped view
            <div className="space-y-6">
              {Object.entries(groupedAttachments).map(([category, items]) => (
                <div key={category}>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                    {attachmentCategoryLabels[category as AttachmentCategory]}
                    <Badge variant="secondary" className="text-xs">{items.length}</Badge>
                  </h4>
                  <div className="space-y-2">
                    {items.map(attachment => (
                      <AttachmentItem 
                        key={attachment.id} 
                        attachment={attachment}
                        onView={onView}
                        onDelete={onDelete}
                        getFileIcon={getFileIcon}
                        formatFileSize={formatFileSize}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Flat view
            <div className="space-y-2">
              {filteredAttachments.map(attachment => (
                <AttachmentItem 
                  key={attachment.id} 
                  attachment={attachment}
                  onView={onView}
                  onDelete={onDelete}
                  getFileIcon={getFileIcon}
                  formatFileSize={formatFileSize}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

interface AttachmentItemProps {
  attachment: MedicalAttachment;
  onView?: (attachment: MedicalAttachment) => void;
  onDelete?: (attachmentId: string) => void;
  getFileIcon: (fileType: string) => React.ReactNode;
  formatFileSize: (bytes?: number) => string;
}

function AttachmentItem({ attachment, onView, onDelete, getFileIcon, formatFileSize }: AttachmentItemProps) {
  return (
    <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors group">
      {getFileIcon(attachment.file_type)}
      
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{attachment.file_name}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{format(parseISO(attachment.created_at), "dd/MM/yyyy", { locale: ptBR })}</span>
          {attachment.file_size && (
            <>
              <span>•</span>
              <span>{formatFileSize(attachment.file_size)}</span>
            </>
          )}
          {attachment.is_before_after && (
            <>
              <span>•</span>
              <Badge variant="outline" className="text-xs py-0">
                {attachment.before_after_type === 'before' ? 'Antes' : 'Depois'}
              </Badge>
            </>
          )}
        </div>
        {attachment.description && (
          <p className="text-xs text-muted-foreground truncate mt-1">
            {attachment.description}
          </p>
        )}
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="sm" onClick={() => onView?.(attachment)}>
          <Eye className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm">
          <Download className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-destructive hover:text-destructive"
          onClick={() => onDelete?.(attachment.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
