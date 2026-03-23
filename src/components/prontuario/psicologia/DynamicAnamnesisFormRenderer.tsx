/**
 * DynamicAnamnesisFormRenderer
 * 
 * Renders anamnesis form fields dynamically from a JSON template structure.
 * Used for templates that have structured version data (e.g., Infantil).
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Edit3, Save, X, FileText } from "lucide-react";
import type { Json } from "@/integrations/supabase/types";

interface TemplateField {
  id: string;
  type: string; // text, textarea, boolean, number, select
  label: string;
  order: number;
  required?: boolean;
  options?: string[];
  placeholder?: string;
}

interface TemplateSection {
  id: string;
  title: string;
  order: number;
  fields: TemplateField[];
}

interface DynamicAnamnesisFormRendererProps {
  structure: Json;
  templateName: string;
  /** Current responses (field_id -> value) */
  responses: Record<string, any>;
  /** Whether the form is in edit mode */
  isEditing: boolean;
  saving?: boolean;
  canEdit?: boolean;
  onResponseChange: (fieldId: string, value: any) => void;
  onSave: () => void;
  onCancel: () => void;
  onStartEdit: () => void;
}

function parseSections(structure: Json): TemplateSection[] {
  if (!Array.isArray(structure)) return [];
  return (structure as any[])
    .map((s) => {
      const rawFields = Array.isArray(s.fields) ? s.fields : Array.isArray(s.campos) ? s.campos : [];
      return {
        id: s.id || "",
        title: s.title || s.titulo || "Seção",
        order: s.order ?? 0,
        fields: rawFields.map((f: any) => ({
          id: f.id || f.nome || "",
          type: f.type || f.tipo || "text",
          label: f.label || f.nome || "",
          order: f.order ?? 0,
          required: f.required ?? f.obrigatorio ?? false,
          options: f.options || f.opcoes,
          placeholder: f.placeholder,
        })),
      };
    })
    .sort((a, b) => a.order - b.order);
}

