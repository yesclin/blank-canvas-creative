import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Image as ImageIcon,
  Search,
  Upload,
  Download,
  Eye,
  Trash2,
  ZoomIn,
  ArrowLeftRight,
  Grid3X3,
  List
} from "lucide-react";
import { MedicalAttachment } from "@/types/prontuario";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ImagesTabProps {
  attachments: MedicalAttachment[];
  onUpload?: () => void;
  onDelete?: (attachmentId: string) => void;
}

export function ImagesTab({ attachments, onUpload, onDelete }: ImagesTabProps) {
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedImage, setSelectedImage] = useState<MedicalAttachment | null>(null);
  const [showBeforeAfter, setShowBeforeAfter] = useState(false);

  // Filter only images
  const images = attachments.filter(
    a => a.category === 'image' || a.file_type.startsWith('image/')
  );

  const filteredImages = images.filter(img => {
    return search === "" || 
      img.file_name.toLowerCase().includes(search.toLowerCase()) ||
      img.description?.toLowerCase().includes(search.toLowerCase());
  });

  // Group before/after images
  const beforeAfterImages = images.filter(img => img.is_before_after);
  const regularImages = filteredImages.filter(img => !img.is_before_after);
  const beforeImages = beforeAfterImages.filter(img => img.before_after_type === 'before');
  const afterImages = beforeAfterImages.filter(img => img.before_after_type === 'after');

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <ImageIcon className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-semibold">Imagens</h2>
          <Badge variant="secondary">{images.length}</Badge>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar imagem..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-48"
            />
          </div>
          <div className="flex items-center border rounded-lg">
            <Button 
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'} 
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button 
              variant={viewMode === 'list' ? 'secondary' : 'ghost'} 
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          <Button onClick={onUpload}>
            <Upload className="h-4 w-4 mr-1" />
            Upload
          </Button>
        </div>
      </div>

      {/* Before/After Section */}
      {beforeAfterImages.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ArrowLeftRight className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Antes e Depois</h3>
                <Badge variant="secondary">{beforeAfterImages.length}</Badge>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowBeforeAfter(true)}
              >
                Ver Comparativo
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {beforeAfterImages.slice(0, 4).map(img => (
                <div 
                  key={img.id}
                  className="relative group cursor-pointer"
                  onClick={() => setSelectedImage(img)}
                >
                  <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                    <img 
                      src={img.file_url} 
                      alt={img.file_name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <Badge 
                    className={`absolute top-2 left-2 ${
                      img.before_after_type === 'before' 
                        ? 'bg-orange-500' 
                        : 'bg-green-500'
                    }`}
                  >
                    {img.before_after_type === 'before' ? 'Antes' : 'Depois'}
                  </Badge>
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <ZoomIn className="h-6 w-6 text-white" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Regular Images */}
      <Card>
        <CardContent className="p-4">
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {regularImages.map(img => (
                <div 
                  key={img.id}
                  className="relative group cursor-pointer"
                  onClick={() => setSelectedImage(img)}
                >
                  <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                    <img 
                      src={img.file_url} 
                      alt={img.file_name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button variant="secondary" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete?.(img.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {img.description || img.file_name}
                  </p>
                </div>
              ))}

              {regularImages.length === 0 && (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  <ImageIcon className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>Nenhuma imagem encontrada</p>
                  <Button variant="outline" className="mt-3" onClick={onUpload}>
                    <Upload className="h-4 w-4 mr-1" />
                    Fazer Upload
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {regularImages.map(img => (
                <div 
                  key={img.id}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    <img 
                      src={img.file_url} 
                      alt={img.file_name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{img.file_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(parseISO(img.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                    {img.description && (
                      <p className="text-xs text-muted-foreground truncate">{img.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedImage(img)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => onDelete?.(img.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Image Preview Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedImage?.description || selectedImage?.file_name}</DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <div className="space-y-4">
              <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                <img 
                  src={selectedImage.file_url} 
                  alt={selectedImage.file_name}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  {format(parseISO(selectedImage.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </span>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
