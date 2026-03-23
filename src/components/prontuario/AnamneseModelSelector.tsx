/**
 * AnamneseModelSelector — Componente unificado para seleção de modelo de anamnese.
 *
 * Usado por TODAS as especialidades no estado vazio (empty state) da aba Anamnese.
 * Exibe:
 *  • Dropdown com modelos ativos da especialidade
 *  • Botão ⚙️ para editar o modelo (somente admin/permissão)
 *  • Botão "Registrar Anamnese" (somente se canEdit)
 */

import { FileText, Settings, Edit3, AlertTriangle, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ResolvedTemplate, TemplateOption } from "@/hooks/prontuario/useResolvedAnamnesisTemplate";

export interface AnamneseModelSelectorProps {
  /** Icon to display at the top of the empty state */
  icon?: React.ReactNode;
  /** Title of the empty state */
  emptyTitle?: string;
  /** Subtitle / description of the empty state */
  emptyDescription?: string;
  /** Label for the register button */
  registerLabel?: string;

  /** Resolved template from useResolvedAnamnesisTemplate */
  resolvedTemplate: ResolvedTemplate | null;
  /** All active templates for the specialty */
  allTemplates: TemplateOption[];
  /** Whether template list is loading */
  isLoading: boolean;
  /** Currently selected template id */
  selectedTemplateId: string | null;
  /** Callback when user picks a different template */
  onTemplateChange: (templateId: string) => void;

  /** Whether the user can edit/register */
  canEdit: boolean;
  /** Whether the user can manage templates (show gear icon) */
  canManageTemplates?: boolean;
  /** Callback to start registering the anamnese */
  onRegister: () => void;
  /** Callback when gear icon is clicked */
  onOpenTemplateEditor?: () => void;
  /** Callback to navigate to template config when no template exists */
  onConfigureTemplate?: () => void;

  /** Specialty display name (for "no template" message) */
  specialtyLabel?: string;
}

export function AnamneseModelSelector({
  icon,
  emptyTitle = "Nenhuma anamnese registrada",
  emptyDescription,
  registerLabel = "Registrar Anamnese",
  resolvedTemplate,
  allTemplates,
  isLoading,
  selectedTemplateId,
  onTemplateChange,
  canEdit,
  canManageTemplates = false,
  onRegister,
  onOpenTemplateEditor,
  onConfigureTemplate,
  specialtyLabel,
}: AnamneseModelSelectorProps) {
  const hasTemplate = !!resolvedTemplate;
  const hasMultipleTemplates = allTemplates.length > 1;

  return (
    <Card className="border-dashed">
      <CardContent className="p-8 text-center">
        {/* Icon */}
        <div className="flex justify-center mb-3">
          {icon || <FileText className="h-10 w-10 text-muted-foreground opacity-50" />}
        </div>

        {/* Title */}
        <h3 className="font-semibold mb-3">{emptyTitle}</h3>

        {/* Description */}
        {emptyDescription && (
          <p className="text-sm text-muted-foreground mb-4">{emptyDescription}</p>
        )}

        {/* Template selector row */}
        {!isLoading && hasTemplate && (
          <div className="flex flex-col items-center gap-3 mb-4">
            <div className="flex items-center gap-2">
              <Select
                value={selectedTemplateId || resolvedTemplate?.id || ""}
                onValueChange={onTemplateChange}
              >
                <SelectTrigger className="bg-background h-8 text-xs w-64">
                  <div className="flex items-center gap-1.5 truncate">
                    <SelectValue placeholder="Selecionar modelo..." />
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  {allTemplates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      <div className="flex items-center gap-2">
                        <span className="truncate">{t.name}</span>
                        {t.is_system && (
                          <Lock className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {canManageTemplates && onOpenTemplateEditor && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onOpenTemplateEditor}
                  className="h-8 px-2"
                  title="Editar modelo"
                >
                  <Settings className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground animate-pulse mb-4">
            <FileText className="h-4 w-4" />
            <span>Carregando modelo...</span>
          </div>
        )}

        {/* No template configured */}
        {!isLoading && !hasTemplate && (
          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-center gap-2 text-sm text-amber-600 mb-3">
              <AlertTriangle className="h-4 w-4" />
              <span>
                Nenhum modelo de anamnese configurado
                {specialtyLabel ? ` para ${specialtyLabel}` : ""}
              </span>
            </div>
            {onConfigureTemplate && canManageTemplates && (
              <Button variant="outline" onClick={onConfigureTemplate}>
                <Settings className="h-4 w-4 mr-2" />
                Configurar Modelo
              </Button>
            )}
          </div>
        )}

        {/* Register button */}
        {canEdit && hasTemplate && !isLoading && (
          <Button onClick={onRegister}>
            <Edit3 className="h-4 w-4 mr-2" />
            {registerLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
