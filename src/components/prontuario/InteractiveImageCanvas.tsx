/**
 * Canvas interativo para desenho sobre imagem base
 * 
 * Features:
 * - Imagem base configurável
 * - Desenho livre com pincel
 * - Seletor de cor
 * - Undo/Redo
 * - Limpar desenho
 * - Exportar desenho como data URL
 */

import { useRef, useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { 
  Undo2, 
  Redo2, 
  Trash2, 
  Paintbrush,
  Palette,
  Download
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DrawingPath {
  points: { x: number; y: number }[];
  color: string;
  lineWidth: number;
}

interface InteractiveImageCanvasProps {
  /** URL da imagem base */
  baseImageUrl?: string;
  /** Dados do desenho existente (JSON string) */
  drawingData?: string;
  /** Callback quando o desenho é alterado */
  onChange?: (drawingData: string) => void;
  /** Modo somente leitura */
  readOnly?: boolean;
  /** Altura do canvas */
  height?: number;
  /** Classe CSS adicional */
  className?: string;
}

const PRESET_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#000000', // black
  '#ffffff', // white
];

export function InteractiveImageCanvas({
  baseImageUrl,
  drawingData,
  onChange,
  readOnly = false,
  height = 400,
  className,
}: InteractiveImageCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentColor, setCurrentColor] = useState('#ef4444');
  const [lineWidth, setLineWidth] = useState(3);
  const [paths, setPaths] = useState<DrawingPath[]>([]);
  const [currentPath, setCurrentPath] = useState<DrawingPath | null>(null);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [baseImage, setBaseImage] = useState<HTMLImageElement | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 600, height: 400 });

  // Load base image
  useEffect(() => {
    if (!baseImageUrl) {
      setBaseImage(null);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setBaseImage(img);
      // Calculate aspect ratio
      const containerWidth = containerRef.current?.clientWidth || 600;
      const aspectRatio = img.width / img.height;
      const newHeight = Math.min(height, containerWidth / aspectRatio);
      const newWidth = newHeight * aspectRatio;
      setCanvasSize({ width: newWidth, height: newHeight });
    };
    img.src = baseImageUrl;
  }, [baseImageUrl, height]);

  // Load existing drawing data
  useEffect(() => {
    if (drawingData) {
      try {
        const parsed = JSON.parse(drawingData);
        if (Array.isArray(parsed.paths)) {
          setPaths(parsed.paths);
          setHistoryIndex(parsed.paths.length - 1);
        }
      } catch (e) {
        console.error('Error parsing drawing data:', e);
      }
    }
  }, [drawingData]);

  // Redraw canvas
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw base image if exists
    if (baseImage) {
      ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);
    } else {
      // Draw placeholder background
      ctx.fillStyle = '#f3f4f6';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = '#d1d5db';
      ctx.strokeRect(0, 0, canvas.width, canvas.height);
      
      // Draw placeholder text
      ctx.fillStyle = '#9ca3af';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Imagem não configurada', canvas.width / 2, canvas.height / 2);
    }

    // Draw paths up to current history index
    const pathsToDraw = paths.slice(0, historyIndex + 1);
    pathsToDraw.forEach(path => {
      if (path.points.length < 2) return;
      
      ctx.beginPath();
      ctx.strokeStyle = path.color;
      ctx.lineWidth = path.lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      ctx.moveTo(path.points[0].x, path.points[0].y);
      for (let i = 1; i < path.points.length; i++) {
        ctx.lineTo(path.points[i].x, path.points[i].y);
      }
      ctx.stroke();
    });

    // Draw current path being drawn
    if (currentPath && currentPath.points.length >= 2) {
      ctx.beginPath();
      ctx.strokeStyle = currentPath.color;
      ctx.lineWidth = currentPath.lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      ctx.moveTo(currentPath.points[0].x, currentPath.points[0].y);
      for (let i = 1; i < currentPath.points.length; i++) {
        ctx.lineTo(currentPath.points[i].x, currentPath.points[i].y);
      }
      ctx.stroke();
    }
  }, [baseImage, paths, historyIndex, currentPath]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  // Get canvas coordinates from mouse/touch event
  const getCanvasCoords = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

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

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (readOnly) return;
    e.preventDefault();
    
    const coords = getCanvasCoords(e);
    setIsDrawing(true);
    setCurrentPath({
      points: [coords],
      color: currentColor,
      lineWidth,
    });
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || readOnly || !currentPath) return;
    e.preventDefault();

    const coords = getCanvasCoords(e);
    setCurrentPath({
      ...currentPath,
      points: [...currentPath.points, coords],
    });
  };

  const handleEnd = () => {
    if (!isDrawing || !currentPath) return;
    setIsDrawing(false);

    if (currentPath.points.length >= 2) {
      // Remove any redo history
      const newPaths = [...paths.slice(0, historyIndex + 1), currentPath];
      setPaths(newPaths);
      setHistoryIndex(newPaths.length - 1);

      // Notify parent
      if (onChange) {
        onChange(JSON.stringify({ paths: newPaths }));
      }
    }

    setCurrentPath(null);
  };

  const handleUndo = () => {
    if (historyIndex >= 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      
      if (onChange) {
        onChange(JSON.stringify({ paths: paths.slice(0, newIndex + 1) }));
      }
    }
  };

  const handleRedo = () => {
    if (historyIndex < paths.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      
      if (onChange) {
        onChange(JSON.stringify({ paths: paths.slice(0, newIndex + 1) }));
      }
    }
  };

  const handleClear = () => {
    setPaths([]);
    setHistoryIndex(-1);
    setCurrentPath(null);
    
    if (onChange) {
      onChange(JSON.stringify({ paths: [] }));
    }
  };

  const handleExport = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = 'desenho-anamnese.png';
    link.href = dataUrl;
    link.click();
  };

  const canUndo = historyIndex >= 0;
  const canRedo = historyIndex < paths.length - 1;
  const hasDrawing = paths.length > 0 || (currentPath && currentPath.points.length > 0);

  return (
    <div className={cn('space-y-3', className)} ref={containerRef}>
      {/* Toolbar */}
      {!readOnly && (
        <div className="flex items-center gap-2 flex-wrap">
          {/* Color picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <div 
                  className="w-4 h-4 rounded-full border border-border"
                  style={{ backgroundColor: currentColor }}
                />
                <Palette className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-3">
              <div className="space-y-3">
                <Label className="text-xs">Cor do pincel</Label>
                <div className="flex gap-1 flex-wrap">
                  {PRESET_COLORS.map(color => (
                    <button
                      key={color}
                      className={cn(
                        'w-6 h-6 rounded-full border-2 transition-transform hover:scale-110',
                        currentColor === color ? 'border-primary ring-2 ring-primary/30' : 'border-border'
                      )}
                      style={{ backgroundColor: color }}
                      onClick={() => setCurrentColor(color)}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={currentColor}
                    onChange={(e) => setCurrentColor(e.target.value)}
                    className="w-8 h-8 cursor-pointer"
                  />
                  <span className="text-xs text-muted-foreground">Personalizada</span>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Brush size */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Paintbrush className="h-4 w-4" />
                <span className="text-xs">{lineWidth}px</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-3">
              <div className="space-y-3">
                <Label className="text-xs">Tamanho do pincel</Label>
                <Slider
                  value={[lineWidth]}
                  onValueChange={([v]) => setLineWidth(v)}
                  min={1}
                  max={20}
                  step={1}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1px</span>
                  <span>20px</span>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <div className="h-6 w-px bg-border" />

          {/* Undo/Redo */}
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handleUndo}
            disabled={!canUndo}
            title="Desfazer"
          >
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handleRedo}
            disabled={!canRedo}
            title="Refazer"
          >
            <Redo2 className="h-4 w-4" />
          </Button>

          <div className="h-6 w-px bg-border" />

          {/* Clear */}
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleClear}
            disabled={!hasDrawing}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Limpar
          </Button>

          {/* Export */}
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleExport}
            title="Baixar imagem"
          >
            <Download className="h-4 w-4 mr-1" />
            Exportar
          </Button>
        </div>
      )}

      {/* Canvas */}
      <div 
        className="border rounded-lg overflow-hidden bg-muted/30"
        style={{ maxWidth: canvasSize.width }}
      >
        <canvas
          ref={canvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          className={cn(
            'touch-none',
            !readOnly && 'cursor-crosshair'
          )}
          onMouseDown={handleStart}
          onMouseMove={handleMove}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={handleStart}
          onTouchMove={handleMove}
          onTouchEnd={handleEnd}
        />
      </div>

      {/* Info */}
      {!readOnly && !baseImageUrl && (
        <p className="text-xs text-muted-foreground">
          Configure uma imagem base no modelo para desenhar sobre ela
        </p>
      )}
    </div>
  );
}