function DynamicField({
  field,
  value,
  onChange,
  readOnly,
}: {
  field: TemplateField;
  value: any;
  onChange: (val: any) => void;
  readOnly: boolean;
}) {
  switch (field.type) {
    case "boolean":
    case "checkbox":
      return (
        <div className="flex items-center gap-3">
          <Switch
            checked={!!value}
            onCheckedChange={onChange}
            disabled={readOnly}
          />
          <Label className="text-sm">{field.label}</Label>
        </div>
      );

    case "textarea":
      if (readOnly) {
        return (
          <div className="space-y-1">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {field.label}
            </Label>
            <p className="text-sm whitespace-pre-wrap">
              {value || <span className="italic text-muted-foreground">Não informado</span>}
            </p>
          </div>
        );
      }
      return (
        <div className="space-y-1.5">
          <Label className="text-sm text-muted-foreground">
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <Textarea
            placeholder={field.placeholder || `Informe ${field.label.toLowerCase()}...`}
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            rows={3}
          />
        </div>
      );

    case "number":
      if (readOnly) {
        return (
          <div className="space-y-1">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {field.label}
            </Label>
            <p className="text-sm">
              {value ?? <span className="italic text-muted-foreground">Não informado</span>}
            </p>
          </div>
        );
      }
      return (
        <div className="space-y-1.5">
          <Label className="text-sm text-muted-foreground">
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <Input
            type="number"
            placeholder={field.placeholder || ""}
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
          />
        </div>
      );

    case "select":
      if (readOnly) {
        return (
          <div className="space-y-1">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {field.label}
            </Label>
            <p className="text-sm">
              {value || <span className="italic text-muted-foreground">Não informado</span>}
            </p>
          </div>
        );
      }
      return (
        <div className="space-y-1.5">
          <Label className="text-sm text-muted-foreground">
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <Select value={value || ""} onValueChange={onChange}>
            <SelectTrigger>
              <SelectValue placeholder="Selecionar..." />
            </SelectTrigger>
            <SelectContent>
              {(field.options || []).map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );

    case "multiselect": {
      const selected: string[] = Array.isArray(value) ? value : [];
      if (readOnly) {
        return (
          <div className="space-y-1">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {field.label}
            </Label>
            <p className="text-sm">
              {selected.length > 0
                ? selected.join(", ")
                : <span className="italic text-muted-foreground">Não informado</span>}
            </p>
          </div>
        );
      }
      return (
        <div className="space-y-1.5">
          <Label className="text-sm text-muted-foreground">
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <div className="flex flex-wrap gap-2">
            {(field.options || []).map((opt) => {
              const isSelected = selected.includes(opt);
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    const next = isSelected
                      ? selected.filter((s) => s !== opt)
                      : [...selected, opt];
                    onChange(next);
                  }}
                  className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-foreground border-border hover:bg-muted"
                  }`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    default: // text
      if (readOnly) {
        return (
          <div className="space-y-1">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {field.label}
            </Label>
            <p className="text-sm">
              {value || <span className="italic text-muted-foreground">Não informado</span>}
            </p>
          </div>
        );
      }
      return (
        <div className="space-y-1.5">
          <Label className="text-sm text-muted-foreground">
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <Input
            placeholder={field.placeholder || `Informe ${field.label.toLowerCase()}...`}
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      );
  }
}

export function DynamicAnamnesisFormRenderer({
  structure,
  templateName,
  responses,
  isEditing,
  saving = false,
  canEdit = false,
  onResponseChange,
  onSave,
  onCancel,
  onStartEdit,
}: DynamicAnamnesisFormRendererProps) {
  const sections = parseSections(structure);

  if (sections.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-8 text-center">
          <FileText className="h-10 w-10 text-muted-foreground opacity-50 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            Estrutura do modelo não disponível.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Edit mode
  if (isEditing) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Edit3 className="h-5 w-5 text-primary" />
              {templateName}
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onCancel} disabled={saving}>
                <X className="h-4 w-4 mr-1" /> Cancelar
              </Button>
              <Button size="sm" onClick={onSave} disabled={saving}>
                <Save className="h-4 w-4 mr-1" /> {saving ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[700px] pr-4">
            <div className="space-y-6">
              {sections.map((section, sIdx) => (
                <div key={section.id}>
                  {sIdx > 0 && <Separator className="mb-6" />}
                  <div className="space-y-4">
                    <Label className="text-base font-semibold">
                      {section.order + 1}. {section.title}
                    </Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {section.fields
                        .sort((a, b) => a.order - b.order)
                        .map((field) => {
                          const isWide =
                            field.type === "textarea" ||
                            field.type === "boolean";
                          return (
                            <div
                              key={field.id}
                              className={isWide ? "col-span-1 md:col-span-2" : ""}
                            >
                              <DynamicField
                                field={field}
                                value={responses[field.id]}
                                onChange={(val) => onResponseChange(field.id, val)}
                                readOnly={false}
                              />
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    );
  }

  // View mode
  const hasAnyData = Object.values(responses).some(
    (v) => v !== null && v !== undefined && v !== "" && v !== false
  );

  if (!hasAnyData) {
    return null; // Let the parent handle empty state
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{templateName}</h2>
        {canEdit && (
          <Button variant="outline" size="sm" onClick={onStartEdit}>
            <Edit3 className="h-4 w-4 mr-1" /> Editar
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          <Accordion
            type="multiple"
            defaultValue={sections.map((s) => s.id)}
            className="w-full"
          >
            {sections.map((section) => (
              <AccordionItem key={section.id} value={section.id} className="border-b last:border-b-0">
                <AccordionTrigger className="px-4 hover:no-underline">
                  <span>
                    {section.order + 1}. {section.title}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {section.fields
                      .sort((a, b) => a.order - b.order)
                      .map((field) => {
                        const isWide = field.type === "textarea";
                        return (
                          <div
                            key={field.id}
                            className={isWide ? "col-span-1 md:col-span-2" : ""}
                          >
                            <DynamicField
                              field={field}
                              value={responses[field.id]}
                              onChange={() => {}}
                              readOnly={true}
                            />
                          </div>
                        );
                      })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
