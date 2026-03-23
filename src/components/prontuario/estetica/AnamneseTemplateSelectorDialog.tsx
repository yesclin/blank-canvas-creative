/**
 * Dialog para seleção de modelo de anamnese estética
 */

import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ClipboardList, 
  Syringe, 
  Droplets, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { ANAMNESE_ESTETICA_TEMPLATES, type TipoAnamneseEstetica } from '@/hooks/prontuario/estetica/anamneseTemplates';

interface AnamneseTemplateSelectorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTemplate: (templateId: TipoAnamneseEstetica) => void;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  ClipboardList,
  Syringe,
  Droplets,
  Sparkles,
};

export function AnamneseTemplateSelectorDialog({
  open,
  onOpenChange,
  onSelectTemplate,
}: AnamneseTemplateSelectorDialogProps) {
  const handleSelect = (templateId: TipoAnamneseEstetica) => {
    onSelectTemplate(templateId);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            Nova Anamnese Estética
          </DialogTitle>
          <DialogDescription>
            Selecione o modelo de anamnese mais adequado para o procedimento
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-3 mt-4">
          {ANAMNESE_ESTETICA_TEMPLATES.map((template) => {
            const IconComponent = iconMap[template.icon] || ClipboardList;
            
            return (
              <Card 
                key={template.id}
                className="cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors group"
                onClick={() => handleSelect(template.id)}
              >
                <CardHeader className="pb-3 pt-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                        <IconComponent className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{template.nome}</CardTitle>
                        <CardDescription className="text-sm">
                          {template.descricao}
                        </CardDescription>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>

        <div className="flex justify-end mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
