/**
 * Componente para renderizar campos de anamnese com base no tipo
 * Suporta: text, textarea, select, multiselect, checkbox, radio, date, number, imagem_interativa
 */

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { CampoAnamnese } from '@/hooks/prontuario/estetica/anamneseTemplates';
import { InteractiveImageCanvas } from './InteractiveImageCanvas';

interface AnamneseFieldRendererProps {
  campo: CampoAnamnese;
  value: unknown;
  onChange: (value: unknown) => void;
  readOnly?: boolean;
  className?: string;
}

export function AnamneseFieldRenderer({
  campo,
  value,
  onChange,
  readOnly = false,
  className,
}: AnamneseFieldRendererProps) {
  const renderField = () => {
    switch (campo.type) {
      case 'text':
        return (
          <Input
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={campo.placeholder}
            disabled={readOnly}
          />
        );

      case 'textarea':
        return (
          <Textarea
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={campo.placeholder}
            disabled={readOnly}
            rows={3}
          />
        );

      case 'number':
        return (
          <Input
            type="number"
            value={(value as number) || ''}
            onChange={(e) => onChange(e.target.valueAsNumber || null)}
            placeholder={campo.placeholder}
            disabled={readOnly}
          />
        );

      case 'date':
        return (
          <Input
            type="date"
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={readOnly}
          />
        );

      case 'select':
        return (
          <Select
            value={(value as string) || ''}
            onValueChange={onChange}
            disabled={readOnly}
          >
            <SelectTrigger>
              <SelectValue placeholder={campo.placeholder || 'Selecione...'} />
            </SelectTrigger>
            <SelectContent>
              {campo.options?.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'multiselect': {
        const selectedValues = (value as string[]) || [];
        return (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1">
              {selectedValues.map((v) => (
                <Badge
                  key={v}
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => {
                    if (!readOnly) {
                      onChange(selectedValues.filter((sv) => sv !== v));
                    }
                  }}
                >
                  {v} ×
                </Badge>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {campo.options
                ?.filter((opt) => !selectedValues.includes(opt))
                .map((opt) => (
                  <Badge
                    key={opt}
                    variant="outline"
                    className={cn(
                      'cursor-pointer',
                      !readOnly && 'hover:bg-primary hover:text-primary-foreground'
                    )}
                    onClick={() => {
                      if (!readOnly) {
                        onChange([...selectedValues, opt]);
                      }
                    }}
                  >
                    + {opt}
                  </Badge>
                ))}
            </div>
          </div>
        );
      }

      case 'radio':
        return (
          <RadioGroup
            value={(value as string) || ''}
            onValueChange={onChange}
            disabled={readOnly}
            className="flex flex-wrap gap-4"
          >
            {campo.options?.map((opt) => (
              <div key={opt} className="flex items-center space-x-2">
                <RadioGroupItem value={opt} id={`${campo.id}-${opt}`} />
                <Label htmlFor={`${campo.id}-${opt}`} className="text-sm font-normal">
                  {opt}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );

      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={campo.id}
              checked={(value as boolean) || false}
              onCheckedChange={onChange}
              disabled={readOnly}
            />
            <Label htmlFor={campo.id} className="text-sm font-normal">
              {campo.placeholder || 'Sim'}
            </Label>
          </div>
        );

      case 'imagem_interativa':
        return (
          <InteractiveImageCanvas
            baseImageUrl={campo.baseImageUrl}
            drawingData={(value as string) || ''}
            onChange={(data) => onChange(data)}
            readOnly={readOnly}
            height={350}
          />
        );

      default:
        return (
          <Input
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={readOnly}
          />
        );
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      <Label className={cn(campo.required && 'after:content-["*"] after:text-destructive after:ml-0.5')}>
        {campo.label}
      </Label>
      {renderField()}
    </div>
  );
}
