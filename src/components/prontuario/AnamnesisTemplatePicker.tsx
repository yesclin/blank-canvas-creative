import { useState, useCallback, useEffect } from "react";
import { Lock, FileText, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ResolvedTemplate, TemplateOption } from "@/hooks/prontuario/useResolvedAnamnesisTemplate";

interface AnamnesisTemplatePickerProps {
  resolvedTemplate: ResolvedTemplate | null;
  allTemplates: TemplateOption[];
  hasMultipleTemplates: boolean;
  isLoading: boolean;
  hasStartedFilling: boolean;
  onTemplateChange: (templateId: string) => void;
  selectedTemplateId: string | null;
  /** Version number of the currently active/selected template */
  versionNumber?: number | null;
}

export function AnamnesisTemplatePicker({
  resolvedTemplate,
  allTemplates,
  hasMultipleTemplates,
  isLoading,
  hasStartedFilling,
  onTemplateChange,
  selectedTemplateId,
  versionNumber,
}: AnamnesisTemplatePickerProps) {
  useEffect(() => {
    if (!selectedTemplateId && resolvedTemplate?.id) {
      onTemplateChange(resolvedTemplate.id);
    }
  }, [resolvedTemplate?.id, selectedTemplateId, onTemplateChange]);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground animate-pulse">
        <FileText className="h-4 w-4" />
        <span>Carregando modelo...</span>
      </div>
    );
  }

  if (!resolvedTemplate || allTemplates.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-destructive">
        <FileText className="h-4 w-4" />
        <span>Nenhum modelo de anamnese disponível para esta especialidade.</span>
      </div>
    );
  }

  const displayVersion = versionNumber ?? resolvedTemplate?.version_number ?? null;

  const VersionBadge = () =>
    displayVersion ? (
      <Badge variant="outline" className="text-[10px] font-mono">
        v{displayVersion}.0
      </Badge>
    ) : null;

  // Single template — no selector needed
  if (!hasMultipleTemplates) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <FileText className="h-4 w-4 text-muted-foreground" />
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-medium">{resolvedTemplate.name}</span>
            <VersionBadge />
          </div>
          <span className="text-[11px] text-muted-foreground">
            Modelo carregado automaticamente
          </span>
        </div>
      </div>
    );
  }

  // Multiple templates — locked after filling starts
  if (hasStartedFilling) {
    const selectedName =
      allTemplates.find((t) => t.id === selectedTemplateId)?.name ||
      resolvedTemplate.name;

    return (
      <div className="flex items-center gap-2 text-sm">
        <Lock className="h-4 w-4 text-muted-foreground" />
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-medium">{selectedName}</span>
            <VersionBadge />
            <Badge variant="secondary" className="text-[10px]">
              Bloqueado
            </Badge>
          </div>
          <span className="text-[11px] text-muted-foreground">
            Modelo fixado após início do preenchimento
          </span>
        </div>
      </div>
    );
  }

  // Multiple templates — selector open
  return (
    <div className="flex items-center gap-2">
      <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      <Select
        value={selectedTemplateId || resolvedTemplate.id}
        onValueChange={onTemplateChange}
      >
        <SelectTrigger className="w-[280px] h-9">
          <SelectValue placeholder="Selecionar modelo de anamnese" />
        </SelectTrigger>
        <SelectContent>
          {allTemplates.map((t) => (
            <SelectItem key={t.id} value={t.id}>
              <div className="flex items-center gap-2">
                <span>{t.name}</span>
                {t.is_default && (
                  <Badge variant="outline" className="text-[10px] ml-1">
                    Padrão
                  </Badge>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <VersionBadge />
    </div>
  );
}
