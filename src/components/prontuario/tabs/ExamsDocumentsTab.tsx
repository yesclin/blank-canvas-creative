import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  FileText,
  Search,
  Upload,
  Download,
  Eye,
  Trash2,
  File,
  FileImage,
  FileSpreadsheet,
  Filter
} from "lucide-react";
import { 
  MedicalAttachment,
  attachmentCategoryLabels,
  AttachmentCategory
} from "@/types/prontuario";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ExamsDocumentsTabProps {
  attachments: MedicalAttachment[];
  onUpload?: () => void;
  onView?: (attachment: MedicalAttachment) => void;
  onDownload?: (attachment: MedicalAttachment) => void;
  onDelete?: (attachmentId: string) => void;
}

export function ExamsDocumentsTab({ 
  attachments, 
  onUpload, 
  onView, 
  onDownload,
  onDelete 
}: ExamsDocumentsTabProps) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Filter only exams and documents (not images)
  const documentsAndExams = attachments.filter(
    a => a.category !== 'image' && !a.is_before_after
  );

  const filteredAttachments = documentsAndExams.filter(att => {
    const matchesSearch = search === "" || 
      att.file_name.toLowerCase().includes(search.toLowerCase()) ||
      att.description?.toLowerCase().includes(search.toLowerCase());
    
    const matchesCategory = categoryFilter === "all" || att.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return <FileText className="h-5 w-5 text-red-500" />;
    if (fileType.includes('image')) return <FileImage className="h-5 w-5 text-blue-500" />;
    if (fileType.includes('spreadsheet') || fileType.includes('excel')) 
      return <FileSpreadsheet className="h-5 w-5 text-green-500" />;
    return <File className="h-5 w-5 text-gray-500" />;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  // Group by category
  const groupedByCategory = filteredAttachments.reduce((acc, att) => {
    const category = attachmentCategoryLabels[att.category];
    if (!acc[category]) acc[category] = [];
    acc[category].push(att);
    return acc;
  }, {} as Record<string, MedicalAttachment[]>);

  // Stats
  const examCount = documentsAndExams.filter(a => a.category === 'exam').length;
  const reportCount = documentsAndExams.filter(a => a.category === 'report').length;
  const prescriptionCount = documentsAndExams.filter(a => a.category === 'prescription').length;
  const consentCount = documentsAndExams.filter(a => a.category === 'consent').length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-semibold">Exames e Documentos</h2>
          <Badge variant="secondary">{documentsAndExams.length}</Badge>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar documento..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-48"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {Object.entries(attachmentCategoryLabels)
                .filter(([key]) => key !== 'image')
                .map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
            </SelectContent>
          </Select>
          <Button onClick={onUpload}>
            <Upload className="h-4 w-4 mr-1" />
            Upload
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{examCount}</div>
            <div className="text-xs text-muted-foreground">Exames</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">{reportCount}</div>
            <div className="text-xs text-muted-foreground">Laudos</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{prescriptionCount}</div>
            <div className="text-xs text-muted-foreground">Receituários</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">{consentCount}</div>
            <div className="text-xs text-muted-foreground">Consentimentos</div>
          </CardContent>
        </Card>
      </div>

      {/* Documents List */}
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="h-[450px]">
            {Object.keys(groupedByCategory).length > 0 ? (
              Object.entries(groupedByCategory).map(([category, atts]) => (
                <div key={category}>
                  <div className="sticky top-0 bg-muted/80 backdrop-blur-sm px-4 py-2 border-b">
                    <h3 className="font-medium text-sm">{category}</h3>
                  </div>
                  <div className="divide-y">
                    {atts.map(att => (
                      <div 
                        key={att.id}
                        className="p-4 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                              {getFileIcon(att.file_type)}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{att.file_name}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>
                                  {format(parseISO(att.created_at), "dd/MM/yyyy", { locale: ptBR })}
                                </span>
                                {att.file_size && (
                                  <>
                                    <span>•</span>
                                    <span>{formatFileSize(att.file_size)}</span>
                                  </>
                                )}
                              </div>
                              {att.description && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {att.description}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => onView?.(att)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => onDownload?.(att)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => onDelete?.(att.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Nenhum documento encontrado</p>
                <Button variant="outline" className="mt-3" onClick={onUpload}>
                  <Upload className="h-4 w-4 mr-1" />
                  Fazer Upload
                </Button>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
