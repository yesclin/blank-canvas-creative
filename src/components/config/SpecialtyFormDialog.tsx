import { useState, useEffect } from "react";
import { useClinicalModules, useToggleSpecialtyModule } from "@/hooks/useClinicalModules";
import { useClinicData } from "@/hooks/useClinicData";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Stethoscope, 
  Loader2, 
  Blocks, 
  Settings,
  CalendarRange,
  Gauge,
  Syringe,
  Upload,
  MapPin,
  Smile,
  Ruler,
  ArrowLeftRight,
  FileCheck,
  ClipboardList,
  LucideIcon,
} from "lucide-react";
import { MODULE_CATEGORY_LABELS, ClinicalModuleCategory, ClinicalModuleKey, CORE_MODULES } from "@/types/clinical-modules";

interface Specialty {
  id: string;
  name: string;
  area: string | null;
  description: string | null;
  is_active: boolean;
}

interface SpecialtyFormData {
  name: string;
  area: string;
  description: string;
  is_active: boolean;
}

interface SpecialtyFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  specialty: Specialty | null;
  onSubmit: (data: SpecialtyFormData) => void;
  isSubmitting: boolean;
}

// Icon mapping
const ICON_MAP: Record<string, LucideIcon> = {
  CalendarRange,
  Gauge,
  Syringe,
  Upload,
  MapPin,
  Smile,
  Ruler,
  ArrowLeftRight,
  FileCheck,
  ClipboardList,
};

