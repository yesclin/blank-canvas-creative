/**
 * ESTÉTICA - Canvas de Assinatura Digital
 * 
 * Componente para captura de assinatura do paciente.
 * Emite os dados da assinatura automaticamente conforme o usuário desenha,
 * sem necessidade de botão intermediário de confirmação.
 */

import { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { Button } from '@/components/ui/button';
import { Eraser } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  buildSignatureThumbnail,
  type SignatureThumbnail,
  type ThumbnailMode,
} from './signatureThumbnail';

interface SignatureCanvasProps {
  /** Recebe o dataURL atualizado a cada traço (ou null quando limpo). */
  onSave: (signatureData: string | null) => void;
  onClear?: () => void;
  className?: string;
  width?: number;
  height?: number;
}

export interface SignatureCanvasHandle {
  /** Retorna o dataURL atual ou null se não houver assinatura. */
  getSignature: () => string | null;
  clear: () => void;
  hasSignature: () => boolean;
}

export const SignatureCanvas = forwardRef<SignatureCanvasHandle, SignatureCanvasProps>(({
  onSave,
  onClear,
  className,
  width = 400,
  height = 150,
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = width;
    canvas.height = height;

    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, width, height);
  }, [width, height]);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    }

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    const coords = getCoordinates(e);
    if (!coords) return;

    setIsDrawing(true);
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    const coords = getCoordinates(e);
    if (!coords) return;

    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
    if (!hasSignature) setHasSignature(true);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    // Emite a assinatura automaticamente ao final de cada traço
    const canvas = canvasRef.current;
    if (canvas && hasSignature) {
      const dataUrl = canvas.toDataURL('image/png');
      onSave(dataUrl);
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    onSave(null);
    onClear?.();
  };

  // Tamanho mínimo (em chars do dataURL) para considerar uma assinatura válida.
  // Canvas em branco (PNG vazio do tamanho atual) gera dataURL ~3-5KB; assinatura real
  // costuma ficar acima de 6KB. Mantemos esse limiar consistente com o ConsentModule.
  const MIN_SIGNATURE_LENGTH = 6000;

  useImperativeHandle(ref, () => ({
    getSignature: () => {
      const canvas = canvasRef.current;
      if (!canvas) {
        console.warn('[SignatureCanvas] getSignature called but canvas ref is null', {
          has_canvas: false,
          is_drawing: isDrawing,
          has_signature: hasSignature,
          min_required: MIN_SIGNATURE_LENGTH,
        });
        return null;
      }
      if (!hasSignature) {
        console.warn('[SignatureCanvas] getSignature returned null — canvas has no strokes', {
          reason: 'not_drawn',
          has_canvas: true,
          is_drawing: isDrawing,
          has_signature: false,
          canvas_width: canvas.width,
          canvas_height: canvas.height,
          min_required: MIN_SIGNATURE_LENGTH,
        });
        return null;
      }
      const dataUrl = canvas.toDataURL('image/png');
      const length = dataUrl?.length ?? 0;
      if (!dataUrl || length === 0) {
        console.error('[SignatureCanvas] toDataURL returned empty', {
          reason: 'empty_data_url',
          has_canvas: true,
          is_drawing: isDrawing,
          has_signature: hasSignature,
          canvas_width: canvas.width,
          canvas_height: canvas.height,
          signature_length: length,
          min_required: MIN_SIGNATURE_LENGTH,
        });
        return null;
      }
      if (length < MIN_SIGNATURE_LENGTH) {
        console.warn('[SignatureCanvas] toDataURL produced suspiciously short signature', {
          reason: 'too_small',
          has_canvas: true,
          is_drawing: isDrawing,
          has_signature: hasSignature,
          canvas_width: canvas.width,
          canvas_height: canvas.height,
          signature_length: length,
          min_required: MIN_SIGNATURE_LENGTH,
        });
        // Retornamos mesmo assim — quem chamou (ConsentModule / wizard) decide rejeitar.
      }
      return dataUrl;
    },
    clear: clearCanvas,
    hasSignature: () => hasSignature,
  }), [hasSignature, isDrawing]);

  return (
    <div className={cn('space-y-2', className)}>
      <div className="border-2 border-dashed rounded-lg overflow-hidden bg-white">
        <canvas
          ref={canvasRef}
          className="w-full touch-none cursor-crosshair"
          style={{ height: `${height}px` }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </div>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          Assine acima usando o mouse ou toque
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={clearCanvas}
          disabled={!hasSignature}
        >
          <Eraser className="h-4 w-4 mr-1.5" />
          Limpar
        </Button>
      </div>
    </div>
  );
});

SignatureCanvas.displayName = 'SignatureCanvas';
