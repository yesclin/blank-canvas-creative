/**
 * Dialog para importar modelos padrão de anamnese
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { 
  ClipboardList, 
  Syringe, 
  Droplets, 
  Sparkles,
  Download
} from 'lucide-react';
import { 
  ANAMNESE_ESTETICA_TEMPLATES, 
  type TemplateAnamneseEstetica 
} from '@/hooks/prontuario/estetica/anamneseTemplates';
import { useAnamnesisTemplates } from '@/hooks/useAnamnesisTemplates';

interface ImportDefaultTemplatesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  ClipboardList,
  Syringe,
  Droplets,
  Sparkles,
};

export function ImportDefaultTemplatesDialog({
  open,
  onOpenChange,
}: ImportDefaultTemplatesDialogProps) {
  const { createTemplate, templates, isCreating } = useAnamnesisTemplates();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);

  // Filter out templates that already exist
  const existingTypes = templates.map(t => t.template_type);
  const availableTemplates = ANAMNESE_ESTETICA_TEMPLATES.filter(
    t => !existingTypes.includes(t.id)
  );

  const handleToggle = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === availableTemplates.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(availableTemplates.map(t => t.id));
    }
  };

  const handleImport = async () => {
    setImporting(true);
    try {
      const templatesToImport = ANAMNESE_ESTETICA_TEMPLATES.filter(
        t => selectedIds.includes(t.id)
      );

      for (const template of templatesToImport) {
        await createTemplate({
          name: template.nome,
          description: template.descricao,
          template_type: template.id,
          icon: template.icon,
          campos: template.campos,
          is_active: true,
        });
      }

      onOpenChange(false);
      setSelectedIds([]);
    } finally {
      setImporting(false);
    }
  };

  const getIcon = (iconName: string) => {
    const IconComponent = iconMap[iconName] || ClipboardList;
    return <IconComponent className="h-5 w-5" />;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Importar Modelos Padrão
          </DialogTitle>
          <DialogDescription>
            Selecione os modelos de anamnese pré-configurados que deseja importar
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {availableTemplates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Todos os modelos padrão já foram importados</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="select-all"
                  checked={selectedIds.length === availableTemplates.length}
                  onCheckedChange={handleSelectAll}
                />
                <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                  Selecionar todos
                </label>
              </div>

              <div className="space-y-2">
                {availableTemplates.map((template) => (
                  <Card 
                    key={template.id}
                    className={`cursor-pointer transition-colors ${
                      selectedIds.includes(template.id) 
                        ? 'border-primary bg-primary/5' 
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => handleToggle(template.id)}
                  >
                    <CardContent className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={selectedIds.includes(template.id)}
                          onCheckedChange={() => handleToggle(template.id)}
                        />
                        <div className="p-2 bg-primary/10 rounded-lg">
                          {getIcon(template.icon)}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{template.nome}</p>
                          <p className="text-sm text-muted-foreground">
                            {template.descricao}
                          </p>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {template.campos.length} campos
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleImport} 
            disabled={selectedIds.length === 0 || importing}
          >
            {importing ? 'Importando...' : `Importar ${selectedIds.length} modelo(s)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
