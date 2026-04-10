/**
 * DynamicAnamneseRenderer
 * 
 * Renders a dynamic anamnese form based on a template structure JSON.
 * Each field type maps to a specific visual component.
 */

import { useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  VisualOptionCardGrid,
  ClinicalTableSingleChoice,
  SelectRowGroup,
  AccordionMeasurementGroup,
  BMICalculator,
  ImageCarouselSelector,
  ImageUploadPlaceholder,
  PerimetryFields,
  BodyTypeSelector,
  createBodyTypeOptions,
  BodyTypeCarouselSelector,
  createCarouselBodyTypeOptions,
} from './anamnese-fields';
import type { DynamicField, DynamicFormValues } from './anamnese-fields/types';

interface DynamicAnamneseRendererProps {
  fields: DynamicField[];
  values: DynamicFormValues;
  onChange: (fieldId: string, value: unknown) => void;
  disabled?: boolean;
}

export function DynamicAnamneseRenderer({
  fields,
  values,
  onChange,
  disabled = false,
}: DynamicAnamneseRendererProps) {
  // Group fields by section
  const sections = groupBySection(fields);

  return (
    <div className="space-y-6">
      {sections.map(({ section, fields: sectionFields }) => (
        <Card key={section}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">{section}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {sectionFields.map((field) => (
              <FieldRenderer
                key={field.id}
                field={field}
                value={values[field.id]}
                onChange={(v) => onChange(field.id, v)}
                allValues={values}
                onChangeAny={onChange}
                disabled={disabled}
              />
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function groupBySection(fields: DynamicField[]) {
  const map = new Map<string, DynamicField[]>();
  for (const f of fields) {
    const section = f.section || f.label;
    if (!map.has(section)) map.set(section, []);
    map.get(section)!.push(f);
  }
  return Array.from(map.entries()).map(([section, fields]) => ({ section, fields }));
}

interface FieldRendererProps {
  field: DynamicField;
  value: unknown;
  onChange: (value: unknown) => void;
  allValues: DynamicFormValues;
  onChangeAny: (fieldId: string, value: unknown) => void;
  disabled: boolean;
}

function FieldRenderer({ field, value, onChange, allValues, onChangeAny, disabled }: FieldRendererProps) {
  const hideLabel = !!(field.section && field.label === field.section);
  switch (field.type) {
    case 'rich_text':
    case 'textarea':
      return (
        <div className="space-y-1.5">
          {!hideLabel && <Label className="text-sm">{field.label}</Label>}
          <Textarea
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder || field.config?.placeholder}
            disabled={disabled}
            rows={field.type === 'rich_text' ? 5 : 3}
            className="resize-none"
          />
        </div>
      );

    case 'text':
      return (
        <div className="space-y-1.5">
          {!hideLabel && <Label className="text-sm">{field.label}</Label>}
          <Input
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder || field.config?.placeholder}
            disabled={disabled}
          />
        </div>
      );

    case 'number':
      return (
        <div className="space-y-1.5">
          {!hideLabel && <Label className="text-sm">{field.label}</Label>}
          <Input
            type="number"
            step="0.1"
            value={value != null ? String(value) : ''}
            onChange={(e) => onChange(e.target.value ? parseFloat(e.target.value) : null)}
            placeholder={field.placeholder}
            disabled={disabled}
          />
        </div>
      );

    case 'radio':
      return (
        <div className="space-y-2">
          {!hideLabel && <Label className="text-sm">{field.label}</Label>}
          <RadioGroup
            value={(value as string) || ''}
            onValueChange={onChange}
            disabled={disabled}
            className="flex flex-wrap gap-3"
          >
            {(field.options || []).map((opt) => (
              <div key={opt} className="flex items-center gap-1.5">
                <RadioGroupItem value={opt} id={`${field.id}-${opt}`} />
                <Label htmlFor={`${field.id}-${opt}`} className="text-sm font-normal cursor-pointer">
                  {opt}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      );

    case 'select':
      return (
        <div className="space-y-1.5">
          {!hideLabel && <Label className="text-sm">{field.label}</Label>}
          <Select
            value={(value as string) || ''}
            onValueChange={onChange}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecionar..." />
            </SelectTrigger>
            <SelectContent>
              {(field.options || []).map((opt) => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );

    case 'visual_card_grid':
      return (
        <div className="space-y-2">
          {!hideLabel && <Label className="text-sm">{field.label}</Label>}
          <VisualOptionCardGrid
            options={field.config?.options || []}
            value={(value as string | string[]) || null}
            onChange={onChange}
            columns={field.config?.columns || 3}
            selection={field.config?.selection || 'single'}
            disabled={disabled}
          />
        </div>
      );

    case 'clinical_table_choice':
      return (
        <div className="space-y-2">
          {!hideLabel && <Label className="text-sm">{field.label}</Label>}
          <ClinicalTableSingleChoice
            rows={field.config?.rows || []}
            value={(value as string) || null}
            onChange={onChange}
            disabled={disabled}
          />
        </div>
      );

    case 'select_row':
      return (
        <div className="space-y-2">
          {!hideLabel && <Label className="text-sm">{field.label}</Label>}
          <SelectRowGroup
            selects={field.config?.selects || []}
            values={(value as Record<string, string>) || {}}
            onChange={(selectId, selectValue) => {
              const current = (value as Record<string, string>) || {};
              onChange({ ...current, [selectId]: selectValue });
            }}
            disabled={disabled}
          />
        </div>
      );

    case 'accordion_measurements':
      return (
        <div className="space-y-2">
          {!hideLabel && <Label className="text-sm">{field.label}</Label>}
          {field.config?.placeholder && (
            <p className="text-xs text-muted-foreground">{field.config.placeholder}</p>
          )}
          <AccordionMeasurementGroup
            sections={(field.config?.sections || []).map((s) => ({
              ...s,
              fields: s.fields || ['medida_1', 'medida_2', 'medida_3'],
            }))}
            values={(value as Record<string, Record<string, number | null>>) || {}}
            onChange={(sectionId, fieldId, val) => {
              const current = (value as Record<string, Record<string, number | null>>) || {};
              const sectionVals = current[sectionId] || {};
              onChange({
                ...current,
                [sectionId]: { ...sectionVals, [fieldId]: val },
              });
            }}
            disabled={disabled}
          />
        </div>
      );

    case 'bmi_calculator':
      return (
        <div className="space-y-2">
          {!hideLabel && <Label className="text-sm">{field.label}</Label>}
          <BMICalculator
            weight={((value as Record<string, number | null>) || {}).weight ?? null}
            height={((value as Record<string, number | null>) || {}).height ?? null}
            onChangeWeight={(w) => {
              const current = (value as Record<string, number | null>) || {};
              onChange({ ...current, weight: w });
            }}
            onChangeHeight={(h) => {
              const current = (value as Record<string, number | null>) || {};
              onChange({ ...current, height: h });
            }}
            disabled={disabled}
          />
        </div>
      );

    case 'image_carousel':
      return (
        <div className="space-y-2">
          {!hideLabel && <Label className="text-sm">{field.label}</Label>}
          <ImageCarouselSelector
            options={field.config?.options || []}
            value={(value as string) || null}
            onChange={onChange}
            disabled={disabled}
          />
        </div>
      );

    case 'body_type_selector': {
      const prefix = field.config?.options?.[0]?.image_placeholder_key
        ? field.config.options[0].image_placeholder_key.replace(/\d+$/, '')
        : `estetica/corporal/aparencia_`;
      const bodyOptions = field.config?.options?.length
        ? field.config.options.map((o, i) => ({
            id: o.id,
            label: o.label || `${i + 1}`,
            value: o.display_order || i + 1,
            image_placeholder_key: o.image_placeholder_key,
            image_url: o.image_url,
          }))
        : createBodyTypeOptions(prefix);
      return (
        <div className="space-y-2">
          <BodyTypeSelector
            title={hideLabel ? undefined : field.label}
            options={bodyOptions}
            value={value != null ? Number(value) : null}
            onChange={(v) => onChange(v)}
            disabled={disabled}
            ariaLabelPrefix={field.label}
          />
        </div>
      );
    }

    case 'image_upload':
      return (
        <div className="space-y-2">
          {!hideLabel && <Label className="text-sm">{field.label}</Label>}
          <ImageUploadPlaceholder
            value={(value as string) || null}
            onChange={onChange}
            disabled={disabled}
            label={field.placeholder || 'Upload de imagem clínica'}
            accept={field.config?.accept || 'image/*'}
          />
        </div>
      );

    default:
      return (
        <div className="space-y-1.5">
          {!hideLabel && <Label className="text-sm">{field.label}</Label>}
          <Input
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
          />
        </div>
      );
  }
}
