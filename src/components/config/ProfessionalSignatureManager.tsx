import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PenTool, Upload, Trash2, Loader2, CheckCircle2, Info, RefreshCw, RotateCcw, Save } from 'lucide-react';
import { useProfessionalSignature, SIGNATURE_DEFAULTS } from '@/hooks/useProfessionalSignature';

export function ProfessionalSignatureManager() {
  const {
    signature, loading, uploading, uploadSignature, removeSignature, updateSignatureSize, getSignedUrl,
  } = useProfessionalSignature();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingPreview, setPendingPreview] = useState<string | null>(null);

  // Size controls local state
  const [localWidth, setLocalWidth] = useState(SIGNATURE_DEFAULTS.width);
  const [localScale, setLocalScale] = useState(SIGNATURE_DEFAULTS.scale);
  const [localAlignment, setLocalAlignment] = useState(SIGNATURE_DEFAULTS.alignment);
  const [savingSize, setSavingSize] = useState(false);
  const [sizeChanged, setSizeChanged] = useState(false);

  // Sync size state from signature
  useEffect(() => {
    if (signature) {
      setLocalWidth(signature.signature_width ?? SIGNATURE_DEFAULTS.width);
      setLocalScale(signature.signature_scale ?? SIGNATURE_DEFAULTS.scale);
      setLocalAlignment(signature.signature_alignment ?? SIGNATURE_DEFAULTS.alignment);
      setSizeChanged(false);
    }
  }, [signature]);

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

  const handleSaveSize = async () => {
    setSavingSize(true);
    await updateSignatureSize({
      signature_width: localWidth,
      signature_scale: localScale,
      signature_alignment: localAlignment,
    });
    setSizeChanged(false);
    setSavingSize(false);
  };

  const handleResetSize = () => {
    setLocalWidth(SIGNATURE_DEFAULTS.width);
    setLocalScale(SIGNATURE_DEFAULTS.scale);
    setLocalAlignment(SIGNATURE_DEFAULTS.alignment);
    setSizeChanged(true);
  };

  const markChanged = () => setSizeChanged(true);

  const computedWidth = Math.round(localWidth * localScale);

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
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-green-600">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Ativa
              </Badge>
              <span className="text-xs text-muted-foreground">
                Salva em {new Date(signature.created_at).toLocaleDateString('pt-BR')}
              </span>
            </div>

            {/* Preview with configured size */}
            <div className="rounded-lg border bg-white p-4 min-h-[140px] flex items-center overflow-hidden"
              style={{ justifyContent: localAlignment === 'left' ? 'flex-start' : localAlignment === 'right' ? 'flex-end' : 'center' }}
            >
              <img
                src={previewUrl}
                alt="Assinatura do profissional"
                className="object-contain"
                style={{ width: `${computedWidth}px`, maxWidth: '100%' }}
              />
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Tamanho renderizado: {computedWidth}px de largura
            </p>

            {/* Size controls */}
            <div className="rounded-lg border p-4 space-y-4 bg-muted/30">
              <p className="text-sm font-medium">Ajuste de tamanho</p>

              <div className="space-y-2">
                <Label className="text-xs">Largura base: {localWidth}px</Label>
                <Slider
                  value={[localWidth]}
                  min={SIGNATURE_DEFAULTS.minWidth}
                  max={SIGNATURE_DEFAULTS.maxWidth}
                  step={10}
                  onValueChange={([v]) => { setLocalWidth(v); markChanged(); }}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Escala: {localScale.toFixed(2)}x</Label>
                <Slider
                  value={[localScale * 100]}
                  min={SIGNATURE_DEFAULTS.minScale * 100}
                  max={SIGNATURE_DEFAULTS.maxScale * 100}
                  step={5}
                  onValueChange={([v]) => { setLocalScale(v / 100); markChanged(); }}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Alinhamento</Label>
                <Select value={localAlignment} onValueChange={(v) => { setLocalAlignment(v); markChanged(); }}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">Esquerda</SelectItem>
                    <SelectItem value="center">Centro</SelectItem>
                    <SelectItem value="right">Direita</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handleResetSize}>
                  <RotateCcw className="h-3 w-3 mr-1" /> Padrão
                </Button>
                {sizeChanged && (
                  <Button size="sm" onClick={handleSaveSize} disabled={savingSize}>
                    {savingSize ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Save className="h-3 w-3 mr-1" />}
                    Salvar tamanho
                  </Button>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                <RefreshCw className="h-4 w-4 mr-1" /> Substituir
              </Button>
              <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={handleRemove}>
                <Trash2 className="h-4 w-4 mr-1" /> Remover
              </Button>
            </div>
          </div>
        )}

        {/* Pending upload preview */}
        {pendingPreview && (
          <div className="space-y-3">
            <p className="text-sm font-medium">Preview da nova assinatura:</p>
            <div className="rounded-lg border bg-white p-4 flex items-center justify-center min-h-[120px]">
              <img src={pendingPreview} alt="Preview da assinatura" className="max-h-[100px] max-w-full object-contain" />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleConfirmUpload} disabled={uploading} size="sm">
                {uploading ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Salvando...</> : <><CheckCircle2 className="h-4 w-4 mr-1" /> Confirmar e Salvar</>}
              </Button>
              <Button variant="outline" size="sm" onClick={handleCancelPending} disabled={uploading}>Cancelar</Button>
            </div>
          </div>
        )}

        {/* No signature yet */}
        {!signature && !pendingPreview && (
          <div className="space-y-3">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Você ainda não possui uma assinatura cadastrada. Envie uma imagem da sua assinatura para usá-la nos documentos.
              </AlertDescription>
            </Alert>
            <Button onClick={() => fileInputRef.current?.click()} variant="outline">
              <Upload className="h-4 w-4 mr-2" /> Enviar Assinatura
            </Button>
          </div>
        )}

        <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleFileSelect} />

        <Separator />
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Formatos aceitos: PNG (recomendado com fundo transparente), JPEG, WebP</p>
          <p>• Tamanho máximo: 2MB</p>
          <p>• Ajuste a largura e escala para a assinatura ficar correta no documento e PDF</p>
          <p>• A assinatura será usada nos documentos assinados e nos PDFs gerados</p>
        </div>
      </CardContent>
    </Card>
  );
}
