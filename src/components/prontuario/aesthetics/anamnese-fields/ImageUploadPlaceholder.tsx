import { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ImageUploadPlaceholderProps {
  value: string | null;
  onChange: (value: string | null) => void;
  disabled?: boolean;
  label?: string;
  accept?: string;
}

export function ImageUploadPlaceholder({
  value,
  onChange,
  disabled = false,
  label = 'Upload de imagem',
  accept = 'image/*',
}: ImageUploadPlaceholderProps) {
  const [preview, setPreview] = useState<string | null>(value);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    // In a real implementation this would upload to storage
    // For now store the file name as a placeholder reference
    onChange(`pending_upload:${file.name}`);
  };

  const handleClear = () => {
    setPreview(null);
    onChange(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFile}
        disabled={disabled}
        className="hidden"
      />

      {preview ? (
        <div className="relative rounded-lg border bg-muted/20 p-2">
          <img
            src={preview}
            alt={label}
            className="mx-auto max-h-48 rounded-md object-contain"
          />
          {!disabled && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute top-1 right-1 h-6 w-6 rounded-full bg-background/80"
              onClick={handleClear}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          className={cn(
            'flex w-full flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 transition-colors',
            'hover:bg-muted/30 hover:border-primary/40',
            disabled && 'opacity-60 cursor-not-allowed'
          )}
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted/50">
            <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="text-xs text-muted-foreground/70">Clique para selecionar uma imagem</p>
          </div>
        </button>
      )}

      {!preview && !disabled && (
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            className="flex-1"
          >
            <Upload className="h-3.5 w-3.5 mr-1.5" />
            Selecionar arquivo
          </Button>
        </div>
      )}
    </div>
  );
}
