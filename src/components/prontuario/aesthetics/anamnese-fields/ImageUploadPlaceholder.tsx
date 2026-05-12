/**
 * ImageUploadPlaceholder — REAL upload component for `image_upload` anamnesis fields.
 *
 * Persists a structured object in the anamnesis JSONB so the image survives
 * reopen/edit/autosave:
 *
 *   {
 *     storage_path: string,   // path inside `aesthetic-images` bucket
 *     file_name: string,
 *     mime_type: string,
 *     size: number,
 *     uploaded_at: string,    // ISO
 *     uploaded_by: string|null,
 *     field_id: string,
 *   }
 *
 * Backward compatibility: also accepts a plain string value
 * (legacy `"pending_upload:..."` placeholder OR a direct URL).
 */

import { useEffect, useRef, useState } from 'react';
import { Upload, Image as ImageIcon, X, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const BUCKET = 'aesthetic-images';

export interface AnamnesisImageValue {
  storage_path: string;
  file_name: string;
  mime_type: string;
  size: number;
  uploaded_at: string;
  uploaded_by: string | null;
  field_id?: string;
}

interface ImageUploadPlaceholderProps {
  value: unknown;
  onChange: (value: AnamnesisImageValue | null) => void;
  disabled?: boolean;
  label?: string;
  accept?: string;
  /** Required for path scoping & RLS. If missing, upload is disabled. */
  clinicId?: string | null;
  patientId?: string | null;
  appointmentId?: string | null;
  fieldId?: string;
}

function normalizeValue(v: unknown): AnamnesisImageValue | null {
  if (!v) return null;
  if (typeof v === 'object') {
    const obj = v as Partial<AnamnesisImageValue>;
    if (obj.storage_path) return obj as AnamnesisImageValue;
  }
  return null;
}

function isLegacyString(v: unknown): v is string {
  return typeof v === 'string' && v.length > 0;
}

export function ImageUploadPlaceholder({
  value,
  onChange,
  disabled = false,
  label = 'Upload de imagem',
  accept = 'image/*',
  clinicId,
  patientId,
  appointmentId,
  fieldId,
}: ImageUploadPlaceholderProps) {
  const stored = normalizeValue(value);
  const legacy = !stored && isLegacyString(value) ? (value as string) : null;

  const [uploading, setUploading] = useState(false);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [signError, setSignError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Resolve preview URL for stored value (signed) or legacy string
  useEffect(() => {
    let cancelled = false;
    setSignError(false);
    setSignedUrl(null);

    if (stored?.storage_path) {
      supabase.storage
        .from(BUCKET)
        .createSignedUrl(stored.storage_path, 60 * 60)
        .then(({ data, error }) => {
          if (cancelled) return;
          if (error || !data?.signedUrl) {
            setSignError(true);
          } else {
            setSignedUrl(data.signedUrl);
          }
        });
      return () => { cancelled = true; };
    }

    if (legacy && legacy.startsWith('http')) {
      setSignedUrl(legacy);
    }
    return () => { cancelled = true; };
  }, [stored?.storage_path, legacy]);

  const canUpload = !!clinicId && !!patientId && !disabled;

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!clinicId || !patientId) {
      toast.error('Contexto da clínica/paciente ausente. Não é possível enviar imagem.');
      return;
    }
    if (!file.type.startsWith('image/')) {
      toast.error('Arquivo não é uma imagem válida.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Imagem excede 10MB.');
      return;
    }

    setUploading(true);
    try {
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
      const safeField = (fieldId || 'campo').replace(/[^a-zA-Z0-9_-]/g, '_');
      const apt = appointmentId || 'sem-atendimento';
      const path = `${clinicId}/${patientId}/anamnesis/${apt}/${safeField}_${Date.now()}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { contentType: file.type, upsert: false });

      if (upErr) {
        console.error('[image_upload] upload error', upErr);
        toast.error(`Erro ao enviar imagem: ${upErr.message}`);
        return;
      }

      const { data: userData } = await supabase.auth.getUser();

      const persisted: AnamnesisImageValue = {
        storage_path: path,
        file_name: file.name,
        mime_type: file.type,
        size: file.size,
        uploaded_at: new Date().toISOString(),
        uploaded_by: userData.user?.id ?? null,
        field_id: fieldId,
      };

      onChange(persisted);
      toast.success('Imagem enviada');
    } catch (err) {
      console.error('[image_upload] unexpected', err);
      toast.error('Erro inesperado ao enviar imagem');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleClear = async () => {
    if (stored?.storage_path) {
      // best-effort cleanup
      supabase.storage.from(BUCKET).remove([stored.storage_path]).catch(() => {});
    }
    onChange(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const hasPreview = !!signedUrl;
  const hasOrphanLegacy = !stored && isLegacyString(value) && !signedUrl;

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFile}
        disabled={!canUpload || uploading}
        className="hidden"
      />

      {hasPreview ? (
        <div className="relative rounded-lg border bg-muted/20 p-2">
          <img
            src={signedUrl!}
            alt={stored?.file_name || label}
            className="mx-auto max-h-48 rounded-md object-contain"
          />
          {!disabled && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute top-1 right-1 h-6 w-6 rounded-full bg-background/80"
              onClick={handleClear}
              aria-label="Remover imagem"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
          {stored?.file_name && (
            <p className="mt-1 text-center text-[11px] text-muted-foreground truncate">
              {stored.file_name}
            </p>
          )}
        </div>
      ) : signError ? (
        <div className="flex items-center gap-2 rounded-lg border border-dashed border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span className="flex-1">Não foi possível carregar a imagem salva.</span>
          {!disabled && (
            <Button type="button" variant="outline" size="sm" onClick={handleClear}>
              Substituir
            </Button>
          )}
        </div>
      ) : (
        <button
          type="button"
          disabled={!canUpload || uploading}
          onClick={() => inputRef.current?.click()}
          className={cn(
            'flex w-full flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 transition-colors',
            'hover:bg-muted/30 hover:border-primary/40',
            (!canUpload || uploading) && 'opacity-60 cursor-not-allowed'
          )}
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted/50">
            {uploading ? (
              <Loader2 className="h-8 w-8 text-muted-foreground/70 animate-spin" />
            ) : (
              <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
            )}
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-muted-foreground">
              {uploading ? 'Enviando...' : label}
            </p>
            <p className="text-xs text-muted-foreground/70">
              {canUpload
                ? 'Clique para selecionar uma imagem (até 10MB)'
                : 'Upload indisponível neste contexto'}
            </p>
          </div>
        </button>
      )}

      {hasOrphanLegacy && !signError && (
        <p className="text-[11px] text-amber-600">
          Imagem antiga não persistida ({String(value).slice(0, 40)}). Faça novo upload para preservar.
        </p>
      )}

      {!hasPreview && !signError && canUpload && (
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex-1"
          >
            <Upload className="h-3.5 w-3.5 mr-1.5" />
            {uploading ? 'Enviando...' : 'Selecionar arquivo'}
          </Button>
        </div>
      )}
    </div>
  );
}
