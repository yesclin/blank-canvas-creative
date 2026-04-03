/**
 * StandardTemplateRenderer
 * 
 * Renders legacy/standard anamnesis templates using TemplateSection[] structure
 * from the V2 hook. Supports basic field types: text, textarea, number, date,
 * select, multiselect, checkbox, radio.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { TemplateSection, TemplateField } from '@/hooks/useAnamnesisTemplatesV2';

interface StandardTemplateRendererProps {
  sections: TemplateSection[];
  values: Record<string, unknown>;
  onChange: (fieldId: string, value: unknown) => void;
  disabled?: boolean;
}

export function StandardTemplateRenderer({
  sections,
  values,
  onChange,
  disabled = false,
}: StandardTemplateRendererProps) {
  if (!sections.length) return null;

  return (
    <div className="space-y-6">
      {sections.map((section) => (
        <Card key={section.id}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">{section.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {section.fields.map((field) => (
              <StandardFieldRenderer
                key={field.id}
                field={field}
                value={values[field.id]}
                onChange={(v) => onChange(field.id, v)}
                disabled={disabled}
              />
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function StandardFieldRenderer({
  field,
  value,
  onChange,
  disabled,
}: {
  field: TemplateField;
  value: unknown;
  onChange: (v: unknown) => void;
  disabled: boolean;
}) {
  switch (field.type) {
    case 'textarea':
      return (
        <div className="space-y-1.5">
          <Label className="text-sm">
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <Textarea
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            disabled={disabled}
            rows={3}
          />
        </div>
      );

    case 'number':
      return (
        <div className="space-y-1.5">
          <Label className="text-sm">
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <Input
            type="number"
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            disabled={disabled}
          />
        </div>
      );

    case 'date':
      return (
        <div className="space-y-1.5">
          <Label className="text-sm">
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <Input
            type="date"
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
          />
        </div>
      );

    case 'select':
      return (
        <div className="space-y-1.5">
          <Label className="text-sm">
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <Select
            value={(value as string) || ''}
            onValueChange={onChange}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder || 'Selecionar...'} />
            </SelectTrigger>
            <SelectContent>
              {(field.options || []).map((opt) => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );

    case 'multiselect':
      return (
        <div className="space-y-2">
          <Label className="text-sm">
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <div className="flex flex-wrap gap-2">
            {(field.options || []).map((opt) => {
              const selected = Array.isArray(value) ? (value as string[]).includes(opt) : false;
              return (
                <label key={opt} className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <Checkbox
                    checked={selected}
                    disabled={disabled}
                    onCheckedChange={(checked) => {
                      const current = Array.isArray(value) ? (value as string[]) : [];
                      onChange(
                        checked
                          ? [...current, opt]
                          : current.filter((v) => v !== opt)
                      );
                    }}
                  />
                  {opt}
                </label>
              );
            })}
          </div>
        </div>
      );

    case 'radio':
      return (
        <div className="space-y-1.5">
          <Label className="text-sm">
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <RadioGroup
            value={(value as string) || ''}
            onValueChange={onChange}
            disabled={disabled}
            className="flex flex-wrap gap-4"
          >
            {(field.options || []).map((opt) => (
              <div key={opt} className="flex items-center gap-1.5">
                <RadioGroupItem value={opt} id={`${field.id}_${opt}`} />
                <Label htmlFor={`${field.id}_${opt}`} className="text-sm font-normal cursor-pointer">
                  {opt}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      );

    case 'checkbox':
      return (
        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox
            checked={!!value}
            onCheckedChange={onChange}
            disabled={disabled}
          />
          <span className="text-sm">
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </span>
        </label>
      );

    // text, scale, calculated, and fallback
    default:
      return (
        <div className="space-y-1.5">
          <Label className="text-sm">
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <Input
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            disabled={disabled}
          />
        </div>
      );
  }
}
