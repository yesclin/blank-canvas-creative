import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { PenTool, Upload, Trash2, Loader2, CheckCircle2, Info, RefreshCw } from 'lucide-react';
import { useProfessionalSignature } from '@/hooks/useProfessionalSignature';

export function ProfessionalSignatureManager() {
  const {
    signature, loading, uploading, uploadSignature, removeSignature, getSignedUrl,
  } = useProfessionalSignature();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingPreview, setPendingPreview] = useState<string | null>(null);

  // Load signed URL for existing signature
  useEffect(() => {
    if (signature?.signature_file_url) {
      getSignedUrl(signature.signature_file_url).then(url => {
        if (url) setPreviewUrl(url);
      });
    } else {
      setPreviewUrl(null);
    }
  }, [signature, getSignedUrl]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview
    const reader = new FileReader();
    reader.onload = () => {
      setPendingPreview(reader.result as string);
      setPendingFile(file);
    };
    reader.readAsDataURL(file);
  };

  const handleConfirmUpload = async () => {
    if (!pendingFile) return;
    const ok = await uploadSignature(pendingFile);
    if (ok) {
      setPendingFile(null);
      setPendingPreview(null);
    }
  };

  const handleCancelPending = () => {
    setPendingFile(null);
    setPendingPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemove = async () => {
    await removeSignature();
    setPreviewUrl(null);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PenTool className="h-5 w-5" />
          Minha Assinatura Digital
        </CardTitle>
        <CardDescription>
          Cadastre sua assinatura para uso nos documentos clínicos. Prefira imagens PNG com fundo transparente.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current signature */}
        {signature && previewUrl && !pendingPreview && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-green-600">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Ativa
              </Badge>
              <span className="text-xs text-muted-foreground">
                Salva em {new Date(signature.created_at).toLocaleDateString('pt-BR')}
              </span>
            </div>
            <div className="rounded-lg border bg-white p-4 flex items-center justify-center min-h-[120px]">
              <img
                src={previewUrl}
                alt="Assinatura do profissional"
                className="max-h-[100px] max-w-full object-contain"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Substituir
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={handleRemove}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Remover
              </Button>
            </div>
          </div>
        )}

        {/* Pending upload preview */}
        {pendingPreview && (
          <div className="space-y-3">
            <p className="text-sm font-medium">Preview da nova assinatura:</p>
            <div className="rounded-lg border bg-white p-4 flex items-center justify-center min-h-[120px]">
              <img
                src={pendingPreview}
                alt="Preview da assinatura"
                className="max-h-[100px] max-w-full object-contain"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleConfirmUpload} disabled={uploading} size="sm">
                {uploading ? (
                  <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Salvando...</>
                ) : (
                  <><CheckCircle2 className="h-4 w-4 mr-1" /> Confirmar e Salvar</>
                )}
              </Button>
              <Button variant="outline" size="sm" onClick={handleCancelPending} disabled={uploading}>
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {/* Upload button (no signature yet) */}
        {!signature && !pendingPreview && (
          <div className="space-y-3">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Você ainda não possui uma assinatura cadastrada. Envie uma imagem da sua assinatura para usá-la nos documentos.
              </AlertDescription>
            </Alert>
            <Button onClick={() => fileInputRef.current?.click()} variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Enviar Assinatura
            </Button>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={handleFileSelect}
        />

        <Separator />
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Formatos aceitos: PNG (recomendado com fundo transparente), JPEG, WebP</p>
          <p>• Tamanho máximo: 2MB</p>
          <p>• A assinatura será usada nos documentos assinados e nos PDFs gerados</p>
        </div>
      </CardContent>
    </Card>
  );
}