export function SpecialtyFormDialog({
  open,
  onOpenChange,
  specialty,
  onSubmit,
  isSubmitting,
}: SpecialtyFormDialogProps) {
  const { clinic } = useClinicData();
  const { data: allModules = [], isLoading: modulesLoading } = useClinicalModules();
  const toggleModule = useToggleSpecialtyModule();
  
  const [formData, setFormData] = useState<SpecialtyFormData>({
    name: "",
    area: "",
    description: "",
    is_active: true,
  });
  
  const [activeTab, setActiveTab] = useState("basic");
  const [moduleStates, setModuleStates] = useState<Record<string, boolean>>({});
  
  // Reset form when dialog opens/closes or specialty changes
  useEffect(() => {
    if (open) {
      if (specialty) {
        setFormData({
          name: specialty.name,
          area: specialty.area || "",
          description: specialty.description || "",
          is_active: specialty.is_active,
        });
        // Load existing module states for this specialty
        loadModuleStates(specialty.id);
      } else {
        setFormData({
          name: "",
          area: "",
          description: "",
          is_active: true,
        });
        // For new specialty, default to core modules only
        const initialStates: Record<string, boolean> = {};
        allModules.forEach(m => {
          initialStates[m.id] = CORE_MODULES.includes(m.key as ClinicalModuleKey);
        });
        setModuleStates(initialStates);
      }
      setActiveTab("basic");
    }
  }, [open, specialty, allModules]);

  const loadModuleStates = async (specialtyId: string) => {
    if (!clinic?.id) return;
    
    const { data: overrides } = await supabase
      .from("clinic_specialty_modules")
      .select("module_id, is_enabled")
      .eq("clinic_id", clinic.id)
      .eq("specialty_id", specialtyId);
    
    // Start with core modules as default
    const states: Record<string, boolean> = {};
    allModules.forEach(m => {
      const override = overrides?.find(o => o.module_id === m.id);
      if (override) {
        states[m.id] = override.is_enabled;
      } else {
        // Default to core modules being enabled
        states[m.id] = CORE_MODULES.includes(m.key as ClinicalModuleKey);
      }
    });
    setModuleStates(states);
  };

  const handleModuleToggle = (moduleId: string) => {
    setModuleStates(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // If editing, save module states
    if (specialty?.id && clinic?.id) {
      for (const [moduleId, isEnabled] of Object.entries(moduleStates)) {
        await toggleModule.mutateAsync({
          specialtyId: specialty.id,
          moduleId,
          isEnabled,
        }).catch(() => {}); // Ignore individual errors
      }
    }
    
    onSubmit(formData);
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  // Group modules by category
  const groupedModules = allModules.reduce((acc, module) => {
    const category = module.category as ClinicalModuleCategory;
    if (!acc[category]) acc[category] = [];
    acc[category].push(module);
    return acc;
  }, {} as Record<ClinicalModuleCategory, typeof allModules>);

  const isEditing = !!specialty;
  const enabledCount = Object.values(moduleStates).filter(Boolean).length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-primary" />
            {isEditing ? "Editar Especialidade Personalizada" : "Nova Especialidade Personalizada"}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Atualize as informações e módulos desta especialidade exclusiva da sua clínica" 
              : "Crie uma especialidade exclusiva para sua clínica. Especialidades padrão do sistema não podem ser editadas."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic" className="gap-2">
                <Settings className="h-4 w-4" />
                Dados Básicos
              </TabsTrigger>
              <TabsTrigger value="modules" className="gap-2" disabled={!isEditing}>
                <Blocks className="h-4 w-4" />
                Módulos
                {isEditing && (
                  <Badge variant="secondary" className="ml-1 text-[10px]">
                    {enabledCount}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="flex-1 space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="specialty-name">
                  Nome da Especialidade <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="specialty-name"
                  placeholder="Ex: Dermatologia, Pediatria, Fisioterapia..."
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="specialty-area">Área (opcional)</Label>
                <Input
                  id="specialty-area"
                  placeholder="Ex: Saúde Mental, Estética, Reabilitação..."
                  value={formData.area}
                  onChange={(e) => setFormData(prev => ({ ...prev, area: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">
                  Agrupe especialidades por área para melhor organização
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="specialty-description">Observação Interna (opcional)</Label>
                <Textarea
                  id="specialty-description"
                  placeholder="Notas internas sobre esta especialidade..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>

              {isEditing && (
                <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/50">
                  <div>
                    <Label htmlFor="specialty-active">Habilitada</Label>
                    <p className="text-xs text-muted-foreground">
                      Apenas especialidades habilitadas podem ser usadas em procedimentos, 
                      profissionais e prontuários
                    </p>
                  </div>
                  <Switch
                    id="specialty-active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                  />
                </div>
              )}

              {!isEditing && (
                <div className="p-3 rounded-lg border bg-muted/50">
                  <p className="text-sm text-muted-foreground">
                    💡 <strong>Dica:</strong> Após criar a especialidade, você poderá configurar os módulos 
                    funcionais disponíveis para ela (como Odontograma, Escalas Clínicas, etc.).
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="modules" className="flex-1 overflow-hidden">
              {modulesLoading ? (
                <div className="space-y-4 p-4">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : (
                <ScrollArea className="h-[350px] pr-4">
                  <div className="space-y-6 py-4">
                    {Object.entries(groupedModules).map(([category, categoryModules]) => (
                      <div key={category} className="space-y-3">
                        <h4 className="text-sm font-medium text-muted-foreground">
                          {MODULE_CATEGORY_LABELS[category as ClinicalModuleCategory]}
                        </h4>
                        <div className="space-y-2">
                          {categoryModules.map((module) => {
                            const Icon = ICON_MAP[module.icon || ''] || Blocks;
                            const isEnabled = moduleStates[module.id] ?? false;
                            const isCore = CORE_MODULES.includes(module.key as ClinicalModuleKey);
                            
                            return (
                              <div
                                key={module.id}
                                className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                                  isEnabled 
                                    ? 'bg-card border-primary/20' 
                                    : 'bg-muted/30 border-muted'
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                    isEnabled 
                                      ? 'bg-primary/10 text-primary' 
                                      : 'bg-muted text-muted-foreground'
                                  }`}>
                                    <Icon className="h-4 w-4" />
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className={`text-sm font-medium ${
                                        !isEnabled && 'text-muted-foreground'
                                      }`}>
                                        {module.name}
                                      </span>
                                      {isCore && (
                                        <Badge variant="outline" className="text-[10px]">
                                          Núcleo
                                        </Badge>
                                      )}
                                    </div>
                                    {module.description && (
                                      <p className="text-xs text-muted-foreground line-clamp-1">
                                        {module.description}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <Switch
                                  checked={isEnabled}
                                  onCheckedChange={() => handleModuleToggle(module.id)}
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter className="pt-4 border-t mt-4">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || !formData.name.trim()}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? "Salvando..." : isEditing ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
